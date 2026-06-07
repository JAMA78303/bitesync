import type { RecipeIngredientInput } from "@/lib/nutrition/calculate";
import { MICRO_RICH_FOODS } from "@/lib/nutrition/micro-rich-foods";
import { getRecipeNutritionTotals } from "@/lib/nutrition/recipeNutritionTotals";

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

async function findBestCarbAdjustment(
  base: RecipeIngredientInput[],
  carb: { name: string; minG: number; maxG: number; step?: number },
  target: number,
): Promise<RecipeIngredientInput[]> {
  const step = carb.step ?? 5;
  let best = [...cloneIngs(base), ing(carb.name, carb.minG, "g")];
  let bestScore = Number.POSITIVE_INFINITY;
  let bestWithin: RecipeIngredientInput[] | null = null;

  for (let g = carb.minG; g <= carb.maxG; g += step) {
    const attempt = [...cloneIngs(base), ing(carb.name, g, "g")];
    const { totals } = await getRecipeNutritionTotals(attempt, { aiEnabled: false });
    const cal = totals.calories;
    const dist = Math.abs(cal - target);
    if (cal >= target - GOAL_MEAL_KCAL_TOLERANCE && cal <= target + GOAL_MEAL_KCAL_TOLERANCE) {
      const prevCal = bestWithin
        ? (await getRecipeNutritionTotals(bestWithin, { aiEnabled: false })).totals.calories
        : Number.POSITIVE_INFINITY;
      if (!bestWithin || dist < Math.abs(prevCal - target)) bestWithin = attempt;
    }
    if (dist < bestScore) {
      bestScore = dist;
      best = attempt;
    }
  }
  return bestWithin ?? best;
}

export type ProteinAxis = "meat" | "fish" | "plant";

