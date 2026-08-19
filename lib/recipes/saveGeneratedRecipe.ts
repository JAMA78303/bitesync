import type { SupabaseClient } from "@supabase/supabase-js";
import type { RecipeIngredientInput } from "@/lib/nutrition/calculate";
import { calculateRecipeNutritionWithMeta } from "@/lib/nutrition/asyncTotals";

export type GeneratedRecipeInsert = {
  name: string;
  description: string | null;
  ingredients: RecipeIngredientInput[];
  steps?: string[];
  recipeSource?: "ai" | "import" | "manual";
  fitsVegetarian?: boolean | null;
  fitsVegan?: boolean | null;
  fitsGlutenFree?: boolean | null;
};

function isMissingMethodStepsColumn(message: string | undefined): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return m.includes("method_steps") || m.includes("recipe_source");
}

/** Insert a generated recipe with nutrition rows; retries without optional columns when migration pending. */
export async function insertGeneratedRecipe(
  supabase: SupabaseClient,
  userId: string,
  recipe: GeneratedRecipeInsert,
): Promise<{ id: string } | null> {
  const ingredients = recipe.ingredients.filter(
    (i) => i.name.trim() && Number.isFinite(i.quantity) && i.quantity > 0,
  );
  if (!ingredients.length) return null;

  const baseRow = {
    user_id: userId,
    name: recipe.name.trim(),
    description: recipe.description?.trim() || null,
    servings: 1,
    fits_vegetarian: recipe.fitsVegetarian === true ? true : null,
    fits_vegan: recipe.fitsVegan === true ? true : null,
    fits_gluten_free: recipe.fitsGlutenFree === true ? true : null,
    source_type: "generated" as const,
  };

  const withSteps = {
    ...baseRow,
    method_steps: recipe.steps ?? [],
    recipe_source: recipe.recipeSource ?? "ai",
  };

  let row: { id: string } | null = null;
  let recipeError: { message?: string } | null = null;

  const first = await supabase.from("recipes").insert(withSteps).select("id").single();
  if (first.error) {
    if (isMissingMethodStepsColumn(first.error.message)) {
      const retry = await supabase.from("recipes").insert(baseRow).select("id").single();
      row = retry.data;
      recipeError = retry.error;
    } else {
      recipeError = first.error;
    }
  } else {
    row = first.data;
  }

  if (recipeError || !row) {
    console.warn("[insertGeneratedRecipe]", recipeError?.message);
    return null;
  }

  const { totals, estimatedFlags, cofidMeta } = await calculateRecipeNutritionWithMeta(ingredients, {
    aiEnabled: true,
  });

  const ingredientRows = ingredients.map((ingredient, i) => ({
    recipe_id: row!.id,
    name: ingredient.name.trim(),
    quantity: ingredient.quantity,
    unit: (ingredient.unit ?? "g").trim(),
    nutrition_estimated: estimatedFlags[i] ?? false,
    cofid_food_name: cofidMeta[i]?.cofid_food_name ?? null,
    cofid_matched_by: cofidMeta[i]?.cofid_matched_by ?? null,
  }));

  const { error: ingError } = await supabase.from("recipe_ingredients").insert(ingredientRows);
  if (ingError) {
    console.warn("[insertGeneratedRecipe] ingredients:", ingError.message);
    return null;
  }

  // Derive the stored nutrition from the rows that actually landed, not from the
  // in-memory draft. A recipe whose macros describe ingredients its own list does
  // not contain is worse than a missing figure: every calorie and protein target
  // in the app is computed from these numbers.
  const { data: storedIngredients } = await supabase
    .from("recipe_ingredients")
    .select("name,quantity,unit")
    .eq("recipe_id", row.id);

  let finalTotals = totals;
  if (storedIngredients?.length) {
    const stored = storedIngredients.map((i) => ({
      name: String(i.name ?? ""),
      quantity: Number(i.quantity ?? 0),
      unit: String(i.unit ?? "g"),
    }));
    if (stored.length !== ingredients.length) {
      console.warn(
        `[insertGeneratedRecipe] stored ${stored.length} of ${ingredients.length} ingredients for "${recipe.name}" — recomputing nutrition from stored rows`,
      );
    }
    const recomputed = await calculateRecipeNutritionWithMeta(stored, { aiEnabled: true });
    finalTotals = recomputed.totals;
  }

  const { error: nutritionError } = await supabase.from("recipe_nutrition").upsert(
    {
      recipe_id: row.id,
      calories: finalTotals.calories,
      protein_g: finalTotals.protein_g,
      carbs_g: finalTotals.carbs_g,
      fat_g: finalTotals.fat_g,
      fibre_g: finalTotals.fibre_g,
      sugar_g: finalTotals.sugar_g,
      sodium_mg: finalTotals.sodium_mg,
      saturated_fat_g: finalTotals.saturated_fat_g,
      coverage_pct: finalTotals.coverage_pct,
    },
    { onConflict: "recipe_id" },
  );

  if (nutritionError) {
    console.warn("[insertGeneratedRecipe] nutrition:", nutritionError.message);
    return null;
  }

  return { id: row.id };
}
