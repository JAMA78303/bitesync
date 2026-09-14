"use server";

import type { MealType } from "@/types";
import {
  assignRecipeToSlot as assignRecipeToSlotImpl,
  clearWeekEntries as clearWeekEntriesImpl,
  quickAddMeal as quickAddMealImpl,
  removeSlotEntry as removeSlotEntryImpl,
  replaceMealEntry as replaceMealEntryImpl,
  setMealEntryStatus as setMealEntryStatusImpl,
  type MealEntryStatus,
} from "@/lib/supabase/meal-plans";

export async function assignRecipeToSlot(
  meal_plan_id: string,
  recipe_id: string,
  day_of_week: number,
  meal_type: MealType,
  slot_index = 0,
) {
  return assignRecipeToSlotImpl(meal_plan_id, recipe_id, day_of_week, meal_type, slot_index);
}

export async function quickAddMeal(
  meal_plan_id: string,
  day_of_week: number,
  meal_type: MealType,
  quick_add_name: string,
  quick_add_calories?: number | null,
  slot_index = 0,
) {
  return quickAddMealImpl(
    meal_plan_id,
    day_of_week,
    meal_type,
    quick_add_name,
    quick_add_calories,
    slot_index,
  );
}

export async function removeSlotEntry(entry_id: string) {
  return removeSlotEntryImpl(entry_id);
}

export async function clearWeekEntries(meal_plan_id: string) {
  return clearWeekEntriesImpl(meal_plan_id);
}

export async function setMealEntryStatus(entry_id: string, status: MealEntryStatus) {
  return setMealEntryStatusImpl(entry_id, status);
}

export async function replaceMealEntry(
  entry_id: string,
  replacement: { name: string; calories: number | null },
) {
  return replaceMealEntryImpl(entry_id, replacement);
}
