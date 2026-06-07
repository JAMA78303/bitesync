"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUserTier } from "@/lib/subscription";
import { estimateStoreItems, summarizeStoreTotals } from "@/lib/pricing/compare";
import type {
  BasketIngredient,
  GoalContext,
  StoreItemEstimate,
  StoreTotal,
  SubstitutionSuggestion,
} from "@/lib/pricing/types";
import { mealPlanRecipeServings, mergeIngredients, mergeScaledRecipeIngredients } from "@/lib/utils/merge";
import { applyPantryToShoppingList } from "@/lib/grocery/applyPantryToShoppingList";
import { replaceGroceryItemsWithMerged } from "@/lib/supabase/grocery";
import { getPantryItems, pantryRowToAvailable } from "@/lib/supabase/pantry";
import { fetchRecipeNutritionMap } from "@/lib/supabase/recipe-nutrition-query";
import { getProfile } from "@/lib/supabase/profile";
import { getDailyCalorieTarget, getDailyProteinTarget } from "@/lib/utils/nutrition-targets";
import {
  generateMealPlan,
  generateSubstitutions,
  type ClaudeMealPlanResult,
} from "@/lib/ai/client";
import { buildDietaryConstraints, dietaryPreferencesToLegacyFlags, parseDietaryPreferences } from "@/lib/dietary/constraints";
import type { SupabaseClient } from "@supabase/supabase-js";
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

type GenerateAIBasketInput = {
  mealPlanId: string;
  weekStartDate: string;
  goals: GoalContext;
  /** Subset of tesco | asda | aldi for £ comparison (omit stores you do not shop at). */
  preferredStores?: string[];
  /** Optional subset of planner days (0=Mon..6=Sun). Defaults to full week. */
  selectedDays?: number[];
};

const ALLOWED_PRICE_STORES = new Set(["tesco", "asda", "aldi"]);

/** Off by default: set ENABLE_ANTHROPIC_MEAL_PLANNING=true and ANTHROPIC_API_KEY to use Claude (billable). */
function isAnthropicMealAiEnabled(): boolean {
  const v = process.env.ENABLE_ANTHROPIC_MEAL_PLANNING;
  return Boolean(process.env.ANTHROPIC_API_KEY) && (v === "true" || v === "1");
}

function normalizePreferredStores(preferred?: string[]): string[] {
  const raw = (preferred ?? ["tesco", "asda", "aldi"])
    .map((s) => String(s).toLowerCase().trim())
    .filter((s) => ALLOWED_PRICE_STORES.has(s));
  return raw.length ? [...new Set(raw)] : ["tesco", "asda", "aldi"];
}

