import {
  dailyCalorieBand,
  formatDailyCalorieBand,
  isWithinDailyCalorieBand,
  isWithinWeekAvgCalorieBand,
  SERVING_SCALE_MAX,
  weekAvgCalorieBand,
} from "@/lib/planner/calorie-bands";
import {
  excludeFromMainMealSlots,
  isRecipeAISnackAppropriate,
  recipeMatchesPlannerSlot,
  SNACK_MAX_CALORIES,
  SNACK_MIN_CALORIES,
} from "@/lib/planner/meal-slot-eligibility";
import { scoreRecipeMicroBoost, type MicroPriority } from "@/lib/nutrition/micro-rich-foods";
import type { ProfileForTargets } from "@/lib/utils/nutrition-targets";

export type CalorieGoalBias = "surplus" | "deficit" | "neutral";

export function calorieGoalBiasFromProfile(profile: ProfileForTargets): CalorieGoalBias {
  const goal = profile?.goal;
  if (goal === "gain") return "surplus";
  if (goal === "lose") return "deficit";
  return "neutral";
}

export type PlanCalorieRow = {
  meal_plan_id: string;
  recipe_id: string;
  day_of_week: number;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  slot_index: number;
  quick_add_name: null;
  quick_add_calories: null;
};

export type PlanRecipeMeta = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  ingredientNames: string[];
};

/** Breakfast, lunch, dinner only — snacks added in a second pass when under band. */
export function mainMealSlotSpecs(): Array<{
  meal_type: PlanCalorieRow["meal_type"];
  slot_index: number;
  calFrac: number;
}> {
  return [
    { meal_type: "breakfast", slot_index: 0, calFrac: 0.25 },
    { meal_type: "lunch", slot_index: 0, calFrac: 0.33 },
    { meal_type: "dinner", slot_index: 0, calFrac: 0.35 },
  ];
}

/** Mains + always-on snack slots; fractions reserve calorie room so snacks are planned, not gap-fillers. */
export function plannerSlotSpecs(snackCountPerDay: number): Array<{
  meal_type: PlanCalorieRow["meal_type"];
  slot_index: number;
  calFrac: number;
}> {
  if (snackCountPerDay >= 2) {
    return [
      { meal_type: "breakfast", slot_index: 0, calFrac: 0.22 },
      { meal_type: "lunch", slot_index: 0, calFrac: 0.28 },
      { meal_type: "dinner", slot_index: 0, calFrac: 0.3 },
      { meal_type: "snack", slot_index: 0, calFrac: 0.1 },
      { meal_type: "snack", slot_index: 1, calFrac: 0.1 },
    ];
  }
  return [
    { meal_type: "breakfast", slot_index: 0, calFrac: 0.24 },
    { meal_type: "lunch", slot_index: 0, calFrac: 0.31 },
    { meal_type: "dinner", slot_index: 0, calFrac: 0.34 },
    { meal_type: "snack", slot_index: 0, calFrac: 0.11 },
  ];
}

export function dayCaloriesFromRows(
  rows: PlanCalorieRow[],
  day: number,
  calById: Map<string, number>,
): number {
  return rows
    .filter((r) => r.day_of_week === day && r.recipe_id)
    .reduce((s, r) => s + (calById.get(r.recipe_id) ?? 0), 0);
}

export function dayProteinFromRows(
  rows: PlanCalorieRow[],
  day: number,
  proById: Map<string, number>,
): number {
  return rows
    .filter((r) => r.day_of_week === day && r.recipe_id)
    .reduce((s, r) => s + (proById.get(r.recipe_id) ?? 0), 0);
}

/** Upper bound for daily protein (and kcal snack trim): target × this ratio. */
export const MACRO_CAP_MAX_RATIO = 1.25;

/** Minimum acceptable daily protein when tuning (95% of target). */
export const PROTEIN_FLOOR_RATIO = 0.95;

export function proteinFloorForTarget(dailyProteinTarget: number): number {
  return dailyProteinTarget * PROTEIN_FLOOR_RATIO;
}

export function isWithinDailyProteinCap(protein: number, dailyTarget: number): boolean {
  if (dailyTarget <= 0) return true;
  return protein >= dailyTarget && protein <= dailyTarget * MACRO_CAP_MAX_RATIO;
}

/** Remove snacks (lowest protein first, highest slot_index as tiebreak) while day calories exceed ratio × daily target. */
export function trimSnacksWhileDayCaloriesExceedRatio(
  rows: PlanCalorieRow[],
  day: number,
  dailyK: number,
  calById: Map<string, number>,
  maxRatio: number,
  opts?: { proById?: Map<string, number>; proteinFloor?: number },
): void {
  const limit = dailyK * maxRatio;
  const proById = opts?.proById;
  const proteinFloor = opts?.proteinFloor ?? 0;

  for (;;) {
    const cal = dayCaloriesFromRows(rows, day, calById);
    if (cal <= limit) break;

    const snackEntries = rows
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => r.day_of_week === day && r.meal_type === "snack" && r.recipe_id);

    if (!snackEntries.length) break;

    const currentPro = proById ? dayProteinFromRows(rows, day, proById) : Infinity;

    const removable = snackEntries
      .map(({ r, i }) => {
        const snackPro = proById?.get(r.recipe_id) ?? 0;
        const proAfter = currentPro - snackPro;
        return { i, slot: r.slot_index ?? 0, snackPro, proAfter };
      })
      .filter(({ proAfter }) => !proById || proAfter >= proteinFloor)
      .sort((a, b) => a.snackPro - b.snackPro || b.slot - a.slot);

    const pick = removable[0];
    if (!pick) break;
    rows.splice(pick.i, 1);
  }
}

