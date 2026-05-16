"use client";

import { Fragment, useEffect, useState } from "react";
import { RecipeSlotCard } from "@/components/planner/RecipeSlotCard";
import { AddSlotButton } from "@/components/planner/AddSlotButton";
import { DailyTotalsRow } from "@/components/planner/DailyTotalsRow";
import { RecipePickerModal } from "@/components/planner/RecipePickerModal";
import type { ProfileDietPrefs } from "@/lib/utils/diet";
import {
  normalizeRecipeNutritionEmbed,
  type RecipeNutritionSummary,
} from "@/lib/utils/recipe-nutrition";
import { DAY_LABELS, MEAL_LABELS, MEAL_TYPES, getEntryCalories } from "@/types";
import type { PlannerGrid as PlannerGridType, MealPlanEntry, MealType } from "@/types";

type Recipe = {
  id: string;
  name: string;
  calories?: number | null;
  fits_vegetarian?: boolean | null;
  fits_vegan?: boolean | null;
  fits_gluten_free?: boolean | null;
  ingredientNames?: string[];
};
type Props = {
  grid: PlannerGridType;
  entries: MealPlanEntry[];
  mealPlanId: string;
  recipes: Recipe[];
  weekDates: Date[];
  /** Monday of this plan (ISO); resets mobile day picker when changing weeks. */
  weekStartIso: string;
  initialActiveDay?: number;
  dailyCalorieTarget?: number | null;
  dailyProteinTarget?: number | null;
  dietPrefs?: ProfileDietPrefs | null;
  dietaryPreferences?: string[];
};

