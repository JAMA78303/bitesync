import { ingredientGrams } from "@/lib/nutrition/convert";
import { sugarGramsTowardFreeSugarLimit } from "@/lib/nutrition/freeSugars";
import { lookupNutrition } from "@/lib/nutrition/lookup";
import { lookupMicros, scaleMicros, sumMicros, type MicroEntry } from "@/lib/nutrition/micros";
import { lookupOmega } from "@/lib/nutrition/omega-values";

export type WeeklyMicroPlanEntry = {
  recipe_id: string;
};

export type WeeklyMicroRecipeIngredient = {
  recipe_id: string;
  name: string;
  quantity: number;
  unit: string;
};

/**
 * Omega is tracked separately from MicroEntry, with its own coverage.
 *
 * Its food table is far smaller than the micronutrient one, so folding it in
 * would let an unmeasured food count as zero and read as a deficiency. Callers
 * should suppress the figure entirely when coverage is too thin to mean anything.
 */
export type WeeklyOmegaAggregate = {
  omega_3_g: number;
  omega_6_g: number;
  /** Ingredient instances with a known omega value. */
  coveredItems: number;
  totalItems: number;
};

export type WeeklyMicroAggregate = {
  weeklyTotals: MicroEntry;
  totalItems: number;
  coveredItems: number;
  /** Null when nothing on the plan has a measured omega value. */
  omega: WeeklyOmegaAggregate | null;
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
  let omega3 = 0;
  let omega6 = 0;
  let omegaCovered = 0;
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

    // Independent of the micro lookup: a food can have omega data without a full
    // micronutrient row, and vice versa.
    const omega = lookupOmega(name);
    if (omega) {
      const scale = (grams * times) / 100;
      omega3 += omega.omega_3_g * scale;
      omega6 += omega.omega_6_g * scale;
      omegaCovered += times;
    }

    const micros = lookupMicros(name);
    if (!micros) continue;

    coveredItems += times;
    const scaled = scaleMicros(micros, grams * times);
    scaled.sugar_g = sugarGramsTowardFreeSugarLimit(name, scaled.sugar_g);
    microEntries.push(scaled);
  }

  if (!microEntries.length) return null;

  return {
    weeklyTotals: sumMicros(microEntries),
    totalItems,
    coveredItems,
    omega: omegaCovered
      ? {
          omega_3_g: Math.round(omega3 * 100) / 100,
          omega_6_g: Math.round(omega6 * 100) / 100,
          coveredItems: omegaCovered,
          totalItems,
        }
      : null,
  };
}
