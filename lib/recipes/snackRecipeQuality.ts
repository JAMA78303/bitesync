import type { RecipeIngredientInput } from "@/lib/nutrition/calculate";

const RAW_PILE_INGREDIENT =
  /\b(chickpeas?|carrots?|lentils?|quinoa|oats?|broccoli|spinach|kale|red pepper|bell pepper)\b/i;

/** True when a snack reads like separate ingredients, not a composed dish. */
export function isIngredientPileSnack(
  name: string,
  ingredients: RecipeIngredientInput[],
  steps: string[],
): boolean {
  if (steps.length < 2) return true;

  const title = name.toLowerCase().trim();
  const ampersandCount = (name.match(/ & /g) ?? []).length;
  if (ampersandCount >= 2) return true;

  const rawCount = ingredients.filter((i) => RAW_PILE_INGREDIENT.test(i.name)).length;
  if (rawCount >= 3) return true;

  const pileTitle =
    /\b(chickpeas?|carrots?|oats?)\b.*\b(chickpeas?|carrots?|oats?)\b/i.test(title) ||
    /\bwith oats\b/i.test(title) && RAW_PILE_INGREDIENT.test(title);
  if (pileTitle) return true;

  return false;
}
