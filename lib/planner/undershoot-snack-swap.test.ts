import {
  dayCaloriesFromRows,
  tuneDayTowardCalorieBand,
  trimSnacksWhileDayCaloriesExceedRatio,
  trimSnacksIfDayOverMacroCaps,
  type PlanCalorieRow,
  type PlanRecipeMeta,
} from "@/lib/planner/plan-calorie-tuning";
import { dailyCalorieBand } from "@/lib/planner/calorie-bands";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const mk = (
  id: string,
  name: string,
  calories: number,
  ingredientNames: string[],
): PlanRecipeMeta => ({ id, name, calories, protein: 25, ingredientNames });

/**
 * Reproduces a real stranded day: 1989 kcal against a 2348 target, while every
 * other day landed in band.
 *
 * The day has its full complement of snacks and no larger main-meal candidate,
 * which used to leave the tuner with nothing to do — a bigger main was
 * unavailable, the serving-scale lever filters the same pool more tightly so it
 * could not succeed either, and a snack could not be *added* to a day whose
 * snack slots were full. The day silently stayed 209 kcal under the floor.
 */
const DAILY_TARGET = 2348;
const band = dailyCalorieBand(DAILY_TARGET);

// Mains identical in size, so no "swap a main for a bigger one" move exists.
const pool: PlanRecipeMeta[] = [
  mk("b1", "Porridge with Berries", 560, ["oats", "milk", "blueberries"]),
  mk("l1", "Chicken Rice Bowl", 640, ["chicken breast", "rice", "peppers"]),
  mk("d1", "Salmon with Potatoes", 690, ["salmon", "potato", "broccoli"]),
  // The only snacks: one tiny (planned) and one large (the escape hatch).
  mk("s-small", "Apple", 99, ["apple"]),
  mk("s-big", "Greek Yoghurt with Almonds", 295, ["greek yoghurt", "almonds"]),
];

const calById = new Map(pool.map((r) => [r.id, r.calories]));
const proById = new Map(pool.map((r) => [r.id, r.protein]));
const allowedRecipeIds = new Set(pool.map((r) => r.id));

const row = (recipeId: string, mealType: PlanCalorieRow["meal_type"], slotIndex = 0): PlanCalorieRow => ({
  meal_plan_id: "plan-1",
  recipe_id: recipeId,
  day_of_week: 0,
  meal_type: mealType,
  slot_index: slotIndex,
  quick_add_name: null,
  quick_add_calories: null,
});

// 560 + 640 + 690 + 99 = 1989 kcal, exactly the reported shortfall.
const rows: PlanCalorieRow[] = [
  row("b1", "breakfast"),
  row("l1", "lunch"),
  row("d1", "dinner"),
  row("s-small", "snack"),
];

const before = dayCaloriesFromRows(rows, 0, calById);
assert(before === 1989, `fixture should start at 1989 kcal, got ${before}`);
assert(before < band.min, `fixture should start below the band floor of ${band.min}`);

tuneDayTowardCalorieBand({
  rows,
  day: 0,
  mealPlanId: "plan-1",
  pool,
  calById,
  proById,
  dailyTarget: DAILY_TARGET,
  dailyProteinTarget: 0,
  // One snack per day: the day is already full, so the fix must swap, not add.
  snackCountPerDay: 1,
  allowedRecipeIds,
  goalBias: "neutral",
  trimSnacksWhileOver: (r, d, maxRatio) =>
    trimSnacksWhileDayCaloriesExceedRatio(r, d, DAILY_TARGET, calById, maxRatio),
  trimSnacksIfOverMacroCaps: (r, d) =>
    trimSnacksIfDayOverMacroCaps(r, d, DAILY_TARGET, 0, calById, proById),
});

const after = dayCaloriesFromRows(rows, 0, calById);
assert(
  after > before,
  `tuner left the day at ${after} kcal — it must lift a day that starts below band`,
);
assert(
  after <= band.max,
  `tuner overshot the band ceiling: ${after} > ${band.max}`,
);
// One snack slot caps the recoverable amount at SNACK_MAX - 99 = 201 kcal
// against a 209 kcal gap, so this fixture cannot quite reach the floor. What
// matters is that the shortfall goes from 209 kcal to a rounding error rather
// than being left untouched.
assert(
  band.min - after < 20,
  `day should end within 20 kcal of the band floor, ended ${band.min - after} short`,
);

const snacks = rows.filter((r) => r.meal_type === "snack");
assert(
  snacks.length === 1,
  `snacks-per-day must be honoured: expected 1 snack slot, got ${snacks.length}`,
);
assert(
  snacks[0]!.recipe_id === "s-big",
  `expected the small snack to be swapped for the larger one, got ${snacks[0]!.recipe_id}`,
);

console.log(`undershoot-snack-swap.test.ts: ok (${before} -> ${after} kcal, band ${band.min}-${band.max})`);
