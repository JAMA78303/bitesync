"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ChefHat, Heart, Link2, Search, Sparkles } from "lucide-react";
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
import {
 archiveGeneratedRecipes,
 archiveRecipe,
 createImportedRecipe,
 deleteAllRecipes,
 deleteArchivedRecipes,
 restoreRecipe,
} from "@/app/(app)/recipes/actions";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/use-toast";
import {
 parsedIngredientsToInputs,
 scaleParsedIngredients,
} from "@/lib/recipes/parseIngredient";
import { getDietTags } from "@/lib/ui/dietTags";
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
 const { confirm } = useConfirm();
 const { toast } = useToast();

 async function handleArchiveGenerated() {
 const ok = await confirm({
 title: "Archive all AI-generated recipes?",
 description:
 "Every recipe created by AI generation will move to your archive. You can restore any of them individually from the Archived view.",
 confirmLabel: "Archive all",
 destructive: true,
 });
 if (!ok) return;

 startTransition(async () => {
 const result = await archiveGeneratedRecipes();
 if ("error" in result) {
 toast({ title: "Couldn't archive recipes", description: result.error, variant: "destructive" });
 return;
 }
 toast({ title: "Done", description: result.message });
 router.refresh();
 });
 }

 async function handleEmptyArchive() {
 const ok = await confirm({
 title: `Permanently delete ${listRecipes.length} archived recipe${listRecipes.length === 1 ? "" : "s"}?`,
 description:
 "This cannot be undone. Your active recipes are not affected, but any planned meals still using these archived recipes will be removed.",
 confirmLabel: "Empty archive",
 destructive: true,
 });
 if (!ok) return;

 startTransition(async () => {
 const result = await deleteArchivedRecipes();
 if ("error" in result) {
 toast({ title: "Couldn't empty archive", description: result.error, variant: "destructive" });
 return;
 }
 toast({ title: "Archive emptied", description: result.message });
 router.refresh();
 });
 }

 async function handleDeleteAll() {
 const ok = await confirm({
 title: `Permanently delete all ${recipeCount} recipes?`,
 description:
 "This cannot be undone. Every recipe — imported, hand-written, and AI-generated — is deleted, and any planned meals using them are removed from your planner. Use 'Archive all AI-generated' instead if you only want to clear generated recipes.",
 confirmLabel: "Delete everything",
 destructive: true,
 });
 if (!ok) return;

 startTransition(async () => {
 const result = await deleteAllRecipes();
 if ("error" in result) {
 toast({ title: "Couldn't delete recipes", description: result.error, variant: "destructive" });
 return;
 }
 toast({ title: "Library cleared", description: result.message });
 router.refresh();
 });
 }

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
 // Match ANY qualifying tag, not just the highest-priority one: a 320 kcal
 // recipe with 35g protein belongs in both High Protein and Low Calorie.
 list = list.filter((r) => {
 if (r.kcal == null) return false;
 return getDietTags(r.kcal, r.protein ?? 0, r.carbs, r.fat, dietaryPreferences, {
 fitsVegetarian: r.fitsVegetarian,
 fitsVegan: r.fitsVegan,
 }).includes(activeFilter);
 });
 }
 return list;
 }, [listRecipes, search, activeFilter, dietaryPreferences]);

 return (
 <div className={ds.mobilePage}>
 <div className={`${ds.gradientHeader} flex flex-col gap-5 md:flex-row md:items-center md:justify-between`}>
 <div className="min-w-0">
 <span className={ds.kicker}>{showArchived ? "OUT OF YOUR PLANNER" : "YOUR LIBRARY"}</span>
 <h1 className={`mb-1.5 ${ds.pageTitle}`}>{showArchived ? "Archived recipes" : "My Recipes"}</h1>
 <p className={ds.pageSubtitle}>
 {showArchived
 ? "Restore any of these from its page."
 : `${recipeCount} ${recipeCount === 1 ? "recipe" : "recipes"} saved and ready to plan`}
 </p>
 <Link
 href={showArchived ?"/recipes" :"/recipes?view=archived"}
 className="mt-3 inline-flex min-h-8 items-center rounded-full border border-white/25 bg-white/10 px-3 text-xs font-semibold text-[var(--text-on-header)] hover:border-white/50"
 >
 {showArchived ?"← Back to my recipes" :"View archived"}
 </Link>
 </div>
 {!showArchived ? (
 <div className="flex w-full shrink-0 gap-2.5 md:w-auto">
 <button
 type="button"
 onClick={() => setShowImport(true)}
 disabled={isPending}
 className={`${ds.heroGhostBtn} flex-1 md:flex-none`}
 >
 <Link2 className="h-4 w-4" aria-hidden />
 Import<span className="hidden sm:inline">&nbsp;from URL</span>
 </button>
 <Link href="/recipes/new" className={`${ds.heroPrimaryBtn} flex-1 md:flex-none`}>
 + Add recipe
 </Link>
 </div>
 ) : null}
 </div>

 <div className={`${ds.mobileGutter} ${ds.overlap} ${ds.pageContent} space-y-4`}>
 <div className="space-y-3">
 <label className="flex min-h-12 items-center gap-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] px-4 shadow-[var(--card-shadow)] focus-within:border-[var(--brand-action)]">
 <Search className="h-4 w-4 shrink-0 text-[var(--text-muted)]" aria-hidden />
 <span className="sr-only">Search recipes</span>
 <input
 type="search"
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Search recipes…"
 className="min-w-0 flex-1 bg-transparent py-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
 />
 </label>
 <div className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
 {FILTER_TAGS.map((tag) => (
 <button
 key={tag}
 type="button"
 onClick={() => setActiveFilter(tag)}
 aria-pressed={activeFilter === tag}
 className={`min-h-10 flex-shrink-0 rounded-xl border px-3.5 text-sm font-semibold transition-colors ${
 activeFilter === tag
 ?"border-[var(--btn-primary-bg)] bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]"
 :"border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-secondary)] hover:border-[var(--brand-primary)]"
 }`}
 >
 {tag}
 </button>
 ))}
 <button
 type="button"
 onClick={() => setActiveFilter("Favourites")}
 aria-pressed={activeFilter ==="Favourites"}
 className={`flex min-h-10 flex-shrink-0 items-center gap-1.5 rounded-xl border px-3.5 text-sm font-semibold transition-colors ${
 activeFilter ==="Favourites"
 ?"border-[var(--btn-primary-bg)] bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]"
 :"border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-secondary)] hover:border-[var(--brand-primary)]"
 }`}
 >
 <Heart
 className={`h-3.5 w-3.5 ${activeFilter ==="Favourites" ?"fill-[var(--traffic-red)] text-[var(--traffic-red)]" :""}`}
 strokeWidth={2}
 aria-hidden
 />
 Favourites
 </button>
 </div>
 </div>

 {!showArchived ? (
 <div className="space-y-3">
 <button
 type="button"
 onClick={() => setShowFillLibrary(true)}
 disabled={isPending || !canFillLibrary}
 title={fillLibraryBlockedMessage ?? undefined}
 className={`${ds.card} flex w-full items-center gap-3 p-4 text-left transition-colors hover:border-[var(--brand-primary)] disabled:cursor-not-allowed disabled:opacity-60`}
 >
 <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-brand-subtle)] text-[var(--brand-primary)]">
 <Sparkles className="h-5 w-5" aria-hidden />
 </span>
 <span className="min-w-0 flex-1">
 <span className={`block ${ds.cardTitle}`}>Fill my library</span>
 <span className="block text-xs text-[var(--text-muted)]">Recipes matched to your targets and diet</span>
 </span>
 </button>
 {!canFillLibrary && fillLibraryBlockedMessage ? (
 <p className="text-center text-xs text-[var(--semantic-warn-text)]">{fillLibraryBlockedMessage}</p>
 ) : null}
 {listRecipes.length > 0 ? (
 <div className="flex flex-wrap justify-end gap-1">
 <button
 type="button"
 onClick={handleArchiveGenerated}
 disabled={isPending}
 className="cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-secondary)] disabled:opacity-60"
 >
 Archive all AI-generated
 </button>
 <button
 type="button"
 onClick={handleDeleteAll}
 disabled={isPending}
 className="cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-medium text-[var(--semantic-error-text)] transition-colors hover:bg-[var(--semantic-error-bg)] disabled:opacity-60"
 >
 Delete all recipes
 </button>
 </div>
 ) : null}
 </div>
 ) : listRecipes.length > 0 ? (
 <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] px-3 py-2">
 <p className="text-xs text-[var(--text-muted)]">
 Archived recipes stay out of your planner. Restore any of them from its page.
 </p>
 <button
 type="button"
 onClick={handleEmptyArchive}
 disabled={isPending}
 className="shrink-0 cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-medium text-[var(--semantic-error-text)] transition-colors hover:bg-[var(--semantic-error-bg)] disabled:opacity-60"
 >
 {isPending ? "Deleting…" : "Empty archive"}
 </button>
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

 <div className={filtered.length === 0 ? "space-y-3" : "grid gap-3 md:grid-cols-2 xl:grid-cols-3"}>
 {filtered.length === 0 ? (
 listRecipes.length === 0 && !showArchived ? (
 <EmptyState
 icon={ChefHat}
 title="No recipes yet"
 description="Fill your library in a minute — or add and import recipes one at a time"
 action={{ href: "/sample-week", label: "See a sample week" }}
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