function normalizeSelectedDays(selectedDays?: number[]): number[] {
  const raw = (selectedDays ?? [0, 1, 2, 3, 4, 5, 6])
    .map((d) => Number(d))
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
  const unique = [...new Set(raw)].sort((a, b) => a - b);
  return unique.length ? unique : [0, 1, 2, 3, 4, 5, 6];
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
  mealPlanId: string,
  selectedDays: number[],
  aiPlan: ClaudeMealPlanResult,
  snackCountPerDay: number,
  allowedRecipeIds: Set<string>,
  pool: RecipeWithNutrition[],
  dailyCalorieTarget: number,
  dailyProteinTarget: number,
): Promise<{ error: string } | { success: true; warning?: string }> {
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

  for (const day of selectedDays) {
    trimSnacksWhileDayCaloriesExceedRatio(rows, day, dailyCalorieTarget, calById, 1.1);
    if (dayCaloriesTotal(rows, day, calById) > dailyCalorieTarget * 1.15) {
      replaceDinnerWithLowestCalRecipe(rows, day, pool);
    }
    trimSnacksIfDayOverMacroCaps(
      rows,
      day,
      dailyCalorieTarget,
      dailyProteinTarget,
      calById,
      proById,
    );
  }

  let warning: string | undefined;
  const minPoolCal = Math.min(...pool.map((r) => r.calories ?? 0));
  let worstDayCal = 0;
  let minDayCal = Infinity;
  for (const d of selectedDays) {
    const dayCal = dayCaloriesTotal(rows, d, calById);
    worstDayCal = Math.max(worstDayCal, dayCal);
    minDayCal = Math.min(minDayCal, dayCal);
  }
  const worstRatio = dailyCalorieTarget > 0 ? worstDayCal / dailyCalorieTarget : 1;
  const minRatio =
    dailyCalorieTarget > 0 && minDayCal !== Infinity ? minDayCal / dailyCalorieTarget : 1;
  if (
    worstRatio > 1.2 ||
    minRatio < 0.8 ||
    (minPoolCal > dailyCalorieTarget * 0.35 && worstRatio > 1.1)
  ) {
    warning =
      `Your recipe library may not have enough lighter meals to land near your ${dailyCalorieTarget} kcal/day goal ` +
      `(worst day ~${Math.round(worstRatio * 100)}% of target). Try adding salads, soups, or smaller portions.`;
  }

  const { error: delError } = await supabase
    .from("meal_plan_entries")
    .delete()
    .eq("meal_plan_id", mealPlanId)
    .in("day_of_week", selectedDays);
  if (delError) return { error: delError.message };

  const { error: insertError } = await supabase.from("meal_plan_entries").insert(rows);
  if (!insertError) return { success: true as const, warning };

  if (insertError.message.toLowerCase().includes("slot_index")) {
    const legacyRows = rows
      .filter((r) => r.slot_index === 0)
      .map((r) => ({
        meal_plan_id: r.meal_plan_id,
        recipe_id: r.recipe_id,
        day_of_week: r.day_of_week,
        meal_type: r.meal_type,
        quick_add_name: r.quick_add_name,
        quick_add_calories: r.quick_add_calories,
      }));
    const { error: legacyInsertError } = await supabase.from("meal_plan_entries").insert(legacyRows);
    if (legacyInsertError) return { error: legacyInsertError.message };
    return { success: true as const, warning };
  }
  return { error: insertError.message };
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

/** Per-slot share of daily calories (sums to 1 with snacks split). */
function daySlotSpecs(snackCountPerDay: number): Array<{
  meal_type: MealPlanInsertRow["meal_type"];
  slot_index: number;
  calFrac: number;
}> {
  const n = Math.max(1, Math.min(2, snackCountPerDay));
  const snackEach = 0.07 / n;
  const slots: Array<{ meal_type: MealPlanInsertRow["meal_type"]; slot_index: number; calFrac: number }> = [
    { meal_type: "breakfast", slot_index: 0, calFrac: 0.25 },
    { meal_type: "lunch", slot_index: 0, calFrac: 0.33 },
    { meal_type: "dinner", slot_index: 0, calFrac: 0.35 },
  ];
  for (let s = 0; s < n; s += 1) {
    slots.push({ meal_type: "snack", slot_index: s, calFrac: snackEach });
  }
  return slots;
}

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

/** Higher is better: overshooting calories/protein is penalised much more than undershooting. */
function scoreRecipeForDaySlot(
  r: RecipeWithNutrition,
  targetSlot: MealPlanInsertRow["meal_type"],
  targetCal: number,
  targetPro: number,
): number {
  const cal = r.calories;
  const pro = r.protein;
  const calOver = Math.max(0, cal - targetCal);
  const calUnder = Math.max(0, targetCal - cal);
  const proOver = Math.max(0, pro - targetPro);
  const proUnder = Math.max(0, targetPro - pro);
  const baseScore = -(calOver * 5 + calUnder + proOver * 3 + proUnder);
  const types = classifyRecipeMealType(r.name, r.ingredientNames ?? []);
  const mult = getMealTypeMultiplier(types, targetSlot);
  return baseScore * mult;
}

function pickRecipeWithBudgetAndUsage(
  pool: RecipeWithNutrition[],
  usedCount: Map<string, number>,
  targetCal: number,
  targetPro: number,
  remainingCal: number,
  remainingPro: number,
  strictAffordableMisses: { count: number },
  logCtx: { day: number; meal_type: MealPlanInsertRow["meal_type"]; slot_index: number },
): RecipeWithNutrition | null {
  const slotCalTarget = Math.max(targetCal, 0);
  const slotProTarget = Math.max(targetPro, 0);
  const effectiveCal = Math.min(slotCalTarget, Math.max(remainingCal, 0));
  const effectivePro = Math.min(slotProTarget, Math.max(remainingPro, 0));

  const available = pool.filter((r) => (usedCount.get(r.id) ?? 0) < 2);
  const poolUse = available.length ? available : pool;
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
      ),
    }))
    .sort((a, b) => b.s - a.s);

  const top = scored.slice(0, 3).map((x) => x.r);
  const picked = top[Math.floor(Math.random() * Math.max(top.length, 1))] ?? scored[0]!.r;
  usedCount.set(picked.id, (usedCount.get(picked.id) ?? 0) + 1);

  console.warn(
    `[heuristic] day ${logCtx.day} ${logCtx.meal_type}#${logCtx.slot_index}: picked "${picked.name}" (${Math.round(picked.calories)} kcal, ${Math.round(picked.protein * 10) / 10}g P)`,
  );

  return picked;
}

function dayCaloriesTotal(
  rows: MealPlanInsertRow[],
  day: number,
  calById: Map<string, number>,
): number {
  return rows
    .filter((r) => r.day_of_week === day && r.recipe_id)
    .reduce((s, r) => s + (calById.get(r.recipe_id!) ?? 0), 0);
}

