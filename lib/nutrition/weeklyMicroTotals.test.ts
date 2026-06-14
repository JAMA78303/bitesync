import {
  aggregateWeeklyMicrosFromPlan,
  type WeeklyMicroPlanEntry,
  type WeeklyMicroRecipeIngredient,
} from "@/lib/nutrition/weeklyMicroTotals";

const RECIPE_ID = "recipe-spinach-bowl";

const spinachIngredients: WeeklyMicroRecipeIngredient[] = [
  { recipe_id: RECIPE_ID, name: "spinach", quantity: 80, unit: "g" },
  { recipe_id: RECIPE_ID, name: "chicken breast", quantity: 140, unit: "g" },
];

function entries(count: number): WeeklyMicroPlanEntry[] {
  return Array.from({ length: count }, () => ({ recipe_id: RECIPE_ID }));
}

function assertNear(actual: number, expected: number, label: string, tolerance = 0.01): void {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

const once = aggregateWeeklyMicrosFromPlan(entries(1), spinachIngredients);
const seven = aggregateWeeklyMicrosFromPlan(entries(7), spinachIngredients);

if (!once || !seven) {
  throw new Error("expected aggregate results for 1× and 7× plans");
}

assertNear(seven.weeklyTotals.iron_mg, once.weeklyTotals.iron_mg * 7, "iron_mg scales with repeat count");
assertNear(seven.weeklyTotals.folate_mcg, once.weeklyTotals.folate_mcg * 7, "folate_mcg scales with repeat count");
assertNear(seven.coveredItems, once.coveredItems * 7, "covered_items scales with repeat count");
assertNear(seven.totalItems, once.totalItems * 7, "total_items scales with repeat count");

// Unreferenced recipes on the plan must not inflate totals.
const mixed = aggregateWeeklyMicrosFromPlan(
  [{ recipe_id: RECIPE_ID }, { recipe_id: "other-recipe" }],
  spinachIngredients,
);
if (!mixed) throw new Error("expected mixed-plan aggregate");
assertNear(mixed.weeklyTotals.iron_mg, once.weeklyTotals.iron_mg, "unreferenced plan entry does not add micros");

console.log("weeklyMicroTotals.test.ts: all assertions passed");
