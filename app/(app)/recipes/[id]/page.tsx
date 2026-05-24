import { notFound } from "next/navigation";
import { archiveRecipe, deleteRecipe } from "@/app/(app)/recipes/actions";
import { RecipeDetailView } from "@/components/recipes/RecipeDetailView";
import { initialDietaryPreferencesFromProfile } from "@/lib/dietary/constraints";
import { fetchRecipeNutritionForRecipe } from "@/lib/supabase/recipe-nutrition-query";
import { getProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";

type RecipePageProps = { params: Promise<{ id: string }> };

export default async function RecipeDetailPage({ params }: RecipePageProps) {
  const raw = (await params).id;
  const id = typeof raw === "string" ? raw.trim() : "";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();
  if (!id) notFound();

  const [profile, { data: recipe }] = await Promise.all([
    getProfile(),
    supabase
      .from("recipes")
      .select(
        "id,name,description,servings,source_url,source_domain,imported_at,detected_servings,cooking_for",
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .is("archived_at", null)
      .single(),
  ]);

  if (!recipe) notFound();

  const { data: ingredientRows } = await supabase
    .from("recipe_ingredients")
    .select("id,name,quantity,unit,nutrition_estimated,cofid_food_name,cofid_matched_by")
    .eq("recipe_id", recipe.id)
    .order("id", { ascending: true });

  const ingredients = (ingredientRows ?? []) as {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    nutrition_estimated?: boolean | null;
    cofid_food_name?: string | null;
    cofid_matched_by?: string | null;
  }[];

  const nutrition = await fetchRecipeNutritionForRecipe(supabase, recipe.id);
  const dietaryPreferences = initialDietaryPreferencesFromProfile(profile);

  return (
    <RecipeDetailView
      recipe={recipe}
      ingredients={ingredients}
      nutrition={
        nutrition
          ? {
              calories: nutrition.calories,
              protein_g: nutrition.protein_g,
              carbs_g: nutrition.carbs_g ?? null,
              fat_g: nutrition.fat_g ?? null,
            }
          : null
      }
      dietaryPreferences={dietaryPreferences}
      editHref={`/recipes/${recipe.id}/edit`}
      archiveAction={
        <form action={archiveRecipe.bind(null, recipe.id)}>
          <button
            type="submit"
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 text-lg text-gray-400 hover:text-amber-600 dark:border-gray-700"
            aria-label="Archive recipe"
          >
            📦
          </button>
        </form>
      }
      deleteAction={
        <form action={deleteRecipe.bind(null, recipe.id)}>
          <button
            type="submit"
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 text-lg text-gray-400 hover:text-red-500 dark:border-gray-700"
            aria-label="Delete recipe"
          >
            🗑️
          </button>
        </form>
      }
    />
  );
}
