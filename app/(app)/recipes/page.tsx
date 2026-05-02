import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { archiveRecipe, deleteRecipe, restoreRecipe } from "@/app/(app)/recipes/actions";
import { fetchRecipeNutritionMap } from "@/lib/supabase/recipe-nutrition-query";
import { getUserTier, getRecipeCount } from "@/lib/subscription";

type RecipeRow = {
  id: string;
  name: string;
  description: string | null;
  archived_at?: string | null;
  fits_vegetarian?: boolean | null;
  fits_vegan?: boolean | null;
  fits_gluten_free?: boolean | null;
};

type Props = { searchParams: Promise<{ view?: string }> };

export default async function RecipesPage({ searchParams }: Props) {
  const params = await searchParams;
  const showArchived = params.view === "archived";
  const supabase = await createClient();
  const [tier, count] = await Promise.all([getUserTier(), getRecipeCount()]);
  const showLimitWarning = tier === "free" && count >= 8;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let recipes: RecipeRow[] = [];
  if (user) {
    let query = supabase
      .from("recipes")
      .select("id,name,description,archived_at,fits_vegetarian,fits_vegan,fits_gluten_free")
      .order("created_at", { ascending: false });
    query = showArchived ? query.not("archived_at", "is", null) : query.is("archived_at", null);
    const { data } = await query;
    recipes = (data as RecipeRow[] | null) ?? [];
  }

  const nutritionByRecipeId =
    recipes.length > 0
      ? await fetchRecipeNutritionMap(
          supabase,
          recipes.map((r) => r.id),
        )
      : new Map();

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-gray-900">Recipes</h1>
          <p className="text-gray-600">
            {showArchived
              ? "Archived recipes are hidden from planner until restored."
              : "Create recipes and preview nutrition as you add ingredients."}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href={showArchived ? "/recipes" : "/recipes?view=archived"}
            className="inline-flex h-10 flex-1 items-center justify-center rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:flex-initial"
          >
            {showArchived ? "Active recipes" : "Archived recipes"}
          </Link>
          {!showArchived ? (
            <Link
              href="/recipes/new"
              className="inline-flex h-10 flex-1 items-center justify-center rounded-md bg-[var(--brand-sage)] px-4 text-sm font-medium text-white hover:opacity-95 sm:flex-initial"
            >
              New Recipe
            </Link>
          ) : null}
        </div>
      </div>
      {showLimitWarning && !showArchived ? (
        <div
          className={`mb-4 flex items-center justify-between gap-3 rounded-lg border p-3 text-sm ${
            count >= 10
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-amber-200 bg-amber-50 text-amber-700"
          }`}
        >
          <span>
            {count >= 10
              ? "Recipe limit reached - upgrade to add more"
              : `${count} of 10 free recipes used`}
          </span>
          <Link
            href="/billing"
            className="whitespace-nowrap text-xs font-semibold underline underline-offset-2"
          >
            Upgrade →
          </Link>
        </div>
      ) : null}
      {!recipes.length ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
          {showArchived
            ? "No archived recipes yet."
            : "No recipes yet. Create your first one to start planning meals."}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {recipes.map((recipe) => {
            const nutrition = nutritionByRecipeId.get(recipe.id) ?? null;
            return (
              <article key={recipe.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="text-lg font-semibold text-gray-900">{recipe.name}</h3>
                  <div className="flex flex-wrap gap-1">
                    {recipe.fits_vegan ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                        Vegan
                      </span>
                    ) : recipe.fits_vegetarian ? (
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-800">
                        Vegetarian
                      </span>
                    ) : null}
                    {recipe.fits_gluten_free ? (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-900">
                        Gluten-free
                      </span>
                    ) : null}
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray-600">{recipe.description ?? "No description"}</p>
                <p className="mt-3 text-sm text-gray-700">
                  Calories:{" "}
                  {nutrition?.calories != null ? nutrition.calories.toFixed(1) : "—"} | Protein:{" "}
                  {nutrition?.protein_g != null ? `${nutrition.protein_g.toFixed(1)}g` : "—"}
                </p>
                <p className="text-xs text-gray-500">
                  Total kcal intake:{" "}
                  {nutrition?.calories != null ? `${nutrition.calories.toFixed(1)} kcal` : "—"}
                </p>
                <Link
                  href={`/recipes/${recipe.id}`}
                  className="mt-3 inline-flex h-8 items-center justify-center rounded-md border border-gray-300 bg-white px-3 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  View macros & micros
                </Link>
                {showArchived ? (
                  <form className="inline-block" action={restoreRecipe.bind(null, recipe.id)}>
                    <button
                      type="submit"
                      className="ml-2 mt-3 inline-flex h-8 items-center justify-center rounded-md border border-[#1A4731] bg-[#F0FDF4] px-3 text-xs font-medium text-[#1A4731] hover:bg-[#dcfce7]"
                    >
                      Restore
                    </button>
                  </form>
                ) : (
                  <>
                    <form className="inline-block" action={archiveRecipe.bind(null, recipe.id)}>
                      <button
                        type="submit"
                        className="ml-2 mt-3 inline-flex h-8 items-center justify-center rounded-md border border-amber-300 bg-amber-50 px-3 text-xs font-medium text-amber-700 hover:bg-amber-100"
                      >
                        Archive
                      </button>
                    </form>
                    <form className="inline-block" action={deleteRecipe.bind(null, recipe.id)}>
                      <button
                        type="submit"
                        className="ml-2 mt-3 inline-flex h-8 items-center justify-center rounded-md border border-red-300 bg-red-50 px-3 text-xs font-medium text-red-700 hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </form>
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
