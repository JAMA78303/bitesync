import {
  calculateRecipeNutritionWithMeta,
  type IngredientCofidMeta,
} from "@/lib/nutrition/asyncTotals";
import type { NutritionTotals, RecipeIngredientInput } from "@/lib/nutrition/calculate";

export type RecipeNutritionResult = {
  totals: NutritionTotals;
  estimatedFlags: boolean[];
  cofidMeta: IngredientCofidMeta[];
};

/** CoFID → local DB → optional AI (same chain as recipe save). */
export async function getRecipeNutritionTotals(
  ingredients: RecipeIngredientInput[],
  opts?: { aiEnabled?: boolean },
): Promise<RecipeNutritionResult> {
  return calculateRecipeNutritionWithMeta(ingredients, opts);
}
