// Runs in the browser (the review screen), so it imports only types from
// micros.ts: that module carries the whole vitamin and mineral food table.
import { drvFor, NUTRIENT_LABELS, type Person, type Sex } from "@/lib/nutrition/drv";
import type { MicroEntry } from "@/lib/nutrition/micros";
import type { Macros, ReviewItem } from "@/lib/photoMeal/types";

const ZERO: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 };

/** Where a slider starts: the middle of the AI's range, to the nearest 5 g. */
export function startingGrams(low: number, high: number): number {
  const mid = (low + high) / 2;
  return Math.max(5, Math.round(mid / 5) * 5);
}

function scale(per100: Macros, grams: number): Macros {
  const f = grams / 100;
  return {
    kcal: per100.kcal * f,
    protein: per100.protein * f,
    carbs: per100.carbs * f,
    fat: per100.fat * f,
    fibre: per100.fibre * f,
  };
}

function add(a: Macros, b: Macros): Macros {
  return {
    kcal: a.kcal + b.kcal,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
    fibre: a.fibre + b.fibre,
  };
}

export type MealRange = {
  /** Every unedited food at the low end of its range. */
  low: Macros;
  /** Every unedited food at the high end. */
  high: Macros;
  /** The sliders as they are now: what gets saved. */
  current: Macros;
  matchedCount: number;
  unmatchedCount: number;
};

/**
 * The meal's totals while portions are uncertain. A food the user hasn't
 * touched counts across its whole range; one they've set counts at exactly
 * that weight, so the range narrows as they edit. Foods with no nutrition
 * match add nothing and are counted, so the screen can say the total is a
 * floor (DEC-005: unknown, not zero).
 */
export function mealRange(items: ReviewItem[]): MealRange {
  let low = ZERO;
  let high = ZERO;
  let current = ZERO;
  let matchedCount = 0;
  let unmatchedCount = 0;
  for (const item of items) {
    if (!item.match) {
      unmatchedCount += 1;
      continue;
    }
    matchedCount += 1;
    const per100 = item.match.per100;
    low = add(low, scale(per100, item.edited ? item.grams : item.gramsLow));
    high = add(high, scale(per100, item.edited ? item.grams : item.gramsHigh));
    current = add(current, scale(per100, item.grams));
  }
  return { low, high, current, matchedCount, unmatchedCount };
}

/**
 * "520–640 kcal" while uncertain, "580 kcal" once the ends are within 5% of
 * each other. Calories round to 10, grams to 1.
 */
export function formatRange(low: number, high: number, unit: "kcal" | "g"): string {
  const step = unit === "kcal" ? 10 : 1;
  const r = (n: number) => Math.round(n / step) * step;
  const lo = r(low);
  const hi = r(high);
  const fmt = (n: number) => n.toLocaleString("en-GB");
  const close = hi <= 0 || (hi - lo) / Math.max(hi, 1) <= 0.05;
  if (close || lo === hi) return `${fmt(r((low + high) / 2))} ${unit}`;
  return `${fmt(lo)}–${fmt(hi)} ${unit}`;
}

/** The 12 vitamins and minerals BiteSync tracks towards a target. */
export const TRACKED_MICROS = [
  "vitamin_a_mcg",
  "vitamin_c_mg",
  "vitamin_d_mcg",
  "vitamin_b12_mcg",
  "folate_mcg",
  "iron_mg",
  "calcium_mg",
  "zinc_mg",
  "magnesium_mg",
  "potassium_mg",
  "selenium_mcg",
  "iodine_mcg",
] as const satisfies readonly (keyof MicroEntry)[];

export type MicroContribution = {
  key: (typeof TRACKED_MICROS)[number];
  label: string;
  amount: number;
  unit: string;
  /** Share of one day's reference intake, 0–1+. */
  shareOfDay: number;
};

export type MicroSummary = {
  contributions: MicroContribution[];
  /** Matched foods that have vitamin and mineral data, out of all matched foods. */
  foodsWithData: number;
  foodsMatched: number;
};

/**
 * What this meal adds towards today's vitamin and mineral targets, at the
 * current slider weights, biggest share first. Foods without data are left
 * out and counted, never treated as zero.
 */
export function microSummary(items: ReviewItem[], who: Sex | Person): MicroSummary {
  const total = Object.fromEntries(TRACKED_MICROS.map((k) => [k, 0])) as Record<(typeof TRACKED_MICROS)[number], number>;
  let foodsWithData = 0;
  let foodsMatched = 0;
  for (const item of items) {
    if (!item.match) continue;
    foodsMatched += 1;
    const per100: MicroEntry | null = item.match.micros100;
    if (!per100) continue;
    foodsWithData += 1;
    for (const key of TRACKED_MICROS) total[key] += Number(per100[key] ?? 0) * (item.grams / 100);
  }
  if (!foodsWithData) return { contributions: [], foodsWithData: 0, foodsMatched };

  const contributions = TRACKED_MICROS.flatMap((key): MicroContribution[] => {
    const drv = drvFor(key, who);
    const amount = total[key];
    if (!drv || !drv.rni || !(amount > 0)) return [];
    return [{ key, label: NUTRIENT_LABELS[key] ?? key, amount, unit: drv.unit, shareOfDay: amount / drv.rni }];
  }).sort((a, b) => b.shareOfDay - a.shareOfDay);

  return { contributions, foodsWithData, foodsMatched };
}
