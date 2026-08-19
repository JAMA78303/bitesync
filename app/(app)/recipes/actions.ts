"use server";

import { toUserFacingError } from "@/lib/errors/userFacing";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { RecipeIngredientInput } from "@/lib/nutrition/calculate";
import {
  calculateRecipeNutritionWithMeta,
  type IngredientCofidMeta,
} from "@/lib/nutrition/asyncTotals";
import {
  publisherNutritionToTotals,
  type PublisherNutritionPerServing,
} from "@/lib/nutrition/publisherNutrition";
import { getRecipeNutritionTotals } from "@/lib/nutrition/recipeNutritionTotals";
import {
  fractionForMealSlot,
  type GoalMealSlot,
} from "@/lib/ai/goal-matched-recipe";
import { resolveGoalMatchedDraft } from "@/lib/recipes/libraryRecipeMatch";
import { dietaryPreferencesToLegacyFlags, parseDietaryPreferences } from "@/lib/dietary/constraints";
import { randomInt } from "node:crypto";
import { canCreateRecipe, getRecipeCount, getUserTier } from "@/lib/subscription";
import { getProfile } from "@/lib/supabase/profile";
import { getDailyCalorieTarget } from "@/lib/utils/nutrition-targets";
import {
  applyRecipeRecompute,
  loadRecipesForRecompute,
  recomputeRecipeMacros,
} from "@/lib/recipes/macroRecompute";
import {
  filterValidRecipeIngredients,
  validateRecipeIngredients,
} from "@/lib/recipes/ingredientValidation";
import type { ActionResult } from "@/types";

type CreateRecipePayload = {
  name: string;
  description: string;
  ingredients: RecipeIngredientInput[];
  fitsVegetarian?: boolean;
  fitsVegan?: boolean;
  fitsGlutenFree?: boolean;
  sourceUrl?: string;
  sourceDomain?: string;
  sourceType?: string;
  importedAt?: string;
  steps?: string[];
};

type UpdateRecipePayload = CreateRecipePayload & { recipeId: string };

export type CreateImportedRecipePayload = CreateRecipePayload & {
  /** Parsed recipeYield from source (e.g. 4). */
  detectedServings: number;
  /** People quantities were scaled for at import. */
  cookingFor: number;
  /** Site-published per-serving macros from schema.org when available. */
  publisherNutritionPerServing?: PublisherNutritionPerServing;
};

const GOAL_MEAL_SLOTS: GoalMealSlot[] = ["breakfast", "lunch", "dinner", "snack"];

