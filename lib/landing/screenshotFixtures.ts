import { addDays } from "@/lib/utils/dates";
import {
  getTrafficLight,
  getTrafficLightLabel,
  isAboveUpperLimit,
  isUnderTarget,
  NUTRIENT_LABELS,
  UK_DRVS,
  type MicroCheckContext,
  type Sex,
} from "@/lib/nutrition/drv";
import { buildGridFromEntries } from "@/lib/planner/build-grid";
import type { MicroAnalysis, NutrientResult } from "@/lib/supabase/nutrition";
import type { MealPlanEntry, MealType } from "@/types";
import type { TDEEFormValues } from "@/lib/utils/tdee";
import type { TodayMeal, TodayTotals } from "@/lib/planner/today";
import type { UserNutritionTargets } from "@/lib/utils/nutrition-targets";
import type { ImportResult } from "@/components/recipes/ImportRecipeModal";

export const SCREENSHOT_WEEK_START = new Date("2026-05-12T12:00:00");
export const SCREENSHOT_WEEK_ISO = "2026-05-12";
export const SCREENSHOT_WEEK_DATES = Array.from({ length: 7 }, (_, i) => addDays(SCREENSHOT_WEEK_START, i));

export const SCREENSHOT_TARGETS: UserNutritionTargets = {
  kcal: 2200,
  protein: 155,
  carbs: 220,
  fat: 73,
  fibre: 30,
};

export const SCREENSHOT_TDEE_DEFAULTS: TDEEFormValues = {
  weightKg: 78,
  heightCm: 178,
  age: 32,
  sex: "male",
  activityLevel: "moderate",
  goal: "lose",
};

export const SCREENSHOT_TODAY_TOTALS: TodayTotals = {
  kcal: 1850,
  protein: 142,
  carbs: 168,
  fat: 58,
  fibre: 26,
};

export const SCREENSHOT_TODAY_MEALS: TodayMeal[] = [
  {
    id: "t1",
    mealType: "breakfast",
    slotIndex: 0,
    logged: false,
    servingLabel: null,
    quickAddName: null,
    quickAddCalories: null,
    recipe: {
      id: "r1",
      name: "Greek yoghurt & berries",
      kcal: 320,
      protein: 24,
      carbs: 38,
      fat: 8,
      fibre: 4,
      imageUrl: null,
    },
  },
  {
    id: "t2",
    mealType: "lunch",
    slotIndex: 0,
    logged: false,
    servingLabel: null,
    quickAddName: null,
    quickAddCalories: null,
    recipe: {
      id: "r2",
      name: "Chicken quinoa bowl",
      kcal: 485,
      protein: 42,
      carbs: 51,
      fat: 12,
      fibre: 8,
      imageUrl: null,
    },
  },
  {
    id: "t3",
    mealType: "dinner",
    slotIndex: 0,
    logged: false,
    servingLabel: null,
    quickAddName: null,
    quickAddCalories: null,
    recipe: {
      id: "r3",
      name: "Salmon tray bake",
      kcal: 610,
      protein: 48,
      carbs: 42,
      fat: 22,
      fibre: 7,
      imageUrl: null,
    },
  },
];

function recipeEntry(
  id: string,
  day: number,
  mealType: MealType,
  name: string,
  calories: number,
  protein: number,
): MealPlanEntry {
  return {
    id,
    meal_plan_id: "screenshot-plan",
    recipe_id: `recipe-${id}`,
    day_of_week: day,
    meal_type: mealType,
    slot_index: 0,
    quick_add_name: null,
    quick_add_calories: null,
    recipe: {
      id: `recipe-${id}`,
      name,
      recipe_nutrition: { calories, protein_g: protein, carbs_g: 45, fat_g: 14, fibre_g: 6 },
    },
  };
}

