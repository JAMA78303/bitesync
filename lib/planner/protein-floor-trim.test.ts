import {
  dayProteinFromRows,
  proteinFloorForTarget,
  trimSnacksWhileDayCaloriesExceedRatio,
  type PlanCalorieRow,
} from "@/lib/planner/plan-calorie-tuning";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const mealPlanId = "plan-1";
const dailyK = 2700;
const dailyP = 200;
const proteinFloor = proteinFloorForTarget(dailyP);

const calById = new Map([
  ["high-pro", 300],
  ["low-pro", 200],
  ["main", 1200],
]);
const proById = new Map([
  ["high-pro", 30],
  ["low-pro", 5],
  ["main", 185],
]);

const rows: PlanCalorieRow[] = [
  {
    meal_plan_id: mealPlanId,
    recipe_id: "main",
    day_of_week: 0,
    meal_type: "lunch",
    slot_index: 0,
    quick_add_name: null,
    quick_add_calories: null,
  },
  {
    meal_plan_id: mealPlanId,
    recipe_id: "high-pro",
    day_of_week: 0,
    meal_type: "snack",
    slot_index: 0,
    quick_add_name: null,
    quick_add_calories: null,
  },
  {
    meal_plan_id: mealPlanId,
    recipe_id: "low-pro",
    day_of_week: 0,
    meal_type: "snack",
    slot_index: 1,
    quick_add_name: null,
    quick_add_calories: null,
  },
];

const beforePro = dayProteinFromRows(rows, 0, proById);
assert(beforePro === 220, `expected 220g before trim, got ${beforePro}`);

trimSnacksWhileDayCaloriesExceedRatio(rows, 0, dailyK, calById, 0.5, {
  proById,
  proteinFloor,
});

const afterPro = dayProteinFromRows(rows, 0, proById);
assert(afterPro >= proteinFloor, `protein ${afterPro}g should stay >= floor ${proteinFloor}g`);
assert(!rows.some((r) => r.recipe_id === "low-pro"), "low-protein snack should be trimmed first");
assert(rows.some((r) => r.recipe_id === "high-pro"), "higher-protein snack should remain");

console.log("protein-floor-trim.test.ts: all assertions passed");
