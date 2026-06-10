"use client";

import Link from "next/link";
import { useState } from "react";
import { getDietTag } from "@/lib/ui/dietTags";
import { getDietTagStyle } from "@/lib/ui/dietTagStyles";
import { getMealEmoji } from "@/lib/ui/mealThumbnails";
import { formatIngredientWeightSuffix } from "@/lib/nutrition/convert";
import { ds } from "@/lib/ui/classes";

type Ingredient = {
 id: string;
 name: string;
 quantity: number;
 unit: string;
 nutrition_estimated?: boolean | null;
 cofid_food_name?: string | null;
 cofid_matched_by?: string | null;
};

type Props = {
 recipe: {
 id: string;
 name: string;
 description: string | null;
 servings: number | null;
 source_url: string | null;
 source_domain: string | null;
 imported_at: string | null;
 detected_servings: number | null;
 cooking_for: number | null;
 };
 ingredients: Ingredient[];
 nutrition: {
 calories: number | null;
 protein_g: number | null;
 carbs_g: number | null;
 fat_g: number | null;
 } | null;
 dietaryPreferences: string[];
 editHref: string;
 lifecycleActions?: React.ReactNode;
 /** @deprecated Prefer lifecycleActions */
 archiveAction?: React.ReactNode;
 /** @deprecated Prefer lifecycleActions */
 deleteAction?: React.ReactNode;
};

export function RecipeDetailView({
 recipe,
 ingredients,
 nutrition,
 dietaryPreferences,
 editHref,
 lifecycleActions,
 archiveAction,
 deleteAction,
}: Props) {
 const baseServings = Math.max(1, Number(recipe.servings ?? 1));
 const [servings, setServings] = useState(baseServings);
 const multiplier = servings / baseServings;

 const kcal = nutrition?.calories ?? 0;
 const protein = nutrition?.protein_g ?? 0;
 const carbs = nutrition?.carbs_g ?? 0;
 const fat = nutrition?.fat_g ?? 0;

 const dietTag =
 nutrition?.calories != null
 ? getDietTag(kcal, protein, carbs, fat, dietaryPreferences)
 : null;

 const macroCells = [
 { label:"Calories", value: Math.round(kcal * multiplier), unit:"kcal" },
 { label:"Protein", value: Math.round(protein * multiplier), unit:"g" },
 { label:"Carbs", value: Math.round(carbs * multiplier), unit:"g" },
 { label:"Fat", value: Math.round(fat * multiplier), unit:"g" },
 ];

 return (
 <div className={`${ds.mobilePage} ${ds.pageContent}`}>
 <div className="relative flex h-40 items-center justify-center rounded-b-none bg-[var(--surface-brand-subtle)]">
 <span className="text-7xl" aria-hidden>
 {getMealEmoji(recipe.name,"dinner")}
 </span>
 {recipe.source_domain && recipe.source_url ? (
 <a
 href={recipe.source_url}
 target="_blank"
 rel="noopener noreferrer"
 className="absolute right-3 bottom-3 flex items-center gap-1 rounded-full bg-[var(--surface-overlay)]/80 px-2 py-1 text-xs text-[var(--text-muted)] backdrop-blur-sm"
 >
 <span>🔗</span> {recipe.source_domain}
 </a>
 ) : null}
 </div>

 <div className={`${ds.mobileGutter} pt-4`}>
 <Link href="/recipes" className="mb-4 inline-flex text-sm font-medium text-[var(--brand-primary)]">
 ← Back to recipes
 </Link>

 {dietTag ? (
 <span className={`mb-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getDietTagStyle(dietTag)}`}>
 {dietTag}
 </span>
 ) : null}
 <h1 className="mb-1 text-xl font-extrabold text-[var(--text-primary)]">{recipe.name}</h1>
 {recipe.description ? <p className="mb-4 text-sm text-[var(--text-muted)]">{recipe.description}</p> : null}

 <div className="mb-6 grid grid-cols-4 gap-2">
 {macroCells.map((m) => (
 <div key={m.label} className="rounded-xl bg-[var(--surface-brand-subtle)] p-2.5 text-center">
 <p className="text-xs font-bold text-[var(--text-primary)]">{m.value}</p>
 <p className="text-[9px] text-[var(--text-muted)]">{m.unit}</p>
 <p className="mt-0.5 text-[8px] text-[var(--text-muted)]">{m.label}</p>
 </div>
 ))}
 </div>

 <div className="mb-6 flex items-center justify-between rounded-2xl bg-[var(--surface-muted)] px-4 py-3">
 <span className="text-sm font-medium text-[var(--text-secondary)]">Serves</span>
 <div className="flex items-center gap-3">
 <button
 type="button"
 onClick={() => setServings((s) => Math.max(1, s - 1))}
 className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-default)] text-[var(--text-muted)]"
 aria-label="Decrease servings"
 >
 −
 </button>
 <span className="w-4 text-center font-bold text-[var(--text-primary)]">{servings}</span>
 <button
 type="button"
 onClick={() => setServings((s) => s + 1)}
 className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-default)] text-[var(--text-muted)]"
 aria-label="Increase servings"
 >
 +
 </button>
 </div>
 </div>

 <h2 className="mb-3 text-sm font-bold text-[var(--text-primary)]">Ingredients</h2>
 <div className="mb-6 space-y-0">
 {ingredients.length === 0 ? (
 <p className="text-sm text-[var(--text-muted)]">
 No ingredients yet.{""}
 <Link href={editHref} className="font-medium text-[var(--brand-primary)] underline">
 Add in edit
 </Link>
 </p>
 ) : (
 ingredients.map((ing) => {
 const qty = Math.round(ing.quantity * multiplier * 100) / 100;
 const weightHint = formatIngredientWeightSuffix(qty, ing.unit, ing.name);
 return (
 <div
 key={ing.id}
 className="flex items-center justify-between border-b border-[var(--border-subtle)] py-2"
 >
 <div className="flex min-w-0 items-center gap-2">
 <span className="text-sm text-[var(--text-secondary)]">
 {qty} {ing.unit} {ing.name}
 {weightHint ? <span className="text-[var(--text-muted)]"> {weightHint}</span> : null}
 </span>
 {ing.cofid_matched_by && ing.cofid_matched_by !=="exact" ? (
 <span
 className="text-xs text-[var(--text-muted)]"
 title={`Matched to: ${ing.cofid_food_name ??""}`}
 >
 ~
 </span>
 ) : null}
 {ing.nutrition_estimated ? (
 <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-xs text-amber-600">
 est.
 </span>
 ) : null}
 </div>
 </div>
 );
 })
 )}
 </div>

 <div className="flex gap-3">
 <Link href="/planner" className={`${ds.primaryBtn} flex-1 py-3.5 text-center`}>
 Add to planner
 </Link>
 <div className="flex gap-2">
 {lifecycleActions ?? (
 <>
 {archiveAction}
 {deleteAction}
 </>
 )}
 </div>
 </div>
 </div>
 </div>
 );
}
