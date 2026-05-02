import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { archiveRecipe, deleteRecipe } from "@/app/(app)/recipes/actions";
import { fetchRecipeNutritionForRecipe } from "@/lib/supabase/recipe-nutrition-query";

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

  const { data: recipe } = await supabase
    .from("recipes")
    .select("id,name,description,servings")
    .eq("id", id)
    .eq("user_id", user.id)
    .is("archived_at", null)
    .single();

  if (!recipe) notFound();

  const nutrition = await fetchRecipeNutritionForRecipe(supabase, recipe.id);

  const fmt = (value: number | null | undefined) => (value == null ? "—" : value.toFixed(1));

  return (
    <section className="mx-auto max-w-full space-y-4 pb-2">
      {/* Sticky on mobile so “Back” stays visible after scrolling past nutrition */}
      <div className="sticky top-0 z-30 -mx-4 border-b border-gray-100 bg-[var(--background)] px-4 py-3 md:static md:z-auto md:mx-0 md:border-0 md:bg-transparent md:px-0 md:py-0">
        <Link
          href="/recipes"
          className="flex min-h-11 w-full items-center gap-2 rounded-lg border-2 border-[#1A4731]/25 bg-white px-4 py-3 text-base font-semibold text-[#1A4731] shadow-sm md:min-h-10 md:rounded-xl md:border md:border-gray-200 md:text-sm md:font-medium md:text-gray-900"
        >
          <ChevronLeft className="h-6 w-6 shrink-0 md:h-5 md:w-5" aria-hidden strokeWidth={2.5} />
          <span className="min-w-0">Back to recipes</span>
        </Link>
      </div>

      <div className="min-w-0 px-0.5">
        <h1 className="break-words text-2xl font-semibold text-gray-900">{recipe.name}</h1>
        <p className="mt-1 text-sm text-gray-600">{recipe.description ?? "No description"}</p>
      </div>

      <div className="flex w-full min-w-0 flex-wrap gap-2 px-0.5">
        <Link
          href={`/recipes/${recipe.id}/edit`}
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-[var(--brand-sage)] px-4 text-sm font-medium text-white hover:opacity-95"
        >
          Edit recipe
        </Link>
        <form action={archiveRecipe.bind(null, recipe.id)} className="inline-flex shrink-0">
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-md border border-amber-300 bg-amber-50 px-4 text-sm font-medium text-amber-700 hover:bg-amber-100"
          >
            Archive recipe
          </button>
        </form>
        <form action={deleteRecipe.bind(null, recipe.id)} className="inline-flex shrink-0">
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-md border border-red-300 bg-red-50 px-4 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            Delete recipe
          </button>
        </form>
      </div>

      <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Nutrition</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <p className="rounded-md bg-gray-50 p-2 text-sm">
            Calories: <strong>{fmt(nutrition?.calories)}</strong>
          </p>
          <p className="rounded-md bg-gray-50 p-2 text-sm">
            Protein: <strong>{fmt(nutrition?.protein_g)} g</strong>
          </p>
          <p className="rounded-md bg-gray-50 p-2 text-sm">
            Carbs: <strong>{fmt(nutrition?.carbs_g)} g</strong>
          </p>
          <p className="rounded-md bg-gray-50 p-2 text-sm">
            Fat: <strong>{fmt(nutrition?.fat_g)} g</strong>
          </p>
          <p className="rounded-md bg-gray-50 p-2 text-sm">
            Fibre: <strong>{fmt(nutrition?.fibre_g)} g</strong>
          </p>
          <p className="rounded-md bg-gray-50 p-2 text-sm">
            Sugar: <strong>{fmt(nutrition?.sugar_g)} g</strong>
          </p>
          <p className="rounded-md bg-gray-50 p-2 text-sm">
            Sodium: <strong>{fmt(nutrition?.sodium_mg)} mg</strong>
          </p>
          <p className="rounded-md bg-gray-50 p-2 text-sm">
            Saturated fat: <strong>{fmt(nutrition?.saturated_fat_g)} g</strong>
          </p>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Total kcal intake: {nutrition?.calories != null ? `${fmt(nutrition.calories)} kcal` : "—"}
        </p>
      </article>
    </section>
  );
}
