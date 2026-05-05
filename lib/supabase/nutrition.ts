import { ingredientGrams } from "@/lib/nutrition/convert";
import { lookupNutrition } from "@/lib/nutrition/lookup";
import { NUTRIENT_LABELS, UK_DRVS, getTrafficLight, getTrafficLightLabel, type Sex, type TrafficLight } from "@/lib/nutrition/drv";
import { lookupMicros, scaleMicros, sumMicros } from "@/lib/nutrition/micros";
import { createClient } from "@/lib/supabase/server";

export type NutrientResult = {
  key: string;
  label: string;
  daily_avg: number;
  unit: string;
  rni: number | null;
  upper: number | null;
  type: "hit" | "limit" | "both";
  traffic: TrafficLight;
  pct_label: string;
};

export type MicroAnalysis = {
  must_hit: NutrientResult[];
  must_limit: NutrientResult[];
  week_start: string;
};

export async function getWeeklyMicroAnalysis(
  mealPlanId: string,
  weekStartISO: string,
  sex: Sex,
): Promise<MicroAnalysis | null> {
  const supabase = await createClient();

  const { data: entries } = await supabase
    .from("meal_plan_entries")
    .select("recipe_id")
    .eq("meal_plan_id", mealPlanId)
    .not("recipe_id", "is", null);

  if (!entries?.length) return null;

  const recipeIds = entries
    .map((e) => e.recipe_id)
    .filter(Boolean)
    .map(String);
  if (!recipeIds.length) return null;

  const { data: ingredients } = await supabase
    .from("recipe_ingredients")
    .select("name, quantity, unit")
    .in("recipe_id", recipeIds);

  if (!ingredients?.length) return null;

  const microEntries = ingredients
    .map((ing) => {
      const micros = lookupMicros(String(ing.name ?? ""));
      if (!micros) return null;
      const name = String(ing.name ?? "");
      const grams = ingredientGrams(
        Number(ing.quantity ?? 0),
        String(ing.unit ?? ""),
        lookupNutrition(name),
        name,
      );
      if (!grams) return null;
      return scaleMicros(micros, grams);
    })
    .filter(Boolean) as ReturnType<typeof scaleMicros>[];

  if (!microEntries.length) return null;

  const weeklyTotals = sumMicros(microEntries);

  const results: NutrientResult[] = Object.keys(UK_DRVS).map((key) => {
    const drv = UK_DRVS[key]![sex];
    const weeklyValue = Number(weeklyTotals[key as keyof typeof weeklyTotals] ?? 0);

    return {
      key,
      label: NUTRIENT_LABELS[key] ?? key,
      daily_avg: weeklyValue / 7,
      unit: drv.unit,
      rni: drv.rni || null,
      upper: drv.upper || null,
      type: drv.type,
      traffic: getTrafficLight(key, weeklyValue, sex),
      pct_label: getTrafficLightLabel(key, weeklyValue, sex),
    };
  });

  return {
    must_hit: results.filter((r) => r.type !== "limit"),
    must_limit: results.filter((r) => r.type === "limit"),
    week_start: weekStartISO,
  };
}
