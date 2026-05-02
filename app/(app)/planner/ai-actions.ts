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
import { replaceGroceryItemsWithMerged } from "@/lib/supabase/grocery";
import { fetchRecipeNutritionMap } from "@/lib/supabase/recipe-nutrition-query";
import { getProfile } from "@/lib/supabase/profile";
import {
  generateMealPlan,
  generateSubstitutions,
  type ClaudeMealPlanResult,
} from "@/lib/ai/client";
import { fractionForMealSlot, type GoalMealSlot } from "@/lib/ai/goal-matched-recipe";
import type { SupabaseClient } from "@supabase/supabase-js";

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
): Promise<{ error: string } | { success: true }> {
  const rows: MealPlanInsertRow[] = [];
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
  if (!rows.length) {
    return { error: "Claude did not return any valid recipe IDs for the selected days." };
  }

  const { error: delError } = await supabase
    .from("meal_plan_entries")
    .delete()
    .eq("meal_plan_id", mealPlanId)
    .in("day_of_week", selectedDays);
  if (delError) return { error: delError.message };

  const { error: insertError } = await supabase.from("meal_plan_entries").insert(rows);
  if (!insertError) return { success: true as const };

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
    return { success: true as const };
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
};

function pickHeuristicRecipeForSlot(
  pool: RecipeWithNutrition[],
  slot: MealPlanInsertRow["meal_type"],
  usedCount: Map<string, number>,
  dailyK: number,
  dailyP: number,
): string {
  const slotKey: GoalMealSlot = slot === "snack" ? "snack" : slot;
  const frac = fractionForMealSlot(slotKey);
  const targetK = dailyK * frac;
  const targetP = dailyP * frac;
  const score = (r: RecipeWithNutrition) => {
    const dk = Math.abs(r.calories - targetK) / Math.max(targetK, 40);
    const dp = Math.abs(r.protein - targetP) / Math.max(targetP, 4);
    return dk + 0.55 * dp;
  };
  const ranked = [...pool].sort((a, b) => score(a) - score(b));
  const top5 = ranked.slice(0, 5);
  let candidates = top5.filter((r) => (usedCount.get(r.id) ?? 0) < 2);
  if (!candidates.length) {
    candidates = ranked.filter((r) => (usedCount.get(r.id) ?? 0) < 2).slice(0, 5);
  }
  if (!candidates.length) {
    candidates = top5.length ? top5 : ranked.slice(0, 1);
  }
  const picked = candidates[Math.floor(Math.random() * candidates.length)]!;
  usedCount.set(picked.id, (usedCount.get(picked.id) ?? 0) + 1);
  return picked.id;
}