export type GoalMatchedRecipeOptions = {
  targetCalories: number;
  mealSlot: GoalMealSlot;
  vegan: boolean;
  vegetarian: boolean;
  glutenFree: boolean;
  /** Changes template choice so drafts are not identical every time (e.g. Date.now() from client). */
  variantSeed: number;
  /** Soft batch mix: bias omnivore templates toward meat or fish mains. */
  proteinAxis?: ProteinAxis;
  /** When set with mealSlot snack, draft ingredients rich in this nutrient key. */
  microFocusKey?: string;
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

/** Omnivore template index with optional meat/fish bias for bulk library variety. */
function pickMealVariant(seed: number, modulo: number, proteinAxis?: ProteinAxis): number {
  if (modulo <= 0) return 0;
  if (proteinAxis === "fish") {
    const fish = [1, 3, 6, 8, 9].filter((i) => i < modulo);
    if (fish.length) return fish[pickVariant(seed ^ 0xf15e, fish.length)];
  }
  if (proteinAxis === "meat") {
    const meat = [0, 2, 4, 5, 7].filter((i) => i < modulo);
    if (meat.length) return meat[pickVariant(seed ^ 0xbeef5, meat.length)];
  }
  return pickVariant(seed, modulo);
}

/** Gluten-free breakfast carbs — avoids defaulting every draft to rice or oats. Names must match the nutrition DB. */
function glutenFreeBreakfastCarbTune(seed: number): { name: string; minG: number; maxG: number } {
  const tunings = [
    { name: "quinoa", minG: 25, maxG: 115 },
    { name: "sweet potato", minG: 70, maxG: 185 },
    { name: "potato", minG: 90, maxG: 210 },
    { name: "buckwheat groats", minG: 22, maxG: 88 },
    { name: "rice cake", minG: 22, maxG: 72 },
    { name: "cornflakes", minG: 30, maxG: 95 },
  ] as const;
  return tunings[pickVariant(seed ^ 0xa54cc641, tunings.length)];
}

/** Lighter GF carbs for vegetarian snack templates (still no wheat/oats pasta). */
function glutenFreeSnackCarbTune(seed: number): { name: string; minG: number; maxG: number } {
  const tunings = [
    { name: "quinoa", minG: 18, maxG: 130 },
    { name: "rice cake", minG: 18, maxG: 65 },
    { name: "sweet potato", minG: 55, maxG: 150 },
    { name: "buckwheat groats", minG: 18, maxG: 75 },
    { name: "cornflakes", minG: 25, maxG: 80 },
  ] as const;
  return tunings[pickVariant(seed ^ 0x61d14cff, tunings.length)];
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
    "sweet potato",
    "potato",
    "buckwheat",
    "rice cake",
    "cornflakes",
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

const ANIMAL_RICH_FOODS = [
  "salmon",
  "mackerel",
  "tuna",
  "tuna canned",
  "chicken breast",
  "eggs",
  "egg",
  "milk",
  "greek yoghurt",
  "greek yogurt",
  "cottage cheese",
  "cheddar",
];
const MEAT_FISH_RICH_FOODS = ["salmon", "mackerel", "tuna", "tuna canned", "chicken breast"];

function filterRichFoodsForDiet(foods: readonly string[], vegan: boolean, vegetarian: boolean): string[] {
  return foods.filter((food) => {
    const lower = food.toLowerCase();
    if (vegan && ANIMAL_RICH_FOODS.some((a) => lower.includes(a) || a.includes(lower))) return false;
    if (vegetarian && !vegan && MEAT_FISH_RICH_FOODS.some((a) => lower.includes(a))) return false;
    return true;
  });
}

function defaultQuantityForRichFood(name: string): { quantity: number; unit: string } {
  const lower = name.toLowerCase();
  if (lower.includes("egg")) return { quantity: 2, unit: "piece" };
  if (lower.includes("oats")) return { quantity: 30, unit: "g" };
  if (["almonds", "walnuts", "chia seeds", "peanut butter"].some((n) => lower.includes(n))) {
    return { quantity: lower.includes("peanut butter") ? 16 : 15, unit: "g" };
  }
  if (lower.includes("milk") || lower.includes("yoghurt") || lower.includes("yogurt") || lower.includes("cheese")) {
    return { quantity: 110, unit: "g" };
  }
  if (["salmon", "tuna", "chicken", "turkey", "tofu"].some((n) => lower.includes(n))) {
    return { quantity: 85, unit: "g" };
  }
  if (lower.includes("orange")) return { quantity: 130, unit: "g" };
  if (["lentils", "chickpeas"].some((n) => lower.includes(n))) return { quantity: 85, unit: "g" };
  return { quantity: 80, unit: "g" };
}

async function buildMicroFocusedSnack(
  opts: GoalMatchedRecipeOptions,
  target: number,
): Promise<RecipeIngredientInput[] | null> {
  const key = opts.microFocusKey?.trim();
  if (!key || opts.mealSlot !== "snack") return null;

  const rich = filterRichFoodsForDiet(MICRO_RICH_FOODS[key] ?? [], opts.vegan, opts.vegetarian);
  if (rich.length < 2) return null;

  const seed = opts.variantSeed;
  const i0 = pickVariant(seed, rich.length);
  const i1 = pickVariantAlt(seed, rich.length);
  const primary = rich[i0]!;
  const secondary = rich[i1 === i0 ? (i1 + 1) % rich.length : i1]!;
  const tertiary = rich.find((f) => f !== primary && f !== secondary) ?? primary;

  const base = [primary, secondary, tertiary].map((name) => {
    const { quantity, unit } = defaultQuantityForRichFood(name);
    return ing(name, quantity, unit);
  });

  const carb = opts.glutenFree
    ? glutenFreeSnackCarbTune(seed ^ 0x51c2f19a)
    : { name: "oats" as const, minG: 0, maxG: 45 };

  return findBestCarbAdjustment(base, carb, target);
}

/** Builds ingredient rows from the in-app nutrition DB; calories should land within ±100 kcal of target when possible. */
async function buildGoalMatchedRecipeIngredientsRaw(
  opts: GoalMatchedRecipeOptions,
): Promise<RecipeIngredientInput[]> {
  const target = clampTarget(opts.targetCalories);
  const carbName = opts.glutenFree ? "rice" : "oats";
  const seed = opts.variantSeed;
  const pv = (modulo: number) => pickMealVariant(seed, modulo, opts.proteinAxis);

  if (opts.mealSlot === "snack" && opts.microFocusKey) {
    const focused = await buildMicroFocusedSnack(opts, target);
    if (focused) return focused;
  }

  if (opts.vegan) {
    if (opts.mealSlot === "breakfast") {
      const v = pickVariant(seed, 5);
      const v2 = pickVariantAlt(seed, 2);
      const carb = opts.glutenFree ? glutenFreeBreakfastCarbTune(seed) : { name: "oats" as const, minG: 25, maxG: 100 };
      const fruit = v2 === 0 ? "banana" : "apple";
      if (v === 0) {
        const base = [ing("tofu", 70, "g"), ing(fruit, 100, "g"), ing("blueberries", 60, "g")];
        return await findBestCarbAdjustment(base, carb, target);
      }
      if (v === 1) {
        const base = [ing("banana", 100, "g"), ing("chia seeds", 12, "g")];
        return await findBestCarbAdjustment(base, carb, target);
      }
      if (v === 2) {
        const base = [ing("tofu", 75, "g"), ing("spinach", 80, "g"), ing("tomato", 80, "g")];
        return await findBestCarbAdjustment(base, carb, target);
      }
      if (v === 3) {
        const base = [ing("chickpeas", 70, "g"), ing("apple", 110, "g")];
        return await findBestCarbAdjustment(base, carb, target);
      }
      const base = [ing("peanut butter", 22, "g"), ing("banana", 100, "g")];
      return await findBestCarbAdjustment(base, carb, target);
    }
    if (opts.mealSlot === "snack") {
      const v = pickVariant(seed, 8);
      const v2 = pickVariantAlt(seed, 3);
      const fruit = v2 === 0 ? "strawberries" : v2 === 1 ? "orange" : "blueberries";
      if (v === 0) {
        const base = [ing("tofu", 90, "g"), ing(fruit, 90, "g"), ing("almonds", 15, "g")];
        return await findBestCarbAdjustment(base, { name: "quinoa", minG: 0, maxG: 180 }, target);
      }
      if (v === 1) {
        const base = [ing("chickpeas", 100, "g"), ing("carrot", 80, "g"), ing("red pepper", 60, "g")];
        return await findBestCarbAdjustment(base, { name: "quinoa", minG: 0, maxG: 200 }, target);
      }
      if (v === 2) {
        const base = [ing("lentils", 80, "g"), ing("spinach", 70, "g"), ing("tomato", 80, "g")];
        return await findBestCarbAdjustment(base, { name: "quinoa", minG: 0, maxG: 160 }, target);
      }
      if (v === 3) {
        const base = [ing("tofu", 85, "g"), ing("broccoli", 90, "g"), ing("almonds", 12, "g")];
        return await findBestCarbAdjustment(base, { name: "quinoa", minG: 0, maxG: 170 }, target);
      }
      if (v === 4) {
        const base = [ing("peanut butter", 18, "g"), ing("banana", 100, "g"), ing("chia seeds", 10, "g")];
        return await findBestCarbAdjustment(base, { name: "oats", minG: 0, maxG: 45 }, target);
      }
      if (v === 5) {
        const base = [ing("chickpeas", 90, "g"), ing("kale", 60, "g"), ing("carrot", 70, "g")];
        return await findBestCarbAdjustment(base, { name: "quinoa", minG: 0, maxG: 150 }, target);
      }
      if (v === 6) {
        const base = [ing("tofu", 80, "g"), ing("sweet potato", 100, "g"), ing("spinach", 50, "g")];
        return await findBestCarbAdjustment(base, { name: "quinoa", minG: 0, maxG: 120 }, target);
      }
      const base = [ing("lentils", 75, "g"), ing("walnuts", 15, "g"), ing(fruit, 80, "g")];
      return await findBestCarbAdjustment(base, { name: "quinoa", minG: 0, maxG: 140 }, target);
    }
    const v = pickVariant(seed, 5);
    if (v === 0) {
      const base = [ing("tofu", 150, "g"), ing("chickpeas", 80, "g"), ing("broccoli", 100, "g")];
      return await findBestCarbAdjustment(base, { name: "quinoa", minG: 0, maxG: 220 }, target);
    }
    if (v === 1) {
      const base = [ing("tofu", 140, "g"), ing("lentils", 90, "g"), ing("spinach", 100, "g")];
      return await findBestCarbAdjustment(base, { name: "quinoa", minG: 0, maxG: 220 }, target);
    }
    if (v === 2) {
      const base = [ing("lentils", 110, "g"), ing("chickpeas", 70, "g"), ing("tomato", 120, "g")];
      return await findBestCarbAdjustment(base, { name: "rice", minG: 0, maxG: 260 }, target);
    }
    if (v === 3) {
      const base = [ing("tofu", 130, "g"), ing("broccoli", 120, "g"), ing("bell pepper", 80, "g")];
      return await findBestCarbAdjustment(base, { name: "quinoa", minG: 0, maxG: 200 }, target);
    }
    const base = [ing("tofu", 130, "g"), ing("broccoli", 120, "g"), ing("spinach", 80, "g")];
    return await findBestCarbAdjustment(base, { name: "quinoa", minG: 0, maxG: 200 }, target);
  }

  if (opts.vegetarian) {
    if (opts.mealSlot === "breakfast") {
      const v = pickVariant(seed, 2);
      const base =
        v === 0
          ? [ing("egg", 2, "piece"), ing("banana", 100, "g")]
          : [ing("egg", 2, "piece"), ing("greek yogurt", 100, "g")];
      const carb = opts.glutenFree
        ? glutenFreeBreakfastCarbTune(seed)
        : { name: "oats" as const, minG: 15, maxG: 120 };
      const out = await findBestCarbAdjustment(base, carb, target);
      const p = (await getRecipeNutritionTotals(out, { aiEnabled: false })).totals.protein_g;
      if (p < 12) {
        const base2 =
          v === 0
            ? [ing("egg", 3, "piece"), ing("banana", 100, "g")]
            : [ing("egg", 3, "piece"), ing("greek yogurt", 100, "g")];
        return await findBestCarbAdjustment(base2, carb, target);
      }
      return out;
    }
    if (opts.mealSlot === "snack") {
      const v = pickVariant(seed, 6);
      const v2 = pickVariantAlt(seed, 3);
      const fruit = v2 === 0 ? "strawberries" : v2 === 1 ? "blueberries" : "orange";
      const carb = opts.glutenFree
        ? glutenFreeSnackCarbTune(seed)
        : { name: "oats" as const, minG: 0, maxG: 50 };
      if (v === 0) {
        const base = [ing("greek yogurt", 120, "g"), ing(fruit, 90, "g"), ing("almonds", 15, "g")];
        return await findBestCarbAdjustment(base, carb, target);
      }
      if (v === 1) {
        const base = [ing("cottage cheese", 100, "g"), ing("blueberries", 80, "g"), ing("walnuts", 12, "g")];
        return await findBestCarbAdjustment(base, carb, target);
      }
      if (v === 2) {
        const base = [ing("egg", 2, "piece"), ing("spinach", 60, "g"), ing("feta cheese", 30, "g")];
        return await findBestCarbAdjustment(base, carb, target);
      }
      if (v === 3) {
        const base = [ing("chickpeas", 90, "g"), ing("carrot", 80, "g"), ing("red pepper", 60, "g")];
        return await findBestCarbAdjustment(base, carb, target);
      }
      if (v === 4) {
        const base = [ing("greek yogurt", 110, "g"), ing("banana", 90, "g"), ing("chia seeds", 10, "g")];
        return await findBestCarbAdjustment(base, carb, target);
      }
      const base = [ing("egg", 2, "piece"), ing("broccoli", 80, "g"), ing("cheddar cheese", 25, "g")];
      return await findBestCarbAdjustment(base, carb, target);
    }
    const v = pickVariant(seed, 5);
    if (v === 0) {
      const base = [ing("lentils", 100, "g"), ing("broccoli", 100, "g")];
      return await findBestCarbAdjustment(base, { name: "rice", minG: 0, maxG: 280 }, target);
    }
    if (v === 1) {
      const base = [ing("chickpeas", 110, "g"), ing("spinach", 100, "g")];
      return await findBestCarbAdjustment(base, { name: "rice", minG: 0, maxG: 280 }, target);
    }
    if (v === 2) {
      const base = [ing("lentils", 90, "g"), ing("tomato", 150, "g"), ing("onion", 60, "g")];
      return await findBestCarbAdjustment(base, { name: "pasta", minG: 40, maxG: 200 }, target);
    }
    if (v === 3) {
      const base = [
        ing("feta cheese", 55, "g"),
        ing("chickpeas", 95, "g"),
        ing("lettuce", 120, "g"),
        ing("cucumber", 90, "g"),
        ing("tomato", 120, "g"),
      ];
      return await findBestCarbAdjustment(base, { name: "quinoa", minG: 0, maxG: 180 }, target);
    }
    const base = [ing("chickpeas", 95, "g"), ing("bell pepper", 100, "g"), ing("carrot", 70, "g")];
    return await findBestCarbAdjustment(base, { name: "rice", minG: 0, maxG: 260 }, target);
  }

  // Omnivore
  if (opts.mealSlot === "snack") {
    const v = pv(10);
    const v2 = pickVariantAlt(seed, 3);
    const fruit = v2 === 0 ? "strawberries" : v2 === 1 ? "orange" : "banana";
    if (v === 0) {
      const base = [ing("greek yogurt", 130, "g"), ing(fruit, 90, "g")];
      return await findBestCarbAdjustment(base, { name: carbName, minG: opts.glutenFree ? 0 : 10, maxG: 100 }, target);
    }
    if (v === 1) {
      const base = [ing("egg", 2, "piece"), ing("spinach", 50, "g"), ing(fruit, 80, "g")];
      return await findBestCarbAdjustment(base, { name: carbName, minG: opts.glutenFree ? 0 : 10, maxG: 90 }, target);
    }
    if (v === 2) {
      const base = [ing("chicken breast", 100, "g"), ing("cheddar cheese", 40, "g")];
      return await findBestCarbAdjustment(base, { name: "rice", minG: 0, maxG: 120 }, target);
    }
    if (v === 3) {
      const base = [ing("turkey breast", 110, "g"), ing("carrot", 80, "g")];
      return await findBestCarbAdjustment(base, { name: "rice", minG: 0, maxG: 110 }, target);
    }
    if (v === 4) {
      const base = [ing("tuna", 120, "g"), ing("cucumber", 80, "g"), ing("carrot", 60, "g")];
      return await findBestCarbAdjustment(base, { name: "rice", minG: 0, maxG: 130 }, target);
    }
    if (v === 5) {
      const base = [ing("cottage cheese", 100, "g"), ing("strawberries", 90, "g"), ing("almonds", 15, "g")];
      return await findBestCarbAdjustment(base, { name: carbName, minG: opts.glutenFree ? 0 : 8, maxG: 70 }, target);
    }
    if (v === 6) {
      const base = [ing("salmon", 75, "g"), ing("avocado", 55, "g"), ing("broccoli", 70, "g")];
      return await findBestCarbAdjustment(base, { name: "rice", minG: 0, maxG: 80 }, target);
    }
    if (v === 7) {
      const base = [ing("greek yogurt", 110, "g"), ing("blueberries", 80, "g"), ing("chia seeds", 10, "g")];
      return await findBestCarbAdjustment(base, { name: carbName, minG: opts.glutenFree ? 0 : 8, maxG: 65 }, target);
    }
    if (v === 8) {
      const base = [ing("egg", 2, "piece"), ing("broccoli", 80, "g"), ing("cheddar cheese", 25, "g")];
      return await findBestCarbAdjustment(base, { name: carbName, minG: opts.glutenFree ? 0 : 10, maxG: 75 }, target);
    }
    const base = [ing("peanut butter", 16, "g"), ing("banana", 90, "g"), ing("walnuts", 12, "g")];
    return await findBestCarbAdjustment(base, { name: carbName, minG: opts.glutenFree ? 0 : 8, maxG: 55 }, target);
  }

  if (opts.mealSlot === "breakfast") {
    const v = pv(7);
    const carb = opts.glutenFree ? glutenFreeBreakfastCarbTune(seed ^ 0x2c7e9f31) : { name: "oats" as const, minG: 20, maxG: 100 };
    const v2 = pickVariantAlt(seed, 2);
    const fruit = v2 === 0 ? "banana" : "apple";
    if (v === 0) {
      const base = [ing("egg", 2, "piece"), ing(fruit, 100, "g")];
      return await findBestCarbAdjustment(base, carb, target);
    }
    if (v === 1) {
      const base = [ing("egg", 3, "piece"), ing("blueberries", 80, "g")];
      return await findBestCarbAdjustment(base, carb, target);
    }
    if (v === 2) {
      const base = [ing("greek yogurt", 160, "g"), ing("strawberries", 90, "g")];
      return await findBestCarbAdjustment(base, carb, target);
    }
    if (v === 3) {
      const base = [ing("cottage cheese", 130, "g"), ing("apple", 120, "g")];
      return await findBestCarbAdjustment(base, carb, target);
    }
    if (v === 4) {
      const base = [ing("chicken breast", 75, "g"), ing("egg", 1, "piece"), ing("spinach", 70, "g")];
      return await findBestCarbAdjustment(base, carb, target);
    }
    if (v === 5) {
      const base = [ing("peanut butter", 28, "g"), ing("banana", 110, "g"), ing("chia seeds", 10, "g")];
      return await findBestCarbAdjustment(base, carb, target);
    }
    const base = [ing("egg", 2, "piece"), ing("greek yogurt", 90, "g")];
    return await findBestCarbAdjustment(base, carb, target);
  }

  const v = pv(10);
  if (v === 0) {
    const base = [ing("chicken breast", 140, "g"), ing("broccoli", 100, "g")];
    return await findBestCarbAdjustment(base, { name: "rice", minG: 0, maxG: 320 }, target);
  }
  if (v === 1) {
    const base = [ing("salmon", 150, "g"), ing("broccoli", 100, "g")];
    return await findBestCarbAdjustment(base, { name: "rice", minG: 0, maxG: 300 }, target);
  }
  if (v === 2) {
    const base = [ing("chicken breast", 120, "g"), ing("spinach", 120, "g")];
    return await findBestCarbAdjustment(base, { name: "rice", minG: 0, maxG: 300 }, target);
  }
  if (v === 3) {
    const base = [ing("salmon", 130, "g"), ing("spinach", 100, "g")];
    return await findBestCarbAdjustment(base, { name: "rice", minG: 0, maxG: 280 }, target);
  }
  if (v === 4) {
    const base = [ing("turkey breast", 160, "g"), ing("green beans", 120, "g")];
    return await findBestCarbAdjustment(base, { name: "rice", minG: 0, maxG: 280 }, target);
  }
  if (v === 5) {
    const base = [ing("beef mince", 130, "g"), ing("bell pepper", 100, "g"), ing("onion", 50, "g")];
    return await findBestCarbAdjustment(base, { name: "rice", minG: 0, maxG: 260 }, target);
  }
  if (v === 6) {
    const base = [ing("tuna", 150, "g"), ing("carrot", 100, "g"), ing("peas", 80, "g")];
    return await findBestCarbAdjustment(base, { name: "rice", minG: 0, maxG: 280 }, target);
  }
  if (v === 7) {
    const base = [
      ing("chicken breast", 140, "g"),
      ing("feta cheese", 45, "g"),
      ing("lettuce", 140, "g"),
      ing("cucumber", 100, "g"),
      ing("tomato", 120, "g"),
      ing("olive oil", 10, "ml"),
    ];
    return await findBestCarbAdjustment(base, { name: "quinoa", minG: 0, maxG: 140 }, target);
  }
  if (v === 8) {
    const base = [
      ing("tuna", 130, "g"),
      ing("feta cheese", 35, "g"),
      ing("rocket", 100, "g"),
      ing("cucumber", 100, "g"),
      ing("tomato", 120, "g"),
      ing("olive oil", 8, "ml"),
    ];
    return await findBestCarbAdjustment(base, { name: "quinoa", minG: 0, maxG: 120 }, target);
  }
  const base = [ing("shrimp", 140, "g"), ing("broccoli", 110, "g"), ing("bell pepper", 70, "g")];
  return await findBestCarbAdjustment(base, { name: "rice", minG: 0, maxG: 260 }, target);
}

const PROTEIN_KEYWORDS = [
  "chicken",
  "salmon",
  "tuna",
  "beef",
  "turkey",
  "shrimp",
  "egg",
  "yogurt",
  "tofu",
  "lentils",
  "chickpeas",
  "beans",
  "protein",
];
const VEG_FRUIT_KEYWORDS = [
  "broccoli",
  "spinach",
  "kale",
  "lettuce",
  "rocket",
  "cucumber",
  "tomato",
  "onion",
  "carrot",
  "celery",
  "pepper",
  "mushroom",
  "cauliflower",
  "cabbage",
  "leek",
  "asparagus",
  "green bean",
  "peas",
  "sweet potato",
  "banana",
  "apple",
  "orange",
  "strawberr",
  "blueberr",
  "raspberr",
  "grape",
  "avocado",
  "kale",
  "almonds",
  "walnuts",
  "chia",
];
const CARB_KEYWORDS = [
  "rice",
  "oats",
  "quinoa",
  "pasta",
  "bread",
  "potato",
  "sweet potato",
  "buckwheat",
  "rice cake",
  "cornflakes",
  "wrap",
  "tortilla",
];
const FAT_KEYWORDS = ["olive oil", "avocado", "almonds", "walnuts", "peanut butter", "chia"];

function hasKeyword(ings: RecipeIngredientInput[], keywords: string[]): boolean {
  return ings.some((ingr) => {
    const n = ingr.name.toLowerCase();
    return keywords.some((k) => n.includes(k));
  });
}

function vegFruitCount(ings: RecipeIngredientInput[]): number {
  return ings.filter((ingr) => {
    const n = ingr.name.toLowerCase();
    return VEG_FRUIT_KEYWORDS.some((k) => n.includes(k));
  }).length;
}

function ensureIngredient(ings: RecipeIngredientInput[], name: string, quantity: number, unit: string): void {
  const exists = ings.some((i) => i.name.toLowerCase().trim() === name.toLowerCase().trim());
  if (!exists) ings.push(ing(name, quantity, unit));
}

function ensureDraftStructure(
  mealSlot: GoalMealSlot,
  ingredients: RecipeIngredientInput[],
  ctx?: { glutenFree?: boolean; variantSeed?: number },
): RecipeIngredientInput[] {
  const out = cloneIngs(ingredients);
  const seed = ctx?.variantSeed ?? 0;

  if (!hasKeyword(out, PROTEIN_KEYWORDS)) {
    ensureIngredient(out, mealSlot === "snack" || mealSlot === "breakfast" ? "greek yogurt" : "chicken breast", mealSlot === "snack" ? 80 : 120, "g");
  }
  if (!hasKeyword(out, CARB_KEYWORDS)) {
    if (ctx?.glutenFree && mealSlot === "breakfast") {
      const c = glutenFreeBreakfastCarbTune(seed ^ 0x4f2b6d19);
      ensureIngredient(out, c.name, Math.round((c.minG + c.maxG) / 2), "g");
    } else if (ctx?.glutenFree && mealSlot === "snack") {
      const c = glutenFreeSnackCarbTune(seed ^ 0x38f1a203);
      ensureIngredient(out, c.name, Math.round((c.minG + c.maxG) / 2), "g");
    } else {
      ensureIngredient(out, mealSlot === "breakfast" ? "oats" : "brown rice", mealSlot === "snack" ? 20 : 60, "g");
    }
  }
  if (!hasKeyword(out, FAT_KEYWORDS)) {
    if (mealSlot === "breakfast") {
      ensureIngredient(out, "chia seeds", 10, "g");
    } else if (mealSlot === "snack") {
      ensureIngredient(out, "peanut butter", 8, "g");
    } else {
      ensureIngredient(out, "olive oil", 10, "ml");
    }
  }

  const vegTarget = mealSlot === "lunch" || mealSlot === "dinner" ? 2 : 1;
  const addables =
    mealSlot === "breakfast" || mealSlot === "snack"
      ? [
          ["strawberries", 90, "g"],
          ["orange", 130, "g"],
          ["spinach", 60, "g"],
          ["almonds", 15, "g"],
          ["banana", 100, "g"],
          ["blueberries", 80, "g"],
          ["apple", 120, "g"],
        ]
      : [
          ["broccoli", 100, "g"],
          ["spinach", 80, "g"],
          ["carrots", 90, "g"],
          ["tomatoes", 100, "g"],
          ["red pepper", 80, "g"],
        ];
  while (vegFruitCount(out) < vegTarget) {
    const next = addables.find(([n]) => !out.some((i) => i.name.toLowerCase() === String(n).toLowerCase()));
    if (!next) break;
    ensureIngredient(out, String(next[0]), Number(next[1]), String(next[2]));
  }

  while (out.length < 5) {
    const filler = addables.find(([n]) => !out.some((i) => i.name.toLowerCase() === String(n).toLowerCase()));
    if (!filler) break;
    ensureIngredient(out, String(filler[0]), Number(filler[1]), String(filler[2]));
  }

  return out;
}

export async function buildGoalMatchedRecipeIngredients(
  opts: GoalMatchedRecipeOptions,
): Promise<RecipeIngredientInput[]> {
  const raw = await buildGoalMatchedRecipeIngredientsRaw(opts);
  return ensureDraftStructure(opts.mealSlot, raw, {
    glutenFree: opts.glutenFree,
    variantSeed: opts.variantSeed,
  });
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