function dayProteinTotal(
  rows: MealPlanInsertRow[],
  day: number,
  proById: Map<string, number>,
): number {
  return rows
    .filter((r) => r.day_of_week === day && r.recipe_id)
    .reduce((s, r) => s + (proById.get(r.recipe_id!) ?? 0), 0);
}

/** Remove snacks (highest slot_index first) while day calories exceed ratio × daily target. */
function trimSnacksWhileDayCaloriesExceedRatio(
  rows: MealPlanInsertRow[],
  day: number,
  dailyK: number,
  calById: Map<string, number>,
  maxRatio: number,
): void {
  const limit = dailyK * maxRatio;
  for (;;) {
    const cal = dayCaloriesTotal(rows, day, calById);
    if (cal <= limit) break;
    let idx = -1;
    let bestSlot = -1;
    for (let i = 0; i < rows.length; i += 1) {
      const r = rows[i]!;
      if (r.day_of_week !== day || r.meal_type !== "snack") continue;
      const si = r.slot_index ?? 0;
      if (si >= bestSlot) {
        bestSlot = si;
        idx = i;
      }
    }
    if (idx < 0) break;
    rows.splice(idx, 1);
    console.warn(
      `[heuristic] day ${day}: snack removed (cal ${Math.round(cal)} > ${Math.round(limit)} = ${Math.round(maxRatio * 100)}% target)`,
    );
  }
}

function replaceDinnerWithLowestCalRecipe(
  rows: MealPlanInsertRow[],
  day: number,
  pool: RecipeWithNutrition[],
): void {
  const ix = rows.findIndex((r) => r.day_of_week === day && r.meal_type === "dinner");
  if (ix < 0) return;
  const mainsOk = pool.filter((r) => !excludeFromMainMealSlots(r.name, r.ingredientNames ?? []));
  const sorted = [...(mainsOk.length ? mainsOk : pool)].sort((a, b) => a.calories - b.calories);
  const best = sorted[0];
  if (!best) return;
  const prevId = rows[ix]!.recipe_id;
  if (prevId === best.id) return;
  rows[ix] = { ...rows[ix]!, recipe_id: best.id };
  console.warn(
    `[heuristic] day ${day}: dinner swapped to lowest-kcal pool recipe "${best.name}" (${Math.round(best.calories)} kcal)`,
  );
}

/**
 * Drop snack slots (highest slot_index first) while the day exceeds
 * maxRatio of daily calories OR daily protein (same cap as kcal).
 */
