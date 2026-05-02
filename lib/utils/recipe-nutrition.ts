/** PostgREST may return a 1:1 embed as either one row or a single-element array. */
export type RecipeNutritionSummary = {
  calories: number | null;
  protein_g: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
  fibre_g?: number | null;
  sugar_g?: number | null;
  sodium_mg?: number | null;
  saturated_fat_g?: number | null;
  coverage_pct?: number | null;
};

export function normalizeRecipeNutritionEmbed(
  embed: RecipeNutritionSummary | RecipeNutritionSummary[] | null | undefined,
): RecipeNutritionSummary | null {
  if (embed == null) return null;
  return Array.isArray(embed) ? embed[0] ?? null : embed;
}
