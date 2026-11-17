import { dailyCalorieBand } from "@/lib/planner/calorie-bands";
import {
  excludeFromMainMealSlots,
  heuristicSnackCandidatePool,
  suitableForBreakfastSlot,
  suitableForBreakfastSlotRelaxed,
} from "@/lib/planner/meal-slot-eligibility";
import { PROTEIN_FLOOR_RATIO } from "@/lib/planner/plan-calorie-tuning";
import { FASTING_SLOT_SHARES, isSuhoorFood } from "@/lib/fasting/slots";

/**
 * Plans one fasting day from the person's recipe library: suhoor (the
 * breakfast slot), iftar (dinner) and up to two late snacks, no lunch. It
 * tries every combination of the best few candidates for each slot and keeps
 * the one closest to the day's calories with the protein met, spread roughly
 * by FASTING_SLOT_SHARES. Deterministic, so it can be tested without a database.
 */

export type FastingRecipe = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  ingredientNames?: string[];
};

export type FastingDayPick = {
  meal_type: "breakfast" | "dinner" | "snack";
  slot_index: number;
  recipe_id: string;
};

export type PlanFastingDayInput = {
  pool: FastingRecipe[];
  kcalTarget: number;
  proteinTarget: number;
  /** How often each recipe is already used this week; repeats cost a little. */
  usage?: Map<string, number>;
  /** Recipes picked for this day already (by the AI planner); kept when they fit. */
  preferred?: Iterable<string>;
  maxSnacks?: number;
};

export type FastingDayPlan = { picks: FastingDayPick[]; kcal: number; protein: number };

const TOP_MAINS = 12;
const TOP_SNACKS = 10;

function shortlist(
  candidates: FastingRecipe[],
  kcal: number,
  protein: number,
  usage: Map<string, number>,
  n: number,
): FastingRecipe[] {
  const score = (r: FastingRecipe) =>
    Math.abs(r.calories - kcal) / Math.max(kcal, 1) +
    (0.5 * Math.max(0, protein - r.protein)) / Math.max(protein, 1) +
    0.1 * (usage.get(r.id) ?? 0);
  return [...candidates].sort((a, b) => score(a) - score(b)).slice(0, n);
}

