import { ingredientGrams } from "@/lib/nutrition/convert";
import { lookupNutrition } from "@/lib/nutrition/lookup";
import { lookupMicros, scaleMicros, sumMicros, type MicroEntry } from "@/lib/nutrition/micros";

export type WeeklyMicroPlanEntry = {
  recipe_id: string;
};

export type WeeklyMicroRecipeIngredient = {
  recipe_id: string;
  name: string;
  quantity: number;
  unit: string;
};

export type WeeklyMicroAggregate = {
  weeklyTotals: MicroEntry;
  totalItems: number;
  coveredItems: number;
};

/** Sum micronutrients for a week, scaling each recipe by how often it appears on the plan. */
export function aggregateWeeklyMicrosFromPlan(
  entries: WeeklyMicroPlanEntry[],
  ingredients: WeeklyMicroRecipeIngredient[],
): WeeklyMicroAggregate | null {
  if (!entries.length || !ingredients.length) return null;

  const entryCounts = new Map<string, number>();
  for (const entry of entries) {
    const id = String(entry.recipe_id ?? "").trim();
    if (!id) continue;
    entryCounts.set(id, (entryCounts.get(id) ?? 0) + 1);
  }
  if (!entryCounts.size) return null;

  let totalItems = 0;
  let coveredItems = 0;
  const microEntries: MicroEntry[] = [];

  for (const ing of ingredients) {
    const recipeId = String(ing.recipe_id ?? "").trim();
    const times = entryCounts.get(recipeId) ?? 0;
    if (!times) continue;

    const name = String(ing.name ?? "");
    const grams = ingredientGrams(
      Number(ing.quantity ?? 0),
      String(ing.unit ?? ""),
      lookupNutrition(name),
      name,
    );
    if (!grams) continue;

    totalItems += times;
    const micros = lookupMicros(name);
    if (!micros) continue;

    coveredItems += times;
    microEntries.push(scaleMicros(micros, grams * times));
  }

  if (!microEntries.length) return null;

  return {
    weeklyTotals: sumMicros(microEntries),
    totalItems,
    coveredItems,
  };
}
