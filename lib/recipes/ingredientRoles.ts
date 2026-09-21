/**
 * Part 1 — Ingredient → role mapping.
 *
 * The shared "what kind of food is this" knowledge that template-based meal
 * generation fills roles from. Every usable ingredient declares which meal
 * ROLES it can fill, its diet compatibility, and a sensible default portion.
 *
 * Names are the canonical nutrition-DB names (same strings the CoFID lookup and
 * the older goal-matched assembler already use), so this is one taxonomy, not a
 * parallel one — composition guards and pantry matching can share it.
 */

import type { ProteinAxis } from "@/lib/ai/goal-matched-recipe";
import { isDairyIngredient } from "@/lib/dietary/dairy";

export type IngredientRole =
  | "protein"
  | "base_carb"
  | "breakfast_base"
  | "vegetable"
  | "fruit"
  | "dairy"
  | "fat_topping"
  | "cooking_fat"
  | "flavour";

export type DietCompat = {
  vegan: boolean;
  vegetarian: boolean;
  glutenFree: boolean;
};

export type IngredientDef = {
  /** Canonical nutrition-DB name. */
  name: string;
  roles: IngredientRole[];
  diet: DietCompat;
  /** Default portion used when this ingredient is NOT the macro-scaled slot. */
  portion: { quantity: number; unit: string };
  /** For protein-role foods: bias bulk variety toward meat/fish/plant. */
  proteinAxis?: ProteinAxis;
};

export type DietFilter = {
  vegan?: boolean;
  vegetarian?: boolean;
  glutenFree?: boolean;
  dairyFree?: boolean;
};

const OMNI: DietCompat = { vegan: false, vegetarian: false, glutenFree: true };
const VEGGIE: DietCompat = { vegan: false, vegetarian: true, glutenFree: true };
const VEGGIE_GLUTEN: DietCompat = { vegan: false, vegetarian: true, glutenFree: false };
const VEGAN: DietCompat = { vegan: true, vegetarian: true, glutenFree: true };
const VEGAN_GLUTEN: DietCompat = { vegan: true, vegetarian: true, glutenFree: false };

function def(
  name: string,
  roles: IngredientRole[],
  diet: DietCompat,
  quantity: number,
  unit: string,
  proteinAxis?: ProteinAxis,
): IngredientDef {
  return { name, roles, diet, portion: { quantity, unit }, proteinAxis };
}

/**
 * The usable ingredient set. Extend freely as the nutrition DB grows — adding a
 * row here makes the ingredient available to every template that uses its role.
 */
