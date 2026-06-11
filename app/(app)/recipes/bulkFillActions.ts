"use server";

import { revalidatePath } from "next/cache";
import { randomInt } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import type { RecipeIngredientInput } from "@/lib/nutrition/calculate";
import { getDailyCalorieTarget } from "@/lib/utils/nutrition-targets";
import { getProfile } from "@/lib/supabase/profile";
import { canCreateRecipe, getRecipeCount, getUserTier } from "@/lib/subscription";
import { initialDietaryPreferencesFromProfile } from "@/lib/dietary/constraints";
import {
  defaultBulkRecipeCount,
  hardConstraintsFromPreferences,
  ingredientSignature,
  planBulkFillBatch,
  type BulkFillSlotPlan,
  type ExistingLibrarySnapshot,
} from "@/lib/recipes/bulkFillLibrary";
import { generateHybridRecipeDraft, type HybridRecipeDraft } from "@/lib/recipes/hybridRecipeEngine";
import { insertGeneratedRecipe } from "@/lib/recipes/saveGeneratedRecipe";
import type { ActionResult } from "@/types";

function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function loadExistingLibrarySnapshot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<ExistingLibrarySnapshot> {
  const { data: recipes } = await supabase
    .from("recipes")
    .select("id,name")
    .eq("user_id", userId)
    .is("archived_at", null);

  const ids = (recipes ?? []).map((r) => r.id);
  const names = (recipes ?? []).map((r) => r.name);

  if (!ids.length) {
    return { names: [], signatures: [] };
  }

  const { data: rows } = await supabase
    .from("recipe_ingredients")
    .select("recipe_id,name")
    .in("recipe_id", ids);

  const byRecipe = new Map<string, RecipeIngredientInput[]>();
  for (const row of rows ?? []) {
    const list = byRecipe.get(row.recipe_id) ?? [];
    list.push({ name: row.name, quantity: 1, unit: "g" });
    byRecipe.set(row.recipe_id, list);
  }

  const signatures = ids.map((id) => ingredientSignature(byRecipe.get(id) ?? []));

  return { names, signatures };
}

export async function planFillMyLibrary(
  count?: number,
): Promise<
  ActionResult<{
    slots: BulkFillSlotPlan[];
    hardConstraints: ReturnType<typeof hardConstraintsFromPreferences>;
    dailyCalorieTarget: number;
    defaultCount: number;
  }>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const profile = await getProfile();
  const daily = getDailyCalorieTarget(profile);
  if (daily == null || !Number.isFinite(Number(daily)) || daily < 800) {
    return {
      error: "Set a daily calorie target in Settings first — we size each meal to a share of your day.",
    };
  }

  const prefs = initialDietaryPreferencesFromProfile(profile);
  const hard = hardConstraintsFromPreferences(prefs);
  const baseSeed = randomInt(0, 0x7fff_fffe) >>> 0;
  const slots = planBulkFillBatch(count ?? defaultBulkRecipeCount(), hard, baseSeed);

  return {
    success: true,
    data: {
      slots,
      hardConstraints: hard,
      dailyCalorieTarget: Number(daily),
      defaultCount: defaultBulkRecipeCount(),
    },
  };
}

export async function generateFillLibrarySlot(payload: {
  slot: BulkFillSlotPlan;
  hardConstraints: ReturnType<typeof hardConstraintsFromPreferences>;
  dailyCalorieTarget: number;
  acceptedDrafts: HybridRecipeDraft[];
}): Promise<ActionResult<HybridRecipeDraft>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const existing = await loadExistingLibrarySnapshot(supabase, user.id);

  const draft = await generateHybridRecipeDraft({
    slot: payload.slot,
    hard: payload.hardConstraints,
    targetDailyCalories: payload.dailyCalorieTarget,
    existing,
    acceptedInBatch: payload.acceptedDrafts,
    useLlmMethod: true,
    requireFullLlmRecipe: payload.slot.mealSlot === "snack",
  });

  if (!draft) {
    return { error: `Could not generate a unique recipe for ${payload.slot.label}. Skipped.` };
  }

  return { success: true, data: draft };
}

export type BulkSaveRecipeInput = {
  name: string;
  description: string;
  ingredients: RecipeIngredientInput[];
  steps?: string[];
  fitsVegetarian?: boolean;
  fitsVegan?: boolean;
  fitsGlutenFree?: boolean;
};

export async function saveFillLibraryRecipes(
  recipes: BulkSaveRecipeInput[],
): Promise<
  ActionResult<{
    saved: { id: string; name: string }[];
    failed: { name: string; error: string }[];
  }>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  if (!recipes.length) {
    return { error: "Select at least one recipe to save." };
  }

  const saved: { id: string; name: string }[] = [];
  const failed: { name: string; error: string }[] = [];

  for (const recipe of recipes) {
    const name = toTitleCase(recipe.name.trim());
    if (!name) {
      failed.push({ name: recipe.name || "(unnamed)", error: "Name required" });
      continue;
    }

    const ingredients = recipe.ingredients.filter(
      (i) => i.name.trim() && Number.isFinite(i.quantity) && i.quantity > 0,
    );
    if (!ingredients.length) {
      failed.push({ name, error: "No valid ingredients" });
      continue;
    }

    const [tier, allowed] = await Promise.all([getUserTier(), canCreateRecipe()]);
    if (tier === "free" && !allowed) {
      failed.push({
        name,
        error: "Recipe limit reached — upgrade to Pro or save fewer recipes.",
      });
      break;
    }

    const inserted = await insertGeneratedRecipe(supabase, user.id, {
      name,
      description: recipe.description.trim() || null,
      ingredients,
      steps: recipe.steps,
      recipeSource: "ai",
      fitsVegetarian: recipe.fitsVegetarian === true ? true : null,
      fitsVegan: recipe.fitsVegan === true ? true : null,
      fitsGlutenFree: recipe.fitsGlutenFree === true ? true : null,
    });

    if (!inserted) {
      failed.push({ name, error: "Insert failed" });
      continue;
    }

    saved.push({ id: inserted.id, name });
  }

  revalidatePath("/recipes");

  return {
    success: true,
    data: { saved, failed },
    message:
      failed.length === 0
        ? `Saved ${saved.length} recipe${saved.length === 1 ? "" : "s"}.`
        : `Saved ${saved.length}; ${failed.length} failed.`,
  };
}

export async function getFillLibraryPreflight(): Promise<
  ActionResult<{ canGenerate: boolean; recipeCount: number; message?: string }>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const [profile, count, tier, allowed] = await Promise.all([
    getProfile(),
    getRecipeCount(),
    getUserTier(),
    canCreateRecipe(),
  ]);

  const daily = getDailyCalorieTarget(profile);
  if (daily == null || daily < 800) {
    return {
      success: true,
      data: {
        canGenerate: false,
        recipeCount: count,
        message: "Set your daily calorie target in Settings first.",
      },
    };
  }

  if (tier === "free" && !allowed) {
    return {
      success: true,
      data: {
        canGenerate: false,
        recipeCount: count,
        message: "Recipe limit reached (10). Upgrade to Pro or archive recipes.",
      },
    };
  }

  return { success: true, data: { canGenerate: true, recipeCount: count } };
}
