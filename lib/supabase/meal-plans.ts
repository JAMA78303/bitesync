"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { MealType, PlannerGrid, MealPlanEntry } from "@/types";

export async function getOrCreateMealPlan(weekStartDate: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", data: null };

  let { data: plan } = await supabase
    .from("meal_plans")
    .select("*")
    .eq("user_id", user.id)
    .eq("week_start_date", weekStartDate)
    .single();

  if (!plan) {
    const { data: newPlan, error } = await supabase
      .from("meal_plans")
      .insert({ user_id: user.id, week_start_date: weekStartDate })
      .select("*")
      .single();

    if (error && error.code !== "23505") return { error: error.message, data: null };

    if (error?.code === "23505") {
      const { data: existing } = await supabase
        .from("meal_plans")
        .select("*")
        .eq("user_id", user.id)
        .eq("week_start_date", weekStartDate)
        .single();
      plan = existing;
    } else {
      plan = newPlan;
    }
  }

  return { data: plan, error: null };
}

export async function getMealPlanEntries(mealPlanId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meal_plan_entries")
    .select(
      `
      id, meal_plan_id, recipe_id, day_of_week, meal_type, quick_add_name, quick_add_calories,
      recipe:recipes (
        id, name,
        recipe_nutrition ( calories, protein_g, carbs_g, fat_g, fibre_g, sugar_g, coverage_pct )
      )
    `,
    )
    .eq("meal_plan_id", mealPlanId);

  return { data: data as MealPlanEntry[] | null, error };
}

export async function buildGrid(entries: MealPlanEntry[]): Promise<PlannerGrid> {
  const grid: PlannerGrid = {};
  for (let d = 0; d <= 6; d++) {
    grid[d] = { breakfast: null, lunch: null, dinner: null, snack: null };
  }
  for (const entry of entries) grid[entry.day_of_week][entry.meal_type] = entry;
  return grid;
}
export async function assignRecipeToSlot(
  meal_plan_id: string,
  recipe_id: string,
  day_of_week: number,
  meal_type: MealType,
) {
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

  if (!plan) return { error: "Meal plan not found" };

  const payload = {
    meal_plan_id,
    recipe_id,
    day_of_week,
    meal_type,
    quick_add_name: null,
    quick_add_calories: null,
  };

  const { error } = await supabase
    .from("meal_plan_entries")
    .upsert(payload, { onConflict: "meal_plan_id,day_of_week,meal_type" });

  if (error) {
    const missingQuickAddColumns =
      error.message.includes("quick_add_name") || error.message.includes("quick_add_calories");
    if (!missingQuickAddColumns) return { error: error.message };

    // Backward-compatible retry for databases that have not yet added quick_add_* columns.
    const { error: fallbackError } = await supabase.from("meal_plan_entries").upsert(
      {
        meal_plan_id,
        recipe_id,
        day_of_week,
        meal_type,
      },
      { onConflict: "meal_plan_id,day_of_week,meal_type" },
    );
    if (fallbackError) return { error: fallbackError.message };
  }

  revalidatePath("/planner");
  return { success: true };
}

export async function quickAddMeal(
  meal_plan_id: string,
  day_of_week: number,
  meal_type: MealType,
  quick_add_name: string,
  quick_add_calories?: number | null,
) {
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

  if (!plan) return { error: "Meal plan not found" };

  const { error } = await supabase.from("meal_plan_entries").upsert(
    {
      meal_plan_id,
      recipe_id: null,
      day_of_week,
      meal_type,
      quick_add_name: quick_add_name.trim(),
      quick_add_calories: quick_add_calories ?? null,
    },
    { onConflict: "meal_plan_id,day_of_week,meal_type" },
  );

  if (error) return { error: error.message };
  revalidatePath("/planner");
  return { success: true };
}

export async function removeSlotEntry(entry_id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("meal_plan_entries").delete().eq("id", entry_id);
  if (error) return { error: error.message };
  revalidatePath("/planner");
  return { success: true };
}

export async function groceryListExists(meal_plan_id: string): Promise<boolean> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("grocery_items")
    .select("*", { count: "exact", head: true })
    .eq("meal_plan_id", meal_plan_id)
    .is("archived_at", null);
  if (error && error.message.toLowerCase().includes("archived_at")) {
    const { count: fallbackCount } = await supabase
      .from("grocery_items")
      .select("*", { count: "exact", head: true })
      .eq("meal_plan_id", meal_plan_id);
    return (fallbackCount ?? 0) > 0;
  }
  return (count ?? 0) > 0;
}
