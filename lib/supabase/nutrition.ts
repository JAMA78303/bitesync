import {
  NUTRIENT_LABELS,
  UK_DRVS,
  getTrafficLight,
  getTrafficLightLabel,
  isAboveUpperLimit,
  isUnderTarget,
  type Sex,
  type TrafficLight,
} from "@/lib/nutrition/drv";
import { aggregateWeeklyMicrosFromPlan } from "@/lib/nutrition/weeklyMicroTotals";
import { createClient } from "@/lib/supabase/server";
import { isSkippedEntry } from "@/types";

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
  /** Daily average is below the RNI (deficiency direction). */
  under_target: boolean;
  /** Daily average exceeds the safe upper limit, when one exists. */
  above_upper: boolean;
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

  // Skipped meals leave the micronutrient analysis too — a week's iron is
  // what was eaten, not what was scheduled. Same tolerance as everywhere else
  // for a database that predates the status columns.
  type EntryRow = { recipe_id: string | null; skipped_at?: string | null };
  const withStatus = await supabase
    .from("meal_plan_entries")
    .select("recipe_id, skipped_at")
    .eq("meal_plan_id", mealPlanId)
    .not("recipe_id", "is", null);
  let entries = withStatus.data as EntryRow[] | null;
  if (withStatus.error && withStatus.error.message.includes("skipped_at")) {
    const legacy = await supabase
      .from("meal_plan_entries")
      .select("recipe_id")
      .eq("meal_plan_id", mealPlanId)
      .not("recipe_id", "is", null);
    entries = (legacy.data ?? []) as EntryRow[];
  }

  if (!entries?.length) return null;

  const eaten = entries.filter((e) => !isSkippedEntry(e));
  if (!eaten.length) return null;

  const recipeIds = [...new Set(eaten.map((e) => e.recipe_id).filter(Boolean).map(String))];
  if (!recipeIds.length) return null;

  const { data: ingredients } = await supabase
    .from("recipe_ingredients")
    .select("recipe_id, name, quantity, unit")
    .in("recipe_id", recipeIds);

  if (!ingredients?.length) return null;

  const aggregated = aggregateWeeklyMicrosFromPlan(
    eaten.map((e) => ({ recipe_id: String(e.recipe_id) })),
    ingredients.map((ing) => ({
      recipe_id: String(ing.recipe_id),
      name: String(ing.name ?? ""),
      quantity: Number(ing.quantity ?? 0),
      unit: String(ing.unit ?? ""),
    })),
  );

  if (!aggregated) return null;

  const { weeklyTotals, totalItems, coveredItems } = aggregated;
  const weeklyRetinolMcg = Number(weeklyTotals.retinol_mcg ?? 0);
  const microContext = { weeklyRetinolMcg };
  // Some ingredients had no nutrient data, so summed intakes are a known floor, not a
  // complete total. For "must not exceed" limits, under-reporting is the dangerous
  // direction, so a green that could really be over the limit is shown as amber.
  const partial = coveredItems < totalItems;

  const results: NutrientResult[] = Object.keys(UK_DRVS).map((key) => {
    const drv = UK_DRVS[key]![sex];
    const weeklyValue = Number(weeklyTotals[key as keyof typeof weeklyTotals] ?? 0);
    const baseTraffic = getTrafficLight(key, weeklyValue, sex, microContext);
    const traffic: TrafficLight =
      partial && drv.type === "limit" && baseTraffic === "green" ? "amber" : baseTraffic;
    const baseLabel = getTrafficLightLabel(key, weeklyValue, sex, microContext);

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
      under_target: isUnderTarget(key, weeklyValue, sex),
      above_upper: isAboveUpperLimit(key, weeklyValue, sex, microContext),
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
