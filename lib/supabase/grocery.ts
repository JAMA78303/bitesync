"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMonday, toLocalISO } from "@/lib/utils/dates";
import { mergeIngredients } from "@/lib/utils/merge";
import type { MealType } from "@/types";

export async function getGroceryItems(meal_plan_id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grocery_items")
    .select("id, name, quantity, unit, is_checked, is_manual, created_at")
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

export async function deleteGroceryItem(item_id: string) {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { error } = await supabase.from("grocery_items").update({ archived_at: now }).eq("id", item_id);

  if (error && error.message.toLowerCase().includes("archived_at")) {
    const { error: fallbackError } = await supabase.from("grocery_items").delete().eq("id", item_id);
    if (fallbackError) return { error: fallbackError.message };
  } else if (error) {
    return { error: error.message };
  }

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

export async function generateGroceryList(meal_plan_id: string, selectedDays?: number[], selectedMealTypes?: MealType[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  let query = supabase
    .from("meal_plan_entries")
    .select("recipe_id")
    .eq("meal_plan_id", meal_plan_id)
    .not("recipe_id", "is", null);

  if (selectedDays && selectedDays.length > 0) {
    query = query.in("day_of_week", selectedDays);
  }
  if (selectedMealTypes && selectedMealTypes.length > 0) {
    query = query.in("meal_type", selectedMealTypes);
  }

  const { data: entries } = await query;

  if (!entries?.length) {
    return { error: "No meals with recipes in selected days." };
  }
  const recipeIds = Array.from(new Set(entries.map((e) => e.recipe_id).filter(Boolean)));

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

export async function addManualGroceryItem(meal_plan_id: string, name: string, quantity: number, unit: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: plan } = await supabase
    .from("meal_plans")
    .select("id")
    .eq("id", meal_plan_id)
    .eq("user_id", user.id)
    .single();

  if (!plan) return { error: "Not found" };

  const payload = {
    meal_plan_id,
    name: name.trim(),
    quantity,
    unit,
    is_checked: false,
    archived_at: null as string | null,
  };

  const { error } = await supabase.from("grocery_items").insert({ ...payload, is_manual: true });

  if (error && error.message.toLowerCase().includes("is_manual")) {
    const { error: fallbackError } = await supabase.from("grocery_items").insert(payload);
    if (fallbackError) return { error: fallbackError.message };
  } else if (error) {
    return { error: error.message };
  }

  revalidatePath("/grocery");
  return { success: true };
}

export async function deleteGroceryList(meal_plan_id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: plan } = await supabase
    .from("meal_plans")
    .select("id")
    .eq("id", meal_plan_id)
    .eq("user_id", user.id)
    .single();

  if (!plan) return { error: "Not found" };

  const now = new Date().toISOString();
  const { error } = await supabase.from("grocery_items").update({ archived_at: now }).eq("meal_plan_id", meal_plan_id);

  if (error && error.message.toLowerCase().includes("archived_at")) {
    const { error: fallbackError } = await supabase.from("grocery_items").delete().eq("meal_plan_id", meal_plan_id);
    if (fallbackError) return { error: fallbackError.message };
  } else if (error) {
    return { error: error.message };
  }

  revalidatePath("/grocery");
  return { success: true };
}
