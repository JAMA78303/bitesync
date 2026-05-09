"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calculateRecipeNutrition, type RecipeIngredientInput } from "@/lib/nutrition/calculate";
import {
  buildGoalMatchedRecipeIngredients,
  fractionForMealSlot,
  type GoalMealSlot,
} from "@/lib/ai/goal-matched-recipe";
import { randomInt } from "node:crypto";
import { canCreateRecipe, getRecipeCount, getUserTier } from "@/lib/subscription";
import { getProfile } from "@/lib/supabase/profile";
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
  importedAt?: string;
};

type UpdateRecipePayload = CreateRecipePayload & { recipeId: string };

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

export async function generateGoalMatchedRecipeDraft(payload: {
  mealSlot: GoalMealSlot;
  fitsVegan: boolean;
  fitsVegetarian: boolean;
  fitsGlutenFree: boolean;
  /** Optional; XORed with draftNonce on the server for extra entropy. */
  variationSeed?: number;
  /** Fresh UUID each click so templates rotate reliably (server actions may reuse timing-only seeds). */
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  if (!GOAL_MEAL_SLOTS.includes(payload.mealSlot)) {
    return { error: "Invalid meal slot." };
  }

  const profile = await getProfile();
  const daily = profile?.daily_calorie_target;
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

  const ingredients = buildGoalMatchedRecipeIngredients({
    targetCalories: targetMealCalories,
    mealSlot: payload.mealSlot,
    vegan,
    vegetarian,
    glutenFree,
    variantSeed,
  });

  const totals = calculateRecipeNutrition(ingredients);

  return {
    success: true,
    data: {
      name: "",
      description: "",
      ingredients,
      targetMealCalories,
      achievedCalories: Math.round(totals.calories * 10) / 10,
      achievedProteinG: Math.round(totals.protein_g * 10) / 10,
    },
  };
}

export async function createRecipe(
  payload: CreateRecipePayload,
): Promise<ActionResult<{ id: string }>> {
  const name = toTitleCase(payload.name.trim());
  const description = payload.description.trim();
  const ingredients = payload.ingredients.filter(
    (ingredient) =>
      ingredient.name.trim() && Number.isFinite(ingredient.quantity) && ingredient.quantity > 0,
  );

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
    return { error: recipeError?.message ?? "Failed to create recipe." };
  }

  const ingredientRows = ingredients.map((ingredient) => ({
    recipe_id: recipe.id,
    name: toTitleCase(ingredient.name.trim()),
    quantity: ingredient.quantity,
    unit: ingredient.unit.trim(),
  }));

  const { error: ingredientsError } = await supabase
    .from("recipe_ingredients")
    .insert(ingredientRows);

  if (ingredientsError) {
    return { error: ingredientsError.message };
  }

  const nutrition = calculateRecipeNutrition(ingredients);
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
    return { error: nutritionError.message };
  }

  revalidatePath("/recipes");
  return { success: true, data: { id: recipe.id }, message: "Recipe created." };
}

export async function updateRecipe(payload: UpdateRecipePayload): Promise<ActionResult<{ id: string }>> {
  const recipeId = payload.recipeId.trim();
  const name = toTitleCase(payload.name.trim());
  const description = payload.description.trim();
  const ingredients = payload.ingredients.filter(
    (ingredient) =>
      ingredient.name.trim() && Number.isFinite(ingredient.quantity) && ingredient.quantity > 0,
  );

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
  if (recipeError) return { error: recipeError.message };

  const { error: deleteIngredientsError } = await supabase
    .from("recipe_ingredients")
    .delete()
    .eq("recipe_id", recipeId);
  if (deleteIngredientsError) return { error: deleteIngredientsError.message };

  const ingredientRows = ingredients.map((ingredient) => ({
    recipe_id: recipeId,
    name: toTitleCase(ingredient.name.trim()),
    quantity: ingredient.quantity,
    unit: ingredient.unit.trim(),
  }));
  const { error: insertIngredientsError } = await supabase
    .from("recipe_ingredients")
    .insert(ingredientRows);
  if (insertIngredientsError) return { error: insertIngredientsError.message };

  const nutrition = calculateRecipeNutrition(ingredients);
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
  if (nutritionError) return { error: nutritionError.message };

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${recipeId}`);
  return { success: true, data: { id: recipeId }, message: "Recipe updated." };
}

export async function deleteRecipe(recipeId: string): Promise<void> {
  const id = recipeId.trim();
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  await supabase.from("recipes").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/recipes");
  redirect("/recipes");
}

export async function archiveRecipe(recipeId: string): Promise<void> {
  const id = recipeId.trim();
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  await supabase
    .from("recipes")
    .update({ archived_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/recipes");
  revalidatePath("/planner");
  redirect("/recipes");
}

export async function restoreRecipe(recipeId: string): Promise<void> {
  const id = recipeId.trim();
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  await supabase
    .from("recipes")
    .update({ archived_at: null, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/recipes");
  revalidatePath("/planner");
  redirect("/recipes?view=archived");
}
