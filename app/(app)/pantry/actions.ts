"use server";

import { toUserFacingError } from "@/lib/errors/userFacing";

import { revalidatePath } from "next/cache";
import { initialDietaryPreferencesFromProfile } from "@/lib/dietary/constraints";
import { parseBulkIngredientInput } from "@/lib/matching/ingredient-overlap";
import {
  suggestMealsFromAvailableIngredients,
  namesToAvailableIngredients,
  type SuggestMealsResult,
} from "@/lib/matching/suggest-meals";
import { PANTRY_STAPLES } from "@/lib/pantry/constants";
import {
  addPantryItem,
  getPantryItems,
  pantryRowToAvailable,
  removePantryItem,
  seedPantryStaples,
  togglePantryRunningLow,
} from "@/lib/supabase/pantry";
import { getProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types";

async function loadRecipeCandidates(userId: string) {
  const supabase = await createClient();

  const { data: recipes } = await supabase
    .from("recipes")
    .select("id,name,fits_vegetarian,fits_vegan,fits_gluten_free")
    .eq("user_id", userId)
    .is("archived_at", null)
    .order("name", { ascending: true });

  if (!recipes?.length) return [];

  const ids = recipes.map((r) => r.id);
  const { data: ingredientRows } = await supabase
    .from("recipe_ingredients")
    .select("recipe_id,name")
    .in("recipe_id", ids);

  const byRecipe = new Map<string, { name: string }[]>();
  for (const row of ingredientRows ?? []) {
    const list = byRecipe.get(row.recipe_id) ?? [];
    list.push({ name: String(row.name ?? "") });
    byRecipe.set(row.recipe_id, list);
  }

  return recipes.map((recipe) => ({
    id: recipe.id,
    name: recipe.name,
    fits_vegetarian: recipe.fits_vegetarian,
    fits_vegan: recipe.fits_vegan,
    fits_gluten_free: recipe.fits_gluten_free,
    ingredients: byRecipe.get(recipe.id) ?? [],
  }));
}

async function runMatchForAvailable(
  available: ReturnType<typeof namesToAvailableIngredients>,
): Promise<ActionResult<SuggestMealsResult>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  if (!available.length) {
    return { error: "Add at least one ingredient to get suggestions." };
  }

  const [profile, recipes] = await Promise.all([getProfile(), loadRecipeCandidates(user.id)]);
  const dietaryPreferences = initialDietaryPreferencesFromProfile(profile);

  const result = suggestMealsFromAvailableIngredients(available, recipes, {
    dietaryPreferences,
    limit: 8,
  });

  return { success: true, data: result };
}

export async function addPantryItemsFromText(raw: string): Promise<ActionResult<{ added: number }>> {
  const parsed = parseBulkIngredientInput(raw);
  if (!parsed.length) return { error: "Could not parse any ingredients from that text." };

  const existing = new Set((await getPantryItems()).map((row) => row.name.toLowerCase()));
  let added = 0;

  for (const item of parsed) {
    if (existing.has(item.name.toLowerCase())) continue;
    const result = await addPantryItem({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit ?? "",
    });
    if (!result.error) {
      added += 1;
      existing.add(item.name.toLowerCase());
    }
  }

  revalidatePath("/pantry");
  if (!added) return { error: "Those items are already in your pantry." };
  return { success: true, data: { added }, message: `Added ${added} item${added === 1 ? "" : "s"}.` };
}

export async function addPantryStaple(name: string): Promise<ActionResult> {
  const result = await addPantryItem({ name });
  if (result.error) return { error: result.error };
  return { success: true };
}

export async function deletePantryItem(itemId: string): Promise<ActionResult> {
  const result = await removePantryItem(itemId);
  if (result.error) return { error: result.error };
  return { success: true };
}

export async function setPantryRunningLow(
  itemId: string,
  runningLow: boolean,
): Promise<ActionResult> {
  const result = await togglePantryRunningLow(itemId, runningLow);
  if (result.error) return { error: result.error };
  return { success: true };
}

export async function seedCommonPantryStaples(): Promise<ActionResult<{ added: number }>> {
  const result = await seedPantryStaples();
  if (result.error) return { error: result.error };
  return {
    success: true,
    data: { added: result.added ?? 0 },
    message: result.added ? `Added ${result.added} staples.` : "Staples already in your pantry.",
  };
}

export async function suggestMealsFromPantry(): Promise<ActionResult<SuggestMealsResult>> {
  const items = await getPantryItems();
  const available = items.map(pantryRowToAvailable);
  return runMatchForAvailable(available);
}

/** AGD-002: match unchecked grocery items only (checked = bought/used). */
export async function suggestMealsFromLeftovers(
  mealPlanId: string,
): Promise<ActionResult<SuggestMealsResult>> {
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
    .maybeSingle();

  if (!plan) return { error: "Meal plan not found" };

  const { data: items, error } = await supabase
    .from("grocery_items")
    .select("name,is_checked,archived_at")
    .eq("meal_plan_id", mealPlanId)
    .is("archived_at", null)
    .eq("is_checked", false);

  if (error) return { error: toUserFacingError(error, "pantry", "addPantryToGrocery") };

  const uncheckedNames = (items ?? []).map((row) => String(row.name ?? "")).filter(Boolean);
  if (!uncheckedNames.length) {
    return { error: "No unchecked grocery items — everything is in your basket or the list is empty." };
  }

  const available = namesToAvailableIngredients(uncheckedNames);
  return runMatchForAvailable(available);
}
