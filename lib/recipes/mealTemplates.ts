/**
 * Part 2 — Meal templates (archetypes).
 *
 * Each template is a coherent dish structure expressed as a set of ROLE slots
 * (required + optional). Coherence is guaranteed by the structure: a porridge
 * bowl is a breakfast base + liquid + fruit, never "eggs + oats + peanut butter".
 *
 * Exactly one slot per template carries `scale` — that is the gram-based slot the
 * macro tuning adjusts to hit the calorie target. Everything else uses its
 * catalog default portion.
 */

import type { GoalMealSlot } from "@/lib/ai/goal-matched-recipe";
import type { IngredientDef, IngredientRole } from "@/lib/recipes/ingredientRoles";

export type TemplateSlot = {
  role: IngredientRole;
  required: boolean;
  /** Number of distinct ingredients to draw for this role (default 1). */
  count?: number;
  /** When present, this is the single gram slot scaled to hit the kcal target. */
  scale?: { min: number; max: number; step?: number };
  /** Restrict this slot to specific catalog names (e.g. liquid dairy for porridge). */
  only?: string[];
  /** Exclude specific catalog names from this slot. */
  not?: string[];
};

/** Helper passed to a template's namer: resolves the chosen ingredient for a role. */
export type TemplateFillLookup = (role: IngredientRole) => IngredientDef | undefined;

export type MealTemplate = {
  id: string;
  /** Human archetype label, used in dish naming. */
  archetype: string;
  mealTypes: GoalMealSlot[];
  diets: { omnivore: boolean; vegetarian: boolean; vegan: boolean };
  /** True when the template can be filled with only gluten-free ingredients. */
  glutenFreeCapable: boolean;
  slots: TemplateSlot[];
  name: (pick: TemplateFillLookup) => string;
};

const LIQUID_DAIRY = ["milk", "oat milk", "almond milk"];
/** Toppings that belong on sweet bowls (no cheese / avocado). */
const SWEET_TOPPINGS = ["almonds", "walnuts", "cashews", "peanut butter", "chia seeds", "pumpkin seeds"];
/** Dairy proteins are bowl/snack foods, not stir-fry / roast / curry mains. */
const SOFT_PROTEINS = ["greek yogurt", "cottage cheese"];

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Nicer dish-name forms (singular berries, etc.). */
function display(name: string | undefined, fallback = ""): string {
  if (!name) return fallback;
  const n = name.toLowerCase().trim();
  const map: Record<string, string> = {
    strawberries: "Strawberry",
    blueberries: "Blueberry",
    raspberries: "Raspberry",
    "greek yogurt": "Greek Yogurt",
    "cottage cheese": "Cottage Cheese",
    "peanut butter": "Peanut Butter",
    "chicken breast": "Chicken",
    "turkey breast": "Turkey",
    "beef mince": "Beef",
    "cheddar cheese": "Cheddar",
    "feta cheese": "Feta",
    "green beans": "Green Bean",
    "red pepper": "Pepper",
    "sweet potato": "Sweet Potato",
  };
  return map[n] ?? titleCase(n);
}

