import {
  dailyCalorieBand,
} from "@/lib/planner/calorie-bands";
import { ds } from "@/lib/ui/classes";
import { sumDayNutritionFromEntries } from "@/lib/planner/weekly-macros";
import type { MealPlanEntry } from "@/types";

type Props = {
 entries: MealPlanEntry[];
 dailyCalorieTarget?: number | null;
 dailyProteinTarget?: number | null;
};

function getBarColour(actual: number, target: number): string {
 if (!target) return "bg-[var(--surface-muted)]";
 const { min, max } = dailyCalorieBand(target);
 if (actual >= min && actual <= max) return "bg-[var(--btn-primary-bg)]";
 if (actual > max) {
  const pct = (actual / target) * 100;
  if (pct > 110) return ds.trafficRed;
  return ds.trafficAmber;
 }
 const pct = (actual / target) * 100;
 if (pct < 70) return ds.trafficRed;
 return ds.trafficAmber;
}

export function DailyTotalsRow({ entries, dailyCalorieTarget, dailyProteinTarget }: Props) {
 const hasTargets = !!dailyCalorieTarget && !!dailyProteinTarget;
 return (
 <>
 <div className="flex items-center justify-end border-t border-[var(--border-default)] px-2 py-2">
 <span className="text-2xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Totals</span>
 </div>
 {Array.from({ length: 7 }, (_, day) => {
 const dayEntries = entries.filter((e) => e.day_of_week === day);
 const { kcal: calories, protein } = sumDayNutritionFromEntries(day, entries);
 const isEmpty = dayEntries.length === 0;
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
