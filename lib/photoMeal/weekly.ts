import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  WeeklyMicroPlanEntry,
  WeeklyMicroRecipeIngredient,
} from "@/lib/nutrition/weeklyMicroTotals";

type Row = {
  id: string;
  meal_plan_entries: { meal_plan_id: string; skipped_at: string | null } | { meal_plan_id: string; skipped_at: string | null }[] | null;
  logged_meal_ingredients: { name: string | null; quantity: number | string | null; unit: string | null }[] | null;
};

/**
 * Photo-logged meals on a plan, shaped like recipe entries so the weekly
 * micronutrient check counts them with no special case. Each logged meal gets
 * the key `logged:<id>`, which can never collide with a recipe id.
 *
 * Skipped entries are left out, like skipped recipes. If the logged_meals
 * migration hasn't run, or the query fails for any other reason, this returns
 * nothing and the week is analysed exactly as before.
 */
export async function loggedMealsForWeeklyMicros(
  supabase: SupabaseClient,
  mealPlanId: string,
): Promise<{ entries: WeeklyMicroPlanEntry[]; ingredients: WeeklyMicroRecipeIngredient[] }> {
  const empty = { entries: [], ingredients: [] };
  const { data, error } = await supabase
    .from("logged_meals")
    .select(
      "id, meal_plan_entries!inner(meal_plan_id, skipped_at), logged_meal_ingredients(name, quantity, unit)",
    )
    .eq("meal_plan_entries.meal_plan_id", mealPlanId);
  if (error || !data) return empty;

  const entries: WeeklyMicroPlanEntry[] = [];
  const ingredients: WeeklyMicroRecipeIngredient[] = [];
  for (const row of data as unknown as Row[]) {
    const entry = Array.isArray(row.meal_plan_entries) ? row.meal_plan_entries[0] : row.meal_plan_entries;
    if (!entry || entry.skipped_at) continue;
    const key = `logged:${row.id}`;
    entries.push({ recipe_id: key });
    for (const ing of row.logged_meal_ingredients ?? []) {
      ingredients.push({
        recipe_id: key,
        name: String(ing.name ?? ""),
        quantity: Number(ing.quantity ?? 0),
        unit: String(ing.unit ?? "g"),
      });
    }
  }
  return { entries, ingredients };
}