/** Drop snack slots (lowest protein first) while the day exceeds macro caps — never below protein floor. */
export function trimSnacksIfDayOverMacroCaps(
  rows: PlanCalorieRow[],
  day: number,
  dailyK: number,
  dailyP: number,
  calById: Map<string, number>,
  proById: Map<string, number>,
  maxRatio = MACRO_CAP_MAX_RATIO,
): void {
  const calLimit = dailyK * maxRatio;
  const proLimit = dailyP * maxRatio;
  const proteinFloor = proteinFloorForTarget(dailyP);

  for (;;) {
    const cal = dayCaloriesFromRows(rows, day, calById);
    const pro = dayProteinFromRows(rows, day, proById);
    if (cal <= calLimit && pro <= proLimit) break;

    const snackEntries = rows
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => r.day_of_week === day && r.meal_type === "snack" && r.recipe_id);

    if (!snackEntries.length) break;

    const removable = snackEntries
      .map(({ r, i }) => {
        const snackPro = proById.get(r.recipe_id) ?? 0;
        return { i, slot: r.slot_index ?? 0, snackPro, proAfter: pro - snackPro };
      })
      .filter(({ proAfter }) => proAfter >= proteinFloor)
      .sort((a, b) => a.snackPro - b.snackPro || b.slot - a.slot);

    const pick = removable[0];
    if (!pick) break;
    rows.splice(pick.i, 1);
  }
}

export function sameDayDuplicateRecipeIds(rows: PlanCalorieRow[], day: number): string[] {
  const seen = new Set<string>();
  const dupes: string[] = [];
  for (const row of rows) {
    if (row.day_of_week !== day || !row.recipe_id) continue;
    if (seen.has(row.recipe_id)) dupes.push(row.recipe_id);
    seen.add(row.recipe_id);
  }
  return dupes;
}

function isPoolSnackCandidate(r: PlanRecipeMeta): boolean {
  return (
    !excludeFromMainMealSlots(r.name, r.ingredientNames ?? []) &&
    r.calories >= SNACK_MIN_CALORIES &&
    r.calories <= SNACK_MAX_CALORIES &&
    isRecipeAISnackAppropriate(r.calories, r.ingredientNames ?? [])
  );
}

export function poolHasSnackRecipes(pool: PlanRecipeMeta[]): boolean {
  return pool.some(isPoolSnackCandidate);
}

/** Distinct snack-eligible recipes — a day needs at least snackCountPerDay of these to fill every slot without repeats. */
export function countPoolSnackRecipes(pool: PlanRecipeMeta[]): number {
  return pool.filter(isPoolSnackCandidate).length;
}

function snackCountOnDay(rows: PlanCalorieRow[], day: number): number {
  return rows.filter((r) => r.day_of_week === day && r.meal_type === "snack").length;
}

