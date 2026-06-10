import {
 normalizeRecipeNutritionEmbed,
 type RecipeNutritionSummary,
} from "@/lib/utils/recipe-nutrition";
import type { PlannerGrid } from "@/types";

type Props = {
 grid: PlannerGrid;
 dailyCalorieTarget?: number | null;
 dailyProteinTarget?: number | null;
};

function getBarColour(actual: number, target: number): string {
 const pct = (actual / target) * 100;
 if (pct > 110) return"bg-red-500";
 if (pct > 105) return"bg-amber-500";
 if (pct >= 90 && pct <= 105) return"bg-[var(--btn-primary-bg)]";
 if (pct >= 70) return"bg-amber-400";
 return"bg-red-400";
}

export function DailyTotalsRow({ grid, dailyCalorieTarget, dailyProteinTarget }: Props) {
 const hasTargets = !!dailyCalorieTarget && !!dailyProteinTarget;
 return (
 <>
 <div className="flex items-center justify-end border-t border-[var(--border-default)] px-2 py-2">
 <span className="text-2xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Totals</span>
 </div>
 {Array.from({ length: 7 }, (_, day) => {
 const slots = Object.values(grid[day]).filter(Boolean);
 const calories = slots.reduce((s, e) => {
 const n = normalizeRecipeNutritionEmbed(
 e!.recipe?.recipe_nutrition as RecipeNutritionSummary | RecipeNutritionSummary[] | null | undefined,
 );
 return s + (n?.calories ?? 0);
 }, 0);
 const protein = slots.reduce((s, e) => {
 const n = normalizeRecipeNutritionEmbed(
 e!.recipe?.recipe_nutrition as RecipeNutritionSummary | RecipeNutritionSummary[] | null | undefined,
 );
 return s + (n?.protein_g ?? 0);
 }, 0);
 const isEmpty = slots.length === 0;
 const calRatio = dailyCalorieTarget ? calories / dailyCalorieTarget : 0;
 const proRatio = dailyProteinTarget ? protein / dailyProteinTarget : 0;
 const calPct = dailyCalorieTarget ? Math.min(calRatio * 100, 100) : 0;
 const proPct = dailyProteinTarget ? Math.min(proRatio * 100, 100) : 0;

 return (
 <div key={`totals-${day}`} className="flex flex-col items-center justify-center border-t border-[var(--border-default)] px-1 py-2">
 {isEmpty ? (
 <span className="text-sm text-[var(--text-on-header-muted)]">-</span>
 ) : (
 <>
 <span className="tabular-nums text-xs font-semibold text-[var(--text-secondary)]">
 {Math.round(calories)}
 <span className="ml-0.5 text-2xs font-normal text-[var(--text-muted)]">kcal</span>
 </span>
 <span className="tabular-nums text-2xs font-medium text-[var(--brand-primary)]">{Math.round(protein)}g P</span>
 {hasTargets ? (
 <div className="mt-1 w-full space-y-0.5">
 <div className="h-1 overflow-hidden rounded-full bg-[var(--surface-muted)]">
 <div
 className={`h-full rounded-full transition-all duration-300 ${getBarColour(calories, dailyCalorieTarget!)}`}
 style={{ width: `${calRatio > 1 ? 100 : calPct}%` }}
 />
 </div>
 <div className="h-1 overflow-hidden rounded-full bg-[var(--surface-muted)]">
 <div
 className={`h-full rounded-full transition-all duration-300 ${getBarColour(protein, dailyProteinTarget!)}`}
 style={{ width: `${proRatio > 1 ? 100 : proPct}%` }}
 />
 </div>
 </div>
 ) : null}
 </>
 )}
 </div>
 );
 })}
 </>
 );
}
