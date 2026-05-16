import { addDays, toLocalISO } from "@/lib/utils/dates";
import {
  normalizeRecipeNutritionEmbed,
  type RecipeNutritionSummary,
} from "@/lib/utils/recipe-nutrition";
import { getEntryCalories, type MealPlanEntry } from "@/types";

export type DayMacros = {
  dayOfWeek: number;
  dateISO: string;
  short: string;
  num: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type WeekMacroSummary = {
  days: DayMacros[];
  weekAvg: { kcal: number; protein: number; carbs: number; fat: number };
};

function nutritionFromEntry(entry: MealPlanEntry) {
  return normalizeRecipeNutritionEmbed(
    entry.recipe?.recipe_nutrition as RecipeNutritionSummary | RecipeNutritionSummary[] | null | undefined,
  );
}

export function computeWeeklyMacrosFromEntries(
  entries: MealPlanEntry[],
  weekStart: Date,
): WeekMacroSummary {
  const days: DayMacros[] = Array.from({ length: 7 }, (_, day) => {
    const dayEntries = entries.filter((e) => e.day_of_week === day);
    let kcal = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;

    for (const entry of dayEntries) {
      const n = nutritionFromEntry(entry);
      const cals = getEntryCalories(entry);
      if (cals != null) kcal += cals;
      else if (n?.calories != null) kcal += n.calories;
      protein += n?.protein_g ?? 0;
      carbs += n?.carbs_g ?? 0;
      fat += n?.fat_g ?? 0;
    }

    const date = addDays(weekStart, day);
    return {
      dayOfWeek: day,
      dateISO: toLocalISO(date),
      short: date.toLocaleDateString("en-GB", { weekday: "short" }).slice(0, 3),
      num: String(date.getDate()),
      kcal,
      protein,
      carbs,
      fat,
    };
  });

  const filled = days.filter((d) => d.kcal > 0);
  const divisor = filled.length > 0 ? filled.length : 1;
  const sum = filled.reduce(
    (acc, d) => ({
      kcal: acc.kcal + d.kcal,
      protein: acc.protein + d.protein,
      carbs: acc.carbs + d.carbs,
      fat: acc.fat + d.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );

  return {
    days,
    weekAvg: {
      kcal: sum.kcal / divisor,
      protein: sum.protein / divisor,
      carbs: sum.carbs / divisor,
      fat: sum.fat / divisor,
    },
  };
}
