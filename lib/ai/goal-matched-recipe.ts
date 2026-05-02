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
  /** Changes template choice so drafts are not identical every time (e.g. Date.now() from client). */
  variantSeed: number;
};

function clampTarget(kcal: number): number {
  return Math.min(Math.max(Math.round(kcal), 120), 2000);
}

function pickVariant(seed: number, modulo: number): number {
  if (modulo <= 0) return 0;
  return (seed >>> 0) % modulo;
}

/** Second template axis so carb tuning does not wash out protein choice. */
function pickVariantAlt(seed: number, modulo: number): number {
  return pickVariant((seed >>> 13) ^ (seed << 3), modulo);
}

function titleCaseWords(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/g)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Readable recipe title from the drafted ingredients (not generic "Goal-matched lunch"). */
export function buildGoalMatchedRecipeTitle(ingredients: RecipeIngredientInput[], mealSlot: GoalMealSlot): string {
  const carbish = new Set([
    "rice",
    "oats",
    "quinoa",
    "white rice",
    "pasta",
  ]);
  const ordered = [...ingredients].sort((a, b) => b.quantity - a.quantity);
  const highlights = ordered
    .filter((i) => !carbish.has(i.name.toLowerCase().trim()))
    .map((i) => titleCaseWords(i.name))
    .filter(Boolean);
  const carb = ordered.find((i) => carbish.has(i.name.toLowerCase().trim()));
  const head = highlights.slice(0, 2).join(" & ");
  const carbBit = carb ? ` with ${titleCaseWords(carb.name)}` : "";
  const slot = mealLabel(mealSlot);
  if (!head) {
    const fallback = ordered
      .slice(0, 3)
      .map((i) => titleCaseWords(i.name))
      .filter(Boolean)
      .join(" & ");
    const core = (fallback || "Balanced plate").trim();
    return core ? `${core} — ${slot}` : `${slot} plate`;
  }
  const core = `${head}${carbBit}`.trim();
  return core ? `${core} — ${slot}` : `${slot} plate`;
}

