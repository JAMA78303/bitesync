"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useMemo, useState } from "react";
import { ImportRecipeModal } from "@/components/recipes/ImportRecipeModal";
import { FillMyLibraryModal } from "@/components/recipes/FillMyLibraryModal";
import { RecipeListCard, type RecipeListItem } from "@/components/recipes/RecipeListCard";
import { createImportedRecipe } from "@/app/(app)/recipes/actions";
import {
  parsedIngredientsToInputs,
  scaleParsedIngredients,
} from "@/lib/recipes/parseIngredient";
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
  canFillLibrary: boolean;
  fillLibraryBlockedMessage?: string | null;
};

export function RecipesPageClient({
  recipes,
  showArchived,
  showLimitWarning,
  recipeCount,
  dietaryPreferences,
  hasBreakfastFriendlyRecipe,
  canFillLibrary,
  fillLibraryBlockedMessage,
}: Props) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [showImport, setShowImport] = useState(false);
  const [showFillLibrary, setShowFillLibrary] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const filtered = useMemo(() => {
    let list = recipes;
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((r) => r.name.toLowerCase().includes(q));
    if (activeFilter === "Favourites") {
      list = list.filter((r) => r.isFavourite);
    } else if (activeFilter !== "All") {
      list = list.filter((r) => {
        if (r.kcal == null) return false;
        const tag = getDietTag(r.kcal, r.protein ?? 0, r.carbs, r.fat, dietaryPreferences);
        return tag === activeFilter;
      });
    }
    return list;
  }, [recipes, search, activeFilter, dietaryPreferences]);

  return (
  <div className={ds.mobilePage}>
    <div className={ds.gradientHeader}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className={ds.pageTitle}>My Recipes</h1>
        <Link
          href={showArchived ? "/recipes" : "/recipes?view=archived"}
          className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm"
        >
          {showArchived ? "Active" : "Archived"}
        </Link>
      </div>

      <div className="flex items-center gap-2 rounded-2xl border border-white/30 bg-white/25 px-4 py-3 backdrop-blur-sm">
        <svg className="h-4 w-4 shrink-0 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search recipes..."
          className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/85 dark:text-white dark:placeholder:text-white/85"
        />
      </div>

      <div className="scrollbar-hide mt-3 flex gap-2 overflow-x-auto pb-1">
        {FILTER_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setActiveFilter(tag)}
            className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              activeFilter === tag
                ? "bg-white text-[#3a5a40] shadow-sm"
                : "border border-white/45 bg-white/30 text-white hover:bg-white/40"
            }`}
          >
            {tag}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setActiveFilter("Favourites")}
          aria-pressed={activeFilter === "Favourites"}
          className={`flex flex-shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
            activeFilter === "Favourites"
              ? "bg-white text-[#3a5a40] shadow-sm"
              : "border border-white/45 bg-white/30 text-white hover:bg-white/40"
          }`}
        >
          <Heart
            className={`h-3.5 w-3.5 ${
              activeFilter === "Favourites" ? "fill-red-500 text-red-500" : "text-white"
            }`}
            strokeWidth={2}
          />
          Favourites
        </button>
      </div>
    </div>

    <div className={`${ds.mobileGutter} ${ds.overlap} ${ds.pageContent} space-y-4`}>
    {!showArchived ? (
      <div className="space-y-3">
        <div className="flex gap-3">
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
        <button
          type="button"
          onClick={() => setShowFillLibrary(true)}
          disabled={isPending || !canFillLibrary}
          title={fillLibraryBlockedMessage ?? undefined}
          className={`${ds.card} w-full py-3 text-center ${ds.cardTitle} disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <span className="text-[#3a5a40]">✨ </span>
          Fill my library
        </button>
        {!canFillLibrary && fillLibraryBlockedMessage ? (
          <p className="text-center text-xs text-amber-700 dark:text-amber-300">{fillLibraryBlockedMessage}</p>
        ) : null}
      </div>
    ) : null}

    {showLimitWarning && !showArchived ? (
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
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
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-100">
        Tip: add breakfast-named recipes (oats, eggs, yoghurt) for better AI planning.
      </div>
    ) : null}

    <div className="space-y-3">
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
              : activeFilter === "Favourites"
                ? "Tap the heart on a recipe to save it here"
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
    </div>

    {showFillLibrary ? <FillMyLibraryModal onClose={() => setShowFillLibrary(false)} /> : null}

    {showImport ? (
      <ImportRecipeModal
        onClose={() => setShowImport(false)}
        onImport={async (result) => {
          const detected = Math.max(1, result.detectedServings ?? 1);
          const cookingFor = Math.max(1, result.cookingFor ?? 1);
          const scale = cookingFor / detected;
          const ingredients = parsedIngredientsToInputs(scaleParsedIngredients(result.ingredients, scale));
          const created = await createImportedRecipe({
            name: result.name,
            description: `Imported from ${result.sourceDomain}`,
            ingredients,
            steps: result.steps,
            sourceUrl: result.sourceUrl,
            sourceDomain: result.sourceDomain,
            sourceType: result.sourceType,
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