export const MEAL_TEMPLATES: MealTemplate[] = [
  // ---------------------------------------------------------------- breakfast
  {
    id: "porridge-bowl",
    archetype: "Porridge",
    mealTypes: ["breakfast"],
    diets: { omnivore: true, vegetarian: true, vegan: true },
    glutenFreeCapable: true,
    slots: [
      { role: "breakfast_base", required: true, scale: { min: 30, max: 90 }, not: ["wholemeal bread", "rice cake"] },
      { role: "dairy", required: true, only: LIQUID_DAIRY },
      { role: "fruit", required: true },
      { role: "fat_topping", required: false, only: SWEET_TOPPINGS },
    ],
    name: (pick) => `${display(pick("fruit")?.name)} Porridge`.trim(),
  },
  {
    id: "overnight-oats",
    archetype: "Overnight Oats",
    mealTypes: ["breakfast", "snack"],
    diets: { omnivore: true, vegetarian: true, vegan: true },
    glutenFreeCapable: false,
    slots: [
      { role: "breakfast_base", required: true, scale: { min: 30, max: 70 }, only: ["oats"] },
      { role: "dairy", required: true, only: LIQUID_DAIRY },
      { role: "fruit", required: true },
      { role: "fat_topping", required: false, only: SWEET_TOPPINGS },
    ],
    name: (pick) => {
      const top = pick("fat_topping");
      const fruit = pick("fruit");
      const lead = top ? display(top.name) : display(fruit?.name);
      return `${lead} Overnight Oats`.trim();
    },
  },
  {
    id: "yogurt-fruit-bowl",
    archetype: "Yogurt Bowl",
    mealTypes: ["breakfast"],
    diets: { omnivore: true, vegetarian: true, vegan: false },
    glutenFreeCapable: true,
    slots: [
      { role: "protein", required: true, scale: { min: 120, max: 260 }, only: ["greek yogurt"] },
      { role: "fruit", required: true },
      { role: "fat_topping", required: false, only: SWEET_TOPPINGS },
    ],
    name: (pick) => `${display(pick("fruit")?.name)} Yogurt Bowl`.trim(),
  },
  {
    id: "scrambled-eggs-toast",
    archetype: "Scrambled Eggs",
    mealTypes: ["breakfast"],
    diets: { omnivore: true, vegetarian: true, vegan: false },
    glutenFreeCapable: false,
    slots: [
      { role: "protein", required: true, only: ["egg"] },
      { role: "base_carb", required: true, scale: { min: 40, max: 110 }, only: ["wholemeal bread"] },
      { role: "vegetable", required: false, only: ["spinach", "tomato", "mushroom"] },
    ],
    name: (pick) => {
      const veg = pick("vegetable");
      return veg ? `Scrambled Eggs & ${display(veg.name)} on Toast` : "Scrambled Eggs on Toast";
    },
  },
  {
    id: "tofu-scramble",
    archetype: "Tofu Scramble",
    mealTypes: ["breakfast"],
    diets: { omnivore: true, vegetarian: true, vegan: true },
    glutenFreeCapable: true,
    slots: [
      { role: "protein", required: true, only: ["tofu"] },
      { role: "vegetable", required: true, count: 2, only: ["spinach", "tomato", "mushroom", "red pepper"] },
      { role: "base_carb", required: false, scale: { min: 40, max: 110 }, only: ["wholemeal bread", "potato"] },
    ],
    name: (pick) => `Tofu Scramble with ${display(pick("vegetable")?.name, "Veg")}`,
  },
  {
    id: "nut-butter-toast",
    archetype: "Nut Butter Toast",
    mealTypes: ["breakfast"],
    diets: { omnivore: true, vegetarian: true, vegan: true },
    glutenFreeCapable: false,
    slots: [
      { role: "base_carb", required: true, scale: { min: 50, max: 110 }, only: ["wholemeal bread"] },
      { role: "fat_topping", required: true, only: ["peanut butter"] },
      { role: "fruit", required: true, only: ["banana", "strawberries", "blueberries"] },
    ],
    name: (pick) => `${display(pick("fruit")?.name)} & Peanut Butter Toast`,
  },

  // ------------------------------------------------------------- lunch/dinner
  {
    id: "grain-bowl",
    archetype: "Grain Bowl",
    mealTypes: ["lunch", "dinner"],
    diets: { omnivore: true, vegetarian: true, vegan: true },
    glutenFreeCapable: true,
    slots: [
      { role: "base_carb", required: true, scale: { min: 50, max: 300 }, not: ["pasta", "wholemeal bread"] },
      { role: "protein", required: true, not: SOFT_PROTEINS },
      { role: "vegetable", required: true, count: 2 },
      { role: "fat_topping", required: false, only: ["avocado"] },
      { role: "dairy", required: false, only: ["feta cheese"] },
    ],
    name: (pick) => `${display(pick("protein")?.name)} ${display(pick("base_carb")?.name, "Grain")} Bowl`,
  },
  {
    id: "stir-fry",
    archetype: "Stir-fry",
    mealTypes: ["lunch", "dinner"],
    diets: { omnivore: true, vegetarian: true, vegan: true },
    glutenFreeCapable: true,
    slots: [
      { role: "protein", required: true, not: SOFT_PROTEINS },
      { role: "vegetable", required: true, count: 2 },
      { role: "base_carb", required: true, scale: { min: 50, max: 280 }, only: ["rice", "brown rice", "quinoa"] },
      { role: "cooking_fat", required: true },
    ],
    name: (pick) => `${display(pick("protein")?.name)} & ${display(pick("vegetable")?.name)} Stir-fry`,
  },
  {
    id: "roast-plate",
    archetype: "Roast Plate",
    mealTypes: ["dinner"],
    diets: { omnivore: true, vegetarian: true, vegan: true },
    glutenFreeCapable: true,
    slots: [
      { role: "protein", required: true, not: [...SOFT_PROTEINS, "egg"] },
      { role: "base_carb", required: true, scale: { min: 120, max: 320 }, only: ["potato", "sweet potato"] },
      { role: "vegetable", required: true, count: 2 },
      { role: "cooking_fat", required: true },
    ],
    name: (pick) =>
      `${display(pick("protein")?.name)} with ${display(pick("base_carb")?.name)} & ${display(pick("vegetable")?.name)}`,
  },
  {
    id: "protein-salad",
    archetype: "Salad",
    mealTypes: ["lunch", "dinner"],
    diets: { omnivore: true, vegetarian: true, vegan: true },
    glutenFreeCapable: true,
    slots: [
      { role: "protein", required: true, not: SOFT_PROTEINS },
      { role: "vegetable", required: true, count: 2, only: ["cucumber", "tomato", "red pepper", "spinach", "carrot"] },
      { role: "base_carb", required: false, scale: { min: 40, max: 140 }, only: ["quinoa"] },
      { role: "cooking_fat", required: true },
      { role: "fat_topping", required: false, only: ["avocado"] },
      { role: "dairy", required: false, only: ["feta cheese"] },
    ],
    name: (pick) => `${display(pick("protein")?.name)} Salad`,
  },
  {
    id: "legume-curry",
    archetype: "Curry",
    mealTypes: ["lunch", "dinner"],
    diets: { omnivore: true, vegetarian: true, vegan: true },
    glutenFreeCapable: true,
    slots: [
      { role: "protein", required: true, only: ["lentils", "chickpeas", "chicken breast"] },
      { role: "vegetable", required: true, count: 2, only: ["spinach", "tomato", "onion", "red pepper"] },
      { role: "base_carb", required: true, scale: { min: 50, max: 260 }, only: ["rice", "brown rice"] },
    ],
    name: (pick) => `${display(pick("protein")?.name)} Curry with Rice`,
  },

  // -------------------------------------------------------------------- snack
  {
    id: "yogurt-pot",
    archetype: "Yogurt Pot",
    mealTypes: ["snack"],
    diets: { omnivore: true, vegetarian: true, vegan: false },
    glutenFreeCapable: true,
    slots: [
      { role: "protein", required: true, scale: { min: 100, max: 220 }, only: ["greek yogurt"] },
      { role: "fruit", required: true },
      { role: "fat_topping", required: false, only: SWEET_TOPPINGS },
    ],
    name: (pick) => `${display(pick("fruit")?.name)} Yogurt Pot`,
  },
  {
    id: "cottage-cheese-fruit",
    archetype: "Cottage Cheese Pot",
    mealTypes: ["snack"],
    diets: { omnivore: true, vegetarian: true, vegan: false },
    glutenFreeCapable: true,
    slots: [
      { role: "protein", required: true, scale: { min: 90, max: 200 }, only: ["cottage cheese"] },
      { role: "fruit", required: true },
      { role: "fat_topping", required: false, only: SWEET_TOPPINGS },
    ],
    name: (pick) => `Cottage Cheese & ${display(pick("fruit")?.name)}`,
  },
  {
    id: "nut-butter-banana",
    archetype: "Nut Butter Banana",
    mealTypes: ["snack"],
    diets: { omnivore: true, vegetarian: true, vegan: true },
    glutenFreeCapable: true,
    slots: [
      { role: "fruit", required: true, only: ["banana", "apple"] },
      { role: "fat_topping", required: true, scale: { min: 12, max: 34 }, only: ["peanut butter"] },
    ],
    name: (pick) => `${display(pick("fruit")?.name)} with Peanut Butter`,
  },
  {
    id: "boiled-eggs-fruit",
    archetype: "Boiled Eggs",
    mealTypes: ["snack"],
    diets: { omnivore: true, vegetarian: true, vegan: false },
    glutenFreeCapable: true,
    slots: [
      { role: "protein", required: true, only: ["egg"] },
      { role: "fruit", required: true, scale: { min: 80, max: 200 } },
    ],
    name: (pick) => `Boiled Eggs & ${display(pick("fruit")?.name)}`,
  },
];

/** Templates valid for a meal type under the given diet (+ gluten-free) constraints. */
export function templatesFor(
  mealSlot: GoalMealSlot,
  filter: { vegan?: boolean; vegetarian?: boolean; glutenFree?: boolean },
): MealTemplate[] {
  return MEAL_TEMPLATES.filter((t) => {
    if (!t.mealTypes.includes(mealSlot)) return false;
    if (filter.glutenFree && !t.glutenFreeCapable) return false;
    if (filter.vegan) return t.diets.vegan;
    if (filter.vegetarian) return t.diets.vegetarian;
    return t.diets.omnivore;
  });
}
