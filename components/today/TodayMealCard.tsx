import Link from "next/link";
import { getDietTag } from "@/lib/ui/dietTags";
import { getDietTagStyle } from "@/lib/ui/dietTagStyles";
import { getMealEmoji } from "@/lib/ui/mealThumbnails";
import type { TodayMeal } from "@/lib/planner/today";

type Props = {
 meal: TodayMeal;
 dietaryPreferences?: string[];
};

export function TodayMealCard({ meal, dietaryPreferences = [] }: Props) {
 const name = meal.recipe?.name ?? meal.quickAddName ??"Meal";
 const emoji = getMealEmoji(name, meal.mealType);
 const recipe = meal.recipe;

 const dietTag =
 recipe &&
 getDietTag(recipe.kcal, recipe.protein, recipe.carbs, recipe.fat, dietaryPreferences);

 const recipeHref = recipe ? `/recipes/${encodeURIComponent(recipe.id)}` : null;

 return (
 <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-3">
 <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--surface-brand-subtle)] text-2xl">
 {recipe?.imageUrl ? (
 // eslint-disable-next-line @next/next/no-img-element
 <img src={recipe.imageUrl} alt={name} className="h-full w-full object-cover" />
 ) : (
 <span>{emoji}</span>
 )}
 </div>

 <div className="min-w-0 flex-1">
 <p className="truncate text-sm font-bold text-[var(--text-primary)]">{name}</p>
 {meal.servingLabel ? (
 <p className="mb-1.5 text-xs text-[var(--text-muted)]">{meal.servingLabel}</p>
 ) : null}
 {dietTag ? (
 <span className={`mb-1.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getDietTagStyle(dietTag)}`}>
 {dietTag}
 </span>
 ) : null}
 {recipeHref ? (
 <Link
 href={recipeHref}
 className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-brand-subtle)] px-2.5 py-1 text-xs font-medium text-[var(--brand-primary)]"
 >
 <span className="h-2 w-2 rounded-full bg-[var(--brand-primary)]" />
 Meal Stats
 </Link>
 ) : null}
 </div>

 <div className="flex-shrink-0" aria-hidden>
 {meal.logged ? (
 <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand-primary)]">
 <svg className="h-4 w-4 text-[var(--text-on-brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
 <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
 </svg>
 </div>
 ) : (
 <div className="h-7 w-7 rounded-full border-2 border-[var(--border-default)]" />
 )}
 </div>
 </div>
 );
}
