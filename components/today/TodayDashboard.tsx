"use client";

import { CalendarDays } from "lucide-react";
import { CalorieRing } from "@/components/today/CalorieRing";
import { EmptyState } from "@/components/ui/EmptyState";
import { GoalsStatusLegend } from "@/components/today/GoalsStatusLegend";
import { MacroBar } from "@/components/today/MacroBar";
import { getGoalStatus } from "@/lib/today/goal-status";
import { TodayMealCard } from "@/components/today/TodayMealCard";
import type { TodayMeal, TodayTotals } from "@/lib/planner/today";
import type { UserNutritionTargets } from "@/lib/utils/nutrition-targets";
import { MEAL_LABELS, type MealType } from "@/types";
import { formatLongDateWithOrdinal } from "@/lib/utils/dates";
import { ds } from "@/lib/ui/classes";

const MEAL_ORDER: MealType[] = ["breakfast","lunch","dinner","snack"];

type Props = {
 meals: TodayMeal[];
 totals: TodayTotals;
 targets: UserNutritionTargets;
 dietaryPreferences: string[];
 /** Landing capture — goals card only (ring + macro bars). */
 heroOnly?: boolean;
 /** Landing capture — ring + one macro bar (~260px crop). */
 compactHero?: boolean;
 /** Fixed date string for screenshot staging. */
 dateLabel?: string;
};

export function TodayDashboard({
 meals,
 totals,
 targets,
 dietaryPreferences,
 heroOnly = false,
 compactHero = false,
 dateLabel,
}: Props) {
 const remaining = Math.max(0, targets.kcal - totals.kcal);
 const calorieStatus = getGoalStatus("kcal", totals.kcal, targets.kcal);
 const headerDate = dateLabel ?? formatLongDateWithOrdinal(new Date());

 return (
 <div className={`${ds.mobilePage} ${compactHero ? "" : ds.pageContent}`}>
 {compactHero ? null : (
 <div className={ds.gradientHeaderCompact}>
 <p className={`mb-0.5 text-sm ${ds.pageSubtitle}`}>{headerDate}</p>
 <h1 className="text-2xl font-bold text-[var(--text-on-header)]">Your Goals</h1>
 </div>
 )}

 <div className={compactHero ? "p-3" : `${ds.mobileGutter} ${ds.overlap}`}>
 <div className={`${compactHero ? "" : "mb-4 "}${ds.card} ${compactHero ? "p-4" : "p-6"}`}>
 <div className={`flex items-center gap-4 ${compactHero ? "mb-3" : "mb-6"}`}>
 <CalorieRing consumed={totals.kcal} target={targets.kcal} />
 <div className="min-w-0">
 <p className={ds.statLabel}>Calories</p>
 <p className={ds.statValue}>
 {Math.round(totals.kcal)}
 <span className={ds.statUnit}> / {targets.kcal}</span>
 </p>
 <p className={`mt-0.5 ${ds.tierMeta}`}>
 {remaining} kcal remaining
 </p>
 <p className={`text-2xs font-medium ${calorieStatus.textClassName}`}>{calorieStatus.label}</p>
 </div>
 </div>

 {compactHero ? (
 <MacroBar metric="protein" label="Protein" value={totals.protein} target={targets.protein} unit="g" />
 ) : (
 <>
 <div className="grid grid-cols-2 gap-x-3 gap-y-4">
 <MacroBar metric="protein" label="Protein" value={totals.protein} target={targets.protein} unit="g" />
 <MacroBar metric="fibre" label="Fibre" value={totals.fibre} target={targets.fibre} unit="g" />
 <MacroBar metric="fat" label="Fat" value={totals.fat} target={targets.fat} unit="g" />
 <MacroBar metric="carbs" label="Carbs" value={totals.carbs} target={targets.carbs} unit="g" />
 </div>
 <GoalsStatusLegend />
 </>
 )}
 </div>

 {heroOnly ? null : (
 <div className="mb-4">
 <h2 className={`mb-3 flex items-center gap-2 ${ds.sectionTitle}`}>
 Meals for Today
 </h2>

 {meals.length === 0 ? (
 <EmptyState
 icon={CalendarDays}
 title="Nothing planned for today"
 description="Plan your week and today's meals will show up here with your calorie ring and macros"
 action={{ href: "/onboarding", label: "Finish setup" }}
 secondaryAction={{ href: "/sample-week", label: "See a sample week" }}
 className="py-12"
 />
 ) : (
 MEAL_ORDER.map((mealType) => {
 const typeMeals = meals.filter((m) => m.mealType === mealType);
 if (!typeMeals.length) return null;

 return (
 <div key={mealType} className="mb-4">
 <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
 {MEAL_LABELS[mealType]}
 </h3>
 <div className="space-y-2">
 {typeMeals.map((meal) => (
 <TodayMealCard key={meal.id} meal={meal} dietaryPreferences={dietaryPreferences} />
 ))}
 </div>
 </div>
 );
 })
 )}
 </div>
 )}
 </div>
 </div>
 );
}
