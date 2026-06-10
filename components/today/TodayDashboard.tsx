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
};

export function TodayDashboard({ meals, totals, targets, dietaryPreferences }: Props) {
 const remaining = Math.max(0, targets.kcal - totals.kcal);
 const calorieStatus = getGoalStatus("kcal", totals.kcal, targets.kcal);
 const dateLabel = formatLongDateWithOrdinal(new Date());

 return (
 <div className={`${ds.mobilePage} ${ds.pageContent}`}>
 <div className={ds.gradientHeaderCompact}>
 <p className={`mb-0.5 text-sm ${ds.pageSubtitle}`}>{dateLabel}</p>
 <h1 className="text-2xl font-bold text-[var(--text-on-header)]">Your Goals</h1>
 </div>

 <div className={`${ds.mobileGutter} ${ds.overlap}`}>
 <div className={`mb-4 ${ds.card} p-6`}>
 <div className="mb-6 flex items-center gap-6">
 <CalorieRing consumed={totals.kcal} target={targets.kcal} />
 <div>
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

 <div className="grid grid-cols-2 gap-4">
 <MacroBar metric="protein" label="Protein" value={totals.protein} target={targets.protein} unit="g" />
 <MacroBar metric="fibre" label="Fibre" value={totals.fibre} target={targets.fibre} unit="g" />
 <MacroBar metric="fat" label="Fat" value={totals.fat} target={targets.fat} unit="g" />
 <MacroBar metric="carbs" label="Carbs" value={totals.carbs} target={targets.carbs} unit="g" />
 </div>
 <GoalsStatusLegend />
 </div>

 <div className="mb-4">
 <h2 className={`mb-3 flex items-center gap-2 ${ds.sectionTitle}`}>
 Meals for Today
 </h2>

 {meals.length === 0 ? (
 <EmptyState
 icon={CalendarDays}
 title="Nothing planned for today"
 description="Add meals to your weekly planner and they will show up here"
 action={{ href: "/planner", label: "Go to planner" }}
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
 </div>
 </div>
 );
}