/** Builds ingredient rows from the in-app nutrition DB; calories should land within ±100 kcal of target when possible. */
export function buildGoalMatchedRecipeIngredients(opts: GoalMatchedRecipeOptions): RecipeIngredientInput[] {
  const target = clampTarget(opts.targetCalories);
  const carbName = opts.glutenFree ? "rice" : "oats";
  const seed = opts.variantSeed;

  if (opts.vegan) {
    if (opts.mealSlot === "snack") {
      const v = pickVariant(seed, 4);
      const v2 = pickVariantAlt(seed, 2);
      if (v === 0) {
        const base = [ing("tofu", 90, "g"), ing(v2 === 0 ? "banana" : "apple", 100, "g")];
        return findBestCarbAdjustment(base, { name: "quinoa", minG: 0, maxG: 180 }, target);
      }
      if (v === 1) {
        const base = [ing("chickpeas", 100, "g"), ing(v2 === 0 ? "banana" : "apple", 100, "g")];
        return findBestCarbAdjustment(base, { name: "quinoa", minG: 0, maxG: 200 }, target);
      }
      if (v === 2) {
        const base = [ing("lentils", 80, "g"), ing("apple", 120, "g")];
        return findBestCarbAdjustment(base, { name: "quinoa", minG: 0, maxG: 160 }, target);
      }
      const base = [ing("tofu", 85, "g"), ing("carrot", 100, "g")];
      return findBestCarbAdjustment(base, { name: "quinoa", minG: 0, maxG: 170 }, target);
    }
    const v = pickVariant(seed, 5);
    if (v === 0) {
      const base = [ing("tofu", 150, "g"), ing("chickpeas", 80, "g"), ing("broccoli", 100, "g")];
      return findBestCarbAdjustment(base, { name: "quinoa", minG: 0, maxG: 220 }, target);
    }
    if (v === 1) {
      const base = [ing("tofu", 140, "g"), ing("lentils", 90, "g"), ing("spinach", 100, "g")];
      return findBestCarbAdjustment(base, { name: "quinoa", minG: 0, maxG: 220 }, target);
    }
    if (v === 2) {
      const base = [ing("lentils", 110, "g"), ing("chickpeas", 70, "g"), ing("tomato", 120, "g")];
      return findBestCarbAdjustment(base, { name: "rice", minG: 0, maxG: 260 }, target);
    }
    if (v === 3) {
      const base = [ing("tofu", 130, "g"), ing("broccoli", 120, "g"), ing("bell pepper", 80, "g")];
      return findBestCarbAdjustment(base, { name: "quinoa", minG: 0, maxG: 200 }, target);
    }
    const base = [ing("tofu", 130, "g"), ing("broccoli", 120, "g"), ing("spinach", 80, "g")];
    return findBestCarbAdjustment(base, { name: "quinoa", minG: 0, maxG: 200 }, target);
  }

  if (opts.vegetarian) {
    if (opts.mealSlot === "breakfast" || opts.mealSlot === "snack") {
      const v = pickVariant(seed, 2);
      const base =
        v === 0
          ? [ing("egg", 2, "piece"), ing("banana", 100, "g")]
          : [ing("egg", 2, "piece"), ing("greek yogurt", 100, "g")];
      const carb = opts.glutenFree
        ? { name: "rice" as const, minG: 0, maxG: 150 }
        : { name: "oats" as const, minG: 15, maxG: 120 };
      const out = findBestCarbAdjustment(base, carb, target);
      const p = calculateRecipeNutrition(out).protein_g;
      if (p < 12) {
        const base2 =
          v === 0
            ? [ing("egg", 3, "piece"), ing("banana", 100, "g")]
            : [ing("egg", 3, "piece"), ing("greek yogurt", 100, "g")];
        return findBestCarbAdjustment(base2, carb, target);
      }
      return out;
    }
    const v = pickVariant(seed, 4);
    if (v === 0) {
      const base = [ing("lentils", 100, "g"), ing("broccoli", 100, "g")];
      return findBestCarbAdjustment(base, { name: "rice", minG: 0, maxG: 280 }, target);
    }
    if (v === 1) {
      const base = [ing("chickpeas", 110, "g"), ing("spinach", 100, "g")];
      return findBestCarbAdjustment(base, { name: "rice", minG: 0, maxG: 280 }, target);
    }
    if (v === 2) {
      const base = [ing("lentils", 90, "g"), ing("tomato", 150, "g"), ing("onion", 60, "g")];
      return findBestCarbAdjustment(base, { name: "pasta", minG: 40, maxG: 200 }, target);
    }
    const base = [ing("chickpeas", 95, "g"), ing("bell pepper", 100, "g"), ing("carrot", 70, "g")];
    return findBestCarbAdjustment(base, { name: "rice", minG: 0, maxG: 260 }, target);
  }

  // Omnivore
  if (opts.mealSlot === "snack") {
    const v = pickVariant(seed, 5);
    const fruit = pickVariantAlt(seed, 2) === 0 ? "banana" : "apple";
    if (v === 0) {
      const base = [ing("greek yogurt", 130, "g"), ing(fruit, 90, "g")];
      return findBestCarbAdjustment(base, { name: carbName, minG: opts.glutenFree ? 0 : 10, maxG: 100 }, target);
    }
    if (v === 1) {
      const base = [ing("egg", 2, "piece"), ing(fruit, 100, "g")];
      return findBestCarbAdjustment(base, { name: carbName, minG: opts.glutenFree ? 0 : 10, maxG: 90 }, target);
    }
    if (v === 2) {
      const base = [ing("chicken breast", 100, "g"), ing("cheddar cheese", 40, "g")];
      return findBestCarbAdjustment(base, { name: "rice", minG: 0, maxG: 120 }, target);
    }
    if (v === 3) {
      const base = [ing("turkey breast", 110, "g"), ing("carrot", 80, "g")];
      return findBestCarbAdjustment(base, { name: "rice", minG: 0, maxG: 110 }, target);
    }
    const base = [ing("tuna", 120, "g"), ing("bell pepper", 70, "g")];
    return findBestCarbAdjustment(base, { name: "rice", minG: 0, maxG: 130 }, target);
  }

  const v = pickVariant(seed, 8);
  if (v === 0) {
    const base = [ing("chicken breast", 140, "g"), ing("broccoli", 100, "g")];
    return findBestCarbAdjustment(base, { name: "rice", minG: 0, maxG: 320 }, target);
  }
  if (v === 1) {
    const base = [ing("salmon", 150, "g"), ing("broccoli", 100, "g")];
    return findBestCarbAdjustment(base, { name: "rice", minG: 0, maxG: 300 }, target);
  }
  if (v === 2) {
    const base = [ing("chicken breast", 120, "g"), ing("spinach", 120, "g")];
    return findBestCarbAdjustment(base, { name: "rice", minG: 0, maxG: 300 }, target);
  }
  if (v === 3) {
    const base = [ing("salmon", 130, "g"), ing("spinach", 100, "g")];
    return findBestCarbAdjustment(base, { name: "rice", minG: 0, maxG: 280 }, target);
  }
  if (v === 4) {
    const base = [ing("turkey breast", 160, "g"), ing("green beans", 120, "g")];
    return findBestCarbAdjustment(base, { name: "rice", minG: 0, maxG: 280 }, target);
  }
  if (v === 5) {
    const base = [ing("beef mince", 130, "g"), ing("bell pepper", 100, "g"), ing("onion", 50, "g")];
    return findBestCarbAdjustment(base, { name: "rice", minG: 0, maxG: 260 }, target);
  }
  if (v === 6) {
    const base = [ing("tuna", 150, "g"), ing("carrot", 100, "g"), ing("peas", 80, "g")];
    return findBestCarbAdjustment(base, { name: "rice", minG: 0, maxG: 280 }, target);
  }
  const base = [ing("shrimp", 140, "g"), ing("broccoli", 110, "g"), ing("bell pepper", 70, "g")];
  return findBestCarbAdjustment(base, { name: "rice", minG: 0, maxG: 260 }, target);
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
