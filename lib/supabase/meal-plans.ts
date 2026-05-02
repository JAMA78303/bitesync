"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { fetchRecipeNutritionMap } from "@/lib/supabase/recipe-nutrition-query";
import type { MealType, PlannerGrid, MealPlanEntry } from "@/types";

async function enrichEntriesWithNutrition(
  supabase: SupabaseClient,
  entries: MealPlanEntry[] | null,
): Promise<MealPlanEntry[] | null> {
  if (!entries?.length) return entries;
  const ids = [...new Set(entries.map((e) => e.recipe_id).filter(Boolean))] as string[];
  if (!ids.length) return entries;
  const map = await fetchRecipeNutritionMap(supabase, ids);
  return entries.map((entry) => {
    const rid = entry.recipe_id;
    if (!rid || !entry.recipe) return entry;
    const n = map.get(rid);
    if (!n) return entry;
    return {
      ...entry,
      recipe: {
        ...entry.recipe,
        recipe_nutrition: n,
      },
    };
  });
}

function isMissingQuickAddColumns(message?: string | null): boolean {
  if (!message) return false;
  return message.includes("quick_add_name") || message.includes("quick_add_calories");
}

function isQuickAddSchemaUnavailable(message?: string | null): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return (
    isMissingQuickAddColumns(message) ||
    (m.includes("recipe_id") && m.includes("null value")) ||
    (m.includes("recipe_id") && m.includes("not-null")) ||
    m.includes("entry_has_content")
  );
}

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
        fits_vegetarian, fits_vegan, fits_gluten_free
      )
    `,
    )
    .eq("meal_plan_id", mealPlanId);

  if (!error) {
    const enriched = await enrichEntriesWithNutrition(supabase, data as unknown as MealPlanEntry[] | null);
    return { data: enriched as MealPlanEntry[] | null, error };
  }

  if (!isMissingQuickAddColumns(error.message)) {
    return { data: null, error };
  }

  const { data: legacyData, error: legacyError } = await supabase
    .from("meal_plan_entries")
    .select(
      `
      id, meal_plan_id, recipe_id, day_of_week, meal_type,
      recipe:recipes (
        id, name,
        fits_vegetarian, fits_vegan, fits_gluten_free
      )
    `,
    )
    .eq("meal_plan_id", mealPlanId);

  if (legacyError) return { data: null, error: legacyError };

  const normalized = (legacyData ?? []).map((entry) => ({
    ...entry,
    quick_add_name: null,
    quick_add_calories: null,
  }));

  const enriched = await enrichEntriesWithNutrition(supabase, normalized as unknown as MealPlanEntry[]);

  return { data: enriched as MealPlanEntry[] | null, error: null };
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
    const missingQuickAddColumns = isMissingQuickAddColumns(error.message);
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

  if (error) {
    if (isQuickAddSchemaUnavailable(error.message)) {
      return {
        error:
          "Quick add requires the latest planner migration (quick_add columns + nullable recipe_id). Run sql/2026-04-30_flexible_input_and_selective_grocery.sql, then try again.",
      };
    }
    return { error: error.message };
  }
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