export function planFastingDay(input: PlanFastingDayInput): FastingDayPlan | null {
  const { kcalTarget, proteinTarget } = input;
  const usage = input.usage ?? new Map<string, number>();
  const preferred = new Set(input.preferred ?? []);
  const maxSnacks = Math.max(0, Math.min(2, input.maxSnacks ?? 2));
  const pool = input.pool.filter((r) => r.calories > 0);
  const ings = (r: FastingRecipe) => r.ingredientNames ?? [];

  let suhoorPool = pool.filter((r) => suitableForBreakfastSlot(r.name, ings(r)));
  if (!suhoorPool.length) suhoorPool = pool.filter((r) => suitableForBreakfastSlotRelaxed(r.name, ings(r)));
  const iftarPool = pool.filter((r) => !excludeFromMainMealSlots(r.name, ings(r)));
  const snackPool = maxSnacks
    ? heuristicSnackCandidatePool(pool.map((r) => ({ ...r, ingredientNames: ings(r) }))).candidates
    : [];
  if (!suhoorPool.length || !iftarPool.length) return null;

  const share = FASTING_SLOT_SHARES;
  const suhoors = shortlist(suhoorPool, kcalTarget * share.breakfast, proteinTarget * share.breakfast, usage, TOP_MAINS);
  const iftars = shortlist(iftarPool, kcalTarget * share.dinner, proteinTarget * share.dinner, usage, TOP_MAINS);
  const snacks = shortlist(snackPool, (kcalTarget * share.snack) / 1.5, (proteinTarget * share.snack) / 1.5, usage, TOP_SNACKS);

  const snackSets: FastingRecipe[][] = [[]];
  for (let i = 0; i < snacks.length; i += 1) {
    snackSets.push([snacks[i]!]);
    if (maxSnacks >= 2) for (let j = i + 1; j < snacks.length; j += 1) snackSets.push([snacks[i]!, snacks[j]!]);
  }

  const band = dailyCalorieBand(kcalTarget);
  const proteinFloor = proteinTarget * PROTEIN_FLOOR_RATIO;
  let best: { score: number; s: FastingRecipe; i: FastingRecipe; snacks: FastingRecipe[] } | null = null;

  for (const s of suhoors) {
    for (const i of iftars) {
      if (i.id === s.id) continue;
      for (const set of snackSets) {
        if (set.some((x) => x.id === s.id || x.id === i.id)) continue;
        const kcal = s.calories + i.calories + set.reduce((t, x) => t + x.calories, 0);
        const snackPro = set.reduce((t, x) => t + x.protein, 0);
        const protein = s.protein + i.protein + snackPro;

        let score = 0;
        // Calories: inside the planner's daily band is free, outside costs.
        if (kcal < band.min) score += (band.min - kcal) / kcalTarget;
        else if (kcal > band.max) score += (kcal - band.max) / kcalTarget;
        score += (0.2 * Math.abs(kcal - kcalTarget)) / kcalTarget;
        // Protein is a minimum (as on Today), and far over is wasteful. Missing
        // it at all costs as much as landing ~15% outside the calorie band.
        if (protein < proteinFloor) score += 0.15 + (3 * (proteinFloor - protein)) / proteinTarget;
        if (protein > proteinTarget * 1.25) score += (protein - proteinTarget * 1.25) / proteinTarget;
        // So no single meal carries it all.
        if (protein > 0) {
          score +=
            0.3 *
            (Math.abs(s.protein / protein - share.breakfast) +
              Math.abs(i.protein / protein - share.dinner) +
              Math.abs(snackPro / protein - share.snack));
        }
        const ids = [s.id, i.id, ...set.map((x) => x.id)];
        // Variety comes after protein and calories in a fasting week: many
        // people eat the same suhoor every day. A repeat costs a little, and
        // never more than landing ~3% outside the calorie band.
        score += ids.reduce((t, id) => t + Math.min(0.03, 0.01 * (usage.get(id) ?? 0)), 0);
        score -= 0.03 * ids.filter((id) => preferred.has(id)).length;
        if (isSuhoorFood(s.name, ings(s))) score -= 0.05;
        if (!set.length && snacks.length) score += 0.05; // a late snack is part of the plan when one fits

        if (!best || score < best.score - 1e-9) best = { score, s, i, snacks: set };
      }
    }
  }
  if (!best) return null;

  const picks: FastingDayPick[] = [
    { meal_type: "breakfast", slot_index: 0, recipe_id: best.s.id },
    { meal_type: "dinner", slot_index: 0, recipe_id: best.i.id },
    ...best.snacks.map((x, n) => ({ meal_type: "snack" as const, slot_index: n, recipe_id: x.id })),
  ];
  const chosen = [best.s, best.i, ...best.snacks];
  return {
    picks,
    kcal: chosen.reduce((t, r) => t + r.calories, 0),
    protein: chosen.reduce((t, r) => t + r.protein, 0),
  };
}

type PlanRow = { day_of_week: number; meal_type: string; slot_index: number; recipe_id: string | null };

/**
 * Re-plans the fasting days inside a week's rows, in place: each fasting day's
 * rows (including any lunch) are replaced by planFastingDay's picks. Recipes
 * already chosen for that day are preferred, and repeats across the week
 * count against a recipe. Returns the fasting days it couldn't plan (no
 * breakfast-style or main-meal recipe in the library); those keep their rows.
 */
export function applyFastingDays<R extends PlanRow>(
  rows: R[],
  fastingDays: number[],
  opts: {
    pool: FastingRecipe[];
    kcalTarget: number;
    proteinTarget: number;
    maxSnacks?: number;
    makeRow: (pick: FastingDayPick, day: number) => R;
  },
): { unplanned: number[] } {
  const unplanned: number[] = [];
  for (const day of [...new Set(fastingDays)].sort((a, b) => a - b)) {
    const usage = new Map<string, number>();
    for (const r of rows) {
      if (r.day_of_week !== day && r.recipe_id) usage.set(r.recipe_id, (usage.get(r.recipe_id) ?? 0) + 1);
    }
    const preferred = rows.filter((r) => r.day_of_week === day && r.recipe_id).map((r) => r.recipe_id!);
    const plan = planFastingDay({
      pool: opts.pool,
      kcalTarget: opts.kcalTarget,
      proteinTarget: opts.proteinTarget,
      usage,
      preferred,
      maxSnacks: opts.maxSnacks,
    });
    if (!plan) {
      unplanned.push(day);
      continue;
    }
    for (let k = rows.length - 1; k >= 0; k -= 1) {
      if (rows[k]!.day_of_week === day) rows.splice(k, 1);
    }
    for (const pick of plan.picks) rows.push(opts.makeRow(pick, day));
  }
  return { unplanned };
}
