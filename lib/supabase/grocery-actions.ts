"use server";

import type { MealType } from "@/types";
import {
  addManualGroceryItem as addManualGroceryItemImpl,
  deleteGroceryItem as deleteGroceryItemImpl,
  deleteGroceryList as deleteGroceryListImpl,
  generateGroceryList as generateGroceryListImpl,
  toggleGroceryItem as toggleGroceryItemImpl,
} from "@/lib/supabase/grocery";
import { planningAccessError } from "@/lib/supabase/meal-plans";

// Making a list from the plan needs canPlan. Ticking, deleting and adding
// items by hand stay open once a trial ends, so the week can still be shopped.

export async function toggleGroceryItem(item_id: string, is_checked: boolean) {
  return toggleGroceryItemImpl(item_id, is_checked);
}

export async function deleteGroceryItem(item_id: string) {
  return deleteGroceryItemImpl(item_id);
}

export async function generateGroceryList(
  meal_plan_id: string,
  selectedDays?: number[],
  selectedMealTypes?: MealType[],
) {
  const blocked = await planningAccessError();
  if (blocked) return { error: blocked };
  return generateGroceryListImpl(meal_plan_id, selectedDays, selectedMealTypes);
}

export async function addManualGroceryItem(
  meal_plan_id: string,
  name: string,
  quantity: number,
  unit: string,
) {
  return addManualGroceryItemImpl(meal_plan_id, name, quantity, unit);
}

export async function deleteGroceryList(meal_plan_id: string) {
  return deleteGroceryListImpl(meal_plan_id);
}
