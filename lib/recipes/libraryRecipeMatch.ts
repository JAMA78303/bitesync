import type { GoalMealSlot, GoalMatchedRecipeOptions } from "@/lib/ai/goal-matched-recipe";
import {
  GOAL_MEAL_KCAL_TOLERANCE,
  buildGoalMatchedRecipeIngredients,
  buildGoalMatchedRecipeTitle,
} from "@/lib/ai/goal-matched-recipe";
import type { RecipeIngredientInput } from "@/lib/nutrition/calculate";
import { recipeMatchesPlannerSlot } from "@/lib/planner/meal-slot-eligibility";
import type { SupabaseClient } from "@supabase/supabase-js";

export type LibraryRecipeMatch = {
  recipeId: string;
  name: string;
  ingredients: RecipeIngredientInput[];
  calories: number;
};

function normalizeDraftUnit(unit: string): string {
  const u = unit.trim().toLowerCase();
  if (u === "piece" || u === "pieces") return "each";
  return unit.trim() || "g";
}

function recipePassesDiet(
  recipe: {
    fits_vegan: boolean | null;
    fits_vegetarian: boolean | null;
    fits_gluten_free: boolean | null;
  },
  vegan: boolean,
  vegetarian: boolean,
  glutenFree: boolean,
): boolean {
  if (vegan && recipe.fits_vegan === false) return false;
  if (vegetarian && !vegan && recipe.fits_vegetarian === false) return false;
  if (glutenFree && recipe.fits_gluten_free === false) return false;
  return true;
}

export async function loadLibraryRecipesForMatch(
  supabase: SupabaseClient,
  userId: string,
): Promise<
  {
    id: string;
    name: string;
    fits_vegan: boolean | null;
    fits_vegetarian: boolean | null;
    fits_gluten_free: boolean | null;
    calories: number | null;
    ingredientNames: string[];
    ingredients: RecipeIngredientInput[];
  }[]
> {
  const { data: recipes } = await supabase
    .from("recipes")
    .select("id,name,fits_vegetarian,fits_vegan,fits_gluten_free")
    .eq("user_id", userId)
    .is("archived_at", null)
    .order("name", { ascending: true });

  if (!recipes?.length) return [];

  const ids = recipes.map((r) => r.id);
  const [nutritionResult, ingredientsResult] = await Promise.all([
    supabase.from("recipe_nutrition").select("recipe_id,calories").in("recipe_id", ids),
    supabase.from("recipe_ingredients").select("recipe_id,name,quantity,unit").in("recipe_id", ids),
  ]);

  const caloriesByRecipe = new Map<string, number>();
  for (const row of nutritionResult.data ?? []) {
    caloriesByRecipe.set(String(row.recipe_id), Number(row.calories ?? 0));
  }

  const ingredientsByRecipe = new Map<string, RecipeIngredientInput[]>();
  const namesByRecipe = new Map<string, string[]>();
  for (const row of ingredientsResult.data ?? []) {
    const rid = String(row.recipe_id ?? "");
    if (!rid) continue;
    const name = String(row.name ?? "").trim();
    const list = ingredientsByRecipe.get(rid) ?? [];
    list.push({
      name,
      quantity: Number(row.quantity ?? 0),
      unit: normalizeDraftUnit(String(row.unit ?? "g")),
    });
    ingredientsByRecipe.set(rid, list);
    const names = namesByRecipe.get(rid) ?? [];
    if (name) names.push(name);
    namesByRecipe.set(rid, names);
  }

  return recipes
    .map((recipe) => ({
      id: recipe.id,
      name: recipe.name,
      fits_vegan: recipe.fits_vegan,
      fits_vegetarian: recipe.fits_vegetarian,
      fits_gluten_free: recipe.fits_gluten_free,
      calories: caloriesByRecipe.get(recipe.id) ?? null,
      ingredientNames: namesByRecipe.get(recipe.id) ?? [],
      ingredients: ingredientsByRecipe.get(recipe.id) ?? [],
    }))
    .filter((r) => r.ingredients.length > 0);
}

/** Prefer a saved library recipe over macro-assembly when one fits slot + targets. */
export function pickLibraryRecipeForSlot(
  recipes: Awaited<ReturnType<typeof loadLibraryRecipesForMatch>>,
  opts: {
    mealSlot: GoalMealSlot;
    targetCalories: number;
    vegan: boolean;
    vegetarian: boolean;
    glutenFree: boolean;
    variantSeed: number;
  },
): LibraryRecipeMatch | null {
  const eligible = recipes.filter((recipe) => {
    if (!recipePassesDiet(recipe, opts.vegan, opts.vegetarian, opts.glutenFree)) return false;
    if (!recipe.ingredientNames.length) return false;
    if (
      !recipeMatchesPlannerSlot(
        recipe.name,
        recipe.ingredientNames,
        opts.mealSlot,
        recipe.calories,
      )
    ) {
      return false;
    }
    const cal = recipe.calories;
    if (cal == null || cal <= 0) return false;
    return Math.abs(cal - opts.targetCalories) <= GOAL_MEAL_KCAL_TOLERANCE * 1.5;
  });

  if (!eligible.length) return null;

  eligible.sort((a, b) => {
    const da = Math.abs((a.calories ?? 0) - opts.targetCalories);
    const db = Math.abs((b.calories ?? 0) - opts.targetCalories);
    if (da !== db) return da - db;
    return a.name.localeCompare(b.name);
  });

  const bucketSize = Math.min(5, eligible.length);
  const pick = eligible[(opts.variantSeed >>> 0) % bucketSize]!;

  return {
    recipeId: pick.id,
    name: pick.name,
    ingredients: pick.ingredients.map((i) => ({ ...i })),
    calories: pick.calories ?? 0,
  };
}

/** Library recipe first; macro-assembly fallback when nothing fits. */
export async function resolveGoalMatchedDraft(
  supabase: SupabaseClient,
  userId: string,
  opts: GoalMatchedRecipeOptions & { preferLibrary?: boolean },
): Promise<{ ingredients: RecipeIngredientInput[]; name: string; source: "library" | "assembled" }> {
  const preferLibrary = opts.preferLibrary !== false && !opts.microFocusKey?.trim();

  if (preferLibrary) {
    const library = await loadLibraryRecipesForMatch(supabase, userId);
    const matched = pickLibraryRecipeForSlot(library, {
      mealSlot: opts.mealSlot,
      targetCalories: opts.targetCalories,
      vegan: opts.vegan,
      vegetarian: opts.vegetarian,
      glutenFree: opts.glutenFree,
      variantSeed: opts.variantSeed,
    });
    if (matched) {
      return { ingredients: matched.ingredients, name: matched.name, source: "library" };
    }
  }

  const ingredients = await buildGoalMatchedRecipeIngredients(opts);
  return {
    ingredients,
    name: buildGoalMatchedRecipeTitle(ingredients, opts.mealSlot),
    source: "assembled",
  };
}
