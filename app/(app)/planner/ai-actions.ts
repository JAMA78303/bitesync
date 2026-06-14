"use server";

import { FRIENDLY_BY_CONTEXT, toUserFacingError } from "@/lib/errors/userFacing";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUserTier } from "@/lib/subscription";
import { fetchRecipeNutritionMap } from "@/lib/supabase/recipe-nutrition-query";
import { getProfile } from "@/lib/supabase/profile";
import { getDailyCalorieTarget, getDailyProteinTarget } from "@/lib/utils/nutrition-targets";
import { generateMealPlan, type ClaudeMealPlanResult } from "@/lib/ai/client";
import { buildDietaryConstraints, dietaryPreferencesToLegacyFlags, parseDietaryPreferences } from "@/lib/dietary/constraints";
import {
  DEFAULT_SNACK_MICRO_PRIORITIES,
  MICRO_RICH_FOODS,
  microPrioritiesFromDeficiencies,
  scoreRecipeMicroBoost,
  type MicroPriority,
} from "@/lib/nutrition/micro-rich-foods";
import type { Sex } from "@/lib/nutrition/drv";
import { getWeeklyMicroAnalysis } from "@/lib/supabase/nutrition";
import type { SupabaseClient } from "@supabase/supabase-js";
import { dailyCalorieBand } from "@/lib/planner/calorie-bands";
import {
  buildPlanCalorieAccuracyWarning,
  buildSnackLibraryNotice,
  calorieGoalBiasFromProfile,
  dayCaloriesFromRows,
  dayProteinFromRows,
  ensureDailySnackCoverage,
  ensureDailyProteinCoverage,
  enforceDailyCalorieCeiling,
  plannerSlotSpecs,
  trimSnacksIfDayOverMacroCaps,
  trimSnacksWhileDayCaloriesExceedRatio,
  tuneDayTowardCalorieBand,
  tuneWeekAvgTowardBand,
  type CalorieGoalBias,
  type PlanCalorieRow,
} from "@/lib/planner/plan-calorie-tuning";
import { autoFillSnackRecipesForPlan } from "@/lib/planner/snack-gap-fill";
import type { ProfileForTargets } from "@/lib/utils/nutrition-targets";
import {
  AI_BREAKFAST_BLOCKED,
  SNACK_MAX_CALORIES,
  SNACK_MIN_CALORIES,
  classifyRecipeMealType,
  excludeFromMainMealSlots,
  getMealTypeMultiplier,
  isRecipeAISnackAppropriate,
  matchByIncludes,
  recipeMatchesPlannerSlot,
  shouldOccupyBreakfastSlot,
  suitableForBreakfastSlot,
  suitableForBreakfastSlotRelaxed,
} from "@/lib/planner/meal-slot-eligibility";

export type GoalContext = {
  calorieTarget: number | null;
  proteinTarget: number | null;
  followsVegetarian: boolean;
  followsVegan: boolean;
  followsGlutenFree: boolean;
  dairyFree?: boolean;
  allergens?: string[];
};

/** Off by default: set ENABLE_ANTHROPIC_MEAL_PLANNING=true and ANTHROPIC_API_KEY to use Claude (billable). */
function isAnthropicMealAiEnabled(): boolean {
  const v = process.env.ENABLE_ANTHROPIC_MEAL_PLANNING;
  return Boolean(process.env.ANTHROPIC_API_KEY) && (v === "true" || v === "1");
}

type MealPlanInsertRow = {
  meal_plan_id: string;
  recipe_id: string;
  day_of_week: number;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  slot_index: number;
  quick_add_name: null;
  quick_add_calories: null;
};

function plannerDayFromAiIndex(selectedDays: number[], slotDay: number, index: number): number {
  if (Number.isInteger(slotDay) && slotDay >= 0 && slotDay < selectedDays.length) {
    return selectedDays[slotDay]!;
  }
  if (index < selectedDays.length) return selectedDays[index]!;
  return selectedDays[Math.max(0, selectedDays.length - 1)]!;
}

