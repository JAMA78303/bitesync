import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { archiveRecipe, deleteRecipe, restoreRecipe } from "@/app/(app)/recipes/actions";

type RecipeRow = {
  id: string;
  name: string;
  description: string | null;
  archived_at?: string | null;
  recipe_nutrition: { calories: number | null; protein_g: number | null; coverage_pct: number | null }[] | null;
};

type Props = { searchParams: Promise<{ view?: string }> };

export default async function RecipesPage({ searchParams }: Props) {
  const params = await searchParams;
  const showArchived = params.view === "archived";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let recipes: RecipeRow[] = [];
  if (user) {
    let query = supabase
      .from("recipes")
      .select("id,name,description,archived_at,recipe_nutrition(calories,protein_g,coverage_pct)")
      .order("created_at", { ascending: false });
    query = showArchived ? query.not("archived_at", "is", null) : query.is("archived_at", null);
    const { data } = await query;
    recipes = (data as RecipeRow[] | null) ?? [];
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Recipes</h1>
          <p className="text-gray-600">
            {showArchived
              ? "Archived recipes are hidden from planner until restored."
              : "Create recipes and preview nutrition as you add ingredients."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={showArchived ? "/recipes" : "/recipes?view=archived"}
            className="inline-flex h-10 items-center justify-center rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {showArchived ? "Active recipes" : "Archived recipes"}
          </Link>
          {!showArchived ? (
            <Link
              href="/recipes/new"
              className="inline-flex h-10 items-center justify-center rounded-md bg-[var(--brand-sage)] px-4 text-sm font-medium text-white hover:opacity-95"
            >
              New Recipe
            </Link>
          ) : null}
        </div>
      </div>
      {!recipes.length ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
          {showArchived
            ? "No archived recipes yet."
            : "No recipes yet. Create your first one to start planning meals."}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {recipes.map((recipe) => {
            const nutrition = recipe.recipe_nutrition?.[0];
            return (
              <article key={recipe.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900">{recipe.name}</h3>
                <p className="mt-1 text-sm text-gray-600">{recipe.description ?? "No description"}</p>
                <p className="mt-3 text-sm text-gray-700">
                  Calories: {nutrition?.calories?.toFixed(1) ?? "0.0"} | Protein:{" "}
                  {nutrition?.protein_g?.toFixed(1) ?? "0.0"}g
                </p>
                <p className="text-xs text-gray-500">
                  Total kcal intake: {nutrition?.calories?.toFixed(1) ?? "0.0"} kcal
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