function trimSnacksIfDayOverMacroCaps(
  rows: MealPlanInsertRow[],
  day: number,
  dailyK: number,
  dailyP: number,
  calById: Map<string, number>,
  proById: Map<string, number>,
  maxRatio = 1.2,
): void {
  const calLimit = dailyK * maxRatio;
  const proLimit = dailyP * maxRatio;

  for (;;) {
    const cal = dayCaloriesTotal(rows, day, calById);
    const pro = dayProteinTotal(rows, day, proById);
    if (cal <= calLimit && pro <= proLimit) break;

    let idx = -1;
    let bestSlot = -1;
    for (let i = 0; i < rows.length; i += 1) {
      const r = rows[i]!;
      if (r.day_of_week !== day || r.meal_type !== "snack") continue;
      const si = r.slot_index ?? 0;
      if (si >= bestSlot) {
        bestSlot = si;
        idx = i;
      }
    }
    if (idx < 0) break;

    const calBefore = cal;
    const proBefore = pro;
    rows.splice(idx, 1);
    const calAfter = dayCaloriesTotal(rows, day, calById);
    const proAfter = dayProteinTotal(rows, day, proById);
    const overBits = [calBefore > calLimit ? "cal" : null, proBefore > proLimit ? "protein" : null].filter(Boolean);
    console.warn(
      `[heuristic] day ${day}: trim snack (${overBits.join("+")} over cap) — kcal ${Math.round(calBefore)}→${Math.round(calAfter)} (cap ~${Math.round(calLimit)}), ` +
        `protein ${Math.round(proBefore * 10) / 10}g→${Math.round(proAfter * 10) / 10}g (cap ~${Math.round(proLimit * 10) / 10}g)`,
    );
  }

  const finalCal = dayCaloriesTotal(rows, day, calById);
  const finalPro = dayProteinTotal(rows, day, proById);
  if (finalCal > dailyK + 300) {
    console.warn(
      `[heuristic] day ${day}: ${Math.round(finalCal)} kcal vs target ${dailyK} (still >300 kcal over) after snack trim`,
    );
  }
  if (finalPro > dailyP + 25) {
    console.warn(
      `[heuristic] day ${day}: ${Math.round(finalPro * 10) / 10}g protein vs target ${dailyP}g (still >25g over) after snack trim`,
    );
  }
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
  const tier = await getUserTier();
  if (tier !== "pro") return { error: "Upgrade to Pro to generate AI weekly plans." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: plan } = await supabase
    .from("meal_plans")
    .select("id")
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

  if (recipesError) return { error: recipesError.message };
  const allRecipes = (recipes ?? []) as RecipeRow[];
  if (!allRecipes.length) {
    return { error: "Add at least one recipe to your library before generating a plan." };
  }

  const nutritionMap = await fetchRecipeNutritionMap(
    supabase,
    allRecipes.map((r) => r.id),
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

  const formattedRecipes = withNutrition.map((r) => ({
    id: r.id,
    name: r.name,
    calories: r.calories,
    protein_g: r.protein,
    carbs_g: r.carbs_g,
    fat_g: r.fat_g,
  }));

  const allowedIds = new Set(allRecipes.map((r) => r.id));
  const dietContext = dietaryFlagsFromProfile(profile, input.goals);
  let claudeSucceeded = false;
  let claudeNotes: string | undefined;
  let heuristicWarning: string | undefined;

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
      });
      if (aiPlan?.plan?.length) {
        const applied = await replacePlanDaysWithClaudePlan(
          supabase,
          input.mealPlanId,
          selectedDaysFullWeek,
          aiPlan,
          snackCountPerDay,
          allowedIds,
          withNutrition as RecipeWithNutrition[],
          dailyCalorieTarget,
          dailyProteinTarget,
        );
        if ("success" in applied && applied.success) {
          claudeSucceeded = true;
          claudeNotes = aiPlan.notes;
          heuristicWarning = applied.warning;
        }
      }
    } catch {
      /* heuristic fallback below */
    }
  }

  if (!claudeSucceeded) {
    const pool = withNutrition as RecipeWithNutrition[];
    const usedCount = new Map<string, number>();
    const rows: MealPlanInsertRow[] = [];
    const calById = new Map(pool.map((r) => [r.id, r.calories]));
    const proById = new Map(pool.map((r) => [r.id, r.protein]));
    const slotPlan = daySlotSpecs(snackCountPerDay);
    const strictAffordableMisses = { count: 0 };

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
      let remainingCal = dailyCalorieTarget;
      let remainingPro = dailyProteinTarget;

      for (const spec of slotPlan) {
        if (spec.meal_type === "snack") {
          const consumed = dailyCalorieTarget - remainingCal;
          if (
            remainingCal <= 150 ||
            remainingCal < dailyCalorieTarget * 0.05 ||
            consumed > dailyCalorieTarget * 0.95
          ) {
            console.warn(
              `[heuristic] day ${day} snack#${spec.slot_index}: skipped (remaining ~${Math.round(remainingCal)} kcal, consumed ~${Math.round(consumed)} kcal)`,
            );
            continue;
          }
        }

        const slotCalTarget = dailyCalorieTarget * spec.calFrac;
        const slotProTarget = dailyProteinTarget * spec.calFrac;
        const picked = pickRecipeWithBudgetAndUsage(
          pool,
          usedCount,
          slotCalTarget,
          slotProTarget,
          remainingCal,
          remainingPro,
          strictAffordableMisses,
          { day, meal_type: spec.meal_type, slot_index: spec.slot_index },
        );
        if (!picked) {
          continue;
        }
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

      const dayTot = dayCaloriesTotal(rows, day, calById);
      const dayProt = dayProteinTotal(rows, day, proById);
      console.warn(
        `[heuristic] day ${day}: planned ~${Math.round(dayTot)} kcal (target ${dailyCalorieTarget}), ` +
          `~${Math.round(dayProt * 10) / 10}g P (target ${dailyProteinTarget}g)`,
      );
      trimSnacksWhileDayCaloriesExceedRatio(
        rows,
        day,
        dailyCalorieTarget,
        calById,
        1.1,
      );
      if (dayCaloriesTotal(rows, day, calById) > dailyCalorieTarget * 1.15) {
        replaceDinnerWithLowestCalRecipe(rows, day, pool);
      }
      trimSnacksIfDayOverMacroCaps(
        rows,
        day,
        dailyCalorieTarget,
        dailyProteinTarget,
        calById,
        proById,
      );
    }
    enforceAiMealSlotSeparation(rows, pool, selectedDaysFullWeek, allowedIds);

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
      const total = dayCaloriesTotal(rows, d, calById);
      const prot = dayProteinTotal(rows, d, proById);
      const delta = Math.round(total - dailyCalorieTarget);
      console.log(`Day ${d} (final): ${slotsLog}`);
      console.log(
        `Day ${d}: ${Math.round(total)} kcal (target: ${dailyCalorieTarget}, delta: ${delta}), ` +
          `${Math.round(prot * 10) / 10}g P (target: ${dailyProteinTarget}g)`,
      );
    }

    const minPoolCal = Math.min(...pool.map((r) => r.calories ?? 0));
    let worstDayCal = 0;
    for (let d = 0; d < 7; d += 1) {
      worstDayCal = Math.max(worstDayCal, dayCaloriesTotal(rows, d, calById));
    }
    const worstRatio = dailyCalorieTarget > 0 ? worstDayCal / dailyCalorieTarget : 1;
    let minDayCal = Infinity;
    for (let d = 0; d < 7; d += 1) {
      minDayCal = Math.min(minDayCal, dayCaloriesTotal(rows, d, calById));
    }
    const minRatio =
      dailyCalorieTarget > 0 && minDayCal !== Infinity ? minDayCal / dailyCalorieTarget : 1;

    if (
      worstRatio > 1.2 ||
      minRatio < 0.8 ||
      strictAffordableMisses.count >= 5 ||
      (minPoolCal > dailyCalorieTarget * 0.35 && worstRatio > 1.1)
    ) {
      heuristicWarning =
        `Your recipe library may not have enough lighter meals to land near your ${dailyCalorieTarget} kcal/day goal ` +
        `(worst day ~${Math.round(worstRatio * 100)}% of target). Try adding salads, soups, or smaller portions.`;
    }

    const { error: clearError } = await supabase
      .from("meal_plan_entries")
      .delete()
      .eq("meal_plan_id", input.mealPlanId);
    if (clearError) return { error: clearError.message };

    const { error: insertError } = await supabase.from("meal_plan_entries").insert(rows);
    if (insertError) {
      if (insertError.message.toLowerCase().includes("slot_index")) {
        const legacyRows = rows
          .filter((r) => r.slot_index === 0)
          .map((r) => ({
            meal_plan_id: r.meal_plan_id,
            recipe_id: r.recipe_id,
            day_of_week: r.day_of_week,
            meal_type: r.meal_type,
            quick_add_name: r.quick_add_name,
            quick_add_calories: r.quick_add_calories,
          }));
        const { error: legacyInsertError } = await supabase.from("meal_plan_entries").insert(legacyRows);
        if (legacyInsertError) return { error: legacyInsertError.message };
      } else {
        return { error: insertError.message };
      }
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
  };
}

