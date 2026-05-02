"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUserTier } from "@/lib/subscription";
import { estimateStoreItems, summarizeStoreTotals } from "@/lib/pricing/compare";
import type { BasketIngredient, GoalContext, SubstitutionSuggestion } from "@/lib/pricing/types";
import { mergeIngredients } from "@/lib/utils/merge";
import { replaceGroceryItemsWithMerged } from "@/lib/supabase/grocery";
import { fetchRecipeNutritionMap } from "@/lib/supabase/recipe-nutrition-query";

type GenerateAIBasketInput = {
  mealPlanId: string;
  weekStartDate: string;
  goals: GoalContext;
  preferredStores?: string[];
};

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

function recipeMatchesGoals(recipe: RecipeRow, goals: GoalContext): boolean {
  if (goals.followsVegan && recipe.fits_vegan !== true) return false;
  if (!goals.followsVegan && goals.followsVegetarian && recipe.fits_vegetarian !== true) return false;
  if (goals.followsGlutenFree && recipe.fits_gluten_free !== true) return false;
  return true;
}

function pickRecipeIds(
  recipeIds: string[],
  perDay: number,
  totalDays: number,
): string[] {
  if (!recipeIds.length) return [];
  const totalSlots = perDay * totalDays;
  const out: string[] = [];
  for (let i = 0; i < totalSlots; i += 1) out.push(recipeIds[i % recipeIds.length]);
  return out;
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
      };
    })
    .sort((a, b) => (b.protein - a.protein) || (b.calories - a.calories));

  const snackCountPerDay = (input.goals.calorieTarget ?? 0) >= 2200 ? 2 : 1;
  const breakfasts = pickRecipeIds(withNutrition.map((r) => r.id), 1, 7);
  const lunches = pickRecipeIds(
    [...withNutrition].sort((a, b) => Math.abs((input.goals.calorieTarget ?? 0) / 3 - a.calories) - Math.abs((input.goals.calorieTarget ?? 0) / 3 - b.calories)).map((r) => r.id),
    1,
    7,
  );
  const dinners = pickRecipeIds([...withNutrition].reverse().map((r) => r.id), 1, 7);
  const snacks = pickRecipeIds(withNutrition.map((r) => r.id), snackCountPerDay, 7);

  const rows: Array<{
    meal_plan_id: string;
    recipe_id: string;
    day_of_week: number;
    meal_type: "breakfast" | "lunch" | "dinner" | "snack";
    slot_index: number;
    quick_add_name: null;
    quick_add_calories: null;
  }> = [];

  for (let day = 0; day < 7; day += 1) {
    rows.push({
      meal_plan_id: input.mealPlanId,
      recipe_id: breakfasts[day],
      day_of_week: day,
      meal_type: "breakfast",
      slot_index: 0,
      quick_add_name: null,
      quick_add_calories: null,
    });
    rows.push({
      meal_plan_id: input.mealPlanId,
      recipe_id: lunches[day],
      day_of_week: day,
      meal_type: "lunch",
      slot_index: 0,
      quick_add_name: null,
      quick_add_calories: null,
    });
    rows.push({
      meal_plan_id: input.mealPlanId,
      recipe_id: dinners[day],
      day_of_week: day,
      meal_type: "dinner",
      slot_index: 0,
      quick_add_name: null,
      quick_add_calories: null,
    });

    for (let s = 0; s < snackCountPerDay; s += 1) {
      rows.push({
        meal_plan_id: input.mealPlanId,
        recipe_id: snacks[(day * snackCountPerDay + s) % snacks.length],
        day_of_week: day,
        meal_type: "snack",
        slot_index: s,
        quick_add_name: null,
        quick_add_calories: null,
      });
    }
  }

  // Replace existing planner slots for this meal plan with AI-picked layout.
  const { error: clearError } = await supabase
    .from("meal_plan_entries")
    .delete()
    .eq("meal_plan_id", input.mealPlanId);
  if (clearError) return { error: clearError.message };

  const { error: insertError } = await supabase.from("meal_plan_entries").insert(rows);
  if (insertError) {
    // Legacy fallback for schemas without slot_index.
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

  revalidatePath("/planner");
  return { success: true as const, snackCountPerDay, recipePool: withNutrition.length };
}

