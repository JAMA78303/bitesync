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

export type NutritionLookupEntry = {
  name: string;
  per_100g: NutritionPer100g;
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
  "slice",
  "handful",
  "clove",
  "rasher",
] as const;
export type Unit = (typeof ALLOWED_UNITS)[number];

export type MealPlan = {
  id: string;
  user_id: string;
  week_start_date: string;
  created_at: string;
};

export type MealPlanEntry = {
  id: string;
  meal_plan_id: string;
  recipe_id: string | null;
  day_of_week: number;
  meal_type: MealType;
  quick_add_name: string | null;
  quick_add_calories: number | null;
  recipe?: {
    id: string;
    name: string;
    recipe_nutrition?: {
      calories: number | null;
      protein_g: number | null;
      carbs_g?: number | null;
      fat_g?: number | null;
      fibre_g?: number | null;
      sugar_g?: number | null;
      coverage_pct: number;
    } | null;
  };
};

export function getEntryName(entry: MealPlanEntry): string {
  return entry.recipe?.name ?? entry.quick_add_name ?? "Meal";
}

export function getEntryCalories(entry: MealPlanEntry): number | null {
  return entry.recipe?.recipe_nutrition?.calories ?? entry.quick_add_calories ?? null;
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
