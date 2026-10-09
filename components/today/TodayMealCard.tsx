import Link from "next/link";
import { getDietTag } from "@/lib/ui/dietTags";
import { getDietTagStyle } from "@/lib/ui/dietTagStyles";
import { MealThumbnail } from "@/components/ui/MealThumbnail";
import { TodayMealActions } from "@/components/today/TodayMealActions";
import { ds } from "@/lib/ui/classes";
import type { TodayMeal } from "@/lib/planner/today";
import { MEAL_LABELS } from "@/types";

type Props = {
 meal: TodayMeal;
 dietaryPreferences?: string[];
};

export function TodayMealCard({ meal, dietaryPreferences = [] }: Props) {
 const name = meal.recipe?.name ?? meal.quickAddName ??"Meal";
 const recipe = meal.recipe;

 const dietTag =
 recipe &&
 getDietTag(recipe.kcal, recipe.protein, recipe.carbs, recipe.fat, dietaryPreferences);

 const recipeHref = recipe ? `/recipes/${encodeURIComponent(recipe.id)}` : null;
 const skipped = meal.status ==="skipped";

 return (
 <div
 className={`flex items-start gap-3 rounded-[18px] border border-[var(--border-default)] bg-[var(--surface-card)] p-4 transition-[opacity,transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--card-shadow)] ${
 skipped ?"opacity-50" :""
 }`}
 >
 <MealThumbnail
 recipeName={name}
 mealType={meal.mealType}
 imageUrl={recipe?.imageUrl}
 imageAlt={name}
 />

 <div className="min-w-0 flex-1">
 <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--brand-primary)]">
 {MEAL_LABELS[meal.mealType]}
 </p>
 <p className={`line-clamp-2 ${ds.cardTitle} ${skipped ?"line-through" :""}`}>{name}</p>
 {skipped ? <p className={`mb-1 ${ds.tierMeta}`}>Skipped — not counted today</p> : null}
 {meal.servingLabel ? (
 <p className={`mb-1.5 ${ds.tierMeta}`}>{meal.servingLabel}</p>
 ) : null}
 {dietTag ? (
 <span className={`mb-1.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getDietTagStyle(dietTag)}`}>
 {dietTag}
 </span>
 ) : null}
 {recipe?.kcal != null ? (
 <p className="mt-1">
 <span className={ds.tierSecondary}>{Math.round(recipe.kcal)}</span>
 <span className={`ml-1 ${ds.tierMeta}`}>kcal</span>
 {recipe.protein != null ? (
 <>
 <span className={`mx-1.5 ${ds.tierMeta}`}>·</span>
 <span className={ds.tierSecondary}>{Math.round(recipe.protein)}g</span>
 <span className={`ml-1 ${ds.tierMeta}`}>protein</span>
 </>
 ) : null}
 </p>
 ) : null}
 {recipeHref ? (
 <Link
 href={recipeHref}
 className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-action-subtle)] px-2.5 py-1 text-xs font-medium text-[var(--brand-action)]"
 >
 <span className="h-2 w-2 rounded-full bg-[var(--brand-action)]" />
 Meal Stats
 </Link>
 ) : null}
 </div>

 <div className="flex-shrink-0">
 <TodayMealActions entryId={meal.id} status={meal.status} mealName={name} />
 </div>
 </div>
 );
}
