"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ChefHat, Heart } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const ImportRecipeModal = dynamic(
 () => import("@/components/recipes/ImportRecipeModal").then((m) => ({ default: m.ImportRecipeModal })),
 { ssr: false },
);
const FillMyLibraryModal = dynamic(
 () => import("@/components/recipes/FillMyLibraryModal").then((m) => ({ default: m.FillMyLibraryModal })),
 { ssr: false },
);
import { RecipeListCard, type RecipeListItem } from "@/components/recipes/RecipeListCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { archiveRecipe, createImportedRecipe, restoreRecipe } from "@/app/(app)/recipes/actions";
import {
 parsedIngredientsToInputs,
 scaleParsedIngredients,
} from "@/lib/recipes/parseIngredient";
import { getDietTag } from "@/lib/ui/dietTags";
import { ds } from "@/lib/ui/classes";
import { UndoToast } from "@/components/ui/UndoToast";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

const UNDO_MS = 5000;

const FILTER_TAGS = ["All","High Protein","Low Calorie","Vegan","Vegetarian","Low Carb"] as const;

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
 const [listRecipes, setListRecipes] = useState(recipes);
 const [undoRecipe, setUndoRecipe] = useState<RecipeListItem | null>(null);
 const [deleteError, setDeleteError] = useState<string | null>(null);
 const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 const [isPending, startTransition] = useTransition();
 const router = useRouter();

 useEffect(() => {
 setListRecipes(recipes);
 }, [recipes]);

 useEffect(() => {
 return () => {
 if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
 };
 }, []);

 const clearUndoTimer = useCallback(() => {
 if (undoTimerRef.current) {
 clearTimeout(undoTimerRef.current);
 undoTimerRef.current = null;
 }
 }, []);

 const handleQuickDelete = useCallback(
 (recipe: RecipeListItem) => {
 if (showArchived) return;

 setDeleteError(null);
 setListRecipes((current) => current.filter((r) => r.id !== recipe.id));

 clearUndoTimer();
 setUndoRecipe(null);

 startTransition(async () => {
 const result = await archiveRecipe(recipe.id);
 if (result &&"error" in result) {
 setListRecipes((current) => {
 if (current.some((r) => r.id === recipe.id)) return current;
 return [...current, recipe].sort((a, b) => a.name.localeCompare(b.name));
 });
 setDeleteError(result.error);
 return;
 }

 setUndoRecipe(recipe);
 undoTimerRef.current = setTimeout(() => {
 setUndoRecipe(null);
 undoTimerRef.current = null;
 }, UNDO_MS);
 });
 },
 [clearUndoTimer, showArchived],
 );

 const handleUndoDelete = useCallback(() => {
 if (!undoRecipe) return;
 const recipe = undoRecipe;
 clearUndoTimer();
 setUndoRecipe(null);

 setListRecipes((current) => {
 if (current.some((r) => r.id === recipe.id)) return current;
 return [...current, recipe].sort((a, b) => a.name.localeCompare(b.name));
 });

 startTransition(async () => {
 const result = await restoreRecipe(recipe.id);
 if (result &&"error" in result) {
 setListRecipes((current) => current.filter((r) => r.id !== recipe.id));
 setDeleteError(result.error);
 }
 });
 }, [clearUndoTimer, undoRecipe]);

 const filtered = useMemo(() => {
 let list = listRecipes;
 const q = search.trim().toLowerCase();
 if (q) list = list.filter((r) => r.name.toLowerCase().includes(q));
 if (activeFilter ==="Favourites") {
 list = list.filter((r) => r.isFavourite);
 } else if (activeFilter !=="All") {
 list = list.filter((r) => {
 if (r.kcal == null) return false;
 const tag = getDietTag(r.kcal, r.protein ?? 0, r.carbs, r.fat, dietaryPreferences);
 return tag === activeFilter;
 });
 }
 return list;
 }, [listRecipes, search, activeFilter, dietaryPreferences]);

 return (
 <div className={ds.mobilePage}>
 <div className={ds.gradientHeader}>
 <div className="mb-4 flex items-center justify-between gap-2">
 <h1 className={ds.pageTitle}>My Recipes</h1>
 <Link
 href={showArchived ?"/recipes" :"/recipes?view=archived"}
 className="rounded-full bg-[var(--surface-overlay)]/20 px-3 py-1 text-xs font-medium text-[var(--btn-primary-text)] backdrop-blur-sm"
 >
 {showArchived ?"Active" :"Archived"}
 </Link>
 </div>

 <div className={ds.headerSearchWrap}>
 <svg className="h-4 w-4 shrink-0 text-[var(--text-on-brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
 </svg>
 <input
 type="search"
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Search recipes..."
 data-force-light
 className="flex-1 bg-transparent text-sm text-[var(--btn-primary-text)] outline-none placeholder:text-[var(--text-on-brand-muted)]"
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
 ?"bg-[var(--surface-card)] text-[var(--brand-primary)] shadow-sm"
 :"border border-[var(--surface-overlay)]/65 bg-[var(--surface-overlay)]/45 text-[var(--text-on-brand)] shadow-sm hover:bg-[var(--surface-overlay)]/55"
 }`}
 >
 {tag}
 </button>
 ))}
 <button
 type="button"
 onClick={() => setActiveFilter("Favourites")}
 aria-pressed={activeFilter ==="Favourites"}
 className={`flex flex-shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
 activeFilter ==="Favourites"
 ?"bg-[var(--surface-card)] text-[var(--brand-primary)] shadow-sm"
 :"border border-[var(--surface-overlay)]/65 bg-[var(--surface-overlay)]/45 text-[var(--text-on-brand)] shadow-sm hover:bg-[var(--surface-overlay)]/55"
 }`}
 >
 <Heart
 className={`h-3.5 w-3.5 ${
 activeFilter ==="Favourites" ?"fill-[var(--traffic-red)] text-[var(--traffic-red)]" :"text-[var(--text-on-brand)]"
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
 <span className="text-[var(--brand-primary)]">+ </span>
 Add recipe
 </Link>
 <button
 type="button"
 onClick={() => setShowImport(true)}
 disabled={isPending}
 className={`${ds.card} flex-1 py-3 text-center ${ds.cardTitle} disabled:opacity-60`}
 >
 <span className="text-[var(--brand-primary)]">🔗 </span>
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
 <span className="text-[var(--brand-primary)]">✨ </span>
 Fill my library
 </button>
 {!canFillLibrary && fillLibraryBlockedMessage ? (
 <p className="text-center text-xs text-[var(--semantic-warn-text)]">{fillLibraryBlockedMessage}</p>
 ) : null}
 </div>
 ) : null}

 {showLimitWarning && !showArchived ? (
 <div className={`flex items-start gap-3 rounded-2xl p-4 ${ds.warnCallout}`}>
 <span className="flex-shrink-0 text-xl" aria-hidden>
 ⚠️
 </span>
 <div>
 <p className="text-sm font-semibold text-[var(--semantic-warn-text)]">
 {recipeCount}/10 recipes used
 </p>
 <p className="mt-0.5 text-xs text-[var(--semantic-warn-text)]/80">
 Upgrade to Pro for unlimited recipes.
 </p>
 <Link
 href="/billing"
 className="mt-1 inline-block text-xs font-bold text-[var(--semantic-warn-text)] underline"
 >
 Upgrade now
 </Link>
 </div>
 </div>
 ) : null}

 {!hasBreakfastFriendlyRecipe && !showArchived && listRecipes.length > 0 ? (
 <div className={`rounded-2xl p-3 text-xs ${ds.warnCallout}`}>
 Tip: add breakfast-named recipes (oats, eggs, yoghurt) for better AI planning.
 </div>
 ) : null}

 <div className="space-y-3">
 {filtered.length === 0 ? (
 listRecipes.length === 0 && !showArchived ? (
 <EmptyState
 icon={ChefHat}
 title="No recipes yet"
 description="Fill your library in a minute — or add and import recipes one at a time"
 action={{ onClick: () => setShowFillLibrary(true), label: "Fill my library" }}
 secondaryAction={{ href: "/sample-week", label: "See a sample week" }}
 />
 ) : (
 <EmptyState
 icon={ChefHat}
 title={listRecipes.length === 0 ? "No recipes yet" : "No matches"}
 description={
 listRecipes.length === 0
 ? "Add your first recipe or import one from a website"
 : activeFilter === "Favourites"
 ? "Tap the heart on a recipe to save it here"
 : "Try a different search or filter"
 }
 className="py-12"
 />
 )
 ) : (
 filtered.map((recipe) => (
 <RecipeListCard
 key={recipe.id}
 recipe={recipe}
 dietaryPreferences={dietaryPreferences}
 onQuickDelete={showArchived ? undefined : handleQuickDelete}
 quickDeleteDisabled={isPending}
 />
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
 publisherNutritionPerServing: result.publisherNutritionPerServing,
 });
 if ("error" in created) throw new Error(created.error);
 setShowImport(false);
 startTransition(() => router.refresh());
 }}
 />
 ) : null}

 {deleteError ? (
 <p className={`rounded-xl px-3 py-2 text-sm ${ds.errorCallout}`}>
 {deleteError}
 </p>
 ) : null}

 <UndoToast
 visible={undoRecipe != null}
 message="Recipe deleted"
 onUndo={handleUndoDelete}
 />
 </div>
 );
}