function recipeMatchesGoals(recipe: RecipeRow, goals: GoalContext): boolean {
  if (goals.followsVegan && recipe.fits_vegan !== true) return false;
  if (!goals.followsVegan && goals.followsVegetarian && recipe.fits_vegetarian !== true) return false;
  if (goals.followsGlutenFree && recipe.fits_gluten_free !== true) return false;
  return true;
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
  const eligible = allRecipes.filter((r) => recipeMatchesGoals(r, input.goals));
  if (!eligible.length) {
    return { error: "No recipes match your dietary preferences yet. Add more recipes and try again." };
  }

  const nutritionMap = await fetchRecipeNutritionMap(
    supabase,
    eligible.map((r) => r.id),
  );
  const withNutrition = eligible
    .map((r) => {
      const n = nutritionMap.get(r.id);
      return {
        ...r,
        calories: n?.calories ?? 0,
        protein: n?.protein_g ?? 0,
        carbs_g: n?.carbs_g ?? null,
        fat_g: n?.fat_g ?? null,
      };
    })
    .sort((a, b) => (b.protein - a.protein) || (b.calories - a.calories));

  const snackCountPerDay = (input.goals.calorieTarget ?? 0) >= 2200 ? 2 : 1;
  const selectedDaysFullWeek = [0, 1, 2, 3, 4, 5, 6];
  const profile = await getProfile();
  const dailyCalorieTarget = Math.round(
    Number(input.goals.calorieTarget ?? profile?.daily_calorie_target ?? 2000),
  );
  const dailyProteinTarget = Math.round(
    Number(input.goals.proteinTarget ?? profile?.daily_protein_target ?? 120),
  );

  const formattedRecipes = withNutrition.map((r) => ({
    id: r.id,
    name: r.name,
    calories: r.calories,
    protein_g: r.protein,
    carbs_g: r.carbs_g,
    fat_g: r.fat_g,
  }));

  const allowedIds = new Set(eligible.map((r) => r.id));
  let claudeSucceeded = false;
  let claudeNotes: string | undefined;

  if (isAnthropicMealAiEnabled()) {
    try {
      const aiPlan = await generateMealPlan({
        recipes: formattedRecipes,
        dailyCalorieTarget,
        dailyProteinTarget,
        daysToFill: 7,
        mealTypes: ["breakfast", "lunch", "dinner", "snack"],
        snackCountPerDay,
        dietaryFlags: {
          isVegan: input.goals.followsVegan,
          isVegetarian: input.goals.followsVegetarian,
          isGlutenFree: input.goals.followsGlutenFree,
          isDairyFree: input.goals.dairyFree === true,
        },
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
        );
        if ("success" in applied && applied.success) {
          claudeSucceeded = true;
          claudeNotes = aiPlan.notes;
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

    for (let day = 0; day < 7; day += 1) {
      const breakfastId = pickHeuristicRecipeForSlot(pool, "breakfast", usedCount, dailyCalorieTarget, dailyProteinTarget);
      const lunchId = pickHeuristicRecipeForSlot(pool, "lunch", usedCount, dailyCalorieTarget, dailyProteinTarget);
      const dinnerId = pickHeuristicRecipeForSlot(pool, "dinner", usedCount, dailyCalorieTarget, dailyProteinTarget);

      rows.push({
        meal_plan_id: input.mealPlanId,
        recipe_id: breakfastId,
        day_of_week: day,
        meal_type: "breakfast",
        slot_index: 0,
        quick_add_name: null,
        quick_add_calories: null,
      });
      rows.push({
        meal_plan_id: input.mealPlanId,
        recipe_id: lunchId,
        day_of_week: day,
        meal_type: "lunch",
        slot_index: 0,
        quick_add_name: null,
        quick_add_calories: null,
      });
      rows.push({
        meal_plan_id: input.mealPlanId,
        recipe_id: dinnerId,
        day_of_week: day,
        meal_type: "dinner",
        slot_index: 0,
        quick_add_name: null,
        quick_add_calories: null,
      });

      for (let s = 0; s < snackCountPerDay; s += 1) {
        const snackId = pickHeuristicRecipeForSlot(pool, "snack", usedCount, dailyCalorieTarget, dailyProteinTarget);
        rows.push({
          meal_plan_id: input.mealPlanId,
          recipe_id: snackId,
          day_of_week: day,
          meal_type: "snack",
          slot_index: s,
          quick_add_name: null,
          quick_add_calories: null,
        });
      }
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
    Number(input.goals.calorieTarget ?? profile?.daily_calorie_target ?? 2000),
  );
  const dailyProteinTarget = Math.round(
    Number(input.goals.proteinTarget ?? profile?.daily_protein_target ?? 120),
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
  const eligible = allRecipes.filter((r) => recipeMatchesGoals(r, input.goals));
  if (!eligible.length) {
    return { error: "No recipes match your dietary preferences yet. Add more recipes and try again." };
  }

  const nutritionMap = await fetchRecipeNutritionMap(
    supabase,
    eligible.map((r) => r.id),
  );
  const withNutrition = eligible
    .map((r) => {
      const n = nutritionMap.get(r.id);
      return {
        ...r,
        calories: n?.calories ?? 0,
        protein: n?.protein_g ?? 0,
        carbs_g: n?.carbs_g ?? null,
        fat_g: n?.fat_g ?? null,
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
  const allowedIds = new Set(eligible.map((r) => r.id));

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
        dietaryFlags: {
          isVegan: input.goals.followsVegan,
          isVegetarian: input.goals.followsVegetarian,
          isGlutenFree: input.goals.followsGlutenFree,
          isDairyFree: input.goals.dairyFree === true,
        },
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
    calorieTarget: profile?.daily_calorie_target ?? null,
    proteinTarget: profile?.daily_protein_target ?? null,
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
  const applied = await replaceGroceryItemsWithMerged(
    mealPlanId,
    merged,
    aiSelectedDays?.length ? aiSelectedDays : undefined,
  );
  if ("error" in applied) return applied;

  revalidatePath("/planner");
  revalidatePath("/grocery");
  return { success: true as const, mealPlanId };
}
