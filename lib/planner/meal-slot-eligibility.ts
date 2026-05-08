/**
 * Shared rules for which recipes belong on breakfast vs lunch/dinner/snack.
 * Used by AI planner heuristics and the manual recipe picker.
 */

import type { MealType } from "@/types";

export const SNACK_MAX_CALORIES = 300;
export const SNACK_MIN_CALORIES = 80;

export const AI_BREAKFAST_BLOCKED = [
  "beef",
  "beef mince",
  "lamb",
  "lamb chops",
  "lamb mince",
  "pork",
  "pork chops",
  "pork mince",
  "steak",
  "sirloin",
  "ribeye",
  "chorizo",
  "bacon",
  "salmon",
  "salmon fillet",
  "smoked salmon",
  "cod",
  "cod fillet",
  "haddock",
  "mackerel",
  "sardines",
  "tuna steak",
  "prawns",
  "king prawns",
  "shrimp",
  "sea bass",
  "tilapia",
  "mussels",
  "white rice",
  "brown rice",
  "basmati rice",
  "pasta",
  "spaghetti",
  "penne",
  "wholemeal pasta",
  "noodles",
  "rice noodles",
  "couscous",
  "chicken thigh",
  "chicken drumstick",
  "chicken wings",
  "chicken breast",
  "boneless chicken",
  "chicken fillet",
] as const;

/** Ingredients typical at breakfast — excludes standalone dinner proteins like chicken breast. */
export const AI_BREAKFAST_ALLOWED = [
  "oats",
  "porridge",
  "granola",
  "wholemeal bread",
  "bread",
  "bagel",
  "sourdough",
  "pitta",
  "eggs",
  "egg",
  "egg white",
  "greek yoghurt",
  "natural yoghurt",
  "low fat yoghurt",
  "milk",
  "whole milk",
  "skimmed milk",
  "semi skimmed milk",
  "oat milk",
  "almond milk",
  "soy milk",
  "cottage cheese",
  "cream cheese",
  "banana",
  "apple",
  "blueberries",
  "strawberries",
  "raspberries",
  "mango",
  "pineapple",
  "peach",
  "kiwi",
  "grapes",
  "orange",
  "chia seeds",
  "yogurt",
  "berries",
  "avocado",
  "spinach",
  "flaxseeds",
  "almonds",
  "walnuts",
  "peanut butter",
  "sunflower seeds",
  "pumpkin seeds",
  "protein powder",
  "whey protein",
  "honey",
  "maple syrup",
  "vanilla",
  "cinnamon",
] as const;

const AI_SNACK_APPROPRIATE = [
  "apple",
  "banana",
  "blueberries",
  "strawberries",
  "raspberries",
  "grapes",
  "orange",
  "pear",
  "peach",
  "kiwi",
  "mango",
  "pineapple",
  "greek yoghurt",
  "natural yoghurt",
  "almonds",
  "walnuts",
  "cashews",
  "peanut butter",
  "chia seeds",
  "oats",
  "granola",
  "rice cakes",
  "crackers",
  "cottage cheese",
  "cream cheese",
  "protein powder",
  "whey protein",
  "almond milk",
  "oat milk",
  "honey",
  "dark chocolate",
] as const;

export function matchByIncludes(ingredients: string[], needles: readonly string[]): boolean {
  return ingredients.some((ing) => needles.some((n) => ing.includes(n) || n.includes(ing)));
}

