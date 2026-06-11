import type { RecipeIngredientInput } from "@/lib/nutrition/calculate";

/** Major ingredients — method steps must not mention these unless they are in the list. */
const STEP_INGREDIENT_CHECKS: { stepPattern: RegExp; inListPattern: RegExp }[] = [
  { stepPattern: /\beggs?\b/i, inListPattern: /\begg/i },
  { stepPattern: /\bchicken\b/i, inListPattern: /chicken/i },
  { stepPattern: /\bsalmon\b/i, inListPattern: /salmon/i },
  { stepPattern: /\btuna\b/i, inListPattern: /tuna/i },
  { stepPattern: /\bturkey\b/i, inListPattern: /turkey/i },
  { stepPattern: /\bbeef\b/i, inListPattern: /beef/i },
  { stepPattern: /\bshrimp\b/i, inListPattern: /shrimp|prawn/i },
  { stepPattern: /\btofu\b/i, inListPattern: /tofu/i },
  { stepPattern: /\bpeanut butter\b/i, inListPattern: /peanut butter/i },
];

function ingredientBlob(ingredients: RecipeIngredientInput[]): string {
  return ingredients
    .map((i) => i.name.toLowerCase())
    .join(" ");
}

/** True when a step mentions a major ingredient that is not in the recipe list. */
export function stepsMentionUnlistedIngredients(
  steps: string[],
  ingredients: RecipeIngredientInput[],
): boolean {
  const blob = ingredientBlob(ingredients);
  const stepText = steps.join(" ");
  for (const { stepPattern, inListPattern } of STEP_INGREDIENT_CHECKS) {
    if (stepPattern.test(stepText) && !inListPattern.test(blob)) {
      return true;
    }
  }
  return false;
}
