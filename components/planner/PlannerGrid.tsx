"use client";

import { Fragment } from "react";
import { useState } from "react";
import { RecipeSlotCard } from "@/components/planner/RecipeSlotCard";
import { AddSlotButton } from "@/components/planner/AddSlotButton";
import { DailyTotalsRow } from "@/components/planner/DailyTotalsRow";
import { RecipePickerModal } from "@/components/planner/RecipePickerModal";
import { DAY_LABELS, MEAL_LABELS, MEAL_TYPES, getEntryCalories } from "@/types";
import type { PlannerGrid as PlannerGridType, MealType } from "@/types";

type Recipe = { id: string; name: string; calories?: number | null };
type Props = {
  grid: PlannerGridType;
  mealPlanId: string;
  recipes: Recipe[];
  weekDates: Date[];
  initialActiveDay?: number;
  dailyCalorieTarget?: number | null;
  dailyProteinTarget?: number | null;
};

export function PlannerGrid({
  grid,
  mealPlanId,
  recipes,
  weekDates,
  initialActiveDay = 0,
  dailyCalorieTarget,
  dailyProteinTarget,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [activeMeal, setActiveMeal] = useState<MealType | null>(null);

  function openPicker(day: number, mealType: MealType) {
    setActiveDay(day);
    setActiveMeal(mealType);
    setModalOpen(true);
  }

  function handleAssigned() {}

  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white md:block">
        <div className="grid min-w-[900px] grid-cols-[120px_repeat(7,minmax(100px,1fr))]">
          <div className="border-b border-gray-200 p-2" />
          {Array.from({ length: 7 }, (_, day) => (
            <div key={`head-${day}`} className="border-b border-l border-gray-200 p-2 text-center">
              <p className="text-xs font-medium text-gray-500">{DAY_LABELS[day]}</p>
              <p className="text-sm font-semibold text-gray-900">{weekDates[day].getDate()}</p>
            </div>
          ))}

          {MEAL_TYPES.map((mealType) => (
            <Fragment key={mealType}>
              <div className="border-b border-gray-200 p-2 text-xs font-semibold uppercase text-gray-500">
                {MEAL_LABELS[mealType]}
              </div>
              {Array.from({ length: 7 }, (_, day) => {
                const entry = grid[day][mealType];
                return (
                  <div key={`${mealType}-${day}`} className="border-b border-l border-gray-200 p-2">
                    {entry ? (
                      <RecipeSlotCard entry={entry} />
                    ) : (
                      <AddSlotButton
                        day={day}
                        mealType={mealType}
                        dayLabel={DAY_LABELS[day]}
                        mealPlanId={mealPlanId}
                        onPickRecipe={openPicker}
                      />
                    )}
                  </div>
                );
              })}
            </Fragment>
          ))}

          <DailyTotalsRow
            grid={grid}
            dailyCalorieTarget={dailyCalorieTarget}
            dailyProteinTarget={dailyProteinTarget}
          />
        </div>
      </div>

      <PlannerGridMobileInline
        grid={grid}
        mealPlanId={mealPlanId}
        weekDates={weekDates}
        openPicker={openPicker}
        initialActiveDay={initialActiveDay}
        dailyCalorieTarget={dailyCalorieTarget}
        dailyProteinTarget={dailyProteinTarget}
      />

      <RecipePickerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        mealPlanId={mealPlanId}
        day={activeDay}
        mealType={activeMeal}
        recipes={recipes}
        onAssigned={handleAssigned}
      />
    </>
  );
}

type MobileProps = {
  grid: PlannerGridType;
  mealPlanId: string;
  weekDates: Date[];
  openPicker: (day: number, mealType: MealType) => void;
  initialActiveDay: number;
  dailyCalorieTarget?: number | null;
  dailyProteinTarget?: number | null;
};

function PlannerGridMobileInline({
  grid,
  mealPlanId,
  weekDates,
  openPicker,
  initialActiveDay,
  dailyCalorieTarget,
  dailyProteinTarget,
}: MobileProps) {
  const [activeDay, setActiveDay] = useState(initialActiveDay);
  const hasTargets = !!dailyCalorieTarget && !!dailyProteinTarget;

  return (
    <div className="space-y-3 md:hidden">
      <div className="grid grid-cols-7 gap-1 rounded-xl border border-gray-200 bg-white p-2">
        {Array.from({ length: 7 }, (_, day) => (
          <button
            key={day}
            type="button"
            onClick={() => setActiveDay(day)}
            className={`flex min-w-0 flex-col items-center rounded-lg px-1 py-2 transition-all ${
              activeDay === day ? "bg-[#1A4731] text-white" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <span className="text-xs">{DAY_LABELS[day]}</span>
            <span className="text-sm font-semibold">{weekDates[day].getDate()}</span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {MEAL_TYPES.map((mealType) => {
          const entry = grid[activeDay][mealType];
          return (
            <div key={mealType} className="space-y-1 rounded-xl border border-gray-200 bg-white p-3">
              <p className="text-xs font-semibold uppercase text-gray-500">{MEAL_LABELS[mealType]}</p>
              {entry ? (
                <RecipeSlotCard entry={entry} />
              ) : (
                <AddSlotButton
                  day={activeDay}
                  mealType={mealType}
                  dayLabel={DAY_LABELS[activeDay]}
                  mealPlanId={mealPlanId}
                  onPickRecipe={openPicker}
                />
              )}
            </div>
          );
        })}

        <div className="rounded-xl border border-gray-200 bg-white p-3">
          {(() => {
            const slots = Object.values(grid[activeDay]).filter(Boolean);
            const cal = slots.reduce((s, e) => s + (getEntryCalories(e!) ?? 0), 0);
            const pro = slots.reduce((s, e) => s + (e!.recipe?.recipe_nutrition?.protein_g ?? 0), 0);
            const carbs = slots.reduce((s, e) => s + (e!.recipe?.recipe_nutrition?.carbs_g ?? 0), 0);
            const fat = slots.reduce((s, e) => s + (e!.recipe?.recipe_nutrition?.fat_g ?? 0), 0);
            const fibre = slots.reduce((s, e) => s + (e!.recipe?.recipe_nutrition?.fibre_g ?? 0), 0);
            const sugar = slots.reduce((s, e) => s + (e!.recipe?.recipe_nutrition?.sugar_g ?? 0), 0);
            if (slots.length === 0) return <p className="text-sm text-gray-500">No meals planned</p>;
            return (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Calories</p>
                  <p className="font-medium text-gray-900">{Math.round(cal)} kcal</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Protein</p>
                  <p className="font-medium text-gray-900">{Math.round(pro)}g</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Carbs</p>
                  <p className="font-medium text-gray-900">{Math.round(carbs)}g</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Fat</p>
                  <p className="font-medium text-gray-900">{Math.round(fat)}g</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Fibre</p>
                  <p className="font-medium text-gray-900">{Math.round(fibre)}g</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Sugar</p>
                  <p className="font-medium text-gray-900">{Math.round(sugar)}g</p>
                </div>
                {hasTargets ? (
                  <div className="col-span-2">
                    <p className="mt-1 text-xs text-slate-400">
                      Target: {dailyCalorieTarget} kcal · {dailyProteinTarget}g P
                    </p>
                  </div>
                ) : null}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