async function replacePlanDaysWithClaudePlan(
  supabase: SupabaseClient,
  userId: string,
  profile: ProfileForTargets,
  mealPlanId: string,
  selectedDays: number[],
  aiPlan: ClaudeMealPlanResult,
  snackCountPerDay: number,
  allowedRecipeIds: Set<string>,
  pool: RecipeWithNutrition[],
  dailyCalorieTarget: number,
  dailyProteinTarget: number,
  goalBias: CalorieGoalBias,
): Promise<{ error: string } | { success: true; warning?: string; snackLibraryNotice?: string }> {
  const rows: MealPlanInsertRow[] = [];
  const calById = new Map(pool.map((r) => [r.id, r.calories]));
  const proById = new Map(pool.map((r) => [r.id, r.protein]));
  const plan = aiPlan.plan.slice(0, selectedDays.length);
  for (let i = 0; i < plan.length; i += 1) {
    const p = plan[i]!;
    const dayOfWeek = plannerDayFromAiIndex(selectedDays, p.day, i);
    const push = (meal_type: MealPlanInsertRow["meal_type"], rid: string | null | undefined, slot_index: number) => {
      if (!rid || typeof rid !== "string") return;
      if (!allowedRecipeIds.has(rid)) return;
      rows.push({
        meal_plan_id: mealPlanId,
        recipe_id: rid,
        day_of_week: dayOfWeek,
        meal_type,
        slot_index,
        quick_add_name: null,
        quick_add_calories: null,
      });
    };
    push("breakfast", p.breakfast, 0);
    push("lunch", p.lunch, 0);
    push("dinner", p.dinner, 0);
    push("snack", p.snack, 0);
    if (snackCountPerDay >= 2) {
      push("snack", p.snack_b ?? null, 1);
    }
  }

  sanitizeAiPlanBreakfastSlots(rows, pool, selectedDays, mealPlanId, allowedRecipeIds);
  rebalanceInappropriateBreakfastAssignments(rows, pool, selectedDays);
  enforceAiMealSlotSeparation(rows, pool, selectedDays, allowedRecipeIds);

  if (!rows.length) {
    return { error: "Claude did not return any valid recipe IDs for the selected days." };
  }

  const tuneDay = (day: number) =>
    tuneDayTowardCalorieBand({
      rows: rows as PlanCalorieRow[],
      day,
      pool,
      calById,
      proById,
      mealPlanId,
      dailyTarget: dailyCalorieTarget,
      dailyProteinTarget,
      snackCountPerDay,
      allowedRecipeIds,
      goalBias,
      trimSnacksWhileOver: (r, d, maxRatio) =>
        trimSnacksWhileDayCaloriesExceedRatio(r as MealPlanInsertRow[], d, dailyCalorieTarget, calById, maxRatio),
      trimSnacksIfOverMacroCaps: (r, d) =>
        trimSnacksIfDayOverMacroCaps(
          r as MealPlanInsertRow[],
          d,
          dailyCalorieTarget,
          dailyProteinTarget,
          calById,
          proById,
        ),
    });

  for (const day of selectedDays) {
    tuneDay(day);
  }
  tuneWeekAvgTowardBand(
    rows as PlanCalorieRow[],
    selectedDays,
    pool,
    calById,
    mealPlanId,
    dailyCalorieTarget,
    snackCountPerDay,
    allowedRecipeIds,
    goalBias,
    tuneDay,
  );

  await autoFillSnackRecipesForPlan({
    supabase,
    userId,
    profile,
    dailyTarget: dailyCalorieTarget,
    days: selectedDays,
    rows: rows as PlanCalorieRow[],
    pool,
    calById,
    allowedRecipeIds,
    tuneDay,
    microPriorities: DEFAULT_SNACK_MICRO_PRIORITIES,
    snackCountPerDay,
  });
  ensureDailySnackCoverage({
    rows: rows as PlanCalorieRow[],
    days: selectedDays,
    pool,
    calById,
    proById,
    mealPlanId,
    dailyTarget: dailyCalorieTarget,
    dailyProteinTarget,
    snackCountPerDay,
    allowedRecipeIds,
    snackMicroPriorities: DEFAULT_SNACK_MICRO_PRIORITIES,
    tuneDay,
  });
  ensureDailyProteinCoverage({
    rows: rows as PlanCalorieRow[],
    days: selectedDays,
    pool,
    calById,
    proById,
    mealPlanId,
    dailyTarget: dailyCalorieTarget,
    dailyProteinTarget,
    snackCountPerDay,
    allowedRecipeIds,
    snackMicroPriorities: DEFAULT_SNACK_MICRO_PRIORITIES,
  });
  enforceDailyCalorieCeiling({
    rows: rows as PlanCalorieRow[],
    days: selectedDays,
    pool,
    calById,
    dailyTarget: dailyCalorieTarget,
    allowedRecipeIds,
    tuneDay,
  });

  const warning = buildPlanCalorieAccuracyWarning(
    selectedDays,
    rows as PlanCalorieRow[],
    calById,
    dailyCalorieTarget,
  );
  const snackLibraryNotice = buildSnackLibraryNotice(
    pool,
    selectedDays,
    rows as PlanCalorieRow[],
    calById,
    dailyCalorieTarget,
  );

  const persisted = await persistWeeklyMealPlanRows(supabase, mealPlanId, rows, selectedDays);
  if ("error" in persisted) return { error: persisted.error };
  return { success: true as const, warning, snackLibraryNotice };
}

type GenerateAIWeekPlanInput = {
  mealPlanId: string;
  goals: GoalContext;
};

type RecipeRow = {
  id: string;
  name: string;
  fits_vegetarian: boolean | null;
  fits_vegan: boolean | null;
  fits_gluten_free: boolean | null;
};

type RecipeWithNutrition = RecipeRow & {
  calories: number;
  protein: number;
  carbs_g: number | null;
  fat_g: number | null;
  ingredientNames: string[];
};

function fixMisplacedBreakfastRecipesForDay(rows: MealPlanInsertRow[], day: number, pool: RecipeWithNutrition[]): void {
  const meta = new Map(pool.map((r) => [r.id, r]));
  for (;;) {
    const bfIdx = rows.findIndex((r) => r.day_of_week === day && r.meal_type === "breakfast");
    const misIdx = rows.findIndex((r) => {
      if (r.day_of_week !== day || r.meal_type === "breakfast") return false;
      const m = meta.get(r.recipe_id);
      return shouldOccupyBreakfastSlot(m?.name ?? "", m?.ingredientNames ?? []);
    });
    if (misIdx < 0) break;

    if (bfIdx < 0) {
      rows[misIdx] = {
        ...rows[misIdx]!,
        meal_type: "breakfast",
        slot_index: 0,
      };
      continue;
    }

    const temp = rows[bfIdx]!.recipe_id;
    rows[bfIdx] = { ...rows[bfIdx]!, recipe_id: rows[misIdx]!.recipe_id };
    rows[misIdx] = { ...rows[misIdx]!, recipe_id: temp };
  }
}