export function classifyRecipeMealType(
  recipeName: string,
  ingredients: string[],
): Array<"breakfast" | "lunch" | "dinner" | "snack" | "any"> {
  const allTextEarly = [recipeName, ...ingredients].join(" ").toLowerCase();
  if (/\bbreakfast\b/i.test(recipeName) || /\bbrunch\b/i.test(recipeName) || /\bbreaky\b/i.test(recipeName) || /\bbrekky\b/i.test(recipeName) || /\bbrekkie\b/i.test(recipeName)) {
    const outEarly: Array<"breakfast" | "lunch" | "dinner" | "snack" | "any"> = ["breakfast"];
    const snackHints = [
      "snack",
      "bar",
      "bite",
      "ball",
      "bliss ball",
      "protein ball",
      "rice cake",
      "cracker",
      "hummus",
      "dip",
      "handful",
      "mixed nuts",
      "apple",
      "fruit",
      "yoghurt",
      "yogurt",
      "smoothie",
      "shake",
    ];
    if (snackHints.some((k) => allTextEarly.includes(k))) outEarly.push("snack");
    return outEarly;
  }

  const breakfastKeywords = [
    "oat",
    "porridge",
    "egg",
    "toast",
    "cereal",
    "yoghurt",
    "yogurt",
    "granola",
    "smoothie",
    "pancake",
    "waffle",
    "bagel",
    "muffin",
    "scrambled",
    "omelette",
    "omelet",
    "frittata",
    "breakfast",
    "morning",
    "avocado toast",
    "fruit",
    "banana",
    "berry",
    "berries",
    "avocado",
    "spinach",
    "chia",
    "bircher",
    "cocoa",
    "matcha",
    "coffee",
    "latte",
    "croissant",
  ];
  const snackKeywords = [
    "snack",
    "bar",
    "bite",
    "ball",
    "bliss ball",
    "protein ball",
    "rice cake",
    "cracker",
    "hummus",
    "dip",
    "handful",
    "mixed nuts",
    "apple",
    "fruit",
    "yoghurt",
    "yogurt",
    "smoothie",
    "shake",
  ];
  const dinnerKeywords = [
    "curry",
    "stew",
    "roast",
    "casserole",
    "lasagne",
    "pasta bake",
    "stir fry",
    "bolognese",
    "chilli",
    "tagine",
    "soup",
    "pie",
    "burger",
    "salmon fillet",
    "chicken breast",
    "beef",
    "lamb",
  ];

  const allText = [recipeName, ...ingredients].join(" ").toLowerCase();
  const out: Array<"breakfast" | "lunch" | "dinner" | "snack" | "any"> = [];
  const hasBreakfast = breakfastKeywords.some((k) => allText.includes(k));
  const hasSnack = snackKeywords.some((k) => allText.includes(k));
  const hasDinner = dinnerKeywords.some((k) => allText.includes(k));
  if (hasBreakfast) out.push("breakfast");
  if (hasSnack) out.push("snack");
  if (hasDinner) out.push("dinner", "lunch");

  /** Avoid classifying chicken/beef bowls etc. as breakfast-only because of vague words like "fruit". */
  const mainMealProteinTokens = [
    "chicken",
    "turkey",
    "duck",
    "beef",
    "pork",
    "lamb",
    "steak",
    "ribs",
    "mince",
    "salmon",
    "cod",
    "haddock",
    "prawn",
    "shrimp",
    "white fish",
    "sea bass",
    "tuna steak",
  ];
  const hasMainProtein = mainMealProteinTokens.some((t) => {
    const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`).test(allText);
  });
  if (hasMainProtein && !recipeNameImpliesBreakfastSlot(recipeName)) {
    if (!out.includes("lunch")) out.push("lunch");
    if (!out.includes("dinner")) out.push("dinner");
  }

  if (out.length === 0) out.push("lunch", "dinner");
  return out;
}

export function recipeNameImpliesBreakfastSlot(recipeName: string): boolean {
  const n = recipeName.trim().toLowerCase();
  return (
    /\bbreakfast\b/.test(n) ||
    /\bbrunch\b/.test(n) ||
    /\bbreaky\b/.test(n) ||
    /\bbrekky\b/.test(n) ||
    /\bbrekkie\b/.test(n)
  );
}

/** True when classifier tags breakfast but not lunch/dinner (e.g. oats, yoghurt bowl). */
export function isBreakfastOnlyRecipe(recipeName: string, ingredientNames: string[]): boolean {
  const types = classifyRecipeMealType(recipeName, ingredientNames);
  const hasMain = types.includes("lunch") || types.includes("dinner");
  return types.includes("breakfast") && !hasMain;
}

export function shouldOccupyBreakfastSlot(recipeName: string, ingredientNames: string[]): boolean {
  return recipeNameImpliesBreakfastSlot(recipeName) || isBreakfastOnlyRecipe(recipeName, ingredientNames);
}

/** Exclude from lunch/dinner/snack picker + AI main-meal pools. */
export function excludeFromMainMealSlots(recipeName: string, ingredientNames: string[]): boolean {
  return shouldOccupyBreakfastSlot(recipeName, ingredientNames);
}

/**
 * Breakfast slot: no dinner mains (chicken breast dinners, curry, pasta dinner, etc.).
 * Titles with "breakfast"/"brunch" pass unless blocked ingredients.
 */
export function suitableForBreakfastSlot(recipeName: string, ingredientNames: string[]): boolean {
  const ings = ingredientNames.map((i) => i.toLowerCase().trim());
  if (matchByIncludes(ings, AI_BREAKFAST_BLOCKED)) return false;
  if (recipeNameImpliesBreakfastSlot(recipeName)) return true;

  const types = classifyRecipeMealType(recipeName, ingredientNames);
  if (types.includes("lunch") || types.includes("dinner")) return false;
  if (types.includes("breakfast")) return true;
  return matchByIncludes(ings, AI_BREAKFAST_ALLOWED);
}

/** Fallback when strict breakfast list is empty: still forbid dinner-tagged recipes. */
export function suitableForBreakfastSlotRelaxed(recipeName: string, ingredientNames: string[]): boolean {
  const ings = ingredientNames.map((i) => i.toLowerCase().trim());
  if (matchByIncludes(ings, AI_BREAKFAST_BLOCKED)) return false;
  if (recipeNameImpliesBreakfastSlot(recipeName)) return true;
  const types = classifyRecipeMealType(recipeName, ingredientNames);
  return !(types.includes("lunch") || types.includes("dinner"));
}

export function getMealTypeMultiplier(
  recipeTypes: string[],
  targetSlot: "breakfast" | "lunch" | "dinner" | "snack",
): number {
  if (recipeTypes.includes(targetSlot)) return 1.0;
  const hasMain = recipeTypes.includes("lunch") || recipeTypes.includes("dinner");
  if (
    (targetSlot === "lunch" || targetSlot === "dinner") &&
    recipeTypes.includes("breakfast") &&
    !hasMain
  ) {
    return 0.06;
  }
  if (targetSlot === "lunch" && recipeTypes.includes("dinner")) return 0.8;
  if (targetSlot === "dinner" && recipeTypes.includes("lunch")) return 0.8;
  if (targetSlot === "breakfast" && !recipeTypes.includes("breakfast")) return 0.1;
  if (targetSlot === "snack" && !recipeTypes.includes("snack")) return 0.2;
  return 0.5;
}

export function isRecipeAISnackAppropriate(calories: number | null, ingredientNames: string[]): boolean {
  if (calories != null && calories > SNACK_MAX_CALORIES) return false;
  const ings = ingredientNames.map((i) => i.toLowerCase().trim());
  return matchByIncludes(ings, AI_SNACK_APPROPRIATE);
}

/** Manual planner modal: filter library by chosen meal slot. */
export function recipeMatchesPlannerSlot(
  recipeName: string,
  ingredientNames: string[],
  mealType: MealType,
  calories?: number | null,
): boolean {
  if (mealType === "breakfast") {
    return suitableForBreakfastSlot(recipeName, ingredientNames);
  }
  if (mealType === "lunch" || mealType === "dinner") {
    return !excludeFromMainMealSlots(recipeName, ingredientNames);
  }
  if (mealType === "snack") {
    if (recipeNameImpliesBreakfastSlot(recipeName)) return false;
    if (excludeFromMainMealSlots(recipeName, ingredientNames)) return false;
    if (calories != null && calories > 0) {
      if (calories > SNACK_MAX_CALORIES || calories < SNACK_MIN_CALORIES) return false;
    }
    return isRecipeAISnackAppropriate(calories ?? null, ingredientNames);
  }
  return true;
}
