import { ingredientGrams } from "@/lib/nutrition/convert";
import type { BasketIngredient } from "@/lib/pricing/types";
import type { NutritionLookupEntry } from "@/types";

export function daysSince(isoDate: string, now = new Date()): number {
  const then = new Date(isoDate);
  const diffMs = now.getTime() - then.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export function normalizeIngredientQuantity(
  ingredient: BasketIngredient,
  nutritionEntry: NutritionLookupEntry | null,
): number | null {
  return ingredientGrams(ingredient.quantity, ingredient.unit, nutritionEntry, ingredient.name);
}