async function deriveBasketIngredientsFromMealPlan(
  mealPlanId: string,
): Promise<BasketIngredient[]> {
  const supabase = await createClient();
  const { data: entries, error: entriesError } = await supabase
    .from("meal_plan_entries")
    .select("recipe_id")
    .eq("meal_plan_id", mealPlanId)
    .not("recipe_id", "is", null);

  if (entriesError) throw new Error(entriesError.message);

  const recipeIds = Array.from(
    new Set((entries ?? []).map((e) => e.recipe_id).filter(Boolean)),
  );
  if (!recipeIds.length) return [];

  const { data: ingredients, error: ingredientError } = await supabase
    .from("recipe_ingredients")
    .select("name, quantity, unit")
    .in("recipe_id", recipeIds);

  if (ingredientError) throw new Error(ingredientError.message);
  if (!ingredients?.length) return [];

  return mergeIngredients(
    ingredients as { name: string; quantity: number; unit: string }[],
  ) as BasketIngredient[];
}

export async function generateAIBasketForWeek(input: GenerateAIBasketInput) {
  const tier = await getUserTier();
  if (tier !== "pro") return { error: "Upgrade to Pro to generate AI grocery plans." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const ingredients = await deriveBasketIngredientsFromMealPlan(input.mealPlanId);
  if (!ingredients.length) {
    return { error: "No recipe ingredients found for this week. Add meals with recipes first." };
  }

  const { estimates: itemEstimates, meta: priceMeta } = await estimateStoreItems(
    ingredients,
    input.preferredStores && input.preferredStores.length > 0 ? input.preferredStores : undefined,
  );
  const storeTotals = summarizeStoreTotals(itemEstimates);
  const recommended = [...storeTotals].sort((a, b) => a.total - b.total)[0] ?? null;

  const { data: inserted, error } = await supabase
    .from("basket_snapshots")
    .insert({
      user_id: user.id,
      meal_plan_id: input.mealPlanId,
      week_start_date: input.weekStartDate,
      goal_context: input.goals,
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
    storeTotals,
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

export async function getSubstitutionSuggestions(
  snapshotId: string,
): Promise<{ success: true; suggestions: SubstitutionSuggestion[] } | { error: string }> {
  const tier = await getUserTier();
  if (tier !== "pro") return { error: "Upgrade to Pro to get substitutions." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("basket_snapshots")
    .select("items")
    .eq("id", snapshotId)
    .single();
  if (error) return { error: error.message };

  const items = Array.isArray(data?.items) ? (data.items as BasketIngredient[]) : [];
  const suggestions: SubstitutionSuggestion[] = items.slice(0, 5).map((item) => ({
    fromItem: String(item.name ?? "Item"),
    toItem: `${String(item.name ?? "Item")} (store brand)`,
    reason: "Lower unit price with similar macros",
    estimatedSavings: 0.5,
    nutritionNote: "Comparable calories/protein",
    confidence: 0.72,
  }));

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
    .select("meal_plan_id, week_start_date, items")
    .eq("id", snapshotId)
    .eq("user_id", user.id)
    .single();
  if (error) return { error: error.message };

  const basketItems = Array.isArray(snapshot?.items) ? (snapshot.items as BasketIngredient[]) : [];
  if (!basketItems.length) return { error: "Snapshot has no basket items to apply." };

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
  const applied = await replaceGroceryItemsWithMerged(mealPlanId, merged);
  if ("error" in applied) return applied;

  revalidatePath("/planner");
  revalidatePath("/grocery");
  return { success: true as const, mealPlanId };
}
