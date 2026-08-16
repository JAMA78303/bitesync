/**
 * Curated snack combinations per micronutrient.
 *
 * The previous approach picked any two foods from a "rich in X" list and paired
 * them, which produced things nobody eats — boiled eggs with an orange for
 * vitamin D, eggs with strawberries for iodine. Rich-in-X is a property of a
 * single food; it says nothing about whether two foods go together.
 *
 * These are real snacks instead. Quantities target roughly 150–320 kcal, the
 * usable snack band. Ingredient names must exist in the nutrition DB so the
 * macro/micro lookup resolves.
 */

export type MicroSnackIngredient = { name: string; quantity: number; unit: string };

export type MicroSnackCombo = {
  /** Human name, used directly as the recipe title. */
  name: string;
  ingredients: MicroSnackIngredient[];
  /** Excluded for vegetarians (contains meat or fish). */
  meatOrFish?: boolean;
  /** Excluded for vegans (contains any animal product). */
  animal?: boolean;
  /** Contains gluten unless noted otherwise. */
  gluten?: boolean;
};

export const MICRO_SNACK_COMBOS: Record<string, MicroSnackCombo[]> = {
  vitamin_d_mcg: [
    {
      name: "Boiled Eggs with Wholemeal Toast",
      ingredients: [
        { name: "eggs", quantity: 2, unit: "each" },
        { name: "wholemeal bread", quantity: 40, unit: "g" },
      ],
      animal: true,
      gluten: true,
    },
    {
      name: "Tuna on Rice Cakes",
      ingredients: [
        { name: "tuna canned", quantity: 80, unit: "g" },
        { name: "rice cake", quantity: 20, unit: "g" },
      ],
      meatOrFish: true,
      animal: true,
    },
    {
      name: "Smoked Mackerel on Oatcakes",
      ingredients: [
        { name: "mackerel", quantity: 60, unit: "g" },
        { name: "oats", quantity: 25, unit: "g" },
      ],
      meatOrFish: true,
      animal: true,
    },
  ],
  iodine_mcg: [
    {
      name: "Greek Yoghurt with Berries",
      ingredients: [
        { name: "greek yoghurt", quantity: 170, unit: "g" },
        { name: "blueberries", quantity: 60, unit: "g" },
      ],
      animal: true,
    },
    {
      name: "Boiled Eggs with Wholemeal Toast",
      ingredients: [
        { name: "eggs", quantity: 2, unit: "each" },
        { name: "wholemeal bread", quantity: 40, unit: "g" },
      ],
      animal: true,
      gluten: true,
    },
    {
      name: "Cottage Cheese on Rice Cakes",
      ingredients: [
        { name: "cottage cheese", quantity: 150, unit: "g" },
        { name: "rice cake", quantity: 20, unit: "g" },
      ],
      animal: true,
    },
  ],
  calcium_mg: [
    {
      name: "Greek Yoghurt with Almonds",
      ingredients: [
        { name: "greek yoghurt", quantity: 170, unit: "g" },
        { name: "almonds", quantity: 20, unit: "g" },
      ],
      animal: true,
    },
    {
      name: "Cheese with Oatcakes",
      ingredients: [
        { name: "cheddar cheese", quantity: 40, unit: "g" },
        { name: "oats", quantity: 25, unit: "g" },
      ],
      animal: true,
    },
    {
      name: "Cottage Cheese with Pineapple",
      ingredients: [
        { name: "cottage cheese", quantity: 150, unit: "g" },
        { name: "pineapple", quantity: 80, unit: "g" },
      ],
      animal: true,
    },
  ],
  iron_mg: [
    {
      name: "Hummus with Carrot Sticks",
      ingredients: [
        { name: "hummus", quantity: 80, unit: "g" },
        { name: "carrots", quantity: 100, unit: "g" },
      ],
    },
    {
      name: "Oat and Almond Bites",
      ingredients: [
        { name: "oats", quantity: 40, unit: "g" },
        { name: "almonds", quantity: 20, unit: "g" },
      ],
      gluten: true,
    },
    {
      name: "Roasted Chickpeas",
      ingredients: [
        { name: "chickpeas", quantity: 120, unit: "g" },
        { name: "olive oil", quantity: 5, unit: "g" },
      ],
    },
  ],
  vitamin_b12_mcg: [
    {
      name: "Greek Yoghurt with Berries",
      ingredients: [
        { name: "greek yoghurt", quantity: 170, unit: "g" },
        { name: "raspberries", quantity: 60, unit: "g" },
      ],
      animal: true,
    },
    {
      name: "Tuna on Rice Cakes",
      ingredients: [
        { name: "tuna canned", quantity: 80, unit: "g" },
        { name: "rice cake", quantity: 20, unit: "g" },
      ],
      meatOrFish: true,
      animal: true,
    },
    {
      name: "Boiled Eggs with Wholemeal Toast",
      ingredients: [
        { name: "eggs", quantity: 2, unit: "each" },
        { name: "wholemeal bread", quantity: 40, unit: "g" },
      ],
      animal: true,
      gluten: true,
    },
  ],
  vitamin_c_mg: [
    {
      name: "Orange and Almonds",
      ingredients: [
        { name: "orange", quantity: 150, unit: "g" },
        { name: "almonds", quantity: 20, unit: "g" },
      ],
    },
    {
      name: "Strawberries with Greek Yoghurt",
      ingredients: [
        { name: "strawberries", quantity: 120, unit: "g" },
        { name: "greek yoghurt", quantity: 150, unit: "g" },
      ],
      animal: true,
    },
    {
      name: "Pepper Sticks with Hummus",
      ingredients: [
        { name: "red pepper", quantity: 120, unit: "g" },
        { name: "hummus", quantity: 70, unit: "g" },
      ],
    },
  ],
  folate_mcg: [
    {
      name: "Hummus with Pepper Sticks",
      ingredients: [
        { name: "hummus", quantity: 80, unit: "g" },
        { name: "red pepper", quantity: 100, unit: "g" },
      ],
    },
    {
      name: "Edamame Pods",
      ingredients: [
        { name: "edamame", quantity: 120, unit: "g" },
      ],
    },
    {
      name: "Roasted Chickpeas",
      ingredients: [
        { name: "chickpeas", quantity: 120, unit: "g" },
        { name: "olive oil", quantity: 5, unit: "g" },
      ],
    },
  ],
  magnesium_mg: [
    {
      name: "Almonds and Dark Chocolate",
      ingredients: [
        { name: "almonds", quantity: 25, unit: "g" },
        { name: "dark chocolate", quantity: 15, unit: "g" },
      ],
    },
    {
      name: "Pumpkin Seeds and Apple",
      ingredients: [
        { name: "pumpkin seeds", quantity: 25, unit: "g" },
        { name: "apple", quantity: 120, unit: "g" },
      ],
    },
  ],
  zinc_mg: [
    {
      name: "Pumpkin Seeds and Apple",
      ingredients: [
        { name: "pumpkin seeds", quantity: 25, unit: "g" },
        { name: "apple", quantity: 120, unit: "g" },
      ],
    },
    {
      name: "Cheese with Oatcakes",
      ingredients: [
        { name: "cheddar cheese", quantity: 40, unit: "g" },
        { name: "oats", quantity: 25, unit: "g" },
      ],
      animal: true,
    },
  ],
  potassium_mg: [
    {
      name: "Banana with Peanut Butter",
      ingredients: [
        { name: "banana", quantity: 120, unit: "g" },
        { name: "peanut butter", quantity: 20, unit: "g" },
      ],
    },
    {
      name: "Greek Yoghurt with Banana",
      ingredients: [
        { name: "greek yoghurt", quantity: 150, unit: "g" },
        { name: "banana", quantity: 100, unit: "g" },
      ],
      animal: true,
    },
  ],
  selenium_mcg: [
    {
      name: "Tuna on Rice Cakes",
      ingredients: [
        { name: "tuna canned", quantity: 80, unit: "g" },
        { name: "rice cake", quantity: 20, unit: "g" },
      ],
      meatOrFish: true,
      animal: true,
    },
    {
      name: "Boiled Eggs with Wholemeal Toast",
      ingredients: [
        { name: "eggs", quantity: 2, unit: "each" },
        { name: "wholemeal bread", quantity: 40, unit: "g" },
      ],
      animal: true,
      gluten: true,
    },
  ],
  vitamin_a_mcg: [
    {
      name: "Carrot Sticks with Hummus",
      ingredients: [
        { name: "hummus", quantity: 80, unit: "g" },
        { name: "carrots", quantity: 120, unit: "g" },
      ],
    },
    {
      name: "Greek Yoghurt with Mango",
      ingredients: [
        { name: "greek yoghurt", quantity: 150, unit: "g" },
        { name: "mango", quantity: 100, unit: "g" },
      ],
      animal: true,
    },
  ],
};

export type MicroSnackDietFilter = {
  vegan: boolean;
  vegetarian: boolean;
  glutenFree: boolean;
};

/** Combos for a nutrient that fit the user's dietary constraints. */
export function microSnackCombosFor(
  nutrientKey: string,
  diet: MicroSnackDietFilter,
): MicroSnackCombo[] {
  const combos = MICRO_SNACK_COMBOS[nutrientKey] ?? [];
  return combos.filter((combo) => {
    if (diet.vegan && combo.animal) return false;
    if (diet.vegetarian && combo.meatOrFish) return false;
    if (diet.glutenFree && combo.gluten) return false;
    return true;
  });
}