/** Fix Claude mis-placements and fill missing breakfast rows when the library has suitable recipes. */
function sanitizeAiPlanBreakfastSlots(
  rows: MealPlanInsertRow[],
  pool: RecipeWithNutrition[],
  selectedDays: number[],
  mealPlanId: string,
  allowedRecipeIds: Set<string>,
): void {
  for (const day of selectedDays) {
    fixMisplacedBreakfastRecipesForDay(rows, day, pool);

    const hasBreakfast = rows.some((r) => r.day_of_week === day && r.meal_type === "breakfast");
    if (hasBreakfast) continue;

    const usedIds = new Set(
      rows.filter((r) => r.day_of_week === day && r.recipe_id).map((r) => r.recipe_id),
    );

    const pickFirst = (pred: (r: RecipeWithNutrition) => boolean) =>
      pool.find((r) => allowedRecipeIds.has(r.id) && !usedIds.has(r.id) && pred(r));

    const picked =
      pickFirst((r) => suitableForBreakfastSlot(r.name, r.ingredientNames ?? [])) ??
      pickFirst((r) => suitableForBreakfastSlotRelaxed(r.name, r.ingredientNames ?? [])) ??
      pickFirst((r) => {
        const cal = r.calories ?? 0;
        const ings = r.ingredientNames ?? [];
        if (cal < 100 || cal > 720) return false;
        if (matchByIncludes(ings.map((x) => x.toLowerCase().trim()), AI_BREAKFAST_BLOCKED)) return false;
        const types = classifyRecipeMealType(r.name, ings);
        return !(types.includes("lunch") || types.includes("dinner"));
      }) ??
      pool.find((r) => allowedRecipeIds.has(r.id) && !usedIds.has(r.id));

    if (picked) {
      rows.push({
        meal_plan_id: mealPlanId,
        recipe_id: picked.id,
        day_of_week: day,
        meal_type: "breakfast",
        slot_index: 0,
        quick_add_name: null,
        quick_add_calories: null,
      });
    }
  }
}

/** If breakfast holds a main (e.g. grilled chicken) but lunch/dinner holds oats/eggs, swap them. */
function rebalanceInappropriateBreakfastAssignments(
  rows: MealPlanInsertRow[],
  pool: RecipeWithNutrition[],
  selectedDays: number[],
): void {
  const meta = new Map(pool.map((r) => [r.id, r]));
  for (const day of selectedDays) {
    const bfIdx = rows.findIndex((r) => r.day_of_week === day && r.meal_type === "breakfast");
    if (bfIdx < 0) continue;
    const bfMeta = meta.get(rows[bfIdx]!.recipe_id);
    if (!bfMeta) continue;
    if (suitableForBreakfastSlot(bfMeta.name, bfMeta.ingredientNames ?? [])) continue;

    const swapIdx = rows.findIndex((r) => {
      if (r.day_of_week !== day || (r.meal_type !== "lunch" && r.meal_type !== "dinner"))
        return false;
      const m = meta.get(r.recipe_id);
      if (!m) return false;
      return suitableForBreakfastSlot(m.name, m.ingredientNames ?? []);
    });
    if (swapIdx < 0) continue;

    const tmp = rows[bfIdx]!.recipe_id;
    rows[bfIdx] = { ...rows[bfIdx]!, recipe_id: rows[swapIdx]!.recipe_id };
    rows[swapIdx] = { ...rows[swapIdx]!, recipe_id: tmp };
  }
}

/** Final guard so AI output cannot place breakfast/main recipes into the wrong slot. */
function enforceAiMealSlotSeparation(
  rows: MealPlanInsertRow[],
  pool: RecipeWithNutrition[],
  selectedDays: number[],
  allowedRecipeIds: Set<string>,
): void {
  const meta = new Map(pool.map((r) => [r.id, r]));
  const mainsPool = pool.filter((r) => !excludeFromMainMealSlots(r.name, r.ingredientNames ?? []));
  const breakfastPool = pool.filter((r) => suitableForBreakfastSlot(r.name, r.ingredientNames ?? []));

  for (const day of selectedDays) {
    const used = new Set(rows.filter((r) => r.day_of_week === day).map((r) => r.recipe_id));

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i]!;
      if (row.day_of_week !== day) continue;
      if (row.meal_type === "snack") continue;

      const current = meta.get(row.recipe_id);
      const currentOk =
        !!current &&
        recipeMatchesPlannerSlot(
          current.name,
          current.ingredientNames ?? [],
          row.meal_type,
          current.calories ?? null,
        );
      if (currentOk) continue;

      const swapIdx = rows.findIndex((candidate, ci) => {
        if (ci === i || candidate.day_of_week !== day || candidate.meal_type === "snack") return false;
        const candMeta = meta.get(candidate.recipe_id);
        if (!candMeta) return false;
        const candFitsCurrent = recipeMatchesPlannerSlot(
          candMeta.name,
          candMeta.ingredientNames ?? [],
          row.meal_type,
          candMeta.calories ?? null,
        );
        if (!candFitsCurrent) return false;
        if (!current) return true;
        return recipeMatchesPlannerSlot(
          current.name,
          current.ingredientNames ?? [],
          candidate.meal_type,
          current.calories ?? null,
        );
      });

      if (swapIdx >= 0) {
        const temp = rows[i]!.recipe_id;
        rows[i] = { ...rows[i]!, recipe_id: rows[swapIdx]!.recipe_id };
        rows[swapIdx] = { ...rows[swapIdx]!, recipe_id: temp };
        continue;
      }

      const replacementPool =
        row.meal_type === "breakfast" ? breakfastPool : mainsPool.length ? mainsPool : pool;
      const replacement = replacementPool.find(
        (r) =>
          allowedRecipeIds.has(r.id) &&
          !used.has(r.id) &&
          recipeMatchesPlannerSlot(r.name, r.ingredientNames ?? [], row.meal_type, r.calories ?? null),
      );
      if (!replacement) continue;
      used.delete(row.recipe_id);
      rows[i] = { ...row, recipe_id: replacement.id };
      used.add(replacement.id);
    }
  }
}

/** Higher is better: overshooting calories/protein is penalised more on deficit goals. */
/** Distinct micro-rich foods for the user's priority nutrients — context for the Claude prompt. */
function microPriorityFoodList(priorities: MicroPriority[]): string[] {
  const foods = new Set<string>();
  for (const { key } of priorities) {
    for (const food of MICRO_RICH_FOODS[key] ?? []) {
      foods.add(food);
    }
  }
  return [...foods].slice(0, 12);
}

