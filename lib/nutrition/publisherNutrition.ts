import type { NutritionTotals } from "@/lib/nutrition/calculate";

export type PublisherNutritionPerServing = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fibre_g?: number;
  sugar_g?: number;
  saturated_fat_g?: number;
  /** Sodium in mg when the source publishes salt/sodium. */
  sodium_mg?: number;
};

function parseNutritionNumber(raw: unknown): number | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  const m = s.match(/([\d.]+)/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return Number.isFinite(n) ? n : null;
}

/** Parse schema.org NutritionInformation from a Recipe JSON-LD node (per serving). */
export function parsePublisherNutritionFromRecipeNode(
  node: Record<string, unknown>,
): PublisherNutritionPerServing | null {
  const nutrition = node.nutrition;
  if (!nutrition || typeof nutrition !== "object") return null;

  const n = nutrition as Record<string, unknown>;
  const calories = parseNutritionNumber(n.calories);
  const protein_g = parseNutritionNumber(n.proteinContent);
  const carbs_g = parseNutritionNumber(n.carbohydrateContent);
  const fat_g = parseNutritionNumber(n.fatContent);
  if (calories == null || protein_g == null || carbs_g == null || fat_g == null) return null;

  const fibre_g = parseNutritionNumber(n.fiberContent) ?? parseNutritionNumber(n.fibreContent) ?? undefined;
  const sugar_g = parseNutritionNumber(n.sugarContent) ?? undefined;
  const saturated_fat_g = parseNutritionNumber(n.saturatedFatContent) ?? undefined;

  let sodium_mg = parseNutritionNumber(n.sodiumContent) ?? undefined;
  const salt_g = parseNutritionNumber(n.saltContent);
  if (salt_g != null) {
    sodium_mg = Math.round(salt_g * 400);
  }

  return {
    calories: Math.round(calories),
    protein_g,
    carbs_g,
    fat_g,
    fibre_g,
    sugar_g,
    saturated_fat_g,
    sodium_mg,
  };
}

export function publisherNutritionToTotals(
  published: PublisherNutritionPerServing,
  coverage_pct: number,
): NutritionTotals {
  return {
    calories: published.calories,
    protein_g: published.protein_g,
    carbs_g: published.carbs_g,
    fat_g: published.fat_g,
    fibre_g: published.fibre_g ?? 0,
    sugar_g: published.sugar_g ?? 0,
    sodium_mg: published.sodium_mg ?? 0,
    saturated_fat_g: published.saturated_fat_g ?? 0,
    coverage_pct,
  };
}
