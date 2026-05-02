import { calculateRecipeNutrition } from "@/lib/nutrition/calculate";
import type { RecipeIngredientInput } from "@/lib/nutrition/calculate";

/** Match a single meal to this fraction of daily calories (rough day split). */
export type GoalMealSlot = "breakfast" | "lunch" | "dinner" | "snack";

export const GOAL_MEAL_KCAL_TOLERANCE = 100;

export function fractionForMealSlot(slot: GoalMealSlot): number {
  switch (slot) {
    case "breakfast":
      return 0.26;
    case "lunch":
      return 0.33;
    case "dinner":
      return 0.34;
    case "snack":
      return 0.12;
    default:
      return 0.33;
  }
}

function ing(name: string, quantity: number, unit: string): RecipeIngredientInput {
  return { name, quantity, unit };
}

function cloneIngs(ings: RecipeIngredientInput[]): RecipeIngredientInput[] {
  return ings.map((i) => ({ ...i, name: i.name, quantity: i.quantity, unit: i.unit }));
}

function findBestCarbAdjustment(
  base: RecipeIngredientInput[],
  carb: { name: string; minG: number; maxG: number; step?: number },
  target: number,
): RecipeIngredientInput[] {
  const step = carb.step ?? 5;
  let best = [...cloneIngs(base), ing(carb.name, carb.minG, "g")];
  let bestScore = Number.POSITIVE_INFINITY;
  let bestWithin: RecipeIngredientInput[] | null = null;

  for (let g = carb.minG; g <= carb.maxG; g += step) {
    const attempt = [...cloneIngs(base), ing(carb.name, g, "g")];
    const cal = calculateRecipeNutrition(attempt).calories;
    const dist = Math.abs(cal - target);
    if (cal >= target - GOAL_MEAL_KCAL_TOLERANCE && cal <= target + GOAL_MEAL_KCAL_TOLERANCE) {
      const prev = bestWithin ? Math.abs(calculateRecipeNutrition(bestWithin).calories - target) : Number.POSITIVE_INFINITY;
      if (!bestWithin || dist < prev) bestWithin = attempt;
    }
    if (dist < bestScore) {
      bestScore = dist;
      best = attempt;
    }
  }
  return bestWithin ?? best;
}

export type GoalMatchedRecipeOptions = {
  targetCalories: number;
  mealSlot: GoalMealSlot;
  vegan: boolean;
  vegetarian: boolean;
  glutenFree: boolean;
};

function clampTarget(kcal: number): number {
  return Math.min(Math.max(Math.round(kcal), 120), 2000);
}

/** Builds ingredient rows from the in-app nutrition DB; calories should land within ±100 kcal of target when possible. */
export function buildGoalMatchedRecipeIngredients(opts: GoalMatchedRecipeOptions): RecipeIngredientInput[] {
  const target = clampTarget(opts.targetCalories);
  const carbName = opts.glutenFree ? "rice" : "oats";

  if (opts.vegan) {
    if (opts.mealSlot === "snack") {
      const base = [ing("tofu", 90, "g"), ing("banana", 100, "g")];
      return findBestCarbAdjustment(base, { name: "quinoa", minG: 0, maxG: 180 }, target);
    }
    const base = [ing("tofu", 150, "g"), ing("chickpeas", 80, "g"), ing("broccoli", 100, "g")];
    return findBestCarbAdjustment(base, { name: "quinoa", minG: 0, maxG: 220 }, target);
  }

  if (opts.vegetarian) {
    if (opts.mealSlot === "breakfast" || opts.mealSlot === "snack") {
      const base = [ing("egg", 2, "piece"), ing("banana", 100, "g")];
      const carb = opts.glutenFree
        ? { name: "rice" as const, minG: 0, maxG: 150 }
        : { name: "oats" as const, minG: 15, maxG: 120 };
      const out = findBestCarbAdjustment(base, carb, target);
      const p = calculateRecipeNutrition(out).protein_g;
      if (p < 12) {
        const base2 = [ing("egg", 3, "piece"), ing("banana", 100, "g")];
        return findBestCarbAdjustment(base2, carb, target);
      }
      return out;
    }
    const base = [ing("lentils", 100, "g"), ing("broccoli", 100, "g")];
    return findBestCarbAdjustment(base, { name: "rice", minG: 0, maxG: 280 }, target);
  }

  // Omnivore
  if (opts.mealSlot === "snack") {
    const base = [ing("greek yogurt", 130, "g"), ing("banana", 90, "g")];
    return findBestCarbAdjustment(base, { name: carbName, minG: opts.glutenFree ? 0 : 10, maxG: 100 }, target);
  }

  const base = [ing("chicken breast", 140, "g"), ing("broccoli", 100, "g")];
  return findBestCarbAdjustment(base, { name: "rice", minG: 0, maxG: 320 }, target);
}

export function mealLabel(slot: GoalMealSlot): string {
  switch (slot) {
    case "breakfast":
      return "Breakfast";
    case "lunch":
      return "Lunch";
    case "dinner":
      return "Dinner";
    case "snack":
      return "Snack";
    default:
      return "Meal";
  }
}
