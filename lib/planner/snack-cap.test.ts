import {
  heuristicSnackCandidatePool,
  SNACK_MAX_CALORIES,
  SNACK_MIN_CALORIES,
} from "@/lib/planner/meal-slot-eligibility";
import {
  buildPlanProteinAccuracyWarning,
  buildSnackLibraryNotice,
  type PlanCalorieRow,
  type PlanRecipeMeta,
} from "@/lib/planner/plan-calorie-tuning";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const mk = (
  id: string,
  name: string,
  calories: number,
  ingredientNames: string[],
): PlanRecipeMeta => ({
  id,
  name,
  calories,
  protein: 20,
  ingredientNames,
});

const fullMealOnlyPool = [
  mk("turkey-sweet-potato", "Turkey & Sweet Potato", 895, ["turkey", "sweet potato"]),
  mk("chicken-salad", "Chicken Salad", 925, ["chicken", "lettuce"]),
];

const fullMealCandidates = heuristicSnackCandidatePool(fullMealOnlyPool);
assert(fullMealCandidates.mode === "none", "full-meal-only pool should not fallback into snack candidates");
assert(fullMealCandidates.candidates.length === 0, "full meals must not fill snack slots");

const cappedButNotSnacky = mk("small-portion", "Small savoury portion", SNACK_MAX_CALORIES, ["water"]);
const oversized = mk("oversized-snack", "Oversized snack", SNACK_MAX_CALORIES + 1, ["yoghurt"]);
const relaxedCandidates = heuristicSnackCandidatePool([oversized, cappedButNotSnacky]);
assert(relaxedCandidates.mode === "relaxed", "capped non-meal recipes can fill via relaxed snack matcher");
assert(relaxedCandidates.candidates.map((r) => r.id).join(",") === "small-portion", "oversized snacks stay excluded");

const mealPlanId = "plan-1";
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
];
const notice = buildSnackLibraryNotice(
  [cappedButNotSnacky],
  [0],
  rows,
  new Map([["main", 750]]),
  2500,
  1,
);
assert(notice?.includes("snack slots were left empty") === true, "missing snack slots should be surfaced");
assert(
  notice?.includes(`${SNACK_MIN_CALORIES}-${SNACK_MAX_CALORIES} kcal`) === true,
  "notice should state the hard snack range",
);

const highProteinWarning = buildPlanProteinAccuracyWarning(
  [0],
  rows,
  new Map([["main", 276]]),
  200,
);
assert(highProteinWarning?.includes("protein ceiling") === true, "over-cap protein days should be surfaced");
assert(highProteinWarning?.includes("<=250g") === true, "protein warning should state the 125% ceiling");

console.log("snack-cap.test.ts: all assertions passed");
