/**
 * Plan accuracy acceptance: simulate weekly tuning for build-muscle and lose-weight profiles.
 *
 * Usage: npx tsx scripts/verify-plan-calorie-bands.ts
 */
import {
  dailyCalorieBand,
  isWithinDailyCalorieBand,
  isWithinWeekAvgCalorieBand,
  weekAvgCalorieBand,
} from "@/lib/planner/calorie-bands";
import {
  calorieGoalBiasFromProfile,
  dayCaloriesFromRows,
  mainMealSlotSpecs,
  tuneDayTowardCalorieBand,
  tuneWeekAvgTowardBand,
  type PlanCalorieRow,
  type PlanRecipeMeta,
} from "@/lib/planner/plan-calorie-tuning";

type Scenario = {
  name: string;
  dailyTarget: number;
  goal: "gain" | "lose" | "maintain";
  pool: PlanRecipeMeta[];
};

function mockPool(target: number, bias: "high" | "low" | "mixed"): PlanRecipeMeta[] {
  const mk = (id: string, name: string, calories: number, protein: number, tags: string[] = []): PlanRecipeMeta => ({
    id,
    name,
    calories,
    protein,
    ingredientNames: tags,
  });

  const main = target * 0.3;
  if (bias === "high") {
    return [
      mk("b1", "Protein oats bowl", main * 0.9, 28, ["oats", "egg"]),
      mk("b2", "Greek yogurt granola", main * 0.85, 22, ["yogurt", "granola"]),
      mk("l1", "Chicken rice bowl", main * 1.05, 42, ["chicken", "rice"]),
      mk("l2", "Tuna pasta salad", main, 35, ["tuna", "pasta"]),
      mk("d1", "Salmon potatoes", main * 1.1, 38, ["salmon", "potato"]),
      mk("d2", "Beef stir fry", main * 1.05, 40, ["beef", "vegetables"]),
      mk("s1", "Protein shake", 220, 25, ["whey", "banana"]),
      mk("s2", "Apple peanut butter", 180, 6, ["apple", "peanut butter"]),
    ];
  }
  if (bias === "low") {
    return [
      mk("b1", "Greek yogurt bowl", main * 0.95, 22, ["yogurt", "berries"]),
      mk("b2", "Egg avocado toast", main * 0.9, 20, ["egg", "avocado"]),
      mk("l1", "Chicken salad", main, 35, ["chicken", "lettuce"]),
      mk("l2", "Tuna wholegrain wrap", main * 0.95, 30, ["tuna"]),
      mk("d1", "Grilled fish vegetables", main * 1.05, 34, ["cod", "greens"]),
      mk("d2", "Turkey chilli bowl", main, 32, ["turkey", "beans"]),
      mk("s1", "Apple almond butter", 175, 5, ["apple", "almond butter"]),
      mk("s2", "Protein cottage snack", 195, 18, ["cottage cheese"]),
    ];
  }
  return [
    mk("b1", "Oats banana", main * 0.8, 18, ["oats"]),
    mk("b2", "Eggs toast", main * 0.85, 20, ["egg"]),
    mk("l1", "Chicken salad", main, 35, ["chicken"]),
    mk("l2", "Lentil soup", main * 0.9, 22, ["lentils"]),
    mk("d1", "Pasta bolognese", main * 1.05, 30, ["beef", "pasta"]),
    mk("d2", "Tofu stir fry", main * 0.95, 24, ["tofu"]),
    mk("s1", "Trail mix", 200, 8, ["nuts"]),
    mk("s2", "Hummus veg", 160, 6, ["hummus"]),
  ];
}

function buildWeek(
  scenario: Scenario,
): { rows: PlanCalorieRow[]; calById: Map<string, number>; days: number[] } {
  const mealPlanId = "verify-plan";
  const days = [0, 1, 2, 3, 4, 5, 6];
  const calById = new Map(scenario.pool.map((r) => [r.id, r.calories]));
  const rows: PlanCalorieRow[] = [];
  const bandMax = dailyCalorieBand(scenario.dailyTarget).max;
  const slots = mainMealSlotSpecs();
  let cursor = 0;

  for (const day of days) {
    let remaining = bandMax;
    for (const spec of slots) {
      const target = scenario.dailyTarget * spec.calFrac;
      const candidates = scenario.pool
        .filter((r) => r.calories <= remaining && r.calories <= target * 1.2)
        .sort((a, b) => Math.abs(a.calories - target) - Math.abs(b.calories - target));
      const pick = candidates[cursor % Math.max(candidates.length, 1)];
      if (!pick) continue;
      remaining -= pick.calories;
      rows.push({
        meal_plan_id: mealPlanId,
        recipe_id: pick.id,
        day_of_week: day,
        meal_type: spec.meal_type,
        slot_index: spec.slot_index,
        quick_add_name: null,
        quick_add_calories: null,
      });
      cursor += 1;
    }
  }

  return { rows, calById, days };
}

