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

export function dayCaloriesFromRows(
  rows: PlanCalorieRow[],
  day: number,
  calById: Map<string, number>,
): number {
  return rows
    .filter((r) => r.day_of_week === day && r.recipe_id)
    .reduce((s, r) => s + (calById.get(r.recipe_id) ?? 0), 0);
}

export function poolHasSnackRecipes(pool: PlanRecipeMeta[]): boolean {
  return pool.some(
    (r) =>
      !excludeFromMainMealSlots(r.name, r.ingredientNames ?? []) &&
      r.calories >= SNACK_MIN_CALORIES &&
      r.calories <= SNACK_MAX_CALORIES &&
      isRecipeAISnackAppropriate(r.calories, r.ingredientNames ?? []),
  );
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
): PlanRecipeMeta | null {
  const ideal = Math.min(Math.max(gapToMin, SNACK_MIN_CALORIES), SNACK_MAX_CALORIES);
  const candidates = pool.filter(
    (r) =>
      allowedRecipeIds.has(r.id) &&
      !usedOnDay.has(r.id) &&
      !excludeFromMainMealSlots(r.name, r.ingredientNames ?? []) &&
      r.calories >= SNACK_MIN_CALORIES &&
      r.calories <= SNACK_MAX_CALORIES &&
      isRecipeAISnackAppropriate(r.calories, r.ingredientNames ?? []) &&
      currentDayCal + r.calories <= bandMax,
  );
  if (!candidates.length) return null;

  const scored = candidates
    .map((r) => {
      const calDist = Math.abs(r.calories - ideal);
      let score = -calDist;
      if (snackMicroPriorities?.length) {
        score += scoreRecipeMicroBoost(r.ingredientNames ?? [], snackMicroPriorities);
      }
      return { r, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0]?.r ?? null;
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
): boolean {
  const mealOrder: PlanCalorieRow["meal_type"][] = ["dinner", "lunch", "breakfast"];
  const usedOnDay = new Set(rows.filter((r) => r.day_of_week === day && r.recipe_id).map((r) => r.recipe_id));
  const currentTotal = dayCaloriesFromRows(rows, day, calById);

  for (const mealType of mealOrder) {
    const idx = rows.findIndex((r) => r.day_of_week === day && r.meal_type === mealType);
    if (idx < 0) continue;
    const currentId = rows[idx]!.recipe_id;
    const currentCal = calById.get(currentId) ?? 0;

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
      }
      return true;
    });
    if (!candidates.length) continue;

    candidates.sort((a, b) => (direction === "up" ? b.calories - a.calories : a.calories - b.calories));
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

export type TuneDayOptions = {
  rows: PlanCalorieRow[];
  day: number;
  pool: PlanRecipeMeta[];
  calById: Map<string, number>;
  mealPlanId: string;
  dailyTarget: number;
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
      const underDays = days
        .filter((d) => !isWithinDailyCalorieBand(dayCaloriesFromRows(rows, d, calById), dailyTarget))
        .sort(
          (a, b) =>
            dayCaloriesFromRows(rows, a, calById) - dayCaloriesFromRows(rows, b, calById),
        );
      for (const day of underDays) {
        tuneDay(day);
        if (isWithinWeekAvgCalorieBand(avg(), dailyTarget)) break;
      }
    } else if (currentAvg > weekBand.max && goalBias !== "surplus") {
      const overDays = days
        .filter((d) => dayCaloriesFromRows(rows, d, calById) > dailyCalorieBand(dailyTarget).max)
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

export function buildSnackLibraryNotice(
  pool: PlanRecipeMeta[],
  days: number[],
  rows: PlanCalorieRow[],
  calById: Map<string, number>,
  dailyTarget: number,
): string | undefined {
  if (poolHasSnackRecipes(pool)) return undefined;
  const band = dailyCalorieBand(dailyTarget);
  const needsSnack = days.some((d) => dayCaloriesFromRows(rows, d, calById) < band.min);
  if (!needsSnack) return undefined;
  return "Add snack recipes to your library to help hit daily targets.";
}
