import { createClient } from "@/lib/supabase/server";
import { fetchRecipeNutritionMap } from "@/lib/supabase/recipe-nutrition-query";
import { getMonday, toLocalISO } from "@/lib/utils/dates";
import {
  normalizeRecipeNutritionEmbed,
  type RecipeNutritionSummary,
} from "@/lib/utils/recipe-nutrition";
import type { MealType } from "@/types";

/**
 * planned: the default — counts toward the day, nothing recorded.
 * eaten:   confirmed; still counts (it already did). The tick on the card.
 * skipped: not eaten; excluded from totals. The one that changes numbers.
 */
export type TodayMealStatus = "planned" | "eaten" | "skipped";

export type TodayMeal = {
  id: string;
  mealPlanId: string;
  dayOfWeek: number;
  mealType: MealType;
  slotIndex: number;
  status: TodayMealStatus;
  /** @deprecated derived from status; kept for callers that predate it. */
  logged: boolean;
  servingLabel: string | null;
  recipe: {
    id: string;
    name: string;
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
    fibre: number;
    imageUrl: string | null;
  } | null;
  quickAddName: string | null;
  quickAddCalories: number | null;
};

type EntryRow = {
  id: string | number;
  meal_type: string;
  slot_index: number | null;
  recipe_id: string | null;
  quick_add_name: string | null;
  quick_add_calories: number | string | null;
  recipe: { id: string; name: string } | { id: string; name: string }[] | null;
  eaten_at?: string | null;
  skipped_at?: string | null;
};

/** PostgREST reports an unknown column by name; both were added together. */
function isMissingStatusColumns(message?: string | null): boolean {
  if (!message) return false;
  return message.includes("eaten_at") || message.includes("skipped_at");
}

function todayDayOfWeek(): number {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1;
}

export async function getTodaysMeals(userId: string): Promise<TodayMeal[]> {
  const supabase = await createClient();
  const weekStart = toLocalISO(getMonday(new Date()));
  const dayOfWeek = todayDayOfWeek();

  const { data: plan } = await supabase
    .from("meal_plans")
    .select("id")
    .eq("user_id", userId)
    .eq("week_start_date", weekStart)
    .maybeSingle();

  if (!plan?.id) return [];

  // Supabase infers row types from a literal select string, so the two shapes
  // are written out rather than assembled, and both are read as EntryRow.
  const withStatus = supabase
    .from("meal_plan_entries")
    .select(
      `
      id,
      meal_type,
      slot_index,
      recipe_id,
      quick_add_name,
      quick_add_calories,
      eaten_at,
      skipped_at,
      recipe:recipes (
        id,
        name
      )
    `,
    )
    .eq("meal_plan_id", plan.id)
    .eq("day_of_week", dayOfWeek)
    .order("meal_type")
    .order("slot_index");

  const withoutStatus = () =>
    supabase
      .from("meal_plan_entries")
      .select(
        `
      id,
      meal_type,
      slot_index,
      recipe_id,
      quick_add_name,
      quick_add_calories,
      recipe:recipes (
        id,
        name
      )
    `,
      )
      .eq("meal_plan_id", plan.id)
      .eq("day_of_week", dayOfWeek)
      .order("meal_type")
      .order("slot_index");

  // eaten_at / skipped_at arrive with sql/2026-09-14_meal_entry_status.sql.
  // Until that migration runs, selecting them fails the whole query — which
  // would blank the Today screen rather than merely lose the status feature.
  // Retry without them and treat every entry as planned, matching the
  // tolerance quickAddMeal already shows for its own late-added columns.
  let result = (await withStatus) as { data: EntryRow[] | null; error: { message: string } | null };
  if (result.error && isMissingStatusColumns(result.error.message)) {
    result = (await withoutStatus()) as { data: EntryRow[] | null; error: { message: string } | null };
  }
  const { data: entries, error } = result;

  if (error || !entries?.length) return [];

  const recipeIds = entries
    .map((e) => e.recipe_id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);
  const nutritionMap = recipeIds.length ? await fetchRecipeNutritionMap(supabase, recipeIds) : new Map();

  const meals: TodayMeal[] = [];

  for (const entry of entries) {
    const hasQuickAdd = Boolean(entry.quick_add_name);
    const recipeEmbed = entry.recipe as { id: string; name: string } | { id: string; name: string }[] | null;
    const recipeRow = Array.isArray(recipeEmbed) ? recipeEmbed[0] ?? null : recipeEmbed;
    const recipeId = entry.recipe_id as string | null;

    if (!hasQuickAdd && !recipeId) continue;

    let recipe: TodayMeal["recipe"] = null;
    if (recipeId && recipeRow) {
      const n = nutritionMap.get(recipeId);
      const embed = normalizeRecipeNutritionEmbed(
        n as RecipeNutritionSummary | null | undefined,
      );
      recipe = {
        id: recipeRow.id,
        name: recipeRow.name,
        kcal: Math.round(embed?.calories ?? 0),
        protein: Math.round(embed?.protein_g ?? 0),
        carbs: Math.round(embed?.carbs_g ?? 0),
        fat: Math.round(embed?.fat_g ?? 0),
        fibre: Math.round(embed?.fibre_g ?? 0),
        imageUrl: null,
      };
    }

    const kcal = recipe?.kcal ?? (entry.quick_add_calories != null ? Math.round(Number(entry.quick_add_calories)) : 0);
    const servingLabel = hasQuickAdd
      ? `${Math.round(Number(entry.quick_add_calories ?? 0))} kcal · quick add`
      : recipe
        ? `${kcal} kcal`
        : null;

    const status: TodayMealStatus = entry.skipped_at ? "skipped" : entry.eaten_at ? "eaten" : "planned";

    meals.push({
      id: String(entry.id),
      mealPlanId: plan.id,
      dayOfWeek,
      mealType: entry.meal_type as MealType,
      slotIndex: Number(entry.slot_index ?? 0),
      status,
      logged: status === "eaten",
      servingLabel,
      recipe,
      quickAddName: entry.quick_add_name as string | null,
      quickAddCalories:
        entry.quick_add_calories != null ? Math.round(Number(entry.quick_add_calories)) : null,
    });
  }

  const mealOrder: Record<MealType, number> = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 };
  return meals.sort((a, b) => {
    const ma = mealOrder[a.mealType] ?? 9;
    const mb = mealOrder[b.mealType] ?? 9;
    if (ma !== mb) return ma - mb;
    return a.slotIndex - b.slotIndex;
  });
}

export type TodayTotals = {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
};

/**
 * The day's intake. Skipped meals are left out; planned and eaten both count,
 * so the plan remains the default truth and only a recorded deviation moves
 * the numbers. A user who never logs sees exactly what they saw before.
 */
export function sumTodayTotals(meals: TodayMeal[]): TodayTotals {
  return meals.reduce(
    (acc, meal) => {
      if (meal.status === "skipped") return acc;
      if (meal.recipe) {
        return {
          kcal: acc.kcal + meal.recipe.kcal,
          protein: acc.protein + meal.recipe.protein,
          carbs: acc.carbs + meal.recipe.carbs,
          fat: acc.fat + meal.recipe.fat,
          fibre: acc.fibre + meal.recipe.fibre,
        };
      }
      return {
        ...acc,
        kcal: acc.kcal + (meal.quickAddCalories ?? 0),
      };
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 },
  );
}