async function deriveBasketIngredientsFromMealPlan(
  mealPlanId: string,
  selectedDays?: number[],
): Promise<BasketIngredient[]> {
  const supabase = await createClient();
  let query = supabase
    .from("meal_plan_entries")
    .select("recipe_id")
    .eq("meal_plan_id", mealPlanId)
    .not("recipe_id", "is", null);
  if (selectedDays?.length) {
    query = query.in("day_of_week", selectedDays);
  }
  const { data: entries, error: entriesError } = await query;

  if (entriesError) throw new Error(entriesError.message);

  const servingsByRecipe = mealPlanRecipeServings(entries ?? []);
  const recipeIds = Array.from(servingsByRecipe.keys());
  if (!recipeIds.length) return [];

  const { data: ingredients, error: ingredientError } = await supabase
    .from("recipe_ingredients")
    .select("recipe_id, name, quantity, unit")
    .in("recipe_id", recipeIds);

  if (ingredientError) throw new Error(ingredientError.message);
  if (!ingredients?.length) return [];

  return mergeScaledRecipeIngredients(
    ingredients as { recipe_id: string; name: string; quantity: number; unit: string }[],
    servingsByRecipe,
  ) as BasketIngredient[];
}

export type LivePriceMatchSummary = {
  ingredientLineCount: number;
  pricedLineCount: number;
  unmatchedSample: string[];
  catalogSize: number;
  catalogLoadError: string | null;
};

/** Live £ comparison from current meal_plan_entries (not basket_snapshots). */
export async function getLiveStorePricingForMealPlan(input: {
  mealPlanId: string;
  selectedDays?: number[];
  preferredStores?: string[];
}): Promise<
  | { success: true; storeTotals: StoreTotal[]; estimates: StoreItemEstimate[]; priceMatchSummary: LivePriceMatchSummary }
  | { error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: plan } = await supabase
    .from("meal_plans")
    .select("id")
    .eq("id", input.mealPlanId)
    .eq("user_id", user.id)
    .single();
  if (!plan) return { error: "Meal plan not found" };

  try {
    const ingredients = await deriveBasketIngredientsFromMealPlan(input.mealPlanId, input.selectedDays);
    const storeFilter = normalizePreferredStores(input.preferredStores);
    const { estimates, meta } = await estimateStoreItems(ingredients, storeFilter);
    const storeTotals = summarizeStoreTotals(estimates);
    return {
      success: true,
      storeTotals,
      estimates,
      priceMatchSummary: {
        ingredientLineCount: ingredients.length,
        pricedLineCount: meta.pricedLineCount,
        unmatchedSample: meta.unmatchedSample,
        catalogSize: meta.catalogSize,
        catalogLoadError: meta.catalogLoadError,
      },
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not estimate store prices." };
  }
}