function scoreRecipeForDaySlot(
  r: RecipeWithNutrition,
  targetSlot: MealPlanInsertRow["meal_type"],
  targetCal: number,
  targetPro: number,
  microPriorities?: MicroPriority[],
  goalBias: CalorieGoalBias = "neutral",
): number {
  const cal = r.calories;
  const pro = r.protein;
  const calOver = Math.max(0, cal - targetCal);
  const calUnder = Math.max(0, targetCal - cal);
  const proOver = Math.max(0, pro - targetPro);
  const proUnder = Math.max(0, targetPro - pro);
  let baseScore: number;
  if (goalBias === "surplus") {
    baseScore = -(calOver * 2 + calUnder * 4 + proOver * 2 + proUnder * 2);
  } else if (goalBias === "deficit") {
    baseScore = -(calOver * 5 + calUnder + proOver * 3 + proUnder * 2.5);
  } else {
    baseScore = -(calOver * 3 + calUnder * 3 + proOver * 3 + proUnder * 2);
  }
  const types = classifyRecipeMealType(r.name, r.ingredientNames ?? []);
  const mult = getMealTypeMultiplier(types, targetSlot);
  baseScore *= mult;
  if (microPriorities?.length) {
    // Snacks lean into micro coverage; mains get half weight so macros stay dominant.
    const boost = scoreRecipeMicroBoost(r.ingredientNames ?? [], microPriorities);
    baseScore += targetSlot === "snack" ? boost : boost * 0.5;
  }
  if (cal > 0 && r.carbs_g != null && r.fat_g != null) {
    const carbKcal = r.carbs_g * 4;
    const fatKcal = r.fat_g * 9;
    const carbShare = carbKcal / cal;
    const fatShare = fatKcal / cal;
    if (targetSlot === "snack" && carbShare > 0.5) baseScore -= 6;
    if (fatShare > 0.45 && goalBias !== "surplus") baseScore -= 4;
  }
  return baseScore;
}

function pickRecipeWithBudgetAndUsage(
  pool: RecipeWithNutrition[],
  usedCount: Map<string, number>,
  usedOnDay: Set<string>,
  targetCal: number,
  targetPro: number,
  remainingCal: number,
  remainingPro: number,
  strictAffordableMisses: { count: number },
  logCtx: { day: number; meal_type: MealPlanInsertRow["meal_type"]; slot_index: number },
  snackMicroPriorities?: MicroPriority[],
  goalBias: CalorieGoalBias = "neutral",
): RecipeWithNutrition | null {
  const slotCalTarget = Math.max(targetCal, 0);
  const slotProTarget = Math.max(targetPro, 0);
  const effectiveCal = Math.min(slotCalTarget, Math.max(remainingCal, 0));
  const effectivePro = Math.min(slotProTarget, Math.max(remainingPro, 0));

  const available = pool.filter((r) => (usedCount.get(r.id) ?? 0) < 2 && !usedOnDay.has(r.id));
  const poolUse = available.length ? available : [];
  if (poolUse.length === 0) {
    console.warn(
      `[heuristic] day ${logCtx.day} ${logCtx.meal_type}#${logCtx.slot_index}: no recipe available (weekly cap or same-day duplicate rule)`,
    );
    return null;
  }
  const poolMainMeals = poolUse.filter((r) => !excludeFromMainMealSlots(r.name, r.ingredientNames ?? []));

  const headroomKcal = 100;

  let consideredPool: RecipeWithNutrition[];

  if (logCtx.meal_type === "breakfast") {
    const strict = poolUse.filter((r) => suitableForBreakfastSlot(r.name, r.ingredientNames ?? []));
    const relaxed = poolUse.filter((r) => suitableForBreakfastSlotRelaxed(r.name, r.ingredientNames ?? []));
    const light = poolUse.filter((r) => {
      const cal = r.calories ?? 0;
      const ings = r.ingredientNames ?? [];
      if (cal < 100 || cal > 720) return false;
      if (matchByIncludes(ings.map((x) => x.toLowerCase().trim()), AI_BREAKFAST_BLOCKED)) return false;
      const types = classifyRecipeMealType(r.name, ings);
      return !(types.includes("lunch") || types.includes("dinner"));
    });
    if (strict.length) {
      consideredPool = strict;
    } else if (relaxed.length) {
      consideredPool = relaxed;
      console.warn(
        `[heuristic] day ${logCtx.day} breakfast#${logCtx.slot_index}: relaxed breakfast matcher (${relaxed.length} in pool)`,
      );
    } else if (light.length) {
      consideredPool = light;
      console.warn(
        `[heuristic] day ${logCtx.day} breakfast#${logCtx.slot_index}: light-calorie fallback (${light.length} in pool)`,
      );
    } else {
      consideredPool = poolUse;
      console.warn(
        `[heuristic] day ${logCtx.day} breakfast#${logCtx.slot_index}: full pool fallback — add oats/eggs/yoghurt-style recipes for better matches`,
      );
    }
  } else if (logCtx.meal_type === "snack") {
    consideredPool = poolUse.filter(
      (r) =>
        !excludeFromMainMealSlots(r.name, r.ingredientNames ?? []) &&
        (r.calories ?? 999) <= SNACK_MAX_CALORIES &&
        (r.calories ?? 0) >= SNACK_MIN_CALORIES &&
        isRecipeAISnackAppropriate(r.calories, r.ingredientNames ?? []),
    );
    if (consideredPool.length === 0) {
      console.warn(
        `[heuristic] day ${logCtx.day} snack#${logCtx.slot_index}: no appropriate recipes found, leaving slot empty`,
      );
      return null;
    }
  } else {
    consideredPool = poolMainMeals.length ? poolMainMeals : poolUse;
  }
  const affordable = consideredPool.filter((r) => (r.calories ?? 0) <= Math.max(remainingCal - headroomKcal, 0));
  let pickPool: RecipeWithNutrition[];
  if (affordable.length > 0) {
    pickPool = affordable;
  } else {
    strictAffordableMisses.count += 1;
    pickPool = [...consideredPool]
      .sort((a, b) => (a.calories ?? 999) - (b.calories ?? 999))
      .slice(0, Math.min(logCtx.meal_type === "snack" ? 3 : 5, consideredPool.length));
    if (pickPool.length === 0) pickPool = [...consideredPool];
  }

  const scored = pickPool
    .map((r) => ({
      r,
      s: scoreRecipeForDaySlot(
        r,
        logCtx.meal_type,
        Math.max(effectiveCal, 1),
        Math.max(effectivePro, 0.5),
        snackMicroPriorities,
        goalBias,
      ),
    }))
    .sort((a, b) => b.s - a.s);

  const top = scored.slice(0, 3).map((x) => x.r);
  const picked = top[Math.floor(Math.random() * Math.max(top.length, 1))] ?? scored[0]?.r;
  if (!picked) return null;
  usedCount.set(picked.id, (usedCount.get(picked.id) ?? 0) + 1);

  console.warn(
    `[heuristic] day ${logCtx.day} ${logCtx.meal_type}#${logCtx.slot_index}: picked "${picked.name}" (${Math.round(picked.calories)} kcal, ${Math.round(picked.protein * 10) / 10}g P)`,
  );

  return picked;
}

