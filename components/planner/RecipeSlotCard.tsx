"use client";

import { X, Flame, Leaf, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { removeSlotEntry } from "@/lib/supabase/meal-plans";
import { useToast } from "@/components/ui/use-toast";
import { MealThumbnail } from "@/components/ui/MealThumbnail";
import { getDietTag } from "@/lib/ui/dietTags";
import { getDietTagStyle } from "@/lib/ui/dietTagStyles";
import { mealTintClasses, QUICK_ADD_VISUAL } from "@/lib/ui/mealVisuals";
import { ds } from "@/lib/ui/classes";
import { recipeDietWarnings, type ProfileDietPrefs } from "@/lib/utils/diet";
import {
 normalizeRecipeNutritionEmbed,
 type RecipeNutritionSummary,
} from "@/lib/utils/recipe-nutrition";
import { getEntryCalories, getEntryName } from "@/types";
import type { MealPlanEntry } from "@/types";

type Props = {
 entry: MealPlanEntry;
 dietPrefs?: ProfileDietPrefs | null;
 dietaryPreferences?: string[];
 /** Compact vertical layout for narrow planner grid cells. */
 variant?:"default" |"grid";
};

export function RecipeSlotCard({
 entry,
 dietPrefs,
 dietaryPreferences = [],
 variant ="default",
}: Props) {
 const [isPending, startTransition] = useTransition();
 const [removed, setRemoved] = useState(false);
 const { toast } = useToast();
 if (removed) return null;

 const name = getEntryName(entry);
 const recipeIdForLink = entry.recipe_id ?? entry.recipe?.id ?? null;
 const isQuickAdd = !recipeIdForLink;
 const recipe = entry.recipe;
 const nutrition = normalizeRecipeNutritionEmbed(
 recipe?.recipe_nutrition as RecipeNutritionSummary | RecipeNutritionSummary[] | null | undefined,
 );
 const calories = getEntryCalories(entry);
 const protein = nutrition?.protein_g ?? null;
 const carbs = nutrition?.carbs_g ?? 0;
 const fat = nutrition?.fat_g ?? 0;

 const dietTag =
 !isQuickAdd && calories != null
 ? getDietTag(calories, protein ?? 0, carbs, fat, dietaryPreferences)
 : null;

 const dietWarnings =
 dietPrefs && recipe
 ? recipeDietWarnings(dietPrefs, {
 fits_vegetarian: recipe.fits_vegetarian ?? null,
 fits_vegan: recipe.fits_vegan ?? null,
 fits_gluten_free: recipe.fits_gluten_free ?? null,
 })
 : [];

 function handleRemove() {
 setRemoved(true);
 startTransition(async () => {
 const result = await removeSlotEntry(entry.id);
 if (result?.error) {
 setRemoved(false);
 toast({ title:"Failed to remove", variant:"destructive" });
 }
 });
 }

 const macroLine =
 calories != null ? (
 <div className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 ${variant ==="grid" ?"mt-1" :"mt-1.5 gap-3"}`}>
 <span className="flex items-baseline gap-1">
 <Flame className="h-3 w-3 shrink-0 text-[var(--brand-action)]" aria-hidden />
 <span className={ds.statValueSm}>{Math.round(calories)}</span>
 <span className={ds.tierMeta}>kcal</span>
 </span>
 {protein != null ? (
 <span className="flex items-baseline gap-1">
 <Leaf className="h-3 w-3 shrink-0 text-[var(--brand-action)]" aria-hidden />
 <span className={ds.statValueSm}>{Math.round(protein)}g</span>
 <span className={ds.tierMeta}>P</span>
 </span>
 ) : null}
 </div>
 ) : isQuickAdd ? (
 <p className={`mt-1 ${ds.tierMeta}`}>Quick add</p>
 ) : null;

 const cardInner =
 variant ==="grid" ? (
 <div
 className={`card-soft flex min-h-[88px] min-w-0 w-full flex-col rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-2 pr-7 ${
 isPending ?"opacity-50" :""
 }`}
 >
 {dietTag ? (
 <span
 className={`mb-1 inline-flex w-fit max-w-full shrink-0 rounded-full px-2 py-0.5 text-2xs font-medium leading-tight ${getDietTagStyle(dietTag)}`}
 >
 {dietTag}
 </span>
 ) : null}
 <p
 className={`min-w-0 w-full break-words line-clamp-2 text-xs font-semibold leading-snug ${ds.tierPrimary}`}
 title={name}
 >
 {name}
 </p>
 {macroLine}
 {dietWarnings.length > 0 ? (
 <p
 className="mt-1 line-clamp-1 text-2xs font-medium text-[var(--semantic-warn-text)]"
 title={dietWarnings.join(" ·")}
 >
 {dietWarnings.join(" ·")}
 </p>
 ) : null}
 </div>
 ) : (
 <div
 className={`card-soft flex items-start gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-3 ${
 isPending ?"opacity-50" :""
 }`}
 >
 {isQuickAdd ? (
 <div
 className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${mealTintClasses(QUICK_ADD_VISUAL.mealType)}`}
 >
 <Sparkles className="h-5 w-5" aria-hidden strokeWidth={2} />
 </div>
 ) : (
 <MealThumbnail recipeName={name} mealType={entry.meal_type} size="sm" />
 )}

 <div className="min-w-0 flex-1">
 {dietTag ? (
 <span
 className={`mb-1 inline-flex w-fit max-w-full rounded-full px-2 py-0.5 text-xs font-medium ${getDietTagStyle(dietTag)}`}
 >
 {dietTag}
 </span>
 ) : null}
 <p
 className={`min-w-0 break-words line-clamp-2 text-sm font-semibold leading-snug ${ds.tierPrimary}`}
 title={name}
 >
 {name}
 </p>
 {macroLine}
 {dietWarnings.length > 0 ? (
 <p
 className="mt-1 line-clamp-1 text-2xs font-medium text-[var(--semantic-warn-text)]"
 title={dietWarnings.join(" ·")}
 >
 {dietWarnings.join(" ·")}
 </p>
 ) : null}
 </div>

 {!isQuickAdd ? (
 <svg
 className="mt-1 h-4 w-4 flex-shrink-0 text-[var(--text-muted)]"
 fill="none"
 viewBox="0 0 24 24"
 stroke="currentColor"
 aria-hidden
 >
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
 </svg>
 ) : null}
 </div>
 );

 return (
 <div className="group relative min-w-0">
 {recipeIdForLink && !isQuickAdd ? (
 <Link
 href={`/recipes/${encodeURIComponent(String(recipeIdForLink))}`}
 className="block min-w-0 outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[var(--brand-action)]"
 aria-label={`Open recipe ${name}`}
 >
 {cardInner}
 </Link>
 ) : (
 cardInner
 )}
 <button
 type="button"
 onClick={(e) => {
 e.preventDefault();
 e.stopPropagation();
 handleRemove();
 }}
 disabled={isPending}
 aria-label={`Remove ${name}`}
 className="absolute right-1.5 top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--surface-overlay)]/90 text-[var(--text-muted)] opacity-80 shadow-sm transition-all hover:bg-[var(--surface-card)] hover:text-[var(--semantic-error-text)] group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100"
 >
 <X className="h-3.5 w-3.5" />
 </button>
 </div>
 );
}
