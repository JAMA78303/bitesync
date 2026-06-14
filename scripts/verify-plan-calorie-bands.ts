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
  dayProteinFromRows,
  ensureDailySnackCoverage,
  isWithinDailyProteinCap,
  MACRO_CAP_MAX_RATIO,
  mainMealSlotSpecs,
  sameDayDuplicateRecipeIds,
  trimSnacksIfDayOverMacroCaps,
  trimSnacksWhileDayCaloriesExceedRatio,
  tuneDayTowardCalorieBand,
  tuneWeekAvgTowardBand,
  type PlanCalorieRow,
  type PlanRecipeMeta,
} from "@/lib/planner/plan-calorie-tuning";

type Scenario = {
  name: string;
  dailyTarget: number;
  dailyProteinTarget: number;
  goal: "gain" | "lose" | "maintain";
  pool: PlanRecipeMeta[];
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
      mk("b3", "Scrambled eggs toast", main * 0.88, 24, ["egg", "toast"]),
      mk("l1", "Chicken rice bowl", main * 1.05, 42, ["chicken", "rice"]),
      mk("l2", "Tuna pasta salad", main, 35, ["tuna", "pasta"]),
      mk("l3", "Turkey wrap", main * 0.98, 38, ["turkey", "wrap"]),
      mk("d1", "Salmon potatoes", main * 1.1, 38, ["salmon", "potato"]),
      mk("d2", "Beef stir fry", main * 1.05, 40, ["beef", "vegetables"]),
      mk("d3", "Cod tray bake", main, 36, ["cod", "vegetables"]),
      mk("s1", "Protein shake", 220, 25, ["whey", "banana"]),
      mk("s2", "Apple peanut butter", 180, 6, ["apple", "peanut butter"]),
    ];
  }
  if (bias === "low") {
    return [
      mk("b1", "Greek yogurt bowl", main * 0.95, 22, ["yogurt", "berries"]),
      mk("b2", "Egg avocado toast", main * 0.9, 20, ["egg", "avocado"]),
      mk("b3", "Overnight oats", main * 0.92, 18, ["oats", "milk"]),
      mk("l1", "Chicken salad", main, 35, ["chicken", "lettuce"]),
      mk("l2", "Tuna wholegrain wrap", main * 0.95, 30, ["tuna"]),
      mk("l3", "Lentil soup", main * 0.88, 22, ["lentils"]),
      mk("d1", "Grilled fish vegetables", main * 1.05, 34, ["cod", "greens"]),
      mk("d2", "Turkey chilli bowl", main, 32, ["turkey", "beans"]),
      mk("d3", "Tofu stir fry", main * 0.94, 26, ["tofu"]),
      mk("s1", "Apple almond butter", 175, 5, ["apple", "almond butter"]),
      mk("s2", "Protein cottage snack", 195, 18, ["cottage cheese"]),
    ];
  }
  return [
    mk("b1", "Oats banana", main * 0.8, 18, ["oats"]),
    mk("b2", "Eggs toast", main * 0.85, 20, ["egg"]),
    mk("b3", "Yogurt honey", main * 0.82, 16, ["yogurt"]),
    mk("l1", "Chicken salad", main, 35, ["chicken"]),
    mk("l2", "Lentil soup", main * 0.9, 22, ["lentils"]),
    mk("l3", "Tuna sandwich", main * 0.95, 28, ["tuna"]),
    mk("d1", "Pasta bolognese", main * 1.05, 30, ["beef", "pasta"]),
    mk("d2", "Tofu stir fry", main * 0.95, 24, ["tofu"]),
    mk("d3", "Salmon rice", main, 32, ["salmon"]),
    mk("s1", "Trail mix", 200, 8, ["nuts"]),
    mk("s2", "Hummus veg", 160, 6, ["hummus"]),
  ];
}

