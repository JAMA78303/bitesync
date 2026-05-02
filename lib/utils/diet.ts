import type { RecipeDietFlags } from "@/types";

export type ProfileDietPrefs = {
  follows_vegetarian: boolean;
  follows_vegan: boolean;
  follows_gluten_free: boolean;
};

/** Short labels when a recipe is not explicitly marked as matching the user's diet prefs. */
export function recipeDietWarnings(prefs: ProfileDietPrefs, recipe: RecipeDietFlags | null | undefined): string[] {
  if (!recipe) return [];
  const w: string[] = [];
  if (prefs.follows_vegan) {
    if (recipe.fits_vegan !== true) w.push("Not marked vegan");
  } else if (prefs.follows_vegetarian && recipe.fits_vegetarian !== true) {
    w.push("Not marked vegetarian");
  }
  if (prefs.follows_gluten_free && recipe.fits_gluten_free !== true) {
    w.push("Not marked gluten-free");
  }
  return w;
}
