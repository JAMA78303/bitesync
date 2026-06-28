/** UK DRV upper limit for preformed retinol only (mcg/day). */
export const VITAMIN_A_RETINOL_UPPER_MCG = 1500;

const BETA_CAROTENE_ONLY = [
  "carrot",
  "carrots",
  "sweet potato",
  "spinach",
  "kale",
  "pepper",
  "peppers",
  "mango",
  "apricot",
  "butternut",
  "squash",
  "pumpkin",
  "watermelon",
  "cantaloupe",
  "melon",
  "broccoli",
  "cabbage",
  "lettuce",
  "tomato",
  "asparagus",
  "beetroot",
  "leek",
  "celery",
  "corn",
  "plum",
  "peach",
  "grape",
  "grapes",
  "pineapple",
];

const PREFORMED_VITAMIN_A = [
  "egg",
  "eggs",
  "liver",
  "cheese",
  "butter",
  "ghee",
  "cream",
  "milk",
  "yoghurt",
  "yogurt",
  "salmon",
  "cod",
  "tuna",
  "haddock",
  "mackerel",
  "sardine",
  "chicken",
  "turkey",
  "beef",
  "lamb",
  "pork",
  "bacon",
  "ham",
  "parmesan",
  "cheddar",
  "mozzarella",
  "cottage cheese",
  "ricotta",
  "feta",
  "cream cheese",
  "prawn",
  "prawns",
  "shrimp",
];

function matchesAny(haystack: string, needles: string[]): boolean {
  return needles.some((n) => haystack.includes(n));
}

/**
 * Estimate preformed retinol (mcg per 100g) from total vitamin A as retinol equivalents.
 * Plant provitamin A (beta-carotene) contributes to RE but not the retinol upper limit.
 */
export function inferRetinolMcgPer100g(ingredientName: string, vitaminAReMcg: number): number {
  if (vitaminAReMcg <= 0) return 0;
  const key = ingredientName.toLowerCase().trim();
  if (matchesAny(key, BETA_CAROTENE_ONLY)) return 0;
  if (matchesAny(key, PREFORMED_VITAMIN_A)) return vitaminAReMcg;
  return 0;
}

export function attachRetinolToMicroEntry<T extends { vitamin_a_mcg: number; retinol_mcg?: number }>(
  ingredientName: string,
  entry: T,
): T & { retinol_mcg: number } {
  return {
    ...entry,
    retinol_mcg: entry.retinol_mcg ?? inferRetinolMcgPer100g(ingredientName, entry.vitamin_a_mcg),
  };
}
