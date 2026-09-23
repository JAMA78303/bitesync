import { shouldOccupyBreakfastSlot } from "@/lib/planner/meal-slot-eligibility";

/** The subset of a planner row this fix touches. */
export type BreakfastFixRow = {
  recipe_id: string;
  day_of_week: number;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  slot_index: number;
};

/** The subset of a pool recipe this fix reads. */
export type BreakfastFixRecipe = {
  id: string;
  name: string;
  ingredientNames?: string[];
};

/**
 * Move a breakfast dish Claude put in a main slot into the breakfast slot.
 *
 * This looped forever whenever a day held two breakfast dishes — say porridge
 * at breakfast and overnight oats at lunch. The swap moved the oats to
 * breakfast and the porridge to lunch; the next pass saw the porridge in a
 * main slot and swapped them straight back. A library with eight porridge,
 * oats and egg recipes makes that pairing near-certain, and it is the whole
 * failure: a CPU-bound loop stamps no phase, runs no catch, reaches no
 * heuristic fallback, and is killed by the platform, leaving an empty week
 * and "an unexpected response was received from the server".
 *
 * Lives outside ai-actions.ts because that file is "use server": every
 * export there must be an async Server Action, so a sync helper cannot be
 * exported from it — which is what broke the build in #76.
 *
 * A swap only helps when the breakfast slot holds something that is *not* a
 * breakfast dish. When both are, there is nothing to gain by exchanging them;
 * leave the day to enforceAiMealSlotSeparation, which swaps against the pool
 * rather than within the day. The iteration cap is belt and braces: every
 * pass must remove one misplaced dish, so it can never legitimately run
 * longer than the day has rows.
 */
export function fixMisplacedBreakfastRecipesForDay<R extends BreakfastFixRow>(
  rows: R[],
  day: number,
  pool: BreakfastFixRecipe[],
): void {
  const meta = new Map(pool.map((r) => [r.id, r]));
  const isBreakfastDish = (recipeId: string): boolean => {
    const m = meta.get(recipeId);
    return shouldOccupyBreakfastSlot(m?.name ?? "", m?.ingredientNames ?? []);
  };

  for (let guard = 0; guard <= rows.length; guard += 1) {
    const bfIdx = rows.findIndex((r) => r.day_of_week === day && r.meal_type === "breakfast");
    const misIdx = rows.findIndex(
      (r) => r.day_of_week === day && r.meal_type !== "breakfast" && isBreakfastDish(r.recipe_id),
    );
    if (misIdx < 0) return;

    if (bfIdx < 0) {
      rows[misIdx] = {
        ...rows[misIdx]!,
        meal_type: "breakfast",
        slot_index: 0,
      };
      continue;
    }

    // Swapping two breakfast dishes changes nothing and comes straight back.
    if (isBreakfastDish(rows[bfIdx]!.recipe_id)) return;

    const temp = rows[bfIdx]!.recipe_id;
    rows[bfIdx] = { ...rows[bfIdx]!, recipe_id: rows[misIdx]!.recipe_id };
    rows[misIdx] = { ...rows[misIdx]!, recipe_id: temp };
  }
  console.warn(`[planner] breakfast fix hit its iteration cap on day ${day}`);
}
