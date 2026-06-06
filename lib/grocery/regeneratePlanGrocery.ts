import type { SupabaseClient } from "@supabase/supabase-js";
import {
  mealPlanRecipeServings,
  mergeScaledRecipeIngredients,
  normalizeIngredientsForShopping,
} from "@/lib/utils/merge";
import type { MealType } from "@/types";

const STALE_NAME_PATTERN = /(tbsp|tsp|tablespoon|teaspoon|½|plus an extra)/i;

export type StaleGroceryPlan = {
  mealPlanId: string;
  weekStartDate: string;
  userId: string;
  staleItemCount: number;
  totalItems: number;
};

function isStaleRow(name: string, unit: string, isManual: boolean): boolean {
  if (isManual) return false;
  const u = unit.toLowerCase();
  return u === "piece" || u === "pieces" || STALE_NAME_PATTERN.test(name);
}

export async function findStaleGroceryPlans(supabase: SupabaseClient): Promise<StaleGroceryPlan[]> {
  const { data: items, error } = await supabase
    .from("grocery_items")
    .select("meal_plan_id, name, unit, is_manual")
    .is("archived_at", null);

  if (error) {
    if (error.message.toLowerCase().includes("archived_at")) {
      const fallback = await supabase.from("grocery_items").select("meal_plan_id, name, unit, is_manual");
      if (fallback.error) throw new Error(fallback.error.message);
      return aggregateStalePlans(fallback.data ?? [], supabase);
    }
    throw new Error(error.message);
  }

  return aggregateStalePlans(items ?? [], supabase);
}

async function aggregateStalePlans(
  items: { meal_plan_id: string; name: string; unit: string; is_manual?: boolean | null }[],
  supabase: SupabaseClient,
): Promise<StaleGroceryPlan[]> {
  const byPlan = new Map<string, { staleItemCount: number; totalItems: number }>();

  for (const row of items) {
    const planId = String(row.meal_plan_id ?? "");
    if (!planId) continue;
    const cur = byPlan.get(planId) ?? { staleItemCount: 0, totalItems: 0 };
    cur.totalItems += 1;
    if (isStaleRow(String(row.name ?? ""), String(row.unit ?? ""), Boolean(row.is_manual))) {
      cur.staleItemCount += 1;
    }
    byPlan.set(planId, cur);
  }

  const staleIds = [...byPlan.entries()].filter(([, v]) => v.staleItemCount > 0).map(([id]) => id);
  if (!staleIds.length) return [];

  const { data: plans } = await supabase
    .from("meal_plans")
    .select("id, week_start_date, user_id")
    .in("id", staleIds);

  const planMeta = new Map((plans ?? []).map((p) => [p.id, p]));

  return staleIds
    .map((id) => {
      const counts = byPlan.get(id)!;
      const meta = planMeta.get(id);
      return {
        mealPlanId: id,
        weekStartDate: meta?.week_start_date ?? "",
        userId: meta?.user_id ?? "",
        staleItemCount: counts.staleItemCount,
        totalItems: counts.totalItems,
      };
    })
    .sort((a, b) => b.staleItemCount - a.staleItemCount);
}

/** Regenerate recipe-derived grocery rows from current meal plan + ingredients (service role). */
export async function regeneratePlanGrocery(
  supabase: SupabaseClient,
  mealPlanId: string,
  selectedDays?: number[],
  selectedMealTypes?: MealType[],
): Promise<{ ok: true; itemCount: number } | { ok: false; error: string }> {
  let query = supabase
    .from("meal_plan_entries")
    .select("recipe_id, day_of_week, meal_type")
    .eq("meal_plan_id", mealPlanId)
    .not("recipe_id", "is", null);

  if (selectedDays?.length) query = query.in("day_of_week", selectedDays);
  if (selectedMealTypes?.length) query = query.in("meal_type", selectedMealTypes);

  const { data: entries, error: entriesError } = await query;
  if (entriesError) return { ok: false, error: entriesError.message };
  if (!entries?.length) return { ok: false, error: "No meals with recipes in scope." };

  const servingsByRecipe = mealPlanRecipeServings(entries);
  const recipeIds = Array.from(servingsByRecipe.keys());
  const { data: ingredients, error: ingError } = await supabase
    .from("recipe_ingredients")
    .select("recipe_id, name, quantity, unit")
    .in("recipe_id", recipeIds);

  if (ingError) return { ok: false, error: ingError.message };
  if (!ingredients?.length) return { ok: false, error: "Recipes have no ingredients." };

  const merged = normalizeIngredientsForShopping(
    mergeScaledRecipeIngredients(
      ingredients as { recipe_id: string; name: string; quantity: number; unit: string }[],
      servingsByRecipe,
    ),
  );

  const { error: rpcError } = await supabase.rpc("replace_grocery_items", {
    p_meal_plan_id: mealPlanId,
    p_items: merged,
  });

  if (rpcError) return { ok: false, error: rpcError.message };

  if (selectedDays?.length && selectedDays.length < 7) {
    const sorted = [...new Set(selectedDays)].sort((a, b) => a - b);
    await supabase.from("meal_plans").update({ grocery_scope_days: sorted }).eq("id", mealPlanId);
  }

  return { ok: true, itemCount: merged.length };
}