export async function generateAIBasketForWeek(input: GenerateAIBasketInput) {
  const tier = await getUserTier();
  if (tier !== "pro") return { error: "Upgrade to Pro to generate AI grocery plans." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: planRow } = await supabase
    .from("meal_plans")
    .select("id")
    .eq("id", input.mealPlanId)
    .eq("user_id", user.id)
    .single();
  if (!planRow) return { error: "Meal plan not found" };

  const selectedDays = normalizeSelectedDays(input.selectedDays);
  const profile = await getProfile();
  const dailyCalorieTarget = Math.round(
    Number(input.goals.calorieTarget ?? getDailyCalorieTarget(profile) ?? 2000),
  );
  const dailyProteinTarget = Math.round(
    Number(input.goals.proteinTarget ?? getDailyProteinTarget(profile) ?? 120),
  );
  const snackCountPerDay = (input.goals.calorieTarget ?? 0) >= 2200 ? 2 : 1;

  const { data: recipes, error: recipesError } = await supabase
    .from("recipes")
    .select("id,name,fits_vegetarian,fits_vegan,fits_gluten_free")
    .eq("user_id", user.id)
    .is("archived_at", null)
    .order("name", { ascending: true });

  if (recipesError) return { error: recipesError.message };
  const allRecipes = (recipes ?? []) as RecipeRow[];
  if (!allRecipes.length) {
    return { error: "Add at least one recipe to your library before generating a plan." };
  }

  const nutritionMap = await fetchRecipeNutritionMap(
    supabase,
    allRecipes.map((r) => r.id),
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

  const formattedRecipes = withNutrition.map((r) => ({
    id: r.id,
    name: r.name,
    calories: r.calories,
    protein_g: r.protein,
    carbs_g: r.carbs_g,
    fat_g: r.fat_g,
  }));
  const allowedIds = new Set(allRecipes.map((r) => r.id));
  const dietContext = dietaryFlagsFromProfile(profile, input.goals);

  const goalContextRecord: Record<string, unknown> = {
    ...input.goals,
    aiSelectedDays: selectedDays,
    planSource: "existing",
  };

  if (isAnthropicMealAiEnabled()) {
    try {
      const aiPlan = await generateMealPlan({
        recipes: formattedRecipes,
        dailyCalorieTarget,
        dailyProteinTarget,
        daysToFill: selectedDays.length,
        mealTypes: ["breakfast", "lunch", "dinner", "snack"],
        snackCountPerDay,
        dietaryFlags: dietContext.flags,
        dietaryConstraintsLine: dietContext.dietaryConstraintsLine || undefined,
        allergies: input.goals.allergens ?? [],
      });
      if (aiPlan?.plan?.length) {
        const applied = await replacePlanDaysWithClaudePlan(
          supabase,
          input.mealPlanId,
          selectedDays,
          aiPlan,
          snackCountPerDay,
          allowedIds,
          withNutrition as RecipeWithNutrition[],
          dailyCalorieTarget,
          dailyProteinTarget,
        );
        if ("success" in applied && applied.success) {
          goalContextRecord.planSource = "claude";
          if (aiPlan.notes) goalContextRecord.claudeNotes = aiPlan.notes;
        }
      }
    } catch {
      /* keep planner as-is */
    }
  }

  const ingredients = await deriveBasketIngredientsFromMealPlan(input.mealPlanId, selectedDays);
  if (!ingredients.length) {
    return {
      error:
        "No recipe ingredients found for the selected days after planning. Add recipes or widen your day selection.",
    };
  }

  const storeFilter = normalizePreferredStores(input.preferredStores);
  const { estimates: itemEstimates, meta: priceMeta } = await estimateStoreItems(ingredients, storeFilter);
  const storeTotals = summarizeStoreTotals(itemEstimates);
  const recommended = [...storeTotals].sort((a, b) => a.total - b.total)[0] ?? null;

  const { data: inserted, error } = await supabase
    .from("basket_snapshots")
    .insert({
      user_id: user.id,
      meal_plan_id: input.mealPlanId,
      week_start_date: input.weekStartDate,
      goal_context: goalContextRecord as unknown as GoalContext,
      items: ingredients,
      store_totals: storeTotals,
      recommended_store: recommended?.store ?? null,
      basket_confidence: recommended?.certainty ?? 0,
      freshness_days: 0,
      estimated_total_gbp: recommended?.total ?? null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/planner");
  revalidatePath("/grocery");
  return {
    success: true as const,
    snapshotId: inserted.id,
    selectedDaysCount: selectedDays.length,
    planSource: goalContextRecord.planSource === "claude" ? ("claude" as const) : ("existing" as const),
    storeTotals,
    estimates: itemEstimates,
    priceMatchSummary: {
      ingredientLineCount: ingredients.length,
      pricedLineCount: priceMeta.pricedLineCount,
      unmatchedSample: priceMeta.unmatchedSample,
      catalogSize: priceMeta.catalogSize,
      catalogLoadError: priceMeta.catalogLoadError,
    },
  };
}

export async function getStoreComparison(snapshotId: string) {
  const tier = await getUserTier();
  if (tier !== "pro") return { error: "Upgrade to Pro to compare grocery prices." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("basket_snapshots")
    .select("id, recommended_store, store_totals, basket_confidence, freshness_days, estimated_total_gbp")
    .eq("id", snapshotId)
    .single();
  if (error) return { error: error.message };
  return { success: true as const, data };
}

async function buildSubstitutionSuggestionsFromItems(
  items: BasketIngredient[],
  goals: GoalContext,
  recommendedStore: string | null,
): Promise<SubstitutionSuggestion[]> {
  const stubSuggestions = (): SubstitutionSuggestion[] =>
    items.slice(0, 5).map((item) => ({
      fromItem: String(item.name ?? "Item"),
      toItem: `${String(item.name ?? "Item")} (store brand)`,
      reason: "Lower unit price with similar macros",
      estimatedSavings: 0.5,
      nutritionNote: "Comparable calories/protein",
      confidence: 0.72,
    }));

  if (!items.length) return [];

  if (!isAnthropicMealAiEnabled()) {
    return stubSuggestions();
  }

  const supabase = await createClient();
  const [{ data: canonRows }, { data: productRows }] = await Promise.all([
    supabase.from("canonical_items").select("*").limit(200),
    supabase
      .from("store_products")
      .select("canonical_item_id, store, product_name, price_gbp, unit_price_gbp, size_value, size_unit")
      .limit(400),
  ]);

  const canonicalItems = (canonRows ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name ?? ""),
    category: String(row.category ?? ""),
    isVegan: Boolean(row.is_vegan),
    isVegetarian: Boolean(row.is_vegetarian),
    isGlutenFree: Boolean(row.is_gluten_free),
    isDairyFree: Boolean(row.is_dairy_free),
  }));

  const storeProducts = (productRows ?? []).map((row) => ({
    canonicalItemId: String(row.canonical_item_id ?? ""),
    store: String(row.store ?? ""),
    productName: String(row.product_name ?? ""),
    currentPrice: Number(row.price_gbp ?? 0),
    unitPrice: Number(row.unit_price_gbp ?? 0),
    sizeValue: Number(row.size_value ?? 0),
    sizeUnit: String(row.size_unit ?? ""),
  }));

  const recStore = recommendedStore ?? "tesco";
  const { estimates } = await estimateStoreItems(items, ["tesco", "asda", "aldi"]);
  const costByIngredient = new Map<string, number>();
  for (const e of estimates) {
    if (e.store !== recStore) continue;
    costByIngredient.set(e.ingredientName, (costByIngredient.get(e.ingredientName) ?? 0) + e.estimatedCost);
  }
  for (const ing of items) {
    if (!costByIngredient.has(ing.name)) {
      let best = Number.POSITIVE_INFINITY;
      for (const e of estimates) {
        if (e.ingredientName !== ing.name) continue;
        best = Math.min(best, e.estimatedCost);
      }
      if (best < Number.POSITIVE_INFINITY) costByIngredient.set(ing.name, best);
    }
  }

  const ingredientsPayload = items.map((ing) => ({
    name: ing.name,
    quantity: ing.quantity,
    unit: ing.unit,
    currentPrice: costByIngredient.get(ing.name) ?? 0,
    store: recStore,
  }));

  try {
    const ai = await generateSubstitutions({
      ingredients: ingredientsPayload,
      canonicalItems,
      storeProducts,
      dietaryFlags: {
        isVegan: goals.followsVegan,
        isVegetarian: goals.followsVegetarian,
        isGlutenFree: goals.followsGlutenFree,
        isDairyFree: goals.dairyFree === true,
      },
      nutritionTargets: {
        calories: Math.round(Number(goals.calorieTarget ?? 2000)),
        protein_g: Math.round(Number(goals.proteinTarget ?? 120)),
      },
    });

    if (!ai?.substitutions?.length) {
      return stubSuggestions();
    }

    return ai.substitutions.slice(0, 5).map((s) => ({
      fromItem: s.originalItem,
      toItem: `${s.suggestedItem} (${s.suggestedStore})`,
      reason: s.reason,
      estimatedSavings: Math.max(0, Number(s.savingAmount) || 0),
      nutritionNote: s.nutritionImpact,
      confidence: s.safeForDiet ? 0.82 : 0.55,
    }));
  } catch {
    return stubSuggestions();
  }
}

export async function getSubstitutionSuggestions(
  snapshotId: string,
): Promise<{ success: true; suggestions: SubstitutionSuggestion[] } | { error: string }> {
  const tier = await getUserTier();
  if (tier !== "pro") return { error: "Upgrade to Pro to get substitutions." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data, error } = await supabase
    .from("basket_snapshots")
    .select("items, goal_context, recommended_store, user_id")
    .eq("id", snapshotId)
    .eq("user_id", user.id)
    .single();
  if (error) return { error: error.message };

  const items = Array.isArray(data?.items) ? (data.items as BasketIngredient[]) : [];
  if (!items.length) return { success: true, suggestions: [] };

  const goalRaw = data?.goal_context as Record<string, unknown> | null;
  const goals = (goalRaw ?? {}) as GoalContext;
  const recStore = (data?.recommended_store as string | null) ?? "tesco";
  const suggestions = await buildSubstitutionSuggestionsFromItems(items, goals, recStore);
  return { success: true, suggestions };
}

export async function getSubstitutionSuggestionsForMealPlan(
  mealPlanId: string,
  selectedDays?: number[] | null,
): Promise<{ success: true; suggestions: SubstitutionSuggestion[] } | { error: string }> {
  const tier = await getUserTier();
  if (tier !== "pro") return { error: "Upgrade to Pro to get substitutions." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: plan } = await supabase
    .from("meal_plans")
    .select("id")
    .eq("id", mealPlanId)
    .eq("user_id", user.id)
    .single();
  if (!plan) return { error: "Meal plan not found" };

  const items = await deriveBasketIngredientsFromMealPlan(
    mealPlanId,
    selectedDays?.length ? selectedDays : undefined,
  );
  if (!items.length) return { success: true, suggestions: [] };

  const profile = await getProfile();
  const goals: GoalContext = {
    calorieTarget: getDailyCalorieTarget(profile),
    proteinTarget: getDailyProteinTarget(profile),
    followsVegetarian: Boolean(profile?.follows_vegetarian),
    followsVegan: Boolean(profile?.follows_vegan),
    followsGlutenFree: Boolean(profile?.follows_gluten_free),
  };

  const suggestions = await buildSubstitutionSuggestionsFromItems(items, goals, "tesco");
  return { success: true, suggestions };
}

export async function applyAIBasketToGrocery(snapshotId: string) {
  const tier = await getUserTier();
  if (tier !== "pro") return { error: "Upgrade to Pro to apply AI grocery plans." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: snapshot, error } = await supabase
    .from("basket_snapshots")
    .select("meal_plan_id, week_start_date, items, goal_context")
    .eq("id", snapshotId)
    .eq("user_id", user.id)
    .single();
  if (error) return { error: error.message };

  const basketItems = Array.isArray(snapshot?.items) ? (snapshot.items as BasketIngredient[]) : [];
  if (!basketItems.length) return { error: "Snapshot has no basket items to apply." };

  const goalCtx = snapshot.goal_context as Record<string, unknown> | null;
  const aiSelectedDays = Array.isArray(goalCtx?.aiSelectedDays)
    ? (goalCtx!.aiSelectedDays as unknown[]).map((d) => Number(d)).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    : undefined;

  let mealPlanId = snapshot.meal_plan_id as string | null;
  if (!mealPlanId) {
    const { data: plan } = await supabase
      .from("meal_plans")
      .select("id")
      .eq("user_id", user.id)
      .eq("week_start_date", snapshot.week_start_date)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    mealPlanId = plan?.id ?? null;
  }

  if (!mealPlanId) return { error: "Could not find a meal plan for this snapshot week." };

  const merged = mergeIngredients(basketItems);
  const pantryRows = await getPantryItems();
  const { items: afterPantry } = applyPantryToShoppingList(merged, pantryRows.map(pantryRowToAvailable));
  const applied = await replaceGroceryItemsWithMerged(
    mealPlanId,
    afterPantry,
    aiSelectedDays?.length ? aiSelectedDays : undefined,
  );
  if ("error" in applied) return applied;

  revalidatePath("/planner");
  revalidatePath("/grocery");
  return { success: true as const, mealPlanId };
}