function hashDraftNonce(uuid: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < uuid.length; i += 1) {
    h ^= uuid.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function mixDraftVariantSeed(
  mealSlot: GoalMealSlot,
  flags: { vegan: boolean; vegetarian: boolean; glutenFree: boolean },
  draftNonce: string | undefined,
  variationSeed: number | undefined,
): number {
  const slotSalt =
    mealSlot === "breakfast"
      ? 0x9e3779b1
      : mealSlot === "lunch"
        ? 0x85ebca6b
        : mealSlot === "dinner"
          ? 0xc2b2ae35
          : 0x27d4eb2d;
  const dietSalt = (flags.vegan ? 0x51ed : 0) ^ (flags.vegetarian && !flags.vegan ? 0x1cef : 0) ^ (flags.glutenFree ? 0xbee5 : 0);

  const trimmed = typeof draftNonce === "string" ? draftNonce.trim() : "";
  const hasNonce = trimmed.length > 0;
  const hasNumeric = typeof variationSeed === "number" && Number.isFinite(variationSeed);

  let h: number;
  if (hasNonce) {
    h = hashDraftNonce(trimmed);
    if (hasNumeric) h = (h ^ (Math.floor(Number(variationSeed)) >>> 0)) >>> 0;
  } else if (hasNumeric) {
    h = Math.floor(Number(variationSeed)) >>> 0;
  } else {
    h = randomInt(0, 0x7fff_fffe) >>> 0;
  }
  return (h ^ slotSalt ^ dietSalt) >>> 0;
}

function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildIngredientRows(
  recipeId: string,
  ingredients: RecipeIngredientInput[],
  estimatedFlags: boolean[],
  cofidMeta: IngredientCofidMeta[],
) {
  return ingredients.map((ingredient, i) => ({
    recipe_id: recipeId,
    name: toTitleCase(ingredient.name.trim()),
    quantity: ingredient.quantity,
    unit: (ingredient.unit ?? "").trim(),
    nutrition_estimated: estimatedFlags[i] ?? false,
    cofid_food_name: cofidMeta[i]?.cofid_food_name ?? null,
    cofid_matched_by: cofidMeta[i]?.cofid_matched_by ?? null,
  }));
}

export async function generateGoalMatchedRecipeDraft(payload: {
  mealSlot: GoalMealSlot;
  fitsVegan: boolean;
  fitsVegetarian: boolean;
  fitsGlutenFree: boolean;
  /** Optional; XORed with draftNonce on the server for extra entropy. */
  variationSeed?: number;
  /** Fresh UUID each click so templates rotate reliably (server actions may reuse timing-only seeds). */
  draftNonce?: string;
  /** When mealSlot is snack, bias ingredients toward this micronutrient key. */
  microNutrientKey?: string;
}): Promise<
  ActionResult<{
    name: string;
    description: string;
    ingredients: RecipeIngredientInput[];
    targetMealCalories: number;
    achievedCalories: number;
    achievedProteinG: number;
  }>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  if (!GOAL_MEAL_SLOTS.includes(payload.mealSlot)) {
    return { error: "Invalid meal slot." };
  }

  const profile = await getProfile();
  const daily = getDailyCalorieTarget(profile);
  if (daily == null || !Number.isFinite(Number(daily)) || daily < 800) {
    return {
      error: "Set a daily calorie target in Settings (TDEE) first. We use it to size each meal to about the right share of your day.",
    };
  }

  const fraction = fractionForMealSlot(payload.mealSlot);
  const targetMealCalories = Math.round(Number(daily) * fraction);
  const vegan = payload.fitsVegan === true;
  const vegetarian = payload.fitsVegetarian === true || vegan;
  const glutenFree = payload.fitsGlutenFree === true;

  const variantSeed = mixDraftVariantSeed(
    payload.mealSlot,
    { vegan, vegetarian, glutenFree },
    payload.draftNonce,
    payload.variationSeed,
  );

  const draft = await resolveGoalMatchedDraft(supabase, user.id, {
    targetCalories: targetMealCalories,
    mealSlot: payload.mealSlot,
    vegan,
    vegetarian,
    glutenFree,
    variantSeed,
    microFocusKey: payload.microNutrientKey?.trim() || undefined,
  });

  const { totals } = await getRecipeNutritionTotals(draft.ingredients, { aiEnabled: true });
  const libraryNote =
    draft.source === "library"
      ? "From your recipe library — review portions and save."
      : payload.microNutrientKey
        ? `Snack to help with ${payload.microNutrientKey.replace(/_/g, " ")} — review ingredients and save.`
        : "";

  return {
    success: true,
    data: {
      name: draft.name,
      description: libraryNote,
      ingredients: draft.ingredients,
      targetMealCalories,
      achievedCalories: Math.round(totals.calories * 10) / 10,
      achievedProteinG: Math.round(totals.protein_g * 10) / 10,
    },
  };
}

export async function generateMicroFocusedSnackDraft(payload: {
  nutrientKey: string;
  draftNonce?: string;
}): Promise<
  ActionResult<{
    name: string;
    description: string;
    ingredients: RecipeIngredientInput[];
    targetMealCalories: number;
    achievedCalories: number;
    achievedProteinG: number;
  }>
