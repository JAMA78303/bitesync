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
  /**
   * Rough per-meal calorie range this template can reach (default fills, scale
   * slot swept min→max). Used to pick weight-appropriate templates per goal:
   * light templates for low targets, reaching templates for build-muscle.
   */
  kcalRange: [number, number];
  /**
   * Calorie-dense ingredient added (in growing portions) to reach high targets
   * when the primary slot maxes out — a coherent topping/fat for the archetype
   * (peanut butter on oats, avocado on a bowl, olive oil on a stir-fry).
   */
  booster?: { name: string; unit: string; steps: number[] };
  slots: TemplateSlot[];
  name: (pick: TemplateFillLookup) => string;
};

const LIQUID_DAIRY = ["milk", "oat milk", "almond milk"];
/**
 * Bases you can actually simmer into porridge. Whitelisted rather than excluded:
 * `breakfast_base` also holds cornflakes and rice cakes, and the porridge template
 * names itself "<fruit> Porridge" regardless of which base it drew — which is how
 * "Apple Porridge" ended up made of cornflakes.
 */
const PORRIDGE_BASES = ["oats", "buckwheat"];
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
    kcalRange: [260, 720],
    booster: { name: "peanut butter", unit: "g", steps: [12, 22, 32] },
    slots: [
      { role: "breakfast_base", required: true, scale: { min: 30, max: 120 }, only: PORRIDGE_BASES },
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
    kcalRange: [250, 680],
    booster: { name: "peanut butter", unit: "g", steps: [12, 22, 32] },
    slots: [
      { role: "breakfast_base", required: true, scale: { min: 30, max: 100 }, only: ["oats"] },
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
    kcalRange: [200, 640],
    booster: { name: "almonds", unit: "g", steps: [12, 20, 30] },
    slots: [
      { role: "protein", required: true, scale: { min: 120, max: 320 }, only: ["greek yogurt"] },
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
    kcalRange: [250, 720],
    booster: { name: "avocado", unit: "g", steps: [40, 70, 100] },
    slots: [
      { role: "protein", required: true, only: ["egg"] },
      { role: "base_carb", required: true, scale: { min: 40, max: 150 }, only: ["wholemeal bread"] },
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
    kcalRange: [240, 720],
    booster: { name: "avocado", unit: "g", steps: [40, 70, 100] },
    slots: [
      { role: "protein", required: true, only: ["tofu"] },
      { role: "vegetable", required: true, count: 2, only: ["spinach", "tomato", "mushroom", "red pepper"] },
      { role: "base_carb", required: false, scale: { min: 40, max: 160 }, only: ["wholemeal bread", "potato"] },
    ],
    name: (pick) => `Tofu Scramble with ${display(pick("vegetable")?.name, "Veg")}`,
  },
  {
    id: "nut-butter-toast",
    archetype: "Nut Butter Toast",
    mealTypes: ["breakfast"],
    diets: { omnivore: true, vegetarian: true, vegan: true },
    glutenFreeCapable: false,
    kcalRange: [320, 820],
    booster: { name: "avocado", unit: "g", steps: [40, 70, 100] },
    slots: [
      { role: "base_carb", required: true, scale: { min: 50, max: 170 }, only: ["wholemeal bread"] },
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
    kcalRange: [400, 1150],
    booster: { name: "avocado", unit: "g", steps: [50, 90, 130] },
    slots: [
      { role: "base_carb", required: true, scale: { min: 50, max: 380 }, not: ["pasta", "wholemeal bread"] },
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
    kcalRange: [380, 1080],
    booster: { name: "olive oil", unit: "ml", steps: [6, 12, 18] },
    slots: [
      { role: "protein", required: true, not: SOFT_PROTEINS },
      { role: "vegetable", required: true, count: 2 },
      { role: "base_carb", required: true, scale: { min: 50, max: 360 }, only: ["rice", "brown rice", "quinoa"] },
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
    kcalRange: [420, 1120],
    booster: { name: "olive oil", unit: "ml", steps: [6, 12, 18] },
    slots: [
      { role: "protein", required: true, not: [...SOFT_PROTEINS, "egg"] },
      { role: "base_carb", required: true, scale: { min: 120, max: 460 }, only: ["potato", "sweet potato"] },
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
    kcalRange: [280, 900],
    booster: { name: "avocado", unit: "g", steps: [50, 90, 130] },
    slots: [
      { role: "protein", required: true, not: SOFT_PROTEINS },
      { role: "vegetable", required: true, count: 2, only: ["cucumber", "tomato", "red pepper", "spinach", "carrot"] },
      { role: "base_carb", required: false, scale: { min: 40, max: 180 }, only: ["quinoa"] },
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
    kcalRange: [360, 1050],
    booster: { name: "olive oil", unit: "ml", steps: [6, 12, 18] },
    slots: [
      { role: "protein", required: true, only: ["lentils", "chickpeas", "chicken breast"] },
      { role: "vegetable", required: true, count: 2, only: ["spinach", "tomato", "onion", "red pepper"] },
      { role: "base_carb", required: true, scale: { min: 50, max: 380 }, only: ["rice", "brown rice"] },
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
    kcalRange: [140, 470],
    booster: { name: "almonds", unit: "g", steps: [12, 22, 32] },
    slots: [
      { role: "protein", required: true, scale: { min: 100, max: 260 }, only: ["greek yogurt"] },
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
    kcalRange: [140, 450],
    booster: { name: "almonds", unit: "g", steps: [12, 22, 32] },
    slots: [
      { role: "protein", required: true, scale: { min: 90, max: 240 }, only: ["cottage cheese"] },
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
    kcalRange: [150, 420],
    booster: { name: "almonds", unit: "g", steps: [10, 18, 26] },
    slots: [
      { role: "fruit", required: true, only: ["banana", "apple"] },
      { role: "fat_topping", required: true, scale: { min: 12, max: 40 }, only: ["peanut butter"] },
    ],
    name: (pick) => `${display(pick("fruit")?.name)} with Peanut Butter`,
  },
  {
    id: "boiled-eggs-fruit",
    archetype: "Boiled Eggs",
    mealTypes: ["snack"],
    diets: { omnivore: true, vegetarian: true, vegan: false },
    glutenFreeCapable: true,
    kcalRange: [200, 440],
    booster: { name: "almonds", unit: "g", steps: [12, 22, 32] },
    slots: [
      { role: "protein", required: true, only: ["egg"] },
      { role: "fruit", required: true, scale: { min: 80, max: 240 } },
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

/** How far a per-meal target sits outside a template's reachable range (0 = inside). */
export function targetDistance(template: MealTemplate, target: number): number {
  const [lo, hi] = template.kcalRange;
  if (target < lo) return lo - target;
  if (target > hi) return target - hi;
  return 0;
}

/**
 * Weight-class aware ordering: templates that can actually reach the target come
 * first (lighter ones for low targets, reaching ones for high targets), each tier
 * seed-rotated for variety. Ties broken by how snugly the target sits in-range.
 */
export function rankTemplatesForTarget(
  templates: MealTemplate[],
  target: number,
  seed: number,
): MealTemplate[] {
  const scored = templates.map((t, i) => {
    const dist = targetDistance(t, target);
    const [lo, hi] = t.kcalRange;
    // Prefer ranges centred near the target so we scale toward the middle, not an edge.
    const centre = (lo + hi) / 2;
    return { t, i, dist, centreGap: Math.abs(target - centre) };
  });
  const rotate = ((seed >>> 0) % Math.max(1, scored.length)) || 0;
  return scored
    .sort((a, b) => {
      if (a.dist !== b.dist) return a.dist - b.dist;
      // Within the same reachability tier, rotate by seed for variety.
      const ra = (a.i + rotate) % scored.length;
      const rb = (b.i + rotate) % scored.length;
      if (ra !== rb) return ra - rb;
      return a.centreGap - b.centreGap;
    })
    .map((s) => s.t);
}
