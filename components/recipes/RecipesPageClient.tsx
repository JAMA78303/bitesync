"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ImportRecipeModal } from "@/components/recipes/ImportRecipeModal";
import { RecipeListCard, type RecipeListItem } from "@/components/recipes/RecipeListCard";
import { createImportedRecipe } from "@/app/(app)/recipes/actions";
import { getDietTag } from "@/lib/ui/dietTags";
import { ds } from "@/lib/ui/classes";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

const FILTER_TAGS = ["All", "High Protein", "Low Calorie", "Vegan", "Vegetarian", "Low Carb"] as const;

type Props = {
  recipes: RecipeListItem[];
  showArchived: boolean;
  showLimitWarning: boolean;
  recipeCount: number;
  dietaryPreferences: string[];
  hasBreakfastFriendlyRecipe: boolean;
};

export function RecipesPageClient({
  recipes,
  showArchived,
  showLimitWarning,
  recipeCount,
  dietaryPreferences,
  hasBreakfastFriendlyRecipe,
}: Props) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [showImport, setShowImport] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const filtered = useMemo(() => {
    let list = recipes;
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((r) => r.name.toLowerCase().includes(q));
    if (activeFilter !== "All") {
      list = list.filter((r) => {
        if (r.kcal == null) return false;
        const tag = getDietTag(r.kcal, r.protein ?? 0, r.carbs, r.fat, dietaryPreferences);
        return tag === activeFilter;
      });
    }
    return list;
  }, [recipes, search, activeFilter, dietaryPreferences]);

  return (
  <div className="-mx-4 min-h-screen bg-gray-50 dark:bg-gray-950 md:mx-0">
    <header className={ds.gradientHeader}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className={ds.pageTitle}>My Recipes</h1>
        <Link
          href={showArchived ? "/recipes" : "/recipes?view=archived"}
          className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm"
        >
          {showArchived ? "Active" : "Archived"}
        </Link>
      </div>

      <div className="flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-3 backdrop-blur-sm">
        <svg className="h-4 w-4 shrink-0 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search recipes..."
          className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/50"
        />
      </div>

      <div className="scrollbar-hide mt-3 flex gap-2 overflow-x-auto pb-1">
        {FILTER_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setActiveFilter(tag)}
            className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              activeFilter === tag ? "bg-white text-[#3a5a40]" : "bg-white/15 text-white hover:bg-white/25"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
    </header>

    {!showArchived ? (
      <div className={`${ds.overlap} mb-4 flex gap-3 px-4`}>
        <Link href="/recipes/new" className={`${ds.card} flex-1 py-3 text-center ${ds.cardTitle}`}>
          <span className="text-[#3a5a40]">+ </span>
          Add recipe
        </Link>
        <button
          type="button"
          onClick={() => setShowImport(true)}
          disabled={isPending}
          className={`${ds.card} flex-1 py-3 text-center ${ds.cardTitle} disabled:opacity-60`}
        >
          <span className="text-[#3a5a40]">🔗 </span>
          Import URL
        </button>
      </div>
    ) : null}

    {showLimitWarning && !showArchived ? (
      <div className="mx-4 mb-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
        <span className="flex-shrink-0 text-xl" aria-hidden>
          ⚠️
        </span>
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
            {recipeCount}/10 recipes used
          </p>
          <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
            Upgrade to Pro for unlimited recipes.
          </p>
          <Link
            href="/billing"
            className="mt-1 inline-block text-xs font-bold text-amber-700 underline dark:text-amber-300"
          >
            Upgrade now
          </Link>
        </div>
      </div>
    ) : null}

    {!hasBreakfastFriendlyRecipe && !showArchived && recipes.length > 0 ? (
      <div className="mx-4 mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-100">
        Tip: add breakfast-named recipes (oats, eggs, yoghurt) for better AI planning.
      </div>
    ) : null}

    <div className={`space-y-3 px-4 ${ds.pageContent}`}>
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center px-4 py-20 text-center">
          <div className="mb-4 text-5xl" aria-hidden>
            🍽️
          </div>
          <p className="mb-1 font-bold text-gray-900 dark:text-white">
            {recipes.length === 0 ? "No recipes yet" : "No matches"}
          </p>
          <p className="mb-6 text-sm text-gray-500">
            {recipes.length === 0
              ? "Add your first recipe or import one from a website"
              : "Try a different search or filter"}
          </p>
          {!showArchived && recipes.length === 0 ? (
            <Link href="/recipes/new" className={ds.primaryBtn}>
              Add your first recipe
            </Link>
          ) : null}
        </div>
      ) : (
        filtered.map((recipe) => (
          <RecipeListCard key={recipe.id} recipe={recipe} dietaryPreferences={dietaryPreferences} />
        ))
      )}
    </div>

    {showImport ? (
      <ImportRecipeModal
        onClose={() => setShowImport(false)}
        onImport={async (result) => {
          const detected = Math.max(1, result.detectedServings ?? 1);
          const cookingFor = Math.max(1, result.cookingFor ?? 1);
          const scale = cookingFor / detected;
          const ingredients = result.ingredients
            .map((ing) => {
              const q =
                ing.quantity != null && Number.isFinite(ing.quantity) && ing.quantity > 0
                  ? ing.quantity
                  : 1;
              return {
                name: ing.name.trim(),
                quantity: Math.round(q * scale * 100) / 100 || 1,
                unit: ing.unit?.trim() || "piece",
              };
            })
            .filter((ing) => ing.name.length > 0);
          const created = await createImportedRecipe({
            name: result.name,
            description: `Imported from ${result.sourceDomain}`,
            ingredients,
            sourceUrl: result.sourceUrl,
            sourceDomain: result.sourceDomain,
            importedAt: new Date().toISOString(),
            detectedServings: detected,
            cookingFor,
          });
          if ("error" in created) throw new Error(created.error);
          setShowImport(false);
          startTransition(() => router.refresh());
        }}
      />
    ) : null}
  </div>
  );
}
