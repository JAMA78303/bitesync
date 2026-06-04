import type { RecipeIngredientInput } from "@/lib/nutrition/calculate";

const MEAT_FISH = [
  "chicken",
  "turkey",
  "beef",
  "pork",
  "lamb",
  "bacon",
  "ham",
  "salmon",
  "tuna",
  "cod",
  "haddock",
  "prawn",
  "shrimp",
  "fish",
  "mince",
];

const DAIRY_EGGS = [
  "milk",
  "cheese",
  "yoghurt",
  "yogurt",
  "butter",
  "cream",
  "feta",
  "cheddar",
  "cottage cheese",
  "egg",
  "eggs",
];

const GLUTEN = [
  "wheat",
  "flour",
  "bread",
  "pasta",
  "spaghetti",
  "noodle",
  "couscous",
  "barley",
  "rye",
  "tortilla",
  "wrap",
  "pitta",
  "bagel",
  "cracker",
  "biscuit",
  "semolina",
];

function ingredientBlob(ingredients: RecipeIngredientInput[]): string {
  return ingredients
    .map((i) => i.name.toLowerCase())
    .join(" ");
}

function containsAny(blob: string, terms: string[]): boolean {
  return terms.some((t) => blob.includes(t));
}

/** Infer recipe diet labels from ingredient names (same flags as create/edit form). */
export function inferDietLabelsFromIngredients(ingredients: RecipeIngredientInput[]): {
  fitsVegan: boolean;
  fitsVegetarian: boolean;
  fitsGlutenFree: boolean;
} {
  const blob = ingredientBlob(ingredients);
  const hasMeatFish = containsAny(blob, MEAT_FISH);
  const hasDairyEggs = containsAny(blob, DAIRY_EGGS);
  const hasGluten = containsAny(blob, GLUTEN);

  const fitsVegan = !hasMeatFish && !hasDairyEggs;
  const fitsVegetarian = !hasMeatFish;
  const fitsGlutenFree = !hasGluten;

  return { fitsVegan, fitsVegetarian, fitsGlutenFree };
}
