import { ingredientGrams } from "@/lib/nutrition/convert";
import { lookupNutrition } from "@/lib/nutrition/lookup";

export type RecipeIngredientInput = {
  name: string;
  quantity: number;
  unit: string;
};

export type NutritionTotals = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fibre_g: number;
  sugar_g: number;
  sodium_mg: number;
  /** Known floor: sum of saturated fat for matched items that HAVE a value. */
  saturated_fat_g: number;
  coverage_pct: number;
  /** Matched items that had a saturated-fat value (for partial-estimate honesty). */
  saturated_fat_known_items?: number;
  /** Matched items considered for saturated fat (known + unknown). */
  saturated_fat_total_items?: number;
};

const EMPTY_TOTALS: NutritionTotals = {
  calories: 0,
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0,
  fibre_g: 0,
  sugar_g: 0,
  sodium_mg: 0,
  saturated_fat_g: 0,
  coverage_pct: 0,
};

export function calculateRecipeNutrition(
  ingredients: RecipeIngredientInput[],
): NutritionTotals {
  const validIngredients = ingredients.filter(
    (ingredient) => ingredient.name.trim() && ingredient.quantity > 0,
  );

  if (!validIngredients.length) {
    return { ...EMPTY_TOTALS };
  }

  const totals: NutritionTotals = { ...EMPTY_TOTALS };
  let matched = 0;
  let satKnownItems = 0;
  let satTotalItems = 0;

  for (const ingredient of validIngredients) {
    const nutrition = lookupNutrition(ingredient.name);
    const grams = ingredientGrams(ingredient.quantity, ingredient.unit, nutrition, ingredient.name);

    if (!grams || !nutrition) {
      continue;
    }

    matched += 1;
    const ratio = grams / 100;
    totals.calories += nutrition.per_100g.calories * ratio;
    totals.protein_g += nutrition.per_100g.protein_g * ratio;
    totals.carbs_g += nutrition.per_100g.carbs_g * ratio;
    totals.fat_g += nutrition.per_100g.fat_g * ratio;
    totals.fibre_g += nutrition.per_100g.fibre_g * ratio;
    totals.sugar_g += nutrition.per_100g.sugar_g * ratio;
    totals.sodium_mg += nutrition.per_100g.sodium_mg * ratio;
    satTotalItems += 1;
    if (nutrition.per_100g.saturated_fat_g != null) {
      satKnownItems += 1;
      totals.saturated_fat_g += nutrition.per_100g.saturated_fat_g * ratio;
    }
  }

  totals.coverage_pct = Math.round((matched / validIngredients.length) * 100);
  totals.saturated_fat_known_items = satKnownItems;
  totals.saturated_fat_total_items = satTotalItems;
  return totals;
}
