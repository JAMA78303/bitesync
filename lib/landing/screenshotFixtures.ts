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
export const SCREENSHOT_WEEK_LABEL = "12th May – 18th May, 2026";
export const SCREENSHOT_TODAY_DATE_LABEL = "Monday 12th May";

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

/** Completed on-target day — greens on ring and macro bars. */
export const SCREENSHOT_TODAY_TOTALS: TodayTotals = {
  kcal: 2140,
  protein: 162,
  carbs: 208,
  fat: 70,
  fibre: 32,
};

export const SCREENSHOT_TODAY_MEALS: TodayMeal[] = [
  {
    id: "t1",
    mealType: "breakfast",
    slotIndex: 0,
    logged: true,
    servingLabel: null,
    quickAddName: null,
    quickAddCalories: null,
    recipe: {
      id: "r1",
      name: "Oats & berries",
      kcal: 400,
      protein: 28,
      carbs: 48,
      fat: 12,
      fibre: 6,
      imageUrl: null,
    },
  },
  {
    id: "t2",
    mealType: "lunch",
    slotIndex: 0,
    logged: true,
    servingLabel: null,
    quickAddName: null,
    quickAddCalories: null,
    recipe: {
      id: "r2",
      name: "Quinoa bowl",
      kcal: 580,
      protein: 46,
      carbs: 55,
      fat: 18,
      fibre: 8,
      imageUrl: null,
    },
  },
  {
    id: "t3",
    mealType: "dinner",
    slotIndex: 0,
    logged: true,
    servingLabel: null,
    quickAddName: null,
    quickAddCalories: null,
    recipe: {
      id: "r3",
      name: "Salmon bake",
      kcal: 710,
      protein: 52,
      carbs: 62,
      fat: 22,
      fibre: 9,
      imageUrl: null,
    },
  },
  {
    id: "t4",
    mealType: "snack",
    slotIndex: 0,
    logged: true,
    servingLabel: null,
    quickAddName: null,
    quickAddCalories: null,
    recipe: {
      id: "r4",
      name: "Greek yoghurt",
      kcal: 450,
      protein: 36,
      carbs: 43,
      fat: 18,
      fibre: 9,
      imageUrl: null,
    },
  },
];

type MealSeed = { name: string; kcal: number; protein: number };

/** Short names that fit planner cards at 390px — 21 unique meals for a full week. */
const SCREENSHOT_WEEK_MEALS: MealSeed[] = [
  { name: "Oats & berries", kcal: 320, protein: 18 },
  { name: "Quinoa bowl", kcal: 485, protein: 42 },
  { name: "Salmon bake", kcal: 610, protein: 48 },
  { name: "Turkey bowl", kcal: 520, protein: 44 },
  { name: "Pesto pasta", kcal: 620, protein: 28 },
  { name: "Lentil soup", kcal: 410, protein: 22 },
  { name: "Beef stir-fry", kcal: 580, protein: 38 },
  { name: "Niçoise salad", kcal: 455, protein: 36 },
  { name: "Roast chicken", kcal: 540, protein: 46 },
  { name: "Halloumi bowl", kcal: 495, protein: 26 },
  { name: "Overnight oats", kcal: 360, protein: 18 },
  { name: "Prawn linguine", kcal: 590, protein: 34 },
  { name: "Fajita bowl", kcal: 505, protein: 40 },
  { name: "Eggs & toast", kcal: 380, protein: 22 },
  { name: "Mushroom risotto", kcal: 560, protein: 16 },
  { name: "Tofu stir-fry", kcal: 430, protein: 24 },
  { name: "Chicken wrap", kcal: 470, protein: 38 },
  { name: "Fish tacos", kcal: 520, protein: 32 },
  { name: "Veggie curry", kcal: 490, protein: 18 },
  { name: "Steak & greens", kcal: 550, protein: 44 },
  { name: "Shakshuka", kcal: 390, protein: 20 },
];

function recipeEntry(
  id: string,
  day: number,
  mealType: MealType,
  seed: MealSeed,
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
      name: seed.name,
      recipe_nutrition: {
        calories: seed.kcal,
        protein_g: seed.protein,
        carbs_g: 45,
        fat_g: 14,
        fibre_g: 6,
      },
    },
  };
}

function buildFullWeekEntries(includeSnacks = false): MealPlanEntry[] {
  const entries: MealPlanEntry[] = [];
  const mealTypes: MealType[] = ["breakfast", "lunch", "dinner"];
  let seedIndex = 0;

  for (let day = 0; day < 7; day += 1) {
    for (const mealType of mealTypes) {
      const seed = SCREENSHOT_WEEK_MEALS[seedIndex % SCREENSHOT_WEEK_MEALS.length]!;
      entries.push(recipeEntry(`w${seedIndex}`, day, mealType, seed));
      seedIndex += 1;
    }
    if (includeSnacks) {
      const snack = SCREENSHOT_WEEK_MEALS[seedIndex % SCREENSHOT_WEEK_MEALS.length]!;
      entries.push(recipeEntry(`s${day}`, day, "snack", snack));
      seedIndex += 1;
    }
  }

  return entries;
}

/** Full varied week — every breakfast/lunch/dinner slot filled. */
export const SCREENSHOT_PLANNER_ENTRIES = buildFullWeekEntries(false);
/** AI plan adds a snack slot per day. */
export const SCREENSHOT_AI_PLAN_ENTRIES = buildFullWeekEntries(true);

export const SCREENSHOT_PLANNER_GRID = buildGridFromEntries(SCREENSHOT_PLANNER_ENTRIES);
export const SCREENSHOT_AI_PLAN_GRID = buildGridFromEntries(SCREENSHOT_AI_PLAN_ENTRIES);

export const SCREENSHOT_PLANNER_RECIPES = Array.from(
  new Map(
    [...SCREENSHOT_PLANNER_ENTRIES, ...SCREENSHOT_AI_PLAN_ENTRIES].map((entry) => {
      const nutrition = entry.recipe?.recipe_nutrition;
      const calories =
        nutrition && !Array.isArray(nutrition) ? (nutrition.calories ?? 0) : 0;
      return [
        entry.recipe_id,
        {
          id: entry.recipe_id!,
          name: entry.recipe?.name ?? "Meal",
          calories,
          ingredientNames: [entry.recipe?.name?.split(" ")[0]?.toLowerCase() ?? "food"],
        },
      ];
    }),
  ).values(),
) as { id: string; name: string; calories: number; ingredientNames: string[] }[];

export const SCREENSHOT_RECIPE_DETAIL = {
  recipe: {
    id: "screenshot-recipe",
    name: "Quinoa bowl",
    description: "Lean protein with whole grains and greens.",
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
  { id: "g5", name: "Salmon fillet", quantity: 2, unit: "each", is_checked: false },
];

export const SCREENSHOT_DIETARY_SELECTED = ["vegetarian", "gluten_free"];

export const SCREENSHOT_IMPORT_PREVIEW: Omit<ImportResult, "cookingFor"> = {
  name: "Lemon chicken traybake",
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

/** Threshold colours from real DRV logic — iodine 86% amber, rest mostly green. */
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
