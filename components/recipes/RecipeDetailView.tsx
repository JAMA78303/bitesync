"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CookingMode } from "@/components/recipes/CookingMode";
import { MealThumbnail } from "@/components/ui/MealThumbnail";
import { parseRecipeSteps } from "@/lib/recipes/parseRecipeSteps";
import { getDietTag } from "@/lib/ui/dietTags";
import { formatIngredientWeightSuffix } from "@/lib/nutrition/convert";
import { isCookedWeightStaple } from "@/lib/recipes/cookedWeight";
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
 method_steps?: string[] | null;
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
 const [cookingOpen, setCookingOpen] = useState(false);
 const multiplier = servings / baseServings;
 const methodSteps = useMemo(() => {
  const fromColumn = Array.isArray(recipe.method_steps)
   ? recipe.method_steps.map((s) => String(s).trim()).filter(Boolean)
   : [];
  return fromColumn.length ? fromColumn : parseRecipeSteps(recipe.description);
 }, [recipe.method_steps, recipe.description]);

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
 <header className={`${ds.gradientHeader} flex flex-col gap-4 md:flex-row md:items-center md:justify-between`}>
 <div className="min-w-0">
 <span className={ds.kicker}>{dietTag ? dietTag : "RECIPE"}</span>
 <h1 className={`mb-1.5 ${ds.pageTitle}`}>{recipe.name}</h1>
 {recipe.source_domain && recipe.source_url ? (
 <a
 href={recipe.source_url}
 target="_blank"
 rel="noopener noreferrer"
 className={`${ds.pageSubtitle} underline-offset-2 hover:underline`}
 >
 Imported from {recipe.source_domain} ↗
 </a>
 ) : (
 <p className={ds.pageSubtitle}>
 {kcal ? `${Math.round(kcal)} kcal · ${Math.round(protein)}g protein` : "Your recipe"}
 </p>
 )}
 </div>
 <Link href="/recipes" className={`${ds.heroGhostBtn} shrink-0 self-start md:self-center`}>
 ← Back to recipes
 </Link>
 </header>

 <div className={`${ds.mobileGutter} grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_300px]`}>
 <article className={`${ds.card} overflow-hidden`}>
 <div className="flex h-36 items-center justify-center bg-[var(--surface-action-subtle)] md:h-44">
 <MealThumbnail recipeName={recipe.name} mealType="dinner" size="lg" />
 </div>

 <div className="p-5 md:p-7">
 {recipe.description ? (
 <p className="mb-5 text-sm leading-relaxed text-[var(--text-secondary)]">{recipe.description}</p>
 ) : null}

 <div className="mb-6 grid grid-cols-4 gap-2">
 {macroCells.map((m) => (
 <div key={m.label} className="rounded-xl bg-[var(--surface-brand-subtle)] px-1 py-3 text-center">
 <p className="font-display text-base font-extrabold text-[var(--text-primary)]">
 {m.value}
 <span className="text-[11px] font-semibold text-[var(--text-muted)]">{m.unit === "g" ? "g" : ""}</span>
 </p>
 <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">{m.label}</p>
 </div>
 ))}
 </div>

 <div className="mb-6 flex items-center justify-between rounded-xl border border-[var(--border-default)] px-4 py-3">
 <span className="text-sm font-semibold text-[var(--text-secondary)]">Serves</span>
 <div className="flex items-center gap-3">
 <button
 type="button"
 onClick={() => setServings((s) => Math.max(1, s - 1))}
 className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--brand-primary)]"
 aria-label="Decrease servings"
 >
 −
 </button>
 <span className="w-5 text-center font-display font-extrabold text-[var(--text-primary)]">{servings}</span>
 <button
 type="button"
 onClick={() => setServings((s) => s + 1)}
 className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--brand-primary)]"
 aria-label="Increase servings"
 >
 +
 </button>
 </div>
 </div>

 <span className={ds.sectionKicker}>INGREDIENTS · {servings} {servings === 1 ? "SERVING" : "SERVINGS"}</span>
 <div className="mt-2 space-y-0">
 {ingredients.length === 0 ? (
 <p className="text-sm text-[var(--text-muted)]">
 No ingredients yet.{" "}
 <Link href={editHref} className="font-medium text-[var(--brand-primary)] underline">
 Add in edit
 </Link>
 </p>
 ) : (
 ingredients.map((ing) => {
 const qty = Math.round(ing.quantity * multiplier * 100) / 100;
 const weightHint = formatIngredientWeightSuffix(qty, ing.unit, ing.name);
 // Pulses are costed as the drained tin — cooked weight — which is the one
 // basis a cook might not assume. Grains and meat are as bought; no label.
 const tinned = ing.unit ==="g" && isCookedWeightStaple(ing.name);
 return (
 <div
 key={ing.id}
 className="flex items-center justify-between border-b border-[var(--border-subtle)] py-2.5 last:border-b-0"
 >
 <div className="flex min-w-0 items-center gap-2">
 <span className="text-sm text-[var(--text-secondary)]">
 {qty} {ing.unit} {ing.name}
 {weightHint ? <span className="text-[var(--text-muted)]"> {weightHint}</span> : null}
 {tinned ? <span className="text-[var(--text-muted)]"> · cooked / drained weight</span> : null}
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
 <span className={`${ds.estBadge} px-1.5 py-0.5`}>est.</span>
 ) : null}
 </div>
 </div>
 );
 })
 )}
 </div>
 </div>
 </article>

 <aside className={`${ds.card} p-5 md:sticky md:top-[92px] md:p-6`}>
 <span className={ds.sectionKicker}>ADD TO YOUR WEEK</span>
 <h2 className="mb-2 font-display text-lg font-extrabold tracking-[-0.02em] text-[var(--text-primary)]">
 Ready to plan this meal?
 </h2>
 <p className="mb-5 text-sm leading-relaxed text-[var(--text-muted)]">
 Pick a day in your planner and that day&apos;s totals update with it.
 </p>
 {methodSteps.length ? (
 <button
 type="button"
 onClick={() => setCookingOpen(true)}
 className={`${ds.primaryBtn} mb-3 w-full py-3.5`}
 >
 Cook
 </button>
 ) : null}
 <Link
 href="/planner"
 className={`${methodSteps.length ? ds.secondaryBtn : ds.primaryBtn} w-full py-3.5 text-center`}
 >
 Add to planner
 </Link>
 <div className="mt-3 flex justify-end gap-2">
 {lifecycleActions ?? (
 <>
 {archiveAction}
 {deleteAction}
 </>
 )}
 </div>
 </aside>
 </div>

 {cookingOpen ? (
 <CookingMode
 recipeName={recipe.name}
 steps={methodSteps}
 ingredients={ingredients.map((ing) => ({
 name: ing.name,
 quantity: Math.round(ing.quantity * multiplier * 100) / 100,
 unit: ing.unit,
 }))}
 servings={servings}
 onClose={() => setCookingOpen(false)}
 />
 ) : null}
 </div>
 );
}
