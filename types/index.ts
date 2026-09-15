export type ActionResult<T = void> =
  | { success: true; data?: T; message?: string }
  | { error: string; code?: string };

export type NutritionPer100g = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fibre_g: number;
  sugar_g: number;
  sodium_mg: number;
  saturated_fat_g: number;
};

import { normalizeRecipeNutritionEmbed, type RecipeNutritionSummary } from "@/lib/utils/recipe-nutrition";

export type NutritionLookupEntry = {
  name: string;
  per_100g: NutritionPer100g;
  /** Average grams per whole unit when quantity uses "piece" or "item" (e.g. one medium apple). */
  typical_piece_g?: number;
  /** Average grams per slice when quantity uses "slice" (e.g. sandwich bread). */
  typical_slice_g?: number;
};

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};
export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const ALLOWED_UNITS = [
  "g",
  "kg",
  "oz",
  "lb",
  "ml",
  "l",
  "tsp",
  "tbsp",
  "cup",
  "fl oz",
  "piece",
  "pieces",
  "item",
  "items",
  "whole",
  "unit",
  "units",
  "each",
  "slice",
  "slices",
  "handful",
  "clove",
  "cloves",
  "rasher",
  "rashers",
] as const;
export type Unit = (typeof ALLOWED_UNITS)[number];

export type MealPlan = {
  id: string;
  user_id: string;
  week_start_date: string;
  created_at: string;
};

export type RecipeDietFlags = {
  fits_vegetarian: boolean | null;
  fits_vegan: boolean | null;
  fits_gluten_free: boolean | null;
};

export type MealPlanEntry = {
  id: string;
  meal_plan_id: string;
  recipe_id: string | null;
  day_of_week: number;
  meal_type: MealType;
  slot_index?: number;
  quick_add_name: string | null;
  quick_add_calories: number | null;
  /** Set from the Today screen. Present only once the status migration has run. */
  eaten_at?: string | null;
  /** Skipped meals stay in the plan but leave every total. See isSkippedEntry. */
  skipped_at?: string | null;
  recipe?: {
    id: string;
    name: string;
    fits_vegetarian?: boolean | null;
    fits_vegan?: boolean | null;
    fits_gluten_free?: boolean | null;
    recipe_nutrition?:
      | {
          calories: number | null;
          protein_g: number | null;
          carbs_g?: number | null;
          fat_g?: number | null;
          fibre_g?: number | null;
          sugar_g?: number | null;
          sodium_mg?: number | null;
          saturated_fat_g?: number | null;
          coverage_pct?: number | null;
        }
      | Array<{
          calories: number | null;
          protein_g: number | null;
          carbs_g?: number | null;
          fat_g?: number | null;
          fibre_g?: number | null;
          sugar_g?: number | null;
          coverage_pct?: number | null;
        }>
      | null;
  };
};

export function getEntryName(entry: MealPlanEntry): string {
  return entry.recipe?.name ?? entry.quick_add_name ?? "Meal";
}

/**
 * A meal the user recorded as not eaten. It stays in the plan — the row is the
 * record of what was planned — but contributes nothing to any total, on the
 * planner, the nutrition page or Today. Those three showed different numbers
 * for the same day until they all asked this one question.
 */
export function isSkippedEntry(entry: Pick<MealPlanEntry, "skipped_at">): boolean {
  return Boolean(entry.skipped_at);
}

export function getEntryCalories(entry: MealPlanEntry): number | null {
  const row = normalizeRecipeNutritionEmbed(
    entry.recipe?.recipe_nutrition as RecipeNutritionSummary | RecipeNutritionSummary[] | null | undefined,
  );
  return row?.calories ?? entry.quick_add_calories ?? null;
}

export type PlannerGrid = {
  [day: number]: { [meal in MealType]: MealPlanEntry | null };
};

export type GroceryItem = {
  id: string;
  meal_plan_id: string;
  name: string;
  quantity: number;
  unit: string;
  is_checked: boolean;
  is_manual?: boolean;
  archived_at: string | null;
  created_at: string;
};

export type UserTier = "free" | "pro";
export type SubscriptionStatus = "free" | "pro" | "past_due" | "cancelled";
