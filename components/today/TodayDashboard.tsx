"use client";

import Link from "next/link";
import { CalorieRing } from "@/components/today/CalorieRing";
import { GoalsStatusLegend } from "@/components/today/GoalsStatusLegend";
import { MacroBar } from "@/components/today/MacroBar";
import { getGoalStatus } from "@/lib/today/goal-status";
import { TodayMealCard } from "@/components/today/TodayMealCard";
import type { TodayMeal, TodayTotals } from "@/lib/planner/today";
import type { UserNutritionTargets } from "@/lib/utils/nutrition-targets";
import { MEAL_LABELS, type MealType } from "@/types";

const MEAL_ORDER: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

type Props = {
  meals: TodayMeal[];
  totals: TodayTotals;
  targets: UserNutritionTargets;
  dietaryPreferences: string[];
};

export function TodayDashboard({ meals, totals, targets, dietaryPreferences }: Props) {
  const remaining = Math.max(0, targets.kcal - totals.kcal);
  const calorieStatus = getGoalStatus("kcal", totals.kcal, targets.kcal);
  const dateLabel = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="-mx-4 min-h-screen bg-gray-50 pb-28 dark:bg-gray-950 md:mx-0">
      <div className="bg-gradient-to-b from-[#3a5a40] to-[#4a7a50] px-5 pt-6 pb-8">
        <p className="mb-0.5 text-sm text-white/70">{dateLabel}</p>
        <h1 className="text-2xl font-bold text-white">Your Goals</h1>
      </div>

      <div className="-mt-4 px-4">
        <div className="mb-4 rounded-3xl bg-white p-6 shadow-sm dark:bg-gray-900">
          <div className="mb-6 flex items-center gap-6">
            <CalorieRing consumed={totals.kcal} target={targets.kcal} />
            <div>
              <p className="mb-0.5 text-xs text-gray-400">Calories</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(totals.kcal)}
                <span className="text-base font-normal text-gray-400"> / {targets.kcal}</span>
              </p>
              <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                {remaining} kcal remaining
              </p>
              <p className={`text-[10px] font-medium ${calorieStatus.textClassName}`}>{calorieStatus.label}</p>
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
          <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
            Meals for Today
            <span aria-hidden>🍽️</span>
          </h2>

          {meals.length === 0 ? (
            <div className="py-10 text-center">
              <p className="mb-3 text-sm text-gray-400">No meals planned for today</p>
              <Link
                href="/planner"
                className="inline-block rounded-xl bg-[#3a5a40] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#2f4a35]"
              >
                Go to planner
              </Link>
            </div>
          ) : (
            MEAL_ORDER.map((mealType) => {
              const typeMeals = meals.filter((m) => m.mealType === mealType);
              if (!typeMeals.length) return null;

              return (
                <div key={mealType} className="mb-4">
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
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