function pickSnackForGap(
  pool: PlanRecipeMeta[],
  gapToMin: number,
  currentDayCal: number,
  bandMax: number,
  usedOnDay: Set<string>,
  allowedRecipeIds: Set<string>,
  snackMicroPriorities?: MicroPriority[],
  opts?: { proById?: Map<string, number>; proteinGap?: number; allowSameDayRepeat?: boolean },
): PlanRecipeMeta | null {
  const ideal = Math.min(Math.max(gapToMin, SNACK_MIN_CALORIES), SNACK_MAX_CALORIES);
  const headroom = Math.max(bandMax - currentDayCal, 0);
  const fitsSlot = (r: PlanRecipeMeta) =>
    allowedRecipeIds.has(r.id) &&
    isPoolSnackCandidate(r) &&
    r.calories <= headroom &&
    currentDayCal + r.calories <= bandMax;
  let candidates = pool.filter((r) => fitsSlot(r) && !usedOnDay.has(r.id));
  // Last resort: repeating a snack beats an empty slot that leaves the day under its
  // calorie/protein floor — but when chasing protein, only a snack that meaningfully
  // closes the gap justifies breaking the no-repeat rule.
  if (!candidates.length && opts?.allowSameDayRepeat) {
    const proteinGap = opts?.proteinGap ?? 0;
    const repeatMinProtein = proteinGap > 5 ? Math.max(10, proteinGap * 0.25) : 0;
    candidates = pool.filter(
      (r) => fitsSlot(r) && (opts?.proById?.get(r.id) ?? 0) >= repeatMinProtein,
    );
  }
  if (!candidates.length) return null;

  const scored = candidates
    .map((r) => {
      const calDist = Math.abs(r.calories - ideal);
      // When headroom is tight, prefer lighter snacks so the day stays inside band.
      const tightHeadroomBonus = headroom < 280 ? (SNACK_MAX_CALORIES - r.calories) * 0.25 : 0;
      let score = -calDist + tightHeadroomBonus;
      if (snackMicroPriorities?.length) {
        score += scoreRecipeMicroBoost(r.ingredientNames ?? [], snackMicroPriorities);
      }
      const proteinGap = opts?.proteinGap ?? 0;
      if (proteinGap > 5 && opts?.proById) {
        score += (opts.proById.get(r.id) ?? 0) * 1.5;
      }
      return { r, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0]?.r ?? null;
}

function swapMainMealForProtein(
  rows: PlanCalorieRow[],
  day: number,
  pool: PlanRecipeMeta[],
  calById: Map<string, number>,
  proById: Map<string, number>,
  bandMin: number,
  bandMax: number,
  allowedRecipeIds: Set<string>,
): boolean {
  const mealOrder: PlanCalorieRow["meal_type"][] = ["dinner", "lunch", "breakfast"];
  const usedOnDay = new Set(rows.filter((r) => r.day_of_week === day && r.recipe_id).map((r) => r.recipe_id));
  const currentTotal = dayCaloriesFromRows(rows, day, calById);

  for (const mealType of mealOrder) {
    const idx = rows.findIndex((r) => r.day_of_week === day && r.meal_type === mealType);
    if (idx < 0) continue;
    const currentId = rows[idx]!.recipe_id;
    const currentCal = calById.get(currentId) ?? 0;
    const currentPro = proById.get(currentId) ?? 0;

    const candidates = pool.filter((r) => {
      if (!allowedRecipeIds.has(r.id)) return false;
      if (r.id === currentId || usedOnDay.has(r.id)) return false;
      if (!recipeMatchesPlannerSlot(r.name, r.ingredientNames ?? [], mealType, r.calories)) return false;
      if (r.protein <= currentPro) return false;
      const newTotal = currentTotal - currentCal + r.calories;
      return newTotal >= bandMin && newTotal <= bandMax;
    });
    if (!candidates.length) continue;

    candidates.sort((a, b) => b.protein - a.protein || b.calories - a.calories);
    const pick = candidates[0]!;
    rows[idx] = { ...rows[idx]!, recipe_id: pick.id };
    console.warn(
      `[tune] day ${day} ${mealType}: protein swap to "${pick.name}" (${Math.round(pick.protein * 10) / 10}g P, ${Math.round(pick.calories)} kcal)`,
    );
    return true;
  }
  return false;
}

function swapSnackForProtein(
  rows: PlanCalorieRow[],
  day: number,
  pool: PlanRecipeMeta[],
  calById: Map<string, number>,
  proById: Map<string, number>,
  bandMin: number,
  bandMax: number,
  allowedRecipeIds: Set<string>,
): boolean {
  const currentTotal = dayCaloriesFromRows(rows, day, calById);
  const snackRows = rows
    .map((r, idx) => ({ r, idx }))
    .filter(({ r }) => r.day_of_week === day && r.meal_type === "snack" && r.recipe_id);
  if (!snackRows.length) return false;

  const usedOnDay = new Set(rows.filter((r) => r.day_of_week === day && r.recipe_id).map((r) => r.recipe_id));

  for (const { r, idx } of snackRows) {
    const currentId = r.recipe_id;
    const currentCal = calById.get(currentId) ?? 0;
    const currentPro = proById.get(currentId) ?? 0;

    const candidates = pool.filter((candidate) => {
      if (!allowedRecipeIds.has(candidate.id)) return false;
      if (candidate.id === currentId || usedOnDay.has(candidate.id)) return false;
      if (
        !isRecipeAISnackAppropriate(candidate.calories, candidate.ingredientNames ?? []) ||
        excludeFromMainMealSlots(candidate.name, candidate.ingredientNames ?? [])
      ) {
        return false;
      }
      if (candidate.protein <= currentPro) return false;
      const newTotal = currentTotal - currentCal + candidate.calories;
      return newTotal >= bandMin && newTotal <= bandMax;
    });
    if (!candidates.length) continue;

    candidates.sort((a, b) => b.protein - a.protein || b.calories - a.calories);
    const pick = candidates[0]!;
    rows[idx] = { ...rows[idx]!, recipe_id: pick.id };
    console.warn(
      `[tune] day ${day} snack#${r.slot_index}: protein swap to "${pick.name}" (${Math.round(pick.protein * 10) / 10}g P)`,
    );
    return true;
  }
  return false;
}

function swapMainMealForCalories(
  rows: PlanCalorieRow[],
  day: number,
  pool: PlanRecipeMeta[],
  calById: Map<string, number>,
  direction: "up" | "down",
  bandMin: number,
  bandMax: number,
  allowedRecipeIds: Set<string>,
  opts?: { proById?: Map<string, number>; proteinFloor?: number },
): boolean {
  const mealOrder: PlanCalorieRow["meal_type"][] = ["dinner", "lunch", "breakfast"];
  const usedOnDay = new Set(rows.filter((r) => r.day_of_week === day && r.recipe_id).map((r) => r.recipe_id));
  const currentTotal = dayCaloriesFromRows(rows, day, calById);
  const currentPro =
    direction === "down" && opts?.proById
      ? dayProteinFromRows(rows, day, opts.proById)
      : 0;
  const proteinFloor = opts?.proteinFloor ?? 0;

  for (const mealType of mealOrder) {
    const idx = rows.findIndex((r) => r.day_of_week === day && r.meal_type === mealType);
    if (idx < 0) continue;
    const currentId = rows[idx]!.recipe_id;
    const currentCal = calById.get(currentId) ?? 0;
    const currentMealPro = opts?.proById?.get(currentId) ?? 0;

    const candidates = pool.filter((r) => {
      if (!allowedRecipeIds.has(r.id)) return false;
      if (r.id === currentId || usedOnDay.has(r.id)) return false;
      if (!recipeMatchesPlannerSlot(r.name, r.ingredientNames ?? [], mealType, r.calories)) return false;
      const newTotal = currentTotal - currentCal + r.calories;
      if (direction === "up") {
        if (r.calories <= currentCal) return false;
        if (newTotal > bandMax) return false;
      } else {
        if (r.calories >= currentCal) return false;
        if (newTotal < bandMin) return false;
        if (opts?.proById && currentPro - currentMealPro + r.protein < proteinFloor) return false;
      }
      return true;
    });
    if (!candidates.length) continue;

    if (direction === "up") {
      candidates.sort((a, b) => b.calories - a.calories);
    } else {
      candidates.sort(
        (a, b) =>
          a.calories - b.calories ||
          b.protein - a.protein ||
          (opts?.proById?.get(b.id) ?? 0) - (opts?.proById?.get(a.id) ?? 0),
      );
    }
    const pick = candidates[0]!;
    rows[idx] = { ...rows[idx]!, recipe_id: pick.id };
    console.warn(
      `[tune] day ${day} ${mealType}: swapped to "${pick.name}" (${Math.round(pick.calories)} kcal), ` +
        `day ~${Math.round(currentTotal - currentCal + pick.calories)} kcal`,
    );
    return true;
  }
  return false;
}

/**
 * Serving-scale lever: prefer a higher-calorie swap within SERVING_SCALE_MAX × current meal calories
 * when a direct swap cannot close a small gap.
 */
function tryServingScaleSwap(
  rows: PlanCalorieRow[],
  day: number,
  pool: PlanRecipeMeta[],
  calById: Map<string, number>,
  bandMin: number,
  bandMax: number,
  allowedRecipeIds: Set<string>,
): boolean {
  const mealOrder: PlanCalorieRow["meal_type"][] = ["dinner", "lunch", "breakfast"];
  const usedOnDay = new Set(rows.filter((r) => r.day_of_week === day && r.recipe_id).map((r) => r.recipe_id));
  const currentTotal = dayCaloriesFromRows(rows, day, calById);
  if (currentTotal >= bandMin) return false;

  for (const mealType of mealOrder) {
    const idx = rows.findIndex((r) => r.day_of_week === day && r.meal_type === mealType);
    if (idx < 0) continue;
    const currentId = rows[idx]!.recipe_id;
    const currentCal = calById.get(currentId) ?? 0;
    if (currentCal <= 0) continue;
    const scaledCap = Math.round(currentCal * SERVING_SCALE_MAX);

    const candidates = pool.filter((r) => {
      if (!allowedRecipeIds.has(r.id)) return false;
      if (r.id === currentId || usedOnDay.has(r.id)) return false;
      if (!recipeMatchesPlannerSlot(r.name, r.ingredientNames ?? [], mealType, r.calories)) return false;
      if (r.calories <= currentCal || r.calories > scaledCap) return false;
      const newTotal = currentTotal - currentCal + r.calories;
      return newTotal >= bandMin && newTotal <= bandMax;
    });
    if (!candidates.length) continue;

    candidates.sort((a, b) => b.calories - a.calories);
    const pick = candidates[0]!;
    rows[idx] = { ...rows[idx]!, recipe_id: pick.id };
    console.warn(
      `[tune] day ${day} ${mealType}: serving-scale swap to "${pick.name}" (${Math.round(pick.calories)} kcal)`,
    );
    return true;
  }
  return false;
}

function addSnackToCloseGap(
  rows: PlanCalorieRow[],
  day: number,
  mealPlanId: string,
  pool: PlanRecipeMeta[],
  calById: Map<string, number>,
  dailyTarget: number,
  snackCountPerDay: number,
  allowedRecipeIds: Set<string>,
  snackMicroPriorities?: MicroPriority[],
): boolean {
  const band = dailyCalorieBand(dailyTarget);
  const current = dayCaloriesFromRows(rows, day, calById);
  if (current >= band.min) return false;
  if (snackCountOnDay(rows, day) >= snackCountPerDay) return false;

  const gapToMin = band.min - current;
  const usedOnDay = new Set(rows.filter((r) => r.day_of_week === day && r.recipe_id).map((r) => r.recipe_id));
  const picked = pickSnackForGap(
    pool,
    gapToMin,
    current,
    band.max,
    usedOnDay,
    allowedRecipeIds,
    snackMicroPriorities,
  );
  if (!picked) return false;

  const slotIndex = snackCountOnDay(rows, day);
  rows.push({
    meal_plan_id: mealPlanId,
    recipe_id: picked.id,
    day_of_week: day,
    meal_type: "snack",
    slot_index: slotIndex,
    quick_add_name: null,
    quick_add_calories: null,
  });
  console.warn(
    `[tune] day ${day} snack#${slotIndex}: added "${picked.name}" (${Math.round(picked.calories)} kcal)`,
  );
  return true;
}

/** Add a snack when the day is below the daily target but already inside the daily band (surplus week-avg tuning). */
function addSnackWhenBelowTarget(
  rows: PlanCalorieRow[],
  day: number,
  mealPlanId: string,
  pool: PlanRecipeMeta[],
  calById: Map<string, number>,
  dailyTarget: number,
  snackCountPerDay: number,
  allowedRecipeIds: Set<string>,
  snackMicroPriorities?: MicroPriority[],
): boolean {
  const band = dailyCalorieBand(dailyTarget);
  const current = dayCaloriesFromRows(rows, day, calById);
  if (current >= dailyTarget) return false;
  if (snackCountOnDay(rows, day) >= snackCountPerDay) return false;

  const gapToTarget = dailyTarget - current;
  const usedOnDay = new Set(rows.filter((r) => r.day_of_week === day && r.recipe_id).map((r) => r.recipe_id));
  const picked = pickSnackForGap(
    pool,
    gapToTarget,
    current,
    band.max,
    usedOnDay,
    allowedRecipeIds,
    snackMicroPriorities,
  );
  if (!picked) return false;

  const slotIndex = snackCountOnDay(rows, day);
  rows.push({
    meal_plan_id: mealPlanId,
    recipe_id: picked.id,
    day_of_week: day,
    meal_type: "snack",
    slot_index: slotIndex,
    quick_add_name: null,
    quick_add_calories: null,
  });
  console.warn(
    `[tune] day ${day} snack#${slotIndex}: added "${picked.name}" (${Math.round(picked.calories)} kcal) below target`,
  );
  return true;
}

/**
 * Guarantee each day carries the requested snack count even when mains already
 * fill the calorie band — swaps a main down to make room when needed.
 */
export function ensureDailySnackCoverage(opts: {
  rows: PlanCalorieRow[];
  days: number[];
  pool: PlanRecipeMeta[];
  calById: Map<string, number>;
  proById?: Map<string, number>;
  mealPlanId: string;
  dailyTarget: number;
  dailyProteinTarget?: number;
  snackCountPerDay: number;
  allowedRecipeIds: Set<string>;
  snackMicroPriorities?: MicroPriority[];
  tuneDay: (day: number) => void;
}): void {
  if (opts.snackCountPerDay < 1) return;
  if (!poolHasSnackRecipes(opts.pool)) return;
  const band = dailyCalorieBand(opts.dailyTarget);

  for (const day of opts.days) {
    let madeRoom = false;
    for (let guard = 0; guard < 4; guard += 1) {
      if (snackCountOnDay(opts.rows, day) >= opts.snackCountPerDay) break;

      const current = dayCaloriesFromRows(opts.rows, day, opts.calById);
      const usedOnDay = new Set(
        opts.rows.filter((r) => r.day_of_week === day && r.recipe_id).map((r) => r.recipe_id),
      );
      const roomUnderMax = band.max - current;
      if (roomUnderMax < SNACK_MIN_CALORIES) {
        const proteinFloor =
          opts.dailyProteinTarget != null && opts.dailyProteinTarget > 0
            ? proteinFloorForTarget(opts.dailyProteinTarget)
            : 0;
        const swapped = swapMainMealForCalories(
          opts.rows,
          day,
          opts.pool,
          opts.calById,
          "down",
          Math.max(band.min - SNACK_MAX_CALORIES, 0),
          band.max,
          opts.allowedRecipeIds,
          opts.proById && proteinFloor > 0 ? { proById: opts.proById, proteinFloor } : undefined,
        );
        if (!swapped) break;
        madeRoom = true;
        continue;
      }
      // Prefer the smallest snack that fits remaining headroom, not a full gap-fill.
      const idealGap = Math.min(
        Math.max(band.min - current, SNACK_MIN_CALORIES),
        roomUnderMax,
      );
      const proteinGap =
        opts.dailyProteinTarget != null && opts.dailyProteinTarget > 0 && opts.proById
          ? Math.max(0, proteinFloorForTarget(opts.dailyProteinTarget) - dayProteinFromRows(opts.rows, day, opts.proById))
          : 0;
      const picked = pickSnackForGap(
        opts.pool,
        idealGap,
        current,
        band.max,
        usedOnDay,
        opts.allowedRecipeIds,
        opts.snackMicroPriorities,
        { proById: opts.proById, proteinGap },
      );

      if (picked) {
        const slotIndex = snackCountOnDay(opts.rows, day);
        opts.rows.push({
          meal_plan_id: opts.mealPlanId,
          recipe_id: picked.id,
          day_of_week: day,
          meal_type: "snack",
          slot_index: slotIndex,
          quick_add_name: null,
          quick_add_calories: null,
        });
        console.warn(
          `[snack-coverage] day ${day} snack#${slotIndex}: added "${picked.name}" (${Math.round(picked.calories)} kcal)`,
        );
        continue;
      }

      // No snack fits under band.max — swap a main down to make room, then retry.
      const roomFloor = Math.max(band.min - SNACK_MAX_CALORIES, 0);
      const proteinFloor =
        opts.dailyProteinTarget != null && opts.dailyProteinTarget > 0
          ? proteinFloorForTarget(opts.dailyProteinTarget)
          : 0;
      const swapped = swapMainMealForCalories(
        opts.rows,
        day,
        opts.pool,
        opts.calById,
        "down",
        roomFloor,
        band.max,
        opts.allowedRecipeIds,
        opts.proById && proteinFloor > 0 ? { proById: opts.proById, proteinFloor } : undefined,
      );
      if (!swapped) break;
      madeRoom = true;
    }

    // Re-tune if the room-making swap left the day under band without a snack filling it.
    if (madeRoom) {
      const total = dayCaloriesFromRows(opts.rows, day, opts.calById);
      if (total < band.min || total > band.max) opts.tuneDay(day);
    }
  }
}

/** Final pass: swap meals and add snacks when days remain materially below the protein target. */
export function ensureDailyProteinCoverage(opts: {
  rows: PlanCalorieRow[];
  days: number[];
  pool: PlanRecipeMeta[];
  calById: Map<string, number>;
  proById: Map<string, number>;
  mealPlanId: string;
  dailyTarget: number;
  dailyProteinTarget: number;
  snackCountPerDay: number;
  allowedRecipeIds: Set<string>;
  snackMicroPriorities?: MicroPriority[];
}): void {
  if (opts.dailyProteinTarget <= 0) return;
  const band = dailyCalorieBand(opts.dailyTarget);
  const proteinFloor = proteinFloorForTarget(opts.dailyProteinTarget);

  for (const day of opts.days) {
    for (let guard = 0; guard < 16; guard += 1) {
      const pro = dayProteinFromRows(opts.rows, day, opts.proById);
      if (pro >= proteinFloor) break;

      if (
        swapMainMealForProtein(
          opts.rows,
          day,
          opts.pool,
          opts.calById,
          opts.proById,
          band.min,
          band.max,
          opts.allowedRecipeIds,
        )
      ) {
        continue;
      }
      if (
        swapSnackForProtein(
          opts.rows,
          day,
          opts.pool,
          opts.calById,
          opts.proById,
          band.min,
          band.max,
          opts.allowedRecipeIds,
        )
      ) {
        continue;
      }

      if (snackCountOnDay(opts.rows, day) >= opts.snackCountPerDay || !poolHasSnackRecipes(opts.pool)) {
        break;
      }

      const current = dayCaloriesFromRows(opts.rows, day, opts.calById);
      if (current + SNACK_MIN_CALORIES > band.max) break;

      const usedOnDay = new Set(
        opts.rows.filter((r) => r.day_of_week === day && r.recipe_id).map((r) => r.recipe_id),
      );
      const proteinGap = proteinFloor - pro;
      const picked = pickSnackForGap(
        opts.pool,
        Math.min(Math.max(band.min - current, SNACK_MIN_CALORIES), band.max - current),
        current,
        band.max,
        usedOnDay,
        opts.allowedRecipeIds,
        opts.snackMicroPriorities,
        {
          proById: opts.proById,
          proteinGap,
          allowSameDayRepeat: countPoolSnackRecipes(opts.pool) < opts.snackCountPerDay,
        },
      );
      if (!picked) break;

      const slotIndex = snackCountOnDay(opts.rows, day);
      opts.rows.push({
        meal_plan_id: opts.mealPlanId,
        recipe_id: picked.id,
        day_of_week: day,
        meal_type: "snack",
        slot_index: slotIndex,
        quick_add_name: null,
        quick_add_calories: null,
      });
      console.warn(
        `[protein-coverage] day ${day} snack#${slotIndex}: added "${picked.name}" (${Math.round(picked.protein * 10) / 10}g P, ${Math.round(picked.calories)} kcal)`,
      );
    }
  }
}

/**
 * Truly final pass: days still under the calorie band with unfilled snack slots, where the
 * library has too few distinct snacks, get a repeated snack — a same-day repeat beats
 * silently missing the day's calorie/protein target. Run after every other tuning pass.
 */
export function fillSnackShortfallAsLastResort(opts: {
  rows: PlanCalorieRow[];
  days: number[];
  pool: PlanRecipeMeta[];
  calById: Map<string, number>;
  proById?: Map<string, number>;
  mealPlanId: string;
  dailyTarget: number;
  dailyProteinTarget?: number;
  snackCountPerDay: number;
  allowedRecipeIds: Set<string>;
  snackMicroPriorities?: MicroPriority[];
}): void {
  if (opts.snackCountPerDay < 1) return;
  if (countPoolSnackRecipes(opts.pool) >= opts.snackCountPerDay) return;
  const band = dailyCalorieBand(opts.dailyTarget);

  for (const day of opts.days) {
    for (let guard = 0; guard < 4; guard += 1) {
      if (snackCountOnDay(opts.rows, day) >= opts.snackCountPerDay) break;
      const current = dayCaloriesFromRows(opts.rows, day, opts.calById);
      const proteinGap =
        opts.dailyProteinTarget != null && opts.dailyProteinTarget > 0 && opts.proById
          ? Math.max(
              0,
              proteinFloorForTarget(opts.dailyProteinTarget) -
                dayProteinFromRows(opts.rows, day, opts.proById),
            )
          : 0;
      if (current >= band.min && proteinGap <= 0) break;
      if (current + SNACK_MIN_CALORIES > band.max) break;

      const usedOnDay = new Set(
        opts.rows.filter((r) => r.day_of_week === day && r.recipe_id).map((r) => r.recipe_id),
      );
      const picked = pickSnackForGap(
        opts.pool,
        Math.min(Math.max(band.min - current, SNACK_MIN_CALORIES), band.max - current),
        current,
        band.max,
        usedOnDay,
        opts.allowedRecipeIds,
        opts.snackMicroPriorities,
        { proById: opts.proById, proteinGap, allowSameDayRepeat: true },
      );
      if (!picked) break;

      const slotIndex = snackCountOnDay(opts.rows, day);
      opts.rows.push({
        meal_plan_id: opts.mealPlanId,
        recipe_id: picked.id,
        day_of_week: day,
        meal_type: "snack",
        slot_index: slotIndex,
        quick_add_name: null,
        quick_add_calories: null,
      });
      console.warn(
        `[snack-shortfall] day ${day} snack#${slotIndex}: repeated "${picked.name}" — library has too few distinct snack recipes`,
      );
    }
  }
}

export type TuneDayOptions = {
  rows: PlanCalorieRow[];
  day: number;
  pool: PlanRecipeMeta[];
  calById: Map<string, number>;
  proById: Map<string, number>;
  mealPlanId: string;
  dailyTarget: number;
  dailyProteinTarget: number;
  snackCountPerDay: number;
  allowedRecipeIds: Set<string>;
  snackMicroPriorities?: MicroPriority[];
  goalBias: CalorieGoalBias;
  trimSnacksWhileOver: (rows: PlanCalorieRow[], day: number, maxRatio: number) => void;
  trimSnacksIfOverMacroCaps: (rows: PlanCalorieRow[], day: number) => void;
};

/** Push a single day into the daily calorie band using meal swaps, serving-scale swaps, and snacks. */
export function tuneDayTowardCalorieBand(opts: TuneDayOptions): void {
  const band = dailyCalorieBand(opts.dailyTarget);
  const maxIterations = 24;
  const proteinFloor =
    opts.dailyProteinTarget > 0 ? proteinFloorForTarget(opts.dailyProteinTarget) : 0;
  const calorieDownOpts =
    proteinFloor > 0 ? { proById: opts.proById, proteinFloor } : undefined;

  for (let i = 0; i < maxIterations; i += 1) {
    const current = dayCaloriesFromRows(opts.rows, opts.day, opts.calById);

    if (current > band.max) {
      opts.trimSnacksWhileOver(opts.rows, opts.day, band.max / opts.dailyTarget);
      if (dayCaloriesFromRows(opts.rows, opts.day, opts.calById) > band.max) {
        if (
          swapMainMealForCalories(
            opts.rows,
            opts.day,
            opts.pool,
            opts.calById,
            "down",
            band.min,
            band.max,
            opts.allowedRecipeIds,
            calorieDownOpts,
          )
        ) {
          continue;
        }
      }
      opts.trimSnacksIfOverMacroCaps(opts.rows, opts.day);
      if (dayCaloriesFromRows(opts.rows, opts.day, opts.calById) <= band.max) continue;
      break;
    }

    if (current < band.min) {
      if (
        swapMainMealForCalories(
          opts.rows,
          opts.day,
          opts.pool,
          opts.calById,
          "up",
          band.min,
          band.max,
          opts.allowedRecipeIds,
        )
      ) {
        continue;
      }
      if (
        tryServingScaleSwap(
          opts.rows,
          opts.day,
          opts.pool,
          opts.calById,
          band.min,
          band.max,
          opts.allowedRecipeIds,
        )
      ) {
        continue;
      }
      if (
        addSnackToCloseGap(
          opts.rows,
          opts.day,
          opts.mealPlanId,
          opts.pool,
          opts.calById,
          opts.dailyTarget,
          opts.snackCountPerDay,
          opts.allowedRecipeIds,
          opts.snackMicroPriorities,
        )
      ) {
        continue;
      }
      break;
    }

    break;
  }

  if (opts.dailyProteinTarget > 0) {
    const proteinFloor = proteinFloorForTarget(opts.dailyProteinTarget);
    for (let i = 0; i < 16; i += 1) {
      const pro = dayProteinFromRows(opts.rows, opts.day, opts.proById);
      if (pro >= proteinFloor) break;
      if (
        swapMainMealForProtein(
          opts.rows,
          opts.day,
          opts.pool,
          opts.calById,
          opts.proById,
          band.min,
          band.max,
          opts.allowedRecipeIds,
        )
      ) {
        continue;
      }
      if (
        swapSnackForProtein(
          opts.rows,
          opts.day,
          opts.pool,
          opts.calById,
          opts.proById,
          band.min,
          band.max,
          opts.allowedRecipeIds,
        )
      ) {
        continue;
      }
      break;
    }
  }
}

export function tuneWeekAvgTowardBand(
  rows: PlanCalorieRow[],
  days: number[],
  pool: PlanRecipeMeta[],
  calById: Map<string, number>,
  mealPlanId: string,
  dailyTarget: number,
  snackCountPerDay: number,
  allowedRecipeIds: Set<string>,
  goalBias: CalorieGoalBias,
  tuneDay: (day: number) => void,
  snackMicroPriorities?: MicroPriority[],
): void {
  const weekBand = weekAvgCalorieBand(dailyTarget);
  const avg = () => {
    const totals = days.map((d) => dayCaloriesFromRows(rows, d, calById));
    return totals.reduce((a, b) => a + b, 0) / Math.max(days.length, 1);
  };

  for (let pass = 0; pass < 3; pass += 1) {
    const currentAvg = avg();
    if (isWithinWeekAvgCalorieBand(currentAvg, dailyTarget)) break;

    if (currentAvg < weekBand.min && goalBias !== "deficit") {
      const dayBand = dailyCalorieBand(dailyTarget);
      const underDays = days
        .filter((d) => {
          const cal = dayCaloriesFromRows(rows, d, calById);
          return cal < weekBand.min || !isWithinDailyCalorieBand(cal, dailyTarget);
        })
        .sort(
          (a, b) =>
            dayCaloriesFromRows(rows, a, calById) - dayCaloriesFromRows(rows, b, calById),
        );
      for (const day of underDays) {
        if (dayCaloriesFromRows(rows, day, calById) >= dayBand.max) continue;
        if (
          goalBias === "surplus" &&
          dayCaloriesFromRows(rows, day, calById) < dailyTarget
        ) {
          if (
            !addSnackWhenBelowTarget(
              rows,
              day,
              mealPlanId,
              pool,
              calById,
              dailyTarget,
              snackCountPerDay,
              allowedRecipeIds,
              snackMicroPriorities,
            )
          ) {
            swapMainMealForCalories(
              rows,
              day,
              pool,
              calById,
              "up",
              dayBand.min,
              dayBand.max,
              allowedRecipeIds,
            );
          }
        }
        tuneDay(day);
        if (isWithinWeekAvgCalorieBand(avg(), dailyTarget)) break;
      }
    } else if (currentAvg > weekBand.max && goalBias !== "surplus") {
      const dayBand = dailyCalorieBand(dailyTarget);
      const overDays = days
        .filter((d) => {
          const cal = dayCaloriesFromRows(rows, d, calById);
          return cal > weekBand.max || cal > dayBand.max;
        })
        .sort(
          (a, b) =>
            dayCaloriesFromRows(rows, b, calById) - dayCaloriesFromRows(rows, a, calById),
        );
      for (const day of overDays) {
        tuneDay(day);
        if (isWithinWeekAvgCalorieBand(avg(), dailyTarget)) break;
      }
    } else {
      break;
    }
  }
}

export function buildPlanCalorieAccuracyWarning(
  days: number[],
  rows: PlanCalorieRow[],
  calById: Map<string, number>,
  dailyTarget: number,
): string | undefined {
  const band = dailyCalorieBand(dailyTarget);
  const weekBand = weekAvgCalorieBand(dailyTarget);
  const dayTotals = days.map((d) => ({ day: d, cal: dayCaloriesFromRows(rows, d, calById) }));
  const avg = dayTotals.reduce((s, x) => s + x.cal, 0) / Math.max(dayTotals.length, 1);
  const outside = dayTotals.filter((x) => x.cal < band.min || x.cal > band.max);

  if (outside.length === 0 && isWithinWeekAvgCalorieBand(avg, dailyTarget)) {
    return undefined;
  }

  const dayBits = outside
    .slice(0, 4)
    .map((x) => `day ${x.day + 1}: ~${Math.round(x.cal)} kcal`)
    .join("; ");
  const avgNote = isWithinWeekAvgCalorieBand(avg, dailyTarget)
    ? ""
    : ` Week average ~${Math.round(avg)} kcal (target band ${Math.round(weekBand.min)}–${Math.round(weekBand.max)}).`;

  return (
    `Some days fall outside your ${formatDailyCalorieBand(dailyTarget)} daily band` +
    (dayBits ? `: ${dayBits}.` : ".") +
    avgNote +
    " Add lighter or snack-sized recipes, or adjust portions."
  );
}

export function buildPlanProteinAccuracyWarning(
  days: number[],
  rows: PlanCalorieRow[],
  proById: Map<string, number>,
  dailyProteinTarget: number,
): string | undefined {
  if (dailyProteinTarget <= 0) return undefined;
  const floor = proteinFloorForTarget(dailyProteinTarget);
  const ceiling = dailyProteinTarget * MACRO_CAP_MAX_RATIO;
  const dayTotals = days.map((day) => ({ day, pro: dayProteinFromRows(rows, day, proById) }));
  const lowDays = dayTotals.filter(({ pro }) => pro < floor);
  const highDays = dayTotals.filter(({ pro }) => pro > ceiling);
  if (!lowDays.length && !highDays.length) return undefined;

  const warnings: string[] = [];
  if (lowDays.length) {
    const dayBits = lowDays
      .slice(0, 4)
      .map(({ day, pro }) => `day ${day + 1}: ~${Math.round(pro * 10) / 10}g`)
      .join("; ");
    warnings.push(
      `Some days fall below your protein target (aim >=${Math.round(floor)}g): ${dayBits}. ` +
        "Your library may need higher-protein options for lighter days.",
    );
  }
  if (highDays.length) {
    const dayBits = highDays
      .slice(0, 4)
      .map(({ day, pro }) => `day ${day + 1}: ~${Math.round(pro * 10) / 10}g`)
      .join("; ");
    warnings.push(
      `Some days exceed your protein ceiling (aim <=${Math.round(ceiling)}g): ${dayBits}. ` +
        "Use smaller or lower-protein snack recipes to keep the plan balanced.",
    );
  }
  return warnings.join(" ");
}

/** Last pass after snack coverage: pull any day still above the daily band max. */
export function enforceDailyCalorieCeiling(opts: {
  rows: PlanCalorieRow[];
  days: number[];
  pool: PlanRecipeMeta[];
  calById: Map<string, number>;
  proById?: Map<string, number>;
  dailyTarget: number;
  dailyProteinTarget?: number;
  allowedRecipeIds: Set<string>;
  tuneDay: (day: number) => void;
}): void {
  const band = dailyCalorieBand(opts.dailyTarget);
  const proteinFloor =
    opts.dailyProteinTarget != null && opts.dailyProteinTarget > 0
      ? proteinFloorForTarget(opts.dailyProteinTarget)
      : 0;

  for (const day of opts.days) {
    for (let pass = 0; pass < 12; pass += 1) {
      const cal = dayCaloriesFromRows(opts.rows, day, opts.calById);
      if (cal <= band.max) break;
      opts.tuneDay(day);
      if (dayCaloriesFromRows(opts.rows, day, opts.calById) > band.max) {
        const snackEntries = opts.rows
          .map((r, i) => ({ r, i }))
          .filter(({ r }) => r.day_of_week === day && r.meal_type === "snack" && r.recipe_id);
        if (!snackEntries.length) break;

        const currentPro = opts.proById ? dayProteinFromRows(opts.rows, day, opts.proById) : Infinity;
        const removable = snackEntries
          .map(({ r, i }) => {
            const snackPro = opts.proById?.get(r.recipe_id) ?? 0;
            return { i, slot: r.slot_index ?? 0, snackPro, proAfter: currentPro - snackPro };
          })
          .filter(({ proAfter }) => !opts.proById || proAfter >= proteinFloor)
          .sort((a, b) => a.snackPro - b.snackPro || b.slot - a.slot);

        const pick = removable[0];
        if (pick === undefined) break;
        opts.rows.splice(pick.i, 1);
      }
    }
  }
}

export function buildSnackLibraryNotice(
  pool: PlanRecipeMeta[],
  days: number[],
  rows: PlanCalorieRow[],
  calById: Map<string, number>,
  dailyTarget: number,
  expectedSnackCountPerDay = 0,
): string | undefined {
  if (expectedSnackCountPerDay > 0) {
    const missingSnackDays = days.filter((d) => snackCountOnDay(rows, d) < expectedSnackCountPerDay);
    if (missingSnackDays.length) {
      const dayBits = missingSnackDays
        .slice(0, 4)
        .map((d) => `day ${d + 1}`)
        .join(", ");
      return (
        `Some snack slots were left empty because no snack-sized recipes fit (${dayBits}). ` +
        "Add 80-300 kcal snack recipes to fill them without blowing past your targets."
      );
    }
  }
  if (poolHasSnackRecipes(pool)) return undefined;
  const band = dailyCalorieBand(dailyTarget);
  const needsSnack = days.some((d) => dayCaloriesFromRows(rows, d, calById) < band.min);
  if (!needsSnack) return undefined;
  return "Add snack recipes to your library to help hit daily targets.";
}