export const INGREDIENT_CATALOG: IngredientDef[] = [
  // Proteins — meat
  def("chicken breast", ["protein"], OMNI, 140, "g", "meat"),
  def("turkey breast", ["protein"], OMNI, 150, "g", "meat"),
  def("beef mince", ["protein"], OMNI, 130, "g", "meat"),
  // Proteins — fish
  def("salmon", ["protein"], OMNI, 140, "g", "fish"),
  def("tuna", ["protein"], OMNI, 120, "g", "fish"),
  def("cod", ["protein"], OMNI, 150, "g", "fish"),
  def("shrimp", ["protein"], OMNI, 130, "g", "fish"),
  // Proteins — vegetarian
  def("egg", ["protein"], VEGGIE, 2, "each"),
  def("greek yogurt", ["protein", "dairy"], VEGGIE, 150, "g"),
  def("cottage cheese", ["protein", "dairy"], VEGGIE, 120, "g"),
  // Proteins — plant
  def("tofu", ["protein"], VEGAN, 150, "g", "plant"),
  def("lentils", ["protein"], VEGAN, 120, "g", "plant"),
  def("chickpeas", ["protein"], VEGAN, 120, "g", "plant"),

  // Base carbs (lunch/dinner)
  def("rice", ["base_carb"], VEGAN, 60, "g"),
  def("brown rice", ["base_carb"], VEGAN, 60, "g"),
  def("quinoa", ["base_carb"], VEGAN, 60, "g"),
  def("pasta", ["base_carb"], VEGAN_GLUTEN, 70, "g"),
  def("potato", ["base_carb"], VEGAN, 180, "g"),
  def("sweet potato", ["base_carb", "vegetable"], VEGAN, 150, "g"),

  // Breakfast bases
  def("oats", ["breakfast_base"], VEGAN_GLUTEN, 50, "g"),
  def("buckwheat", ["breakfast_base"], VEGAN, 50, "g"),
  def("rice cake", ["breakfast_base"], VEGAN, 30, "g"),
  def("cornflakes", ["breakfast_base"], VEGAN, 40, "g"),
  def("wholemeal bread", ["base_carb", "breakfast_base"], VEGAN_GLUTEN, 80, "g"),

  // Vegetables
  def("broccoli", ["vegetable"], VEGAN, 100, "g"),
  def("spinach", ["vegetable"], VEGAN, 80, "g"),
  def("kale", ["vegetable"], VEGAN, 70, "g"),
  def("carrot", ["vegetable"], VEGAN, 90, "g"),
  def("tomato", ["vegetable"], VEGAN, 100, "g"),
  def("red pepper", ["vegetable"], VEGAN, 80, "g"),
  def("cucumber", ["vegetable"], VEGAN, 90, "g"),
  def("green beans", ["vegetable"], VEGAN, 100, "g"),
  def("peas", ["vegetable"], VEGAN, 80, "g"),
  def("mushroom", ["vegetable"], VEGAN, 90, "g"),
  def("courgette", ["vegetable"], VEGAN, 90, "g"),
  def("onion", ["vegetable", "flavour"], VEGAN, 50, "g"),

  // Fruit
  def("banana", ["fruit"], VEGAN, 100, "g"),
  def("apple", ["fruit"], VEGAN, 120, "g"),
  def("strawberries", ["fruit"], VEGAN, 90, "g"),
  def("blueberries", ["fruit"], VEGAN, 80, "g"),
  def("orange", ["fruit"], VEGAN, 130, "g"),
  def("raspberries", ["fruit"], VEGAN, 80, "g"),

  // Dairy (liquids / cheese)
  def("milk", ["dairy"], VEGGIE, 200, "g"),
  def("oat milk", ["dairy"], VEGAN, 200, "g"),
  def("almond milk", ["dairy"], VEGAN, 200, "g"),
  def("cheddar cheese", ["dairy"], VEGGIE, 30, "g"),
  def("feta cheese", ["dairy"], VEGGIE, 40, "g"),

  // Fat toppings
  def("almonds", ["fat_topping"], VEGAN, 15, "g"),
  def("walnuts", ["fat_topping"], VEGAN, 14, "g"),
  def("cashews", ["fat_topping"], VEGAN, 15, "g"),
  def("peanut butter", ["fat_topping"], VEGAN, 18, "g"),
  def("chia seeds", ["fat_topping"], VEGAN, 10, "g"),
  def("pumpkin seeds", ["fat_topping"], VEGAN, 12, "g"),
  def("avocado", ["fat_topping"], VEGAN, 65, "g"),

  // Cooking fats
  def("olive oil", ["cooking_fat"], VEGAN, 8, "ml"),
];

const BY_NAME = new Map<string, IngredientDef>(
  INGREDIENT_CATALOG.map((d) => [d.name.toLowerCase(), d]),
);

/** Canonical role lookup for any ingredient name (shared "what kind of food" knowledge). */
export function rolesForIngredient(name: string): IngredientRole[] {
  const exact = BY_NAME.get(name.toLowerCase().trim());
  if (exact) return exact.roles;
  const n = name.toLowerCase().trim();
  const partial = INGREDIENT_CATALOG.find(
    (d) => n.includes(d.name.toLowerCase()) || d.name.toLowerCase().includes(n),
  );
  return partial?.roles ?? [];
}

export function getIngredientDef(name: string): IngredientDef | undefined {
  return BY_NAME.get(name.toLowerCase().trim());
}

/** True when an ingredient is allowed under the given dietary constraints. */
export function dietAllows(d: IngredientDef, filter: DietFilter): boolean {
  if (filter.glutenFree && !d.diet.glutenFree) return false;
  if (filter.vegan && !d.diet.vegan) return false;
  if (filter.vegetarian && !filter.vegan && !d.diet.vegetarian) return false;
  // By name, not role: oat and almond milk fill the "dairy" slot and are not dairy.
  if (filter.dairyFree && isDairyIngredient(d.name)) return false;
  return true;
}

/** All diet-compatible ingredients that can fill the given role. */
export function ingredientsForRole(role: IngredientRole, filter: DietFilter): IngredientDef[] {
  return INGREDIENT_CATALOG.filter((d) => d.roles.includes(role) && dietAllows(d, filter));
}