function tuneScenario(scenario: Scenario): {
  dayTotals: number[];
  weekAvg: number;
  outsideDays: number;
} {
  const { rows, calById, days } = buildWeek(scenario);
  const allowed = new Set(scenario.pool.map((r) => r.id));
  const goalBias = calorieGoalBiasFromProfile({ goal: scenario.goal });
  const snackCountPerDay = scenario.dailyTarget >= 2200 ? 2 : 1;
  const mealPlanId = "verify-plan";

  const tuneDay = (day: number) =>
    tuneDayTowardCalorieBand({
      rows,
      day,
      pool: scenario.pool,
      calById,
      mealPlanId,
      dailyTarget: scenario.dailyTarget,
      snackCountPerDay,
      allowedRecipeIds: allowed,
      goalBias,
      trimSnacksWhileOver: () => {},
      trimSnacksIfOverMacroCaps: () => {},
    });

  for (const day of days) tuneDay(day);
  tuneWeekAvgTowardBand(
    rows,
    days,
    scenario.pool,
    calById,
    mealPlanId,
    scenario.dailyTarget,
    snackCountPerDay,
    allowed,
    goalBias,
    tuneDay,
  );

  const dayTotals = days.map((d) => dayCaloriesFromRows(rows, d, calById));
  const weekAvg = dayTotals.reduce((a, b) => a + b, 0) / dayTotals.length;
  const outsideDays = dayTotals.filter((t) => !isWithinDailyCalorieBand(t, scenario.dailyTarget)).length;
  return { dayTotals, weekAvg, outsideDays };
}

function assertScenario(scenario: Scenario, maxOutsideDays: number): void {
  const { dayTotals, weekAvg, outsideDays } = tuneScenario(scenario);
  const band = dailyCalorieBand(scenario.dailyTarget);
  const weekBand = weekAvgCalorieBand(scenario.dailyTarget);
  const weekOk = isWithinWeekAvgCalorieBand(weekAvg, scenario.dailyTarget);

  console.log(`\n=== ${scenario.name} (target ${scenario.dailyTarget} kcal) ===`);
  console.log(`  Daily band: ${band.min}–${band.max} kcal`);
  console.log(`  Week avg band: ${weekBand.min}–${weekBand.max} kcal`);
  console.log(`  Day totals: ${dayTotals.map((t) => Math.round(t)).join(", ")}`);
  console.log(`  Week avg: ~${Math.round(weekAvg)} kcal`);
  console.log(`  Days outside band: ${outsideDays}`);

  let failed = false;
  if (outsideDays > maxOutsideDays) {
    console.log(`  FAIL: more than ${maxOutsideDays} day(s) outside daily band`);
    failed = true;
  }
  if (!weekOk) {
    console.log("  FAIL: week average outside ±5% band");
    failed = true;
  }
  if (!failed) {
    console.log("  PASS");
  } else {
    process.exitCode = 1;
  }
}

function main() {
  assertScenario(
    {
      name: "Build muscle (surplus)",
      dailyTarget: 2800,
      goal: "gain",
      pool: mockPool(2800, "high"),
    },
    2,
  );
  assertScenario(
    {
      name: "Lose weight (deficit)",
      dailyTarget: 1700,
      goal: "lose",
      pool: mockPool(1700, "low"),
    },
    2,
  );
  assertScenario(
    {
      name: "Maintain (mixed library)",
      dailyTarget: 2200,
      goal: "maintain",
      pool: mockPool(2200, "mixed"),
    },
    2,
  );

  if (process.exitCode === 1) {
    console.log("\nPlan calorie band verification FAILED.");
  } else {
    console.log("\nPlan calorie band verification PASSED.");
  }
}

main();
