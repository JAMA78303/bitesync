import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { archiveRecipe, deleteRecipe } from "@/app/(app)/recipes/actions";

type RecipePageProps = { params: Promise<{ id: string }> };

export default async function RecipeDetailPage({ params }: RecipePageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const { data: recipe } = await supabase
    .from("recipes")
    .select("id,name,description,servings,recipe_nutrition(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .is("archived_at", null)
    .single();

  if (!recipe) notFound();

  const nutrition = Array.isArray(recipe.recipe_nutrition)
    ? recipe.recipe_nutrition[0]
    : recipe.recipe_nutrition;

  const fmt = (value: number | null | undefined) => (value == null ? "—" : value.toFixed(1));

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{recipe.name}</h1>
          <p className="text-sm text-gray-600">{recipe.description ?? "No description"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/recipes/${recipe.id}/edit`}
            className="inline-flex h-9 items-center justify-center rounded-md bg-[var(--brand-sage)] px-3 text-sm font-medium text-white hover:opacity-95"
          >
            Edit recipe
          </Link>
          <Link
            href="/recipes"
            className="inline-flex h-9 items-center justify-center rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back to recipes
          </Link>
          <form action={archiveRecipe.bind(null, recipe.id)}>
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center rounded-md border border-amber-300 bg-amber-50 px-3 text-sm font-medium text-amber-700 hover:bg-amber-100"
            >
              Archive recipe
            </button>
          </form>
          <form action={deleteRecipe.bind(null, recipe.id)}>
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center rounded-md border border-red-300 bg-red-50 px-3 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              Delete recipe
            </button>
          </form>
        </div>
      </div>

      <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Nutrition</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <p className="rounded-md bg-gray-50 p-2 text-sm">Calories: <strong>{fmt(nutrition?.calories)}</strong></p>
          <p className="rounded-md bg-gray-50 p-2 text-sm">Protein: <strong>{fmt(nutrition?.protein_g)} g</strong></p>
          <p className="rounded-md bg-gray-50 p-2 text-sm">Carbs: <strong>{fmt(nutrition?.carbs_g)} g</strong></p>
          <p className="rounded-md bg-gray-50 p-2 text-sm">Fat: <strong>{fmt(nutrition?.fat_g)} g</strong></p>
          <p className="rounded-md bg-gray-50 p-2 text-sm">Fibre: <strong>{fmt(nutrition?.fibre_g)} g</strong></p>
          <p className="rounded-md bg-gray-50 p-2 text-sm">Sugar: <strong>{fmt(nutrition?.sugar_g)} g</strong></p>
          <p className="rounded-md bg-gray-50 p-2 text-sm">Sodium: <strong>{fmt(nutrition?.sodium_mg)} mg</strong></p>
          <p className="rounded-md bg-gray-50 p-2 text-sm">Saturated fat: <strong>{fmt(nutrition?.saturated_fat_g)} g</strong></p>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Total kcal intake: {fmt(nutrition?.calories)} kcal
        </p>
      </article>
    </section>
  );
}
