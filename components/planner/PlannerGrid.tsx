"use client";

import { Fragment, useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { formatDayWithOrdinal } from "@/lib/utils/dates";
import { EmptyState } from "@/components/ui/EmptyState";
import { RecipeSlotCard } from "@/components/planner/RecipeSlotCard";
import { AddSlotButton } from "@/components/planner/AddSlotButton";
import { ClearWeekButton } from "@/components/planner/ClearWeekButton";
import { DailyTotalsRow } from "@/components/planner/DailyTotalsRow";
import { CalorieRing } from "@/components/today/CalorieRing";
import { getGoalStatus } from "@/lib/today/goal-status";
import { RecipePickerModal } from "@/components/planner/RecipePickerModal";
import type { ProfileDietPrefs } from "@/lib/utils/diet";
import { sumDayNutritionFromEntries } from "@/lib/planner/weekly-macros";
import { DAY_LABELS, MEAL_LABELS, MEAL_TYPES } from "@/types";
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

const BREAKFAST_EMPTY_TIP =
"Tip: add recipes whose names mention oats, eggs, yoghurt… so hints and AI picks align better.";

function BreakfastEmptyTip({ className ="" }: { className?: string }) {
 return (
 <p
 className={`text-2xs font-normal normal-case leading-snug text-[var(--text-muted)] ${className}`.trim()}
 >
 {BREAKFAST_EMPTY_TIP}
 </p>
 );
}

function isBreakfastRowEmpty(grid: PlannerGridType): boolean {
 for (let day = 0; day < 7; day++) {
 if (grid[day]?.breakfast) return false;
 }
 return true;
}

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
 /** Force mobile day layout (screenshot capture at 390px). */
 forceMobileLayout?: boolean;
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
 forceMobileLayout = false,
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
 .filter((entry) => entry.day_of_week === day && entry.meal_type ==="snack")
 .sort((a, b) => (a.slot_index ?? 0) - (b.slot_index ?? 0));
 }

 function nextSnackSlotIndex(day: number): number {
 const slots = snackEntriesForDay(day).map((e) => e.slot_index ?? 0);
 if (!slots.length) return 0;
 return Math.max(...slots) + 1;
 }

 function handleAssigned() {}

 const showBreakfastTip = isBreakfastRowEmpty(grid);
 const hasAnyMeals = entries.some((entry) => entry.recipe_id != null || !!entry.quick_add_name);

 return (
 <>
 {!hasAnyMeals ? (
 <EmptyState
 icon={CalendarDays}
 title="Your week is empty"
 description="Tap any meal slot to add a recipe — or use Generate AI plan above to fill the whole week"
 action={{ href: "/recipes", label: "Browse recipes" }}
 secondaryAction={{ href: "/sample-week", label: "See a sample week" }}
 className="mb-4"
 />
 ) : null}
 {hasAnyMeals ? (
 <div className="mb-2 flex justify-end">
 <ClearWeekButton mealPlanId={mealPlanId} />
 </div>
 ) : null}
 <div
 className={`${forceMobileLayout ? "hidden" : "hidden sm:block"} overflow-x-auto rounded-[20px] border border-[var(--border-default)] bg-[var(--surface-card)] shadow-[var(--card-shadow)]`}
 >
 <div className="grid min-w-[980px] grid-cols-[120px_repeat(7,minmax(112px,1fr))]">
 <div className="border-b border-[var(--border-default)] p-2" />
 {Array.from({ length: 7 }, (_, day) => (
 <div key={`head-${day}`} className="border-b border-l border-[var(--border-default)] p-2 text-center">
 <p className="text-[11px] font-bold tracking-[0.04em] text-[var(--text-muted)]">{DAY_LABELS[day]}</p>
 <p className="font-display text-base font-extrabold tracking-[-0.02em] text-[var(--text-primary)]">{formatDayWithOrdinal(weekDates[day].getDate())}</p>
 </div>
 ))}

 {MEAL_TYPES.map((mealType) => (
 <Fragment key={mealType}>
 <div className="border-b border-[var(--border-default)] p-3 font-display text-[11px] font-extrabold uppercase tracking-[0.08em] text-[var(--text-muted)]">
 {MEAL_LABELS[mealType]}
 </div>
 {Array.from({ length: 7 }, (_, day) => {
 const entry = grid[day][mealType];
 const snackEntries = mealType ==="snack" ? snackEntriesForDay(day) : [];
 return (
 <div key={`${mealType}-${day}`} className="min-w-0 border-b border-l border-[var(--border-default)] p-2">
 {mealType ==="snack" ? (
 <div className="space-y-1">
 {snackEntries.length > 0 ? (
 snackEntries.map((snack) => (
 <RecipeSlotCard key={snack.id} entry={snack} dietPrefs={dietPrefs} dietaryPreferences={dietaryPreferences} variant="grid" />
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
 <RecipeSlotCard key={entry.id} entry={entry} dietPrefs={dietPrefs} dietaryPreferences={dietaryPreferences} variant="grid" />
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
 {mealType ==="breakfast" && showBreakfastTip ? (
 <div className="col-span-8 border-b border-[var(--border-default)] bg-[var(--surface-brand-subtle)]/60 px-3 py-2">
 <BreakfastEmptyTip />
 </div>
 ) : null}
 </Fragment>
 ))}

 <DailyTotalsRow
 entries={entries}
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
 showBreakfastTip={showBreakfastTip}
 forceMobileLayout={forceMobileLayout}
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
 weekDates={weekDates}
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
 showBreakfastTip: boolean;
 forceMobileLayout?: boolean;
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
 showBreakfastTip,
 forceMobileLayout = false,
}: MobileProps) {
 const [activeDay, setActiveDay] = useState(initialActiveDay);

 useEffect(() => {
 setActiveDay(initialActiveDay);
 }, [weekStartIso, initialActiveDay]);
 const hasTargets = !!dailyCalorieTarget && !!dailyProteinTarget;
 const snackEntries = entries
 .filter((entry) => entry.day_of_week === activeDay && entry.meal_type ==="snack")
 .sort((a, b) => (a.slot_index ?? 0) - (b.slot_index ?? 0));
 const nextSnackSlot = snackEntries.length ? Math.max(...snackEntries.map((e) => e.slot_index ?? 0)) + 1 : 0;

 return (
 <div className={forceMobileLayout ? "space-y-3" : "space-y-3 sm:hidden"}>
 <div className="scrollbar-hide -mr-4 flex gap-2 overflow-x-auto pb-2 pr-4">
 {Array.from({ length: 7 }, (_, day) => {
 const dayKcal = sumDayNutritionFromEntries(day, entries).kcal;
 const active = activeDay === day;
 const fill = dailyCalorieTarget ? Math.min(dayKcal / dailyCalorieTarget, 1) : dayKcal > 0 ? 1 : 0;
 return (
 <button
 key={day}
 type="button"
 onClick={() => setActiveDay(day)}
 aria-pressed={active}
 className={`flex min-w-[68px] flex-col items-center gap-1.5 rounded-[14px] border px-2 pb-2.5 pt-3 transition-[background-color,border-color,box-shadow] ${
 active
 ?"border-[var(--btn-primary-bg)] bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] shadow-[0_8px_22px_rgba(10,122,88,0.22)]"
 :"border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-primary)] hover:border-[var(--brand-primary)]"
 }`}
 >
 <span className={`text-[11px] font-bold tracking-[0.04em] ${active ? "opacity-80" : "text-[var(--text-muted)]"}`}>
 {DAY_LABELS[day]}
 </span>
 <span className="font-display text-lg font-extrabold leading-none tracking-[-0.03em]">
 {formatDayWithOrdinal(weekDates[day].getDate())}
 </span>
 <span
 className={`h-[3px] w-full overflow-hidden rounded-full ${active ? "bg-white/25" : "bg-[var(--border-default)]"}`}
 aria-hidden
 >
 <span
 className={`block h-full rounded-full ${active ? "bg-[var(--accent-lime)]" : "bg-[var(--brand-action)]"}`}
 style={{ width: `${fill * 100}%` }}
 />
 </span>
 <span className={`text-[10px] ${active ? "opacity-80" : "text-[var(--text-muted)]"}`}>
 {dayKcal > 0 ? `${Math.round(dayKcal).toLocaleString("en-GB")} kcal` : "—"}
 </span>
 </button>
 );
 })}
 </div>

 <div className="space-y-3">
 {MEAL_TYPES.map((mealType) => {
 const entry = grid[activeDay][mealType];
 return (
 <div key={mealType} className="meal-section space-y-2">
 <p className="meal-type-label">{MEAL_LABELS[mealType]}</p>
 {mealType ==="breakfast" && showBreakfastTip ? (
 <BreakfastEmptyTip className="rounded-xl bg-[var(--surface-brand-subtle)]/80 px-3 py-2" />
 ) : null}
 {mealType ==="snack" ? (
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
 <RecipeSlotCard key={entry.id} entry={entry} dietPrefs={dietPrefs} dietaryPreferences={dietaryPreferences} />
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

 <div className="rounded-[18px] border border-[var(--border-default)] bg-[var(--surface-card)] p-5 shadow-[var(--card-shadow)]">
 {(() => {
 const dayEntries = entries.filter((e) => e.day_of_week === activeDay);
 const { kcal: cal, protein: pro, carbs, fat, fibre, sugar } = sumDayNutritionFromEntries(
 activeDay,
 entries,
 );
 if (dayEntries.length === 0) return <p className="text-sm text-[var(--text-muted)]">No meals planned</p>;
 const status = hasTargets ? getGoalStatus("kcal", cal, dailyCalorieTarget!) : null;
 return (
 <>
 <div className="mb-4 flex items-center justify-between gap-3">
 <span className="font-display text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--text-muted)]">
 {DAY_LABELS[activeDay]} total
 </span>
 {status ? (
 <span className={`rounded-full bg-[var(--surface-brand-subtle)] px-2.5 py-1 text-[11px] font-bold ${status.textClassName}`}>
 {status.label}
 </span>
 ) : null}
 </div>
 <div className="mb-4 flex items-center gap-4">
 {hasTargets ? <CalorieRing consumed={cal} target={dailyCalorieTarget!} size={76} /> : null}
 <div>
 <p className="font-display text-[28px] font-extrabold leading-none tracking-[-0.04em] text-[var(--text-primary)]">
 {Math.round(cal).toLocaleString("en-GB")}
 </p>
 <p className="mt-1 text-xs text-[var(--text-muted)]">
 {hasTargets ? `of ${dailyCalorieTarget!.toLocaleString("en-GB")} kcal` : "kcal"}
 </p>
 </div>
 </div>
 <div className="grid grid-cols-3 gap-3 border-t border-[var(--border-subtle)] pt-4 text-sm">
 {[
 ["Protein", pro, hasTargets ? dailyProteinTarget : null],
 ["Carbs", carbs, null],
 ["Fat", fat, null],
 ["Fibre", fibre, null],
 ["Sugar", sugar, null],
 ].map(([label, value, target]) => (
 <div key={String(label)}>
 <p className="text-xs text-[var(--text-muted)]">{label}</p>
 <p className="font-display font-extrabold text-[var(--text-primary)]">
 {Math.round(Number(value))}g
 {target ? <span className="text-xs font-medium text-[var(--text-muted)]"> / {target}g</span> : null}
 </p>
 </div>
 ))}
 </div>
 </>
 );
 })()}
 </div>
 </div>
 </div>
 );
}