/** Varied planner week — no recipe repeats in the same meal slot. */
export const SCREENSHOT_PLANNER_ENTRIES: MealPlanEntry[] = [
  recipeEntry("a", 0, "lunch", "Chicken quinoa bowl", 485, 42),
  recipeEntry("b", 0, "dinner", "Salmon tray bake", 610, 48),
  recipeEntry("c", 1, "lunch", "Turkey & sweet potato", 520, 44),
  recipeEntry("d", 1, "dinner", "Pesto pasta primavera", 620, 28),
  recipeEntry("e", 2, "breakfast", "Greek yoghurt & berries", 320, 24),
  recipeEntry("f", 2, "lunch", "Lentil & spinach soup", 410, 22),
  recipeEntry("g", 3, "dinner", "Beef stir-fry & rice", 580, 38),
  recipeEntry("h", 4, "lunch", "Tuna niçoise salad", 455, 36),
  recipeEntry("i", 5, "dinner", "Roast chicken & veg", 540, 46),
];

/** Fuller week for AI plan screenshot. */
export const SCREENSHOT_AI_PLAN_ENTRIES: MealPlanEntry[] = [
  ...SCREENSHOT_PLANNER_ENTRIES,
  recipeEntry("j", 3, "lunch", "Halloumi grain bowl", 495, 26),
  recipeEntry("k", 4, "breakfast", "Overnight oats", 360, 18),
  recipeEntry("l", 4, "dinner", "Prawn linguine", 590, 34),
  recipeEntry("m", 5, "lunch", "Chicken fajita bowl", 505, 40),
  recipeEntry("n", 6, "breakfast", "Scrambled eggs & toast", 380, 22),
  recipeEntry("o", 6, "dinner", "Mushroom risotto", 560, 16),
];

export const SCREENSHOT_PLANNER_GRID = buildGridFromEntries(SCREENSHOT_PLANNER_ENTRIES);
export const SCREENSHOT_AI_PLAN_GRID = buildGridFromEntries(SCREENSHOT_AI_PLAN_ENTRIES);

export const SCREENSHOT_PLANNER_RECIPES = [
  { id: "recipe-a", name: "Chicken quinoa bowl", calories: 485, ingredientNames: ["chicken", "quinoa"] },
  { id: "recipe-b", name: "Salmon tray bake", calories: 610, ingredientNames: ["salmon", "broccoli"] },
  { id: "recipe-c", name: "Turkey & sweet potato", calories: 520, ingredientNames: ["turkey", "sweet potato"] },
  { id: "recipe-d", name: "Pesto pasta primavera", calories: 620, ingredientNames: ["pasta", "pesto"] },
  { id: "recipe-e", name: "Greek yoghurt & berries", calories: 320, ingredientNames: ["yoghurt", "berries"] },
  { id: "recipe-f", name: "Lentil & spinach soup", calories: 410, ingredientNames: ["lentils", "spinach"] },
  { id: "recipe-g", name: "Beef stir-fry & rice", calories: 580, ingredientNames: ["beef", "rice"] },
  { id: "recipe-h", name: "Tuna niçoise salad", calories: 455, ingredientNames: ["tuna", "eggs"] },
  { id: "recipe-i", name: "Roast chicken & veg", calories: 540, ingredientNames: ["chicken", "potatoes"] },
  { id: "recipe-j", name: "Halloumi grain bowl", calories: 495, ingredientNames: ["halloumi", "quinoa"] },
  { id: "recipe-k", name: "Overnight oats", calories: 360, ingredientNames: ["oats", "milk"] },
  { id: "recipe-l", name: "Prawn linguine", calories: 590, ingredientNames: ["prawns", "pasta"] },
  { id: "recipe-m", name: "Chicken fajita bowl", calories: 505, ingredientNames: ["chicken", "pepper"] },
  { id: "recipe-n", name: "Scrambled eggs & toast", calories: 380, ingredientNames: ["eggs", "bread"] },
  { id: "recipe-o", name: "Mushroom risotto", calories: 560, ingredientNames: ["mushrooms", "rice"] },
];

export const SCREENSHOT_RECIPE_DETAIL = {
  recipe: {
    id: "screenshot-recipe",
    name: "Chicken quinoa bowl",
    description: "A balanced bowl with lean protein and whole grains.",
    method_steps: ["Cook quinoa.", "Pan-fry chicken.", "Steam broccoli and assemble."],
    servings: 2,
    source_url: null,
    source_domain: null,
    imported_at: null,
    detected_servings: null,
    cooking_for: null,
  },
  ingredients: [
    { id: "i1", name: "Chicken breast", quantity: 140, unit: "g", nutrition_estimated: false },
    { id: "i2", name: "Quinoa", quantity: 60, unit: "g", nutrition_estimated: false },
    { id: "i3", name: "Broccoli", quantity: 100, unit: "g", nutrition_estimated: false },
  ],
  nutrition: { calories: 485, protein_g: 42, carbs_g: 51, fat_g: 12 },
};