function mealPlanSlotKey(day: number, mealType: string, slotIndex: number): string {
  return `${day}|${mealType}|${slotIndex}`;
}

const FRIENDLY_WEEK_PLAN_FAIL = FRIENDLY_BY_CONTEXT["week-plan"];

function userFacingPlanError(technical: string, logContext: string): string {
  if (
    technical.startsWith("No meals could") ||
    technical.startsWith("Only ") ||
    technical.startsWith("Add at least")
  ) {
    console.error(`[persistWeeklyMealPlanRows] ${logContext}:`, technical);
    return technical;
  }
  return toUserFacingError(technical, "week-plan", `persistWeeklyMealPlanRows:${logContext}`);
}

/** Drop duplicate slots if the generator assigned the same day+meal+slot twice. */
function dedupeMealPlanRowsBySlot(rows: MealPlanInsertRow[]): MealPlanInsertRow[] {
  const seen = new Set<string>();
  const out: MealPlanInsertRow[] = [];
  for (const row of rows) {
    const key = mealPlanSlotKey(row.day_of_week, row.meal_type, row.slot_index ?? 0);
    if (seen.has(key)) {
      console.warn(`[persistWeeklyMealPlanRows] dropping duplicate slot ${key}`);
      continue;
    }
    seen.add(key);
    out.push(row);
  }
  return out;
}

