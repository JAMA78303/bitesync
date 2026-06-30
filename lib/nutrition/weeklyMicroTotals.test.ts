import {
  aggregateWeeklyMicrosFromPlan,
  type WeeklyMicroPlanEntry,
  type WeeklyMicroRecipeIngredient,
} from "@/lib/nutrition/weeklyMicroTotals";
import { getTrafficLight, isAboveUpperLimit } from "@/lib/nutrition/drv";

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

// Plant-heavy week: high total vitamin A (RE) but retinol-only upper limit stays clear.
const PLANT_RECIPE = "plant-heavy-day";
const plantIngredients: WeeklyMicroRecipeIngredient[] = [
  { recipe_id: PLANT_RECIPE, name: "sweet potato", quantity: 250, unit: "g" },
  { recipe_id: PLANT_RECIPE, name: "carrots", quantity: 150, unit: "g" },
  { recipe_id: PLANT_RECIPE, name: "red pepper", quantity: 120, unit: "g" },
];
const plantWeek = aggregateWeeklyMicrosFromPlan(
  Array.from({ length: 7 }, () => ({ recipe_id: PLANT_RECIPE })),
  plantIngredients,
);
if (!plantWeek) throw new Error("expected plant-heavy week aggregate");

const plantReWeekly = plantWeek.weeklyTotals.vitamin_a_mcg;
const plantRetinolWeekly = plantWeek.weeklyTotals.retinol_mcg ?? 0;
const plantDailyRe = plantReWeekly / 7;
const plantDailyRetinol = plantRetinolWeekly / 7;

if (plantDailyRe < 700) {
  throw new Error(`plant-heavy day should exceed RNI in RE: ${plantDailyRe}`);
}
if (plantDailyRetinol >= 1500) {
  throw new Error(`plant-heavy day retinol should stay below upper: ${plantDailyRetinol}`);
}
if (
  isAboveUpperLimit("vitamin_a_mcg", plantReWeekly, "male", { weeklyRetinolMcg: plantRetinolWeekly })
) {
  throw new Error("plant-heavy week must not trip vitamin A upper limit");
}
if (getTrafficLight("vitamin_a_mcg", plantReWeekly, "male", { weeklyRetinolMcg: plantRetinolWeekly }) !== "green") {
  throw new Error("plant-heavy week vitamin A traffic should stay green");
}

// High preformed retinol (butter) still flags the upper limit.
const BUTTER_RECIPE = "butter-heavy-day";
const butterIngredients: WeeklyMicroRecipeIngredient[] = [
  { recipe_id: BUTTER_RECIPE, name: "butter", quantity: 250, unit: "g" },
];
const butterWeek = aggregateWeeklyMicrosFromPlan(
  Array.from({ length: 7 }, () => ({ recipe_id: BUTTER_RECIPE })),
  butterIngredients,
);
if (!butterWeek) throw new Error("expected butter-heavy week aggregate");

const butterRetinolWeekly = butterWeek.weeklyTotals.retinol_mcg ?? 0;
if (butterRetinolWeekly / 7 < 1500) {
  throw new Error(`butter-heavy day retinol should exceed upper: ${butterRetinolWeekly / 7}`);
}
if (
  !isAboveUpperLimit("vitamin_a_mcg", butterWeek.weeklyTotals.vitamin_a_mcg, "male", {
    weeklyRetinolMcg: butterRetinolWeekly,
  })
) {
  throw new Error("high preformed retinol week must trip vitamin A upper limit");
}

console.log("weeklyMicroTotals.test.ts: all assertions passed");