export const SCREENSHOT_GROCERY_ITEMS = [
  { id: "g1", name: "Chicken breast", quantity: 500, unit: "g", is_checked: true },
  { id: "g2", name: "Greek yoghurt", quantity: 500, unit: "g", is_checked: true },
  { id: "g3", name: "Quinoa", quantity: 250, unit: "g", is_checked: false },
  { id: "g4", name: "Spinach", quantity: 200, unit: "g", is_checked: false },
  { id: "g5", name: "Salmon fillet", quantity: 2, unit: "pack", is_checked: false },
];

export const SCREENSHOT_DIETARY_SELECTED = ["vegetarian", "gluten_free"];

export const SCREENSHOT_IMPORT_PREVIEW: Omit<ImportResult, "cookingFor"> = {
  name: "One-pan lemon chicken",
  sourceUrl: "https://www.bbcgoodfood.com/recipes/lemon-chicken",
  sourceDomain: "bbcgoodfood.com",
  sourceType: "recipe_blog",
  detectedServings: 4,
  ingredients: [
    { quantity: 4, unit: null, name: "chicken thighs", grams: 600, gramsSource: "estimated", rawText: "4 chicken thighs" },
    { quantity: 2, unit: null, name: "lemon", grams: 120, gramsSource: "estimated", rawText: "2 lemons" },
    { quantity: 2, unit: "tbsp", name: "olive oil", grams: 27, gramsSource: "estimated", rawText: "2 tbsp olive oil" },
  ],
  steps: ["Heat the oven to 200°C.", "Roast the chicken with lemon until cooked through."],
};

const SCREENSHOT_SEX: Sex = "male";

function nutrientResult(
  key: string,
  weeklyValue: number,
  context?: MicroCheckContext,
): NutrientResult {
  const drv = UK_DRVS[key]![SCREENSHOT_SEX];
  const traffic = getTrafficLight(key, weeklyValue, SCREENSHOT_SEX, context);
  const baseLabel = getTrafficLightLabel(key, weeklyValue, SCREENSHOT_SEX, context);
  return {
    key,
    label: NUTRIENT_LABELS[key] ?? key,
    daily_avg: weeklyValue / 7,
    unit: drv.unit,
    rni: drv.rni || null,
    upper: drv.upper || null,
    type: drv.type,
    traffic,
    pct_label: baseLabel,
    under_target: isUnderTarget(key, weeklyValue, SCREENSHOT_SEX),
    above_upper: isAboveUpperLimit(key, weeklyValue, SCREENSHOT_SEX, context),
    partial: false,
  };
}

/** Threshold colours from real DRV logic — iodine 86% amber, vitamin D 97% green. */
export const SCREENSHOT_MICRO_ANALYSIS: MicroAnalysis = {
  week_start: SCREENSHOT_WEEK_ISO,
  covered_items: 28,
  total_items: 28,
  must_hit: [
    nutrientResult("vitamin_d_mcg", 10 * 0.97 * 7),
    nutrientResult("vitamin_c_mg", 48 * 7),
    nutrientResult("iron_mg", 12 * 7),
    nutrientResult("calcium_mg", 720 * 7),
    nutrientResult("folate_mcg", 260 * 7),
    nutrientResult("iodine_mcg", 140 * 0.86 * 7),
    nutrientResult("vitamin_a_mcg", 840 * 7, { weeklyRetinolMcg: 55 * 7 }),
    nutrientResult("vitamin_b12_mcg", 1.5 * 1.1 * 7),
    nutrientResult("zinc_mg", 9 * 7),
    nutrientResult("magnesium_mg", 290 * 7),
    nutrientResult("potassium_mg", 3400 * 7),
    nutrientResult("selenium_mcg", 72 * 7),
  ],
  must_limit: [
    nutrientResult("saturated_fat_g", 22 * 7),
    nutrientResult("salt_g", 5.2 * 7),
    nutrientResult("sugar_g", 24 * 7),
  ],
};
