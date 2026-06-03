import type { RecipeDietFlags } from "@/types";

/** True when a saved recipe satisfies the user's dietary preference keys. */
export function recipeMatchesDietaryPreferences(
  recipe: RecipeDietFlags,
  dietaryPreferences: string[],
): boolean {
  if (!dietaryPreferences.length || dietaryPreferences.includes("no_preference")) {
    return true;
  }

  if (dietaryPreferences.includes("vegan") && recipe.fits_vegan !== true) {
    return false;
  }
  if (dietaryPreferences.includes("vegetarian") && recipe.fits_vegetarian !== true) {
    return false;
  }
  if (dietaryPreferences.includes("gluten_free") && recipe.fits_gluten_free !== true) {
    return false;
  }

  return true;
}
