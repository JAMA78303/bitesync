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
  /** True when some ingredients lacked data, so this is a known floor, not a complete total. */
  partial: boolean;
};

export type MicroAnalysis = {
  must_hit: NutrientResult[];
  must_limit: NutrientResult[];
  week_start: string;
  /** Ingredients with micronutrient data / total ingredients considered. */
  covered_items: number;
  total_items: number;
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

  let totalItems = 0;
  let coveredItems = 0;
  const microEntries: ReturnType<typeof scaleMicros>[] = [];
  for (const ing of ingredients) {
    const name = String(ing.name ?? "");
    const grams = ingredientGrams(
      Number(ing.quantity ?? 0),
      String(ing.unit ?? ""),
      lookupNutrition(name),
      name,
    );
    if (!grams) continue;
    totalItems += 1;
    const micros = lookupMicros(name);
    if (!micros) continue;
    coveredItems += 1;
    microEntries.push(scaleMicros(micros, grams));
  }

  if (!microEntries.length) return null;

  const weeklyTotals = sumMicros(microEntries);
  // Some ingredients had no nutrient data, so summed intakes are a known floor, not a
  // complete total. For "must not exceed" limits, under-reporting is the dangerous
  // direction, so a green that could really be over the limit is shown as amber.
  const partial = coveredItems < totalItems;

  const results: NutrientResult[] = Object.keys(UK_DRVS).map((key) => {
    const drv = UK_DRVS[key]![sex];
    const weeklyValue = Number(weeklyTotals[key as keyof typeof weeklyTotals] ?? 0);
    const baseTraffic = getTrafficLight(key, weeklyValue, sex);
    const traffic: TrafficLight =
      partial && drv.type === "limit" && baseTraffic === "green" ? "amber" : baseTraffic;
    const baseLabel = getTrafficLightLabel(key, weeklyValue, sex);

    return {
      key,
      label: NUTRIENT_LABELS[key] ?? key,
      daily_avg: weeklyValue / 7,
      unit: drv.unit,
      rni: drv.rni || null,
      upper: drv.upper || null,
      type: drv.type,
      traffic,
      pct_label: partial ? `${baseLabel} · partial data` : baseLabel,
      partial,
    };
  });

  return {
    must_hit: results.filter((r) => r.type !== "limit"),
    must_limit: results.filter((r) => r.type === "limit"),
    week_start: weekStartISO,
    covered_items: coveredItems,
    total_items: totalItems,
  };
}