/** Legacy DB unique key is (meal_plan_id, day_of_week, meal_type) — only one snack per day. */
function collapseRowsForLegacyUniqueConstraint(rows: MealPlanInsertRow[]): MealPlanInsertRow[] {
  const out: MealPlanInsertRow[] = [];
  const seen = new Set<string>();
  const snackByDay = new Map<number, MealPlanInsertRow>();

  for (const row of rows) {
    if (row.meal_type === "snack") {
      const existing = snackByDay.get(row.day_of_week);
      if (!existing || (row.slot_index ?? 0) < (existing.slot_index ?? 0)) {
        snackByDay.set(row.day_of_week, row);
      }
      continue;
    }
    const key = `${row.day_of_week}|${row.meal_type}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }

  for (const snack of snackByDay.values()) {
    out.push(snack);
  }
  return out;
}

function toLegacyInsertRow(row: MealPlanInsertRow) {
  return {
    meal_plan_id: row.meal_plan_id,
    recipe_id: row.recipe_id,
    day_of_week: row.day_of_week,
    meal_type: row.meal_type,
    quick_add_name: row.quick_add_name,
    quick_add_calories: row.quick_add_calories,
  };
}

/** Remove meal-plan rows not present in the newly generated week. */
async function pruneStaleMealPlanEntries(
  supabase: SupabaseClient,
  mealPlanId: string,
  keepKeys: Set<string>,
  keyFn: (day: number, mealType: string, slotIndex?: number) => string,
): Promise<void> {
  const { data: existing } = await supabase
    .from("meal_plan_entries")
    .select("id, day_of_week, meal_type, slot_index")
    .eq("meal_plan_id", mealPlanId);

  const staleIds = (existing ?? [])
    .filter((entry) => !keepKeys.has(keyFn(entry.day_of_week, entry.meal_type, entry.slot_index ?? 0)))
    .map((entry) => entry.id);

  if (staleIds.length) {
    await supabase.from("meal_plan_entries").delete().in("id", staleIds);
  }
}

async function persistWeeklyMealPlanRows(
  supabase: SupabaseClient,
  mealPlanId: string,
  rows: MealPlanInsertRow[],
  selectedDays: number[],
): Promise<{ error: string } | { success: true }> {
  const deduped = dedupeMealPlanRowsBySlot(rows);

  if (!deduped.length) {
    return {
      error:
        "No meals could be planned from your recipe library. Add more varied recipes (breakfast, lighter lunches, and snack-sized options) and try again.",
    };
  }

  const daysWithMeals = new Set(deduped.map((r) => r.day_of_week));
  if (daysWithMeals.size < Math.min(7, selectedDays.length)) {
    return {
      error: `Only ${daysWithMeals.size} of ${selectedDays.length} days could be filled. Add more recipes that fit breakfast, lunch, and dinner slots.`,
    };
  }

  // Full-week replace: clear every slot for this plan (not only selectedDays subset).
  const { error: clearError } = await supabase
    .from("meal_plan_entries")
    .delete()
    .eq("meal_plan_id", mealPlanId);
  if (clearError) return { error: userFacingPlanError(clearError.message, "clear") };

  const { error: insertError } = await supabase.from("meal_plan_entries").insert(deduped);
  if (!insertError) return { success: true as const };

  console.warn("[persistWeeklyMealPlanRows] modern insert failed, trying legacy schema:", insertError.message);

  // Legacy DB: unique (meal_plan_id, day_of_week, meal_type) — max one snack/day; slot_index may be absent.
  await supabase.from("meal_plan_entries").delete().eq("meal_plan_id", mealPlanId);

  const legacyRows = collapseRowsForLegacyUniqueConstraint(deduped).map(toLegacyInsertRow);
  const { error: legacyUpsertError } = await supabase
    .from("meal_plan_entries")
    .upsert(legacyRows, { onConflict: "meal_plan_id,day_of_week,meal_type" });

  if (!legacyUpsertError) {
    const keepKeys = new Set(legacyRows.map((r) => `${r.day_of_week}|${r.meal_type}`));
    await pruneStaleMealPlanEntries(
      supabase,
      mealPlanId,
      keepKeys,
      (day, mealType) => `${day}|${mealType}`,
    );
    return { success: true as const };
  }

  return { error: userFacingPlanError(legacyUpsertError.message, "legacy upsert") };
}

function dietaryFlagsFromProfile(profile: Awaited<ReturnType<typeof getProfile>>, goals: GoalContext) {
  const prefs = parseDietaryPreferences(profile?.dietary_preferences);
  const fromPrefs = dietaryPreferencesToLegacyFlags(prefs);
  return {
    prefs,
    dietaryConstraintsLine: buildDietaryConstraints(prefs),
    flags: {
      isVegan: fromPrefs.followsVegan || goals.followsVegan,
      isVegetarian: fromPrefs.followsVegetarian || goals.followsVegetarian,
      isGlutenFree: fromPrefs.followsGlutenFree || goals.followsGlutenFree,
      isDairyFree: fromPrefs.dairyFree || goals.dairyFree === true,
    },
  };
}

export async function generateAIWeekPlan(input: GenerateAIWeekPlanInput) {
  try {
    return await generateAIWeekPlanInner(input);
  } catch (err) {
    console.error("[generateAIWeekPlan] unexpected failure:", err);
    return { error: FRIENDLY_WEEK_PLAN_FAIL };
  }
}

async function generateAIWeekPlanInner(input: GenerateAIWeekPlanInput) {
  const tier = await getUserTier();
  if (tier !== "pro") return { error: "Upgrade to Pro to generate AI weekly plans." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: plan } = await supabase
    .from("meal_plans")
    .select("id, week_start_date")
    .eq("id", input.mealPlanId)
    .eq("user_id", user.id)
    .single();
  if (!plan) return { error: "Meal plan not found" };

  const { data: recipes, error: recipesError } = await supabase
    .from("recipes")
    .select("id,name,fits_vegetarian,fits_vegan,fits_gluten_free")
    .eq("user_id", user.id)
    .is("archived_at", null)
    .order("name", { ascending: true });

  if (recipesError) return { error: userFacingPlanError(recipesError.message, "load recipes") };
  const allRecipes = (recipes ?? []) as RecipeRow[];
  if (!allRecipes.length) {
    return { error: "Add at least one recipe to your library before generating a plan." };
  }

  const nutritionMap = await fetchRecipeNutritionMap(
    supabase,
    allRecipes.map((r) => r.id),
    { fillMissing: false },
  );
  const { data: ingredientRows } = await supabase
    .from("recipe_ingredients")
    .select("recipe_id,name")
    .in("recipe_id", allRecipes.map((r) => r.id));
  const ingredientNamesByRecipe = new Map<string, string[]>();
  for (const row of ingredientRows ?? []) {
    const rid = String(row.recipe_id ?? "");
    if (!rid) continue;
    const cur = ingredientNamesByRecipe.get(rid) ?? [];
    cur.push(String(row.name ?? ""));
    ingredientNamesByRecipe.set(rid, cur);
  }
  const withNutrition = allRecipes
    .map((r) => {
      const n = nutritionMap.get(r.id);
      return {
        ...r,
        calories: n?.calories ?? 0,
        protein: n?.protein_g ?? 0,
        carbs_g: n?.carbs_g ?? null,
        fat_g: n?.fat_g ?? null,
        ingredientNames: ingredientNamesByRecipe.get(r.id) ?? [],
      };
    })
    .sort((a, b) => (b.protein - a.protein) || (b.calories - a.calories));

  const snackCountPerDay = (input.goals.calorieTarget ?? 0) >= 2200 ? 2 : 1;
  const selectedDaysFullWeek = [0, 1, 2, 3, 4, 5, 6];
  const profile = await getProfile();
  const dailyCalorieTarget = Math.round(
    Number(input.goals.calorieTarget ?? getDailyCalorieTarget(profile) ?? 2000),
  );
  const dailyProteinTarget = Math.round(
    Number(input.goals.proteinTarget ?? getDailyProteinTarget(profile) ?? 120),
  );
  const goalBias = calorieGoalBiasFromProfile(profile);

  let snackMicroPriorities: MicroPriority[] = DEFAULT_SNACK_MICRO_PRIORITIES;
  const sex = profile?.sex === "male" || profile?.sex === "female" ? (profile.sex as Sex) : null;
  if (sex && plan.week_start_date) {
    const microAnalysis = await getWeeklyMicroAnalysis(input.mealPlanId, plan.week_start_date, sex);
    if (microAnalysis) {
      snackMicroPriorities = microPrioritiesFromDeficiencies(microAnalysis.must_hit);
      const lowKeys = microAnalysis.must_hit.filter((n) => n.traffic === "red" || n.traffic === "amber").map((n) => n.key);
      if (lowKeys.length) {
        console.warn("[heuristic] snack micro priorities from current plan:", lowKeys.join(", "));
      }
    }
  }

  const formattedRecipes = withNutrition.map((r) => ({
    id: r.id,
    name: r.name,
    calories: r.calories,
    protein_g: r.protein,
    carbs_g: r.carbs_g,
    fat_g: r.fat_g,
    ingredients: (r.ingredientNames ?? []).slice(0, 8),
  }));
  const microPriorityFoods = microPriorityFoodList(snackMicroPriorities);

  const allowedIds = new Set(allRecipes.map((r) => r.id));
  const dietContext = dietaryFlagsFromProfile(profile, input.goals);
  let claudeSucceeded = false;
  let claudeNotes: string | undefined;
  let heuristicWarning: string | undefined;
  let snackLibraryNotice: string | undefined;
  let claudeApplyError: string | undefined;

  if (isAnthropicMealAiEnabled()) {
    try {
      const aiPlan = await generateMealPlan({
        recipes: formattedRecipes,
        dailyCalorieTarget,
        dailyProteinTarget,
        daysToFill: 7,
        mealTypes: ["breakfast", "lunch", "dinner", "snack"],
        snackCountPerDay,
        dietaryFlags: dietContext.flags,
        dietaryConstraintsLine: dietContext.dietaryConstraintsLine || undefined,
        allergies: input.goals.allergens ?? [],
        microPriorityFoods,
      });
      if (aiPlan?.plan?.length) {
        const applied = await replacePlanDaysWithClaudePlan(
          supabase,
          user.id,
          profile,
          input.mealPlanId,
          selectedDaysFullWeek,
          aiPlan,
          snackCountPerDay,
          allowedIds,
          withNutrition as RecipeWithNutrition[],
          dailyCalorieTarget,
          dailyProteinTarget,
          goalBias,
        );
        if ("success" in applied && applied.success) {
          claudeSucceeded = true;
          claudeNotes = aiPlan.notes;
          heuristicWarning = applied.warning;
          snackLibraryNotice = applied.snackLibraryNotice;
        } else if ("error" in applied) {
          claudeApplyError = applied.error;
          console.warn("[generateAIWeekPlan] Claude plan not applied:", applied.error);
        }
      }
    } catch (err) {
      console.warn("[generateAIWeekPlan] Claude planning failed, using heuristic:", err);
    }
  }

  if (!claudeSucceeded) {
    const pool = withNutrition as RecipeWithNutrition[];
    const usedCount = new Map<string, number>();
    const rows: MealPlanInsertRow[] = [];
    const calById = new Map(pool.map((r) => [r.id, r.calories]));
    const proById = new Map(pool.map((r) => [r.id, r.protein]));
    const slotPlan = plannerSlotSpecs(snackCountPerDay);
    const strictAffordableMisses = { count: 0 };
    const bandMax = dailyCalorieBand(dailyCalorieTarget).max;

    console.log("=== HEURISTIC RECIPE LIBRARY ===");
    console.log(
      pool.map((r) => ({
        name: r.name,
        kcal: Math.round(r.calories),
        protein_g: Math.round(r.protein * 10) / 10,
      })),
    );
    console.log("=== DAILY TARGETS (heuristic) ===", {
      kcal: dailyCalorieTarget,
      protein_g: dailyProteinTarget,
    });

    for (let day = 0; day < 7; day += 1) {
      let remainingCal = bandMax;
      let remainingPro = dailyProteinTarget;
      const usedOnDay = new Set<string>();

      for (const spec of slotPlan) {
        const slotCalTarget = dailyCalorieTarget * spec.calFrac;
        const slotProTarget = dailyProteinTarget * spec.calFrac;
        const picked = pickRecipeWithBudgetAndUsage(
          pool,
          usedCount,
          usedOnDay,
          slotCalTarget,
          slotProTarget,
          remainingCal,
          remainingPro,
          strictAffordableMisses,
          { day, meal_type: spec.meal_type, slot_index: spec.slot_index },
          snackMicroPriorities,
          goalBias,
        );
        if (!picked) {
          continue;
        }
        usedOnDay.add(picked.id);
        remainingCal -= picked.calories;
        remainingPro -= picked.protein;
        console.warn(
          `[heuristic] day ${day} after ${spec.meal_type}#${spec.slot_index}: remaining ~${Math.round(remainingCal)} kcal, ~${Math.round(remainingPro * 10) / 10}g P`,
        );
        rows.push({
          meal_plan_id: input.mealPlanId,
          recipe_id: picked.id,
          day_of_week: day,
          meal_type: spec.meal_type,
          slot_index: spec.slot_index,
          quick_add_name: null,
          quick_add_calories: null,
        });
      }

      const dayTot = dayCaloriesFromRows(rows as PlanCalorieRow[], day, calById);
      const dayProt = dayProteinFromRows(rows as PlanCalorieRow[], day, proById);
      console.warn(
        `[heuristic] day ${day}: main meals ~${Math.round(dayTot)} kcal (target ${dailyCalorieTarget}), ` +
          `~${Math.round(dayProt * 10) / 10}g P (target ${dailyProteinTarget}g)`,
      );
    }
    enforceAiMealSlotSeparation(rows, pool, selectedDaysFullWeek, allowedIds);

    const tuneDay = (day: number) =>
      tuneDayTowardCalorieBand({
        rows: rows as PlanCalorieRow[],
        day,
        pool,
        calById,
        proById,
        mealPlanId: input.mealPlanId,
        dailyTarget: dailyCalorieTarget,
        dailyProteinTarget,
        snackCountPerDay,
        allowedRecipeIds: allowedIds,
        snackMicroPriorities,
        goalBias,
        trimSnacksWhileOver: (r, d, maxRatio) =>
          trimSnacksWhileDayCaloriesExceedRatio(r as MealPlanInsertRow[], d, dailyCalorieTarget, calById, maxRatio),
        trimSnacksIfOverMacroCaps: (r, d) =>
          trimSnacksIfDayOverMacroCaps(
            r as MealPlanInsertRow[],
            d,
            dailyCalorieTarget,
            dailyProteinTarget,
            calById,
            proById,
          ),
      });

    for (let day = 0; day < 7; day += 1) {
      tuneDay(day);
    }
    tuneWeekAvgTowardBand(
      rows as PlanCalorieRow[],
      selectedDaysFullWeek,
      pool,
      calById,
      input.mealPlanId,
      dailyCalorieTarget,
      snackCountPerDay,
      allowedIds,
      goalBias,
      tuneDay,
    );

    await autoFillSnackRecipesForPlan({
      supabase,
      userId: user.id,
      profile,
      dailyTarget: dailyCalorieTarget,
      days: selectedDaysFullWeek,
      rows: rows as PlanCalorieRow[],
      pool,
      calById,
      allowedRecipeIds: allowedIds,
      tuneDay,
      microPriorities: snackMicroPriorities,
      snackCountPerDay,
    });
    ensureDailySnackCoverage({
      rows: rows as PlanCalorieRow[],
      days: selectedDaysFullWeek,
      pool,
      calById,
      proById,
      mealPlanId: input.mealPlanId,
      dailyTarget: dailyCalorieTarget,
      dailyProteinTarget,
      snackCountPerDay,
      allowedRecipeIds: allowedIds,
      snackMicroPriorities,
      tuneDay,
    });
    ensureDailyProteinCoverage({
      rows: rows as PlanCalorieRow[],
      days: selectedDaysFullWeek,
      pool,
      calById,
      proById,
      mealPlanId: input.mealPlanId,
      dailyTarget: dailyCalorieTarget,
      dailyProteinTarget,
      snackCountPerDay,
      allowedRecipeIds: allowedIds,
      snackMicroPriorities,
    });
    tuneWeekAvgTowardBand(
      rows as PlanCalorieRow[],
      selectedDaysFullWeek,
      pool,
      calById,
      input.mealPlanId,
      dailyCalorieTarget,
      snackCountPerDay,
      allowedIds,
      goalBias,
      tuneDay,
      snackMicroPriorities,
    );
    enforceDailyCalorieCeiling({
      rows: rows as PlanCalorieRow[],
      days: selectedDaysFullWeek,
      pool,
      calById,
      dailyTarget: dailyCalorieTarget,
      allowedRecipeIds: allowedIds,
      tuneDay,
    });

    const mealOrder: Record<string, number> = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 };
    const nameById = new Map(pool.map((r) => [r.id, r.name]));

    console.log("=== DAY PLAN DEBUG (heuristic) ===");
    for (let d = 0; d < 7; d += 1) {
      const dayRows = rows
        .filter((r) => r.day_of_week === d && r.recipe_id)
        .sort((a, b) => {
          const ma = mealOrder[a.meal_type] ?? 9;
          const mb = mealOrder[b.meal_type] ?? 9;
          if (ma !== mb) return ma - mb;
          return (a.slot_index ?? 0) - (b.slot_index ?? 0);
        });
      const slotsLog = dayRows
        .map((r) => {
          const k = calById.get(r.recipe_id!) ?? 0;
          const nm = nameById.get(r.recipe_id!) ?? r.recipe_id;
          return `${r.meal_type}#${r.slot_index}: ${nm} (${Math.round(k)} kcal)`;
        })
        .join(" | ");
      const total = dayCaloriesFromRows(rows as PlanCalorieRow[], d, calById);
      const prot = dayProteinFromRows(rows as PlanCalorieRow[], d, proById);
      const delta = Math.round(total - dailyCalorieTarget);
      console.log(`Day ${d} (final): ${slotsLog}`);
      console.log(
        `Day ${d}: ${Math.round(total)} kcal (target: ${dailyCalorieTarget}, delta: ${delta}), ` +
          `${Math.round(prot * 10) / 10}g P (target: ${dailyProteinTarget}g)`,
      );
    }

    const minPoolCal = Math.min(...pool.map((r) => r.calories ?? 0));
    heuristicWarning = buildPlanCalorieAccuracyWarning(
      selectedDaysFullWeek,
      rows as PlanCalorieRow[],
      calById,
      dailyCalorieTarget,
    );
    snackLibraryNotice = buildSnackLibraryNotice(
      pool,
      selectedDaysFullWeek,
      rows as PlanCalorieRow[],
      calById,
      dailyCalorieTarget,
    );
    if (
      strictAffordableMisses.count >= 5 ||
      (minPoolCal > dailyCalorieTarget * 0.35 &&
        selectedDaysFullWeek.some(
          (d) => dayCaloriesFromRows(rows as PlanCalorieRow[], d, calById) > dailyCalorieTarget * 1.1,
        ))
    ) {
      const extra =
        "Your library may need more lighter meals for days that run high — try salads, soups, or smaller portions.";
      heuristicWarning = heuristicWarning ? `${heuristicWarning} ${extra}` : extra;
    }

    const persisted = await persistWeeklyMealPlanRows(
      supabase,
      input.mealPlanId,
      rows,
      selectedDaysFullWeek,
    );
    if ("error" in persisted) {
      if (claudeApplyError) {
        console.warn("[generateAIWeekPlan] Claude apply error (also failed heuristic):", claudeApplyError);
      }
      return { error: persisted.error };
    }
  }

  revalidatePath("/planner");
  return {
    success: true as const,
    snackCountPerDay,
    recipePool: withNutrition.length,
    planSource: claudeSucceeded ? ("claude" as const) : ("heuristic" as const),
    notes: claudeNotes,
    heuristicWarning,
    snackLibraryNotice,
  };
}