> {
  const nutrientKey = payload.nutrientKey.trim();
  if (!nutrientKey) return { error: "Missing nutrient." };

  const profile = await getProfile();
  const prefs = parseDietaryPreferences(profile?.dietary_preferences);
  const flags = dietaryPreferencesToLegacyFlags(prefs);

  return generateGoalMatchedRecipeDraft({
    mealSlot: "snack",
    fitsVegan: flags.followsVegan,
    fitsVegetarian: flags.followsVegetarian,
    fitsGlutenFree: flags.followsGlutenFree,
    microNutrientKey: nutrientKey,
    draftNonce: payload.draftNonce,
  });
}

export async function createRecipe(
  payload: CreateRecipePayload,
): Promise<ActionResult<{ id: string }>> {
  const name = toTitleCase(payload.name.trim());
  const description = payload.description.trim();
  const ingredientError = validateRecipeIngredients(payload.ingredients);
  if (ingredientError) return { error: ingredientError };
  const ingredients = filterValidRecipeIngredients(payload.ingredients);

  if (!name) {
    return { error: "Recipe name is required." };
  }

  if (!ingredients.length) {
    return { error: "Add at least one valid ingredient." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const [tier, allowed, count] = await Promise.all([
    getUserTier(),
    canCreateRecipe(),
    getRecipeCount(),
  ]);
  if (tier === "free" && !allowed) {
    return {
      error: `Recipe limit reached (${count}/10). Upgrade to Pro for unlimited recipes.`,
    };
  }

  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .insert({
      user_id: user.id,
      name,
      description: description || null,
      servings: 1,
      fits_vegetarian: payload.fitsVegetarian === true ? true : null,
      fits_vegan: payload.fitsVegan === true ? true : null,
      fits_gluten_free: payload.fitsGlutenFree === true ? true : null,
      source_url: payload.sourceUrl?.trim() || null,
      source_domain: payload.sourceDomain?.trim() || null,
      imported_at: payload.importedAt?.trim() || null,
    })
    .select("id")
    .single();

  if (recipeError || !recipe) {
    return {
      error: recipeError
        ? toUserFacingError(recipeError, "recipe-save", "createRecipe")
        : "Failed to create recipe.",
    };
  }

  const { totals: nutrition, estimatedFlags, cofidMeta } = await calculateRecipeNutritionWithMeta(
    ingredients,
    { aiEnabled: true },
  );

  const ingredientRows = buildIngredientRows(recipe.id, ingredients, estimatedFlags, cofidMeta);

  const { error: ingredientsError } = await supabase
    .from("recipe_ingredients")
    .insert(ingredientRows);

  if (ingredientsError) {
    return { error: toUserFacingError(ingredientsError, "recipe-save", "saveRecipeIngredients") };
  }

  const { error: nutritionError } = await supabase.from("recipe_nutrition").upsert(
    {
      recipe_id: recipe.id,
      calories: nutrition.calories,
      protein_g: nutrition.protein_g,
      carbs_g: nutrition.carbs_g,
      fat_g: nutrition.fat_g,
      fibre_g: nutrition.fibre_g,
      sugar_g: nutrition.sugar_g,
      sodium_mg: nutrition.sodium_mg,
      saturated_fat_g: nutrition.saturated_fat_g,
      coverage_pct: nutrition.coverage_pct,
    },
    { onConflict: "recipe_id" },
  );

  if (nutritionError) {
    return { error: toUserFacingError(nutritionError, "recipe-save", "saveRecipeNutrition") };
  }

  revalidatePath("/recipes");
  return { success: true, data: { id: recipe.id }, message: "Recipe created." };
}

export async function createImportedRecipe(
  payload: CreateImportedRecipePayload,
): Promise<ActionResult<{ id: string }>> {
  const name = toTitleCase(payload.name.trim());
  const steps = (payload.steps ?? []).map((s) => s.trim()).filter(Boolean);
  const descriptionBody = payload.description.trim();
  const description =
    steps.length > 0
      ? [descriptionBody, "Method", ...steps.map((step, i) => `${i + 1}. ${step}`)]
          .filter(Boolean)
          .join("\n")
      : descriptionBody;
  const ingredientError = validateRecipeIngredients(payload.ingredients);
  if (ingredientError) return { error: ingredientError };
  const ingredients = filterValidRecipeIngredients(payload.ingredients);

  if (!name) {
    return { error: "Recipe name is required." };
  }

  if (!ingredients.length) {
    return { error: "Add at least one valid ingredient." };
  }

  const cookingFor = Math.max(1, Math.min(12, Math.round(Number(payload.cookingFor)) || 1));
  const detectedServings = Math.max(1, Math.min(48, Math.round(Number(payload.detectedServings)) || 1));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const [tier, allowed, count] = await Promise.all([
    getUserTier(),
    canCreateRecipe(),
    getRecipeCount(),
  ]);
  if (tier === "free" && !allowed) {
    return {
      error: `Recipe limit reached (${count}/10). Upgrade to Pro for unlimited recipes.`,
    };
  }

  const { totals: calculated, estimatedFlags, cofidMeta } = await calculateRecipeNutritionWithMeta(
    ingredients,
    { aiEnabled: true },
  );
  const nutrition = payload.publisherNutritionPerServing
    ? publisherNutritionToTotals(payload.publisherNutritionPerServing, calculated.coverage_pct)
    : calculated;

  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .insert({
      user_id: user.id,
      name,
      description: description || null,
      servings: cookingFor,
      detected_servings: detectedServings,
      cooking_for: cookingFor,
      fits_vegetarian: payload.fitsVegetarian === true ? true : null,
      fits_vegan: payload.fitsVegan === true ? true : null,
      fits_gluten_free: payload.fitsGlutenFree === true ? true : null,
      source_url: payload.sourceUrl?.trim() || null,
      source_domain: payload.sourceDomain?.trim() || null,
      source_type: payload.sourceType?.trim() || null,
      imported_at: payload.importedAt?.trim() || null,
    })
    .select("id")
    .single();

  if (recipeError || !recipe) {
    return {
      error: recipeError
        ? toUserFacingError(recipeError, "recipe-save", "createRecipe")
        : "Failed to create recipe.",
    };
  }

  const ingredientRows = buildIngredientRows(recipe.id, ingredients, estimatedFlags, cofidMeta);

  const { error: ingredientsError } = await supabase.from("recipe_ingredients").insert(ingredientRows);

  if (ingredientsError) {
    return { error: toUserFacingError(ingredientsError, "recipe-save", "saveRecipeIngredients") };
  }

  const { error: nutritionError } = await supabase.from("recipe_nutrition").upsert(
    {
      recipe_id: recipe.id,
      calories: nutrition.calories,
      protein_g: nutrition.protein_g,
      carbs_g: nutrition.carbs_g,
      fat_g: nutrition.fat_g,
      fibre_g: nutrition.fibre_g,
      sugar_g: nutrition.sugar_g,
      sodium_mg: nutrition.sodium_mg,
      saturated_fat_g: nutrition.saturated_fat_g,
      coverage_pct: nutrition.coverage_pct,
    },
    { onConflict: "recipe_id" },
  );

  if (nutritionError) {
    return { error: toUserFacingError(nutritionError, "recipe-save", "saveRecipeNutrition") };
  }

  revalidatePath("/recipes");
  return { success: true, data: { id: recipe.id }, message: "Recipe imported." };
}

export async function updateRecipe(payload: UpdateRecipePayload): Promise<ActionResult<{ id: string }>> {
  const recipeId = payload.recipeId.trim();
  const name = toTitleCase(payload.name.trim());
  const description = payload.description.trim();
  const ingredientError = validateRecipeIngredients(payload.ingredients);
  if (ingredientError) return { error: ingredientError };
  const ingredients = filterValidRecipeIngredients(payload.ingredients);

  if (!recipeId) return { error: "Recipe not found." };
  if (!name) return { error: "Recipe name is required." };
  if (!ingredients.length) return { error: "Add at least one valid ingredient." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error: recipeError } = await supabase
    .from("recipes")
    .update({
      name,
      description: description || null,
      updated_at: new Date().toISOString(),
      fits_vegetarian: payload.fitsVegetarian === true ? true : null,
      fits_vegan: payload.fitsVegan === true ? true : null,
      fits_gluten_free: payload.fitsGlutenFree === true ? true : null,
    })
    .eq("id", recipeId)
    .eq("user_id", user.id);
  if (recipeError) return { error: toUserFacingError(recipeError, "recipe-save", "updateRecipe") };

  const { error: deleteIngredientsError } = await supabase
    .from("recipe_ingredients")
    .delete()
    .eq("recipe_id", recipeId);
  if (deleteIngredientsError) {
    return { error: toUserFacingError(deleteIngredientsError, "recipe-save", "deleteRecipeIngredients") };
  }

  const { totals: nutrition, estimatedFlags, cofidMeta } = await calculateRecipeNutritionWithMeta(
    ingredients,
    { aiEnabled: true },
  );

  const ingredientRows = buildIngredientRows(recipeId, ingredients, estimatedFlags, cofidMeta);
  const { error: insertIngredientsError } = await supabase
    .from("recipe_ingredients")
    .insert(ingredientRows);
  if (insertIngredientsError) {
    return { error: toUserFacingError(insertIngredientsError, "recipe-save", "insertRecipeIngredients") };
  }

  const { error: nutritionError } = await supabase.from("recipe_nutrition").upsert(
    {
      recipe_id: recipeId,
      calories: nutrition.calories,
      protein_g: nutrition.protein_g,
      carbs_g: nutrition.carbs_g,
      fat_g: nutrition.fat_g,
      fibre_g: nutrition.fibre_g,
      sugar_g: nutrition.sugar_g,
      sodium_mg: nutrition.sodium_mg,
      saturated_fat_g: nutrition.saturated_fat_g,
      coverage_pct: nutrition.coverage_pct,
    },
    { onConflict: "recipe_id" },
  );
  if (nutritionError) return { error: toUserFacingError(nutritionError, "recipe-save", "saveRecipeNutrition") };

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${recipeId}`);
  return { success: true, data: { id: recipeId }, message: "Recipe updated." };
}

export async function deleteRecipe(recipeId: string): Promise<ActionResult> {
  const id = recipeId.trim();
  if (!id) return { error: "Invalid recipe" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.from("recipes").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { error: toUserFacingError(error, "recipe-save", "recipeAction") };

  revalidatePath("/recipes");
  revalidatePath("/planner");
  return { success: true, message: "Recipe deleted." };
}

export async function archiveRecipe(recipeId: string): Promise<ActionResult> {
  const id = recipeId.trim();
  if (!id) return { error: "Invalid recipe" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("recipes")
    .update({ archived_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: toUserFacingError(error, "recipe-save", "recipeAction") };

  revalidatePath("/recipes");
  revalidatePath("/planner");
  return { success: true, message: "Recipe archived." };
}

/**
 * Permanently delete every recipe in the library, plus any planned meals that
 * referenced them. Unlike archiving this cannot be undone — it exists to give a
 * genuinely clean slate (e.g. re-testing generation from scratch), where leftover
 * archived rows would still skew library counts and duplicate checks.
 */
export async function deleteAllRecipes(): Promise<ActionResult<{ deleted: number }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Clear planner entries first so nothing is left pointing at a deleted recipe.
  // Done explicitly rather than relying on the FK's delete behaviour.
  const { data: plans } = await supabase.from("meal_plans").select("id").eq("user_id", user.id);
  const planIds = (plans ?? []).map((p) => p.id as string);
  if (planIds.length) {
    const { error: entriesError } = await supabase
      .from("meal_plan_entries")
      .delete()
      .in("meal_plan_id", planIds);
    if (entriesError) {
      return { error: toUserFacingError(entriesError, "week-plan", "deleteAllRecipes") };
    }
  }

  const { data, error } = await supabase
    .from("recipes")
    .delete()
    .eq("user_id", user.id)
    .select("id");

  if (error) return { error: toUserFacingError(error, "recipe-save", "deleteAllRecipes") };

  revalidatePath("/recipes");
  revalidatePath("/planner");
  revalidatePath("/today");
  revalidatePath("/grocery");

  const deleted = data?.length ?? 0;
  return {
    success: true,
    data: { deleted },
    message: deleted
      ? `Deleted ${deleted} recipe${deleted === 1 ? "" : "s"} and cleared your planner.`
      : "No recipes to delete.",
  };
}

/** Bulk-archive every AI-generated recipe. Individual archive/restore stays available. */
export async function archiveGeneratedRecipes(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("recipes")
    .update({ archived_at: now, updated_at: now })
    .eq("user_id", user.id)
    .in("recipe_source", ["ai", "generated"])
    .is("archived_at", null)
    .select("id");

  if (error) {
    // Databases without the recipe_source migration have no AI-generated recipes to archive.
    if (error.message.toLowerCase().includes("recipe_source")) {
      return { success: true, message: "No AI-generated recipes to archive." };
    }
    return { error: toUserFacingError(error, "recipe-save", "archiveGeneratedRecipes") };
  }

  revalidatePath("/recipes");
  revalidatePath("/planner");
  const count = data?.length ?? 0;
  return {
    success: true,
    message:
      count > 0
        ? `Archived ${count} AI-generated recipe${count === 1 ? "" : "s"}.`
        : "No AI-generated recipes to archive.",
  };
}

export async function toggleRecipeFavourite(
  recipeId: string,
  isFavourite: boolean,
): Promise<ActionResult> {
  const id = recipeId.trim();
  if (!id) return { error: "Invalid recipe" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("recipes")
    .update({ is_favourite: isFavourite, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: toUserFacingError(error, "recipe-save", "recipeAction") };

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${id}`);
  return { success: true, message: isFavourite ? "Added to favourites" : "Removed from favourites" };
}

export async function restoreRecipe(recipeId: string): Promise<ActionResult> {
  const id = recipeId.trim();
  if (!id) return { error: "Invalid recipe" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("recipes")
    .update({ archived_at: null, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: toUserFacingError(error, "recipe-save", "recipeAction") };

  revalidatePath("/recipes");
  revalidatePath("/planner");
  return { success: true, message: "Recipe restored." };
}

/** Recompute stored nutrition using corrected parser + CoFID matcher (current user only). */
export async function recomputeAllRecipeNutrition(): Promise<
  ActionResult<{ updated: number; significant: number }>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const recipes = await loadRecipesForRecompute(supabase, user.id);
  if (!recipes.length) {
    return { success: true, data: { updated: 0, significant: 0 }, message: "No recipes to update." };
  }

  let updated = 0;
  let significant = 0;

  for (const recipe of recipes) {
    const result = await recomputeRecipeMacros(recipe, { aiEnabled: false });
    const unchanged =
      !result.ingredientsChanged &&
      !result.cofidMatchesChanged &&
      Math.round(recipe.nutrition?.calories ?? 0) === result.newCalories;
    if (unchanged) continue;

    await applyRecipeRecompute(supabase, result);
    updated += 1;
    if (result.significantChange) significant += 1;
  }

  revalidatePath("/recipes");
  revalidatePath("/planner");
  revalidatePath("/today");
  return {
    success: true,
    data: { updated, significant },
    message: `Recalculated nutrition for ${updated} recipe${updated === 1 ? "" : "s"} (${significant} large shift${significant === 1 ? "" : "s"}).`,
  };
}