export function PlannerGrid({
  grid,
  entries,
  mealPlanId,
  recipes,
  weekDates,
  weekStartIso,
  initialActiveDay = 0,
  dailyCalorieTarget,
  dailyProteinTarget,
  dietPrefs,
  dietaryPreferences = [],
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [activeMeal, setActiveMeal] = useState<MealType | null>(null);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(0);

  function openPicker(day: number, mealType: MealType, slotIndex = 0) {
    setActiveDay(day);
    setActiveMeal(mealType);
    setActiveSlotIndex(slotIndex);
    setModalOpen(true);
  }

  function snackEntriesForDay(day: number): MealPlanEntry[] {
    return entries
      .filter((entry) => entry.day_of_week === day && entry.meal_type === "snack")
      .sort((a, b) => (a.slot_index ?? 0) - (b.slot_index ?? 0));
  }

  function nextSnackSlotIndex(day: number): number {
    const slots = snackEntriesForDay(day).map((e) => e.slot_index ?? 0);
    if (!slots.length) return 0;
    return Math.max(...slots) + 1;
  }

  function handleAssigned() {}

  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white sm:block">
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
                const snackEntries = mealType === "snack" ? snackEntriesForDay(day) : [];
                return (
                  <div key={`${mealType}-${day}`} className="border-b border-l border-gray-200 p-2">
                    {mealType === "snack" ? (
                      <div className="space-y-1">
                        {snackEntries.length > 0 ? (
                          snackEntries.map((snack) => (
                            <RecipeSlotCard key={snack.id} entry={snack} dietPrefs={dietPrefs} dietaryPreferences={dietaryPreferences} />
                          ))
                        ) : (
                          <AddSlotButton
                            day={day}
                            mealType={mealType}
                            dayLabel={DAY_LABELS[day]}
                            mealPlanId={mealPlanId}
                            slotIndex={0}
                            onPickRecipe={openPicker}
                          />
                        )}
                        {snackEntries.length > 0 ? (
                          <AddSlotButton
                            day={day}
                            mealType={mealType}
                            dayLabel={DAY_LABELS[day]}
                            mealPlanId={mealPlanId}
                            slotIndex={nextSnackSlotIndex(day)}
                            onPickRecipe={openPicker}
                          />
                        ) : null}
                      </div>
                    ) : entry ? (
                      <RecipeSlotCard entry={entry} dietPrefs={dietPrefs} dietaryPreferences={dietaryPreferences} />
                    ) : (
                      <div className="space-y-1">
                        <AddSlotButton
                          day={day}
                          mealType={mealType}
                          dayLabel={DAY_LABELS[day]}
                          mealPlanId={mealPlanId}
                          onPickRecipe={openPicker}
                        />
                        {mealType === "breakfast" ? (
                          <p className="text-[11px] text-slate-500">
                            Tip: add recipes whose names mention oats, eggs, yoghurt… so hints and AI picks align better.
                          </p>
                        ) : null}
                      </div>
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
        entries={entries}
        mealPlanId={mealPlanId}
        weekDates={weekDates}
        weekStartIso={weekStartIso}
        openPicker={openPicker}
        initialActiveDay={initialActiveDay}
        dailyCalorieTarget={dailyCalorieTarget}
        dailyProteinTarget={dailyProteinTarget}
        dietPrefs={dietPrefs}
        dietaryPreferences={dietaryPreferences}
      />

      <RecipePickerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        mealPlanId={mealPlanId}
        day={activeDay}
        mealType={activeMeal}
        slotIndex={activeSlotIndex}
        recipes={recipes}
        dietPrefs={dietPrefs}
        onAssigned={handleAssigned}
      />
    </>
  );
}

type MobileProps = {
  grid: PlannerGridType;
  entries: MealPlanEntry[];
  mealPlanId: string;
  weekDates: Date[];
  weekStartIso: string;
  openPicker: (day: number, mealType: MealType, slotIndex?: number) => void;
  initialActiveDay: number;
  dailyCalorieTarget?: number | null;
  dailyProteinTarget?: number | null;
  dietPrefs?: ProfileDietPrefs | null;
  dietaryPreferences?: string[];
};

function PlannerGridMobileInline({
  grid,
  entries,
  mealPlanId,
  weekDates,
  weekStartIso,
  openPicker,
  initialActiveDay,
  dailyCalorieTarget,
  dailyProteinTarget,
  dietPrefs,
  dietaryPreferences = [],
}: MobileProps) {
  const [activeDay, setActiveDay] = useState(initialActiveDay);

  useEffect(() => {
    setActiveDay(initialActiveDay);
  }, [weekStartIso, initialActiveDay]);
  const hasTargets = !!dailyCalorieTarget && !!dailyProteinTarget;
  const snackEntries = entries
    .filter((entry) => entry.day_of_week === activeDay && entry.meal_type === "snack")
    .sort((a, b) => (a.slot_index ?? 0) - (b.slot_index ?? 0));
  const nextSnackSlot = snackEntries.length ? Math.max(...snackEntries.map((e) => e.slot_index ?? 0)) + 1 : 0;

  return (
    <div className="space-y-3 sm:hidden">
      <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
        {Array.from({ length: 7 }, (_, day) => (
          <button
            key={day}
            type="button"
            onClick={() => setActiveDay(day)}
            className={`flex min-w-[48px] flex-col items-center rounded-2xl px-1 py-2 transition-all ${
              activeDay === day
                ? "bg-[#3a5a40] text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            }`}
          >
            <span className="text-xs font-medium">{DAY_LABELS[day]}</span>
            <span className="text-lg font-bold">{weekDates[day].getDate()}</span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {MEAL_TYPES.map((mealType) => {
          const entry = grid[activeDay][mealType];
          return (
            <div key={mealType} className="meal-section space-y-2">
              <p className="meal-type-label">{MEAL_LABELS[mealType]}</p>
              {mealType === "snack" ? (
                <div className="space-y-1">
                  {snackEntries.length > 0 ? (
                    snackEntries.map((snack) => (
                      <RecipeSlotCard
                        key={snack.id}
                        entry={snack}
                        dietPrefs={dietPrefs}
                        dietaryPreferences={dietaryPreferences}
                      />
                    ))
                  ) : (
                    <AddSlotButton
                      day={activeDay}
                      mealType={mealType}
                      dayLabel={DAY_LABELS[activeDay]}
                      mealPlanId={mealPlanId}
                      slotIndex={0}
                      onPickRecipe={openPicker}
                    />
                  )}
                  {snackEntries.length > 0 ? (
                    <AddSlotButton
                      day={activeDay}
                      mealType={mealType}
                      dayLabel={DAY_LABELS[activeDay]}
                      mealPlanId={mealPlanId}
                      slotIndex={nextSnackSlot}
                      onPickRecipe={openPicker}
                    />
                  ) : null}
                </div>
              ) : entry ? (
                <RecipeSlotCard entry={entry} dietPrefs={dietPrefs} dietaryPreferences={dietaryPreferences} />
              ) : (
                <div className="space-y-1">
                  <AddSlotButton
                    day={activeDay}
                    mealType={mealType}
                    dayLabel={DAY_LABELS[activeDay]}
                    mealPlanId={mealPlanId}
                    onPickRecipe={openPicker}
                  />
                  {mealType === "breakfast" ? (
                    <p className="text-[11px] text-slate-500">
                      Tip: breakfast-named recipes help AI fill this slot automatically.
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}

        <div className="rounded-xl border border-gray-200 bg-white p-3">
          {(() => {
            const slots = Object.values(grid[activeDay]).filter(Boolean);
            const cal = slots.reduce((s, e) => s + (getEntryCalories(e!) ?? 0), 0);
            const pro = slots.reduce((s, e) => {
              const n = normalizeRecipeNutritionEmbed(e!.recipe?.recipe_nutrition as RecipeNutritionSummary | RecipeNutritionSummary[] | null | undefined);
              return s + (n?.protein_g ?? 0);
            }, 0);
            const carbs = slots.reduce((s, e) => {
              const n = normalizeRecipeNutritionEmbed(e!.recipe?.recipe_nutrition as RecipeNutritionSummary | RecipeNutritionSummary[] | null | undefined);
              return s + (n?.carbs_g ?? 0);
            }, 0);
            const fat = slots.reduce((s, e) => {
              const n = normalizeRecipeNutritionEmbed(e!.recipe?.recipe_nutrition as RecipeNutritionSummary | RecipeNutritionSummary[] | null | undefined);
              return s + (n?.fat_g ?? 0);
            }, 0);
            const fibre = slots.reduce((s, e) => {
              const n = normalizeRecipeNutritionEmbed(e!.recipe?.recipe_nutrition as RecipeNutritionSummary | RecipeNutritionSummary[] | null | undefined);
              return s + (n?.fibre_g ?? 0);
            }, 0);
            const sugar = slots.reduce((s, e) => {
              const n = normalizeRecipeNutritionEmbed(e!.recipe?.recipe_nutrition as RecipeNutritionSummary | RecipeNutritionSummary[] | null | undefined);
              return s + (n?.sugar_g ?? 0);
            }, 0);
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
