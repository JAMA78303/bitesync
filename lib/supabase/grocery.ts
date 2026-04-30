"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMonday, toLocalISO } from "@/lib/utils/dates";
import { mergeIngredients } from "@/lib/utils/merge";

export async function getGroceryItems(meal_plan_id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grocery_items")
    .select("id, name, quantity, unit, is_checked, created_at")
    .eq("meal_plan_id", meal_plan_id)
    .is("archived_at", null)
    .order("is_checked", { ascending: true })
    .order("name", { ascending: true });
  return { data, error };
}

export async function toggleGroceryItem(item_id: string, is_checked: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("grocery_items").update({ is_checked }).eq("id", item_id);
  if (error) return { error: error.message };
  revalidatePath("/grocery");
  return { success: true };
}

export async function getMealPlanIdForWeek(weekStartDate?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const week = weekStartDate ?? toLocalISO(getMonday(new Date()));
  const { data } = await supabase
    .from("meal_plans")
    .select("id")
    .eq("user_id", user.id)
    .eq("week_start_date", week)
    .order("created_at", { ascending: false })
    .limit(1);
  return data?.[0]?.id ?? null;
}

export async function groceryListExists(meal_plan_id: string): Promise<boolean> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("grocery_items")
    .select("*", { count: "exact", head: true })
    .eq("meal_plan_id", meal_plan_id)
    .is("archived_at", null);
  return (count ?? 0) > 0;
}

export async function generateGroceryList(meal_plan_id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: entries } = await supabase
    .from("meal_plan_entries")
    .select("recipe_id")
    .eq("meal_plan_id", meal_plan_id);

  if (!entries?.length) return { error: "No meals in your plan yet. Add some meals first." };
  const recipeIds = entries.map((e) => e.recipe_id);

  const { data: ingredients } = await supabase
    .from("recipe_ingredients")
    .select("name, quantity, unit")
    .in("recipe_id", recipeIds);

  if (!ingredients?.length) return { error: "Your recipes have no ingredients." };

  const merged = mergeIngredients(ingredients as { name: string; quantity: number; unit: string }[]);
  const { error } = await supabase.rpc("replace_grocery_items", {
    p_meal_plan_id: meal_plan_id,
    p_items: merged,
  });
  if (error) return { error: error.message };

  revalidatePath("/grocery");
  return { success: true };
}
