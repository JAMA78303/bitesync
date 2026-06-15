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

// Hand-check: 2× recipe A + 1× recipe B iron = per-serving × entry count (no double-count).
const RECIPE_A = "recipe-a";
const RECIPE_B = "recipe-b";
const multiIngredients: WeeklyMicroRecipeIngredient[] = [
  { recipe_id: RECIPE_A, name: "spinach", quantity: 80, unit: "g" },
  { recipe_id: RECIPE_B, name: "lentils", quantity: 100, unit: "g" },
];
const multiPlan: WeeklyMicroPlanEntry[] = [
  { recipe_id: RECIPE_A },
  { recipe_id: RECIPE_A },
  { recipe_id: RECIPE_B },
];
const multi = aggregateWeeklyMicrosFromPlan(multiPlan, multiIngredients);
const singleA = aggregateWeeklyMicrosFromPlan([{ recipe_id: RECIPE_A }], multiIngredients);
const singleB = aggregateWeeklyMicrosFromPlan([{ recipe_id: RECIPE_B }], multiIngredients);
if (!multi || !singleA || !singleB) throw new Error("expected multi-recipe aggregate");
const expectedIron =
  singleA.weeklyTotals.iron_mg * 2 + singleB.weeklyTotals.iron_mg;
assertNear(multi.weeklyTotals.iron_mg, expectedIron, "multi-recipe iron = sum(per-serving × count)");
assertNear(
  multi.weeklyTotals.iron_mg / 7,
  expectedIron / 7,
  "daily avg iron matches hand-check arithmetic",
);

console.log("weeklyMicroTotals.test.ts: all assertions passed");
