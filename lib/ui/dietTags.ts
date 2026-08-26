/**
 * Badge tag for a recipe card — a single label, highest priority first.
 *
 * Note the vegan/vegetarian branches key off the USER's preferences, not the
 * recipe, so every recipe of a vegan user shows "Vegan". That is fine for a badge
 * but useless for filtering, which is what getDietTags below is for.
 */
export function getDietTag(
  kcal: number,
  protein: number,
  carbs: number,
  fat: number,
  preferences: string[] = [],
): string | null {
  if (preferences.includes("vegan")) return "Vegan";
  if (preferences.includes("vegetarian")) return "Vegetarian";
  if (protein >= 30) return "High Protein";
  if (kcal <= 350) return "Low Calorie";
  if (kcal >= 600) return "High Calorie";
  if (carbs <= 20) return "Low Carb";
  if (fat <= 5) return "Low Fat";
  return null;
}

/**
 * Every tag a recipe qualifies for, for filtering.
 *
 * Filtering previously used getDietTag's single winner, so a 320 kcal recipe with
 * 35g protein was "High Protein" and vanished from the Low Calorie tab. Worse, a
 * vegan user tagged every recipe "Vegan", leaving all the other tabs empty.
 */
export function getDietTags(
  kcal: number,
  protein: number,
  carbs: number,
  fat: number,
  preferences: string[] = [],
): string[] {
  const tags: string[] = [];
  if (preferences.includes("vegan")) tags.push("Vegan");
  if (preferences.includes("vegetarian") || preferences.includes("vegan")) tags.push("Vegetarian");
  if (protein >= 30) tags.push("High Protein");
  if (kcal <= 350) tags.push("Low Calorie");
  if (kcal >= 600) tags.push("High Calorie");
  if (carbs <= 20) tags.push("Low Carb");
  if (fat <= 5) tags.push("Low Fat");
  return tags;
}
