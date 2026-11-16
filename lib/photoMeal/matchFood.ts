import { lookupNutritionAsync } from "@/lib/nutrition/lookupAsync";
import { lookupMicros } from "@/lib/nutrition/micros";
import type { FoodMatch } from "@/lib/photoMeal/types";

/**
 * Per-100 g nutrition for a food name the AI (or the user) gave, from the same
 * chain recipes use: CoFID first, then BiteSync's own food list. Never the AI
 * estimate (skipAI): a photo estimate is already uncertain enough, and the AI
 * only names foods here — it never supplies numbers.
 *
 * Null when nothing matched, which the review screen shows as "couldn't
 * match" and leaves out of the totals (DEC-005).
 */
export async function matchFood(name: string): Promise<FoodMatch | null> {
  const trimmed = name.trim();
  if (trimmed.length < 2) return null;

  const resolved = await lookupNutritionAsync(trimmed, 100, "g", { skipAI: true });
  if (!resolved || resolved.estimated) return null;

  return {
    per100: {
      kcal: resolved.kcal,
      protein: resolved.protein,
      carbs: resolved.carbs,
      fat: resolved.fat,
      fibre: resolved.fibre,
    },
    micros100: lookupMicros(trimmed),
    source:
      resolved.source === "cofid" && resolved.cofid_food_name
        ? `CoFID: ${resolved.cofid_food_name}`
        : "BiteSync food list",
  };
}