function buildWeek(scenario: Scenario): { rows: PlanCalorieRow[]; calById: Map<string, number>; proById: Map<string, number>; days: number[] } {
  const mealPlanId = "verify-plan";
  const days = [0, 1, 2, 3, 4, 5, 6];
  const calById = new Map(scenario.pool.map((r) => [r.id, r.calories]));
  const proById = new Map(scenario.pool.map((r) => [r.id, r.protein]));
  const rows: PlanCalorieRow[] = [];
  const bandMax = dailyCalorieBand(scenario.dailyTarget).max;
  const slots = mainMealSlotSpecs();
  const usedCount = new Map<string, number>();
  let cursor = 0;

  for (const day of days) {
    const usedOnDay = new Set<string>();
    let remaining = bandMax;
    for (const spec of slots) {
      const target = scenario.dailyTarget * spec.calFrac;
      const candidates = scenario.pool
        .filter(
          (r) =>
            r.calories <= remaining &&
            r.calories <= target * 1.2 &&
            (usedCount.get(r.id) ?? 0) < 2 &&
            !usedOnDay.has(r.id),
        )
        .sort((a, b) => Math.abs(a.calories - target) - Math.abs(b.calories - target));
      const pick = candidates[cursor % Math.max(candidates.length, 1)];
      if (!pick) continue;
      remaining -= pick.calories;
      usedOnDay.add(pick.id);
      usedCount.set(pick.id, (usedCount.get(pick.id) ?? 0) + 1);
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

  return { rows, calById, proById, days };
}

function tuneScenario(scenario: Scenario): {
  rows: PlanCalorieRow[];
  dayTotals: number[];
  dayProteins: number[];
  weekAvg: number;
  outsideDays: number;
  daysMissingSnack: number;
  proteinCapViolations: number;
  sameDayDupes: number;
} {
  const { rows, calById, proById, days } = buildWeek(scenario);
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
      proById,
      mealPlanId,
      dailyTarget: scenario.dailyTarget,
      dailyProteinTarget: scenario.dailyProteinTarget,
      snackCountPerDay,
      allowedRecipeIds: allowed,
      goalBias,
      trimSnacksWhileOver: (r, d, maxRatio) =>
        trimSnacksWhileDayCaloriesExceedRatio(r, d, scenario.dailyTarget, calById, maxRatio),
      trimSnacksIfOverMacroCaps: (r, d) =>
        trimSnacksIfDayOverMacroCaps(
          r,
          d,
          scenario.dailyTarget,
          scenario.dailyProteinTarget,
          calById,
          proById,
        ),
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
  ensureDailySnackCoverage({
    rows,
    days,
    pool: scenario.pool,
    calById,
    mealPlanId,
    dailyTarget: scenario.dailyTarget,
    snackCountPerDay,
    allowedRecipeIds: allowed,
    tuneDay,
  });
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
  const dayProteins = days.map((d) => dayProteinFromRows(rows, d, proById));
  const weekAvg = dayTotals.reduce((a, b) => a + b, 0) / dayTotals.length;
  const outsideDays = dayTotals.filter((t) => !isWithinDailyCalorieBand(t, scenario.dailyTarget)).length;
  const daysMissingSnack = days.filter(
    (d) => !rows.some((r) => r.day_of_week === d && r.meal_type === "snack"),
  ).length;
  const proteinCapViolations = dayProteins.filter(
    (p) => p > scenario.dailyProteinTarget * MACRO_CAP_MAX_RATIO,
  ).length;
  const sameDayDupes = days.filter((d) => sameDayDuplicateRecipeIds(rows, d).length > 0).length;

  return {
    rows,
    dayTotals,
    dayProteins,
    weekAvg,
    outsideDays,
    daysMissingSnack,
    proteinCapViolations,
    sameDayDupes,
  };
}

function assertScenario(scenario: Scenario, maxOutsideDays: number): void {
  const {
    dayTotals,
    dayProteins,
    weekAvg,
    outsideDays,
    daysMissingSnack,
    proteinCapViolations,
    sameDayDupes,
  } = tuneScenario(scenario);
  const band = dailyCalorieBand(scenario.dailyTarget);
  const weekBand = weekAvgCalorieBand(scenario.dailyTarget);
  const weekOk = isWithinWeekAvgCalorieBand(weekAvg, scenario.dailyTarget);
  const proCap = Math.round(scenario.dailyProteinTarget * MACRO_CAP_MAX_RATIO);

  console.log(`\n=== ${scenario.name} (target ${scenario.dailyTarget} kcal / ${scenario.dailyProteinTarget}g P) ===`);
  console.log(`  Daily kcal band: ${band.min}–${band.max} kcal`);
  console.log(`  Protein cap: ≤${proCap}g (${Math.round(MACRO_CAP_MAX_RATIO * 100)}% of target)`);
  console.log(`  Week avg band: ${weekBand.min}–${weekBand.max} kcal`);
  console.log("  Day grid (kcal / protein):");
  for (let i = 0; i < dayTotals.length; i += 1) {
    const kcal = Math.round(dayTotals[i]!);
    const pro = Math.round(dayProteins[i]!);
    const kcalOk = isWithinDailyCalorieBand(dayTotals[i]!, scenario.dailyTarget) ? "✓" : "✗";
    const proOk = pro <= proCap ? "✓" : "✗";
    console.log(`    ${DAY_LABELS[i]}: ${kcal} kcal ${kcalOk} | ${pro}g P ${proOk}`);
  }
  console.log(`  Week avg: ~${Math.round(weekAvg)} kcal`);
  console.log(`  Days outside kcal band: ${outsideDays}`);
  console.log(`  Days over protein cap: ${proteinCapViolations}`);
  console.log(`  Days with same-recipe duplicate: ${sameDayDupes}`);
  console.log(`  Days missing a snack: ${daysMissingSnack}`);

  let failed = false;
  if (outsideDays > maxOutsideDays) {
    console.log(`  FAIL: more than ${maxOutsideDays} day(s) outside daily kcal band`);
    failed = true;
  }
  if (!weekOk) {
    console.log("  FAIL: week average outside ±5% band");
    failed = true;
  }
  if (daysMissingSnack > 0) {
    console.log("  FAIL: every day should carry at least one snack");
    failed = true;
  }
  if (proteinCapViolations > 0) {
    console.log(`  FAIL: ${proteinCapViolations} day(s) exceed protein cap (${proCap}g)`);
    failed = true;
  }
  if (sameDayDupes > 0) {
    console.log(`  FAIL: ${sameDayDupes} day(s) repeat the same recipe twice`);
    failed = true;
  }
  const belowProteinTarget = dayProteins.filter((p) => !isWithinDailyProteinCap(p, scenario.dailyProteinTarget) && p <= proCap).length;
  if (belowProteinTarget > 0) {
    console.log(`  NOTE: ${belowProteinTarget} day(s) below protein target (allowed if within cap)`);
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
      dailyProteinTarget: 175,
      goal: "gain",
      pool: mockPool(2800, "high"),
    },
    2,
  );
  assertScenario(
    {
      name: "Lose weight (deficit)",
      dailyTarget: 1700,
      dailyProteinTarget: 128,
      goal: "lose",
      pool: mockPool(1700, "low"),
    },
    2,
  );
  assertScenario(
    {
      name: "Maintain (mixed library)",
      dailyTarget: 2200,
      dailyProteinTarget: 138,
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
