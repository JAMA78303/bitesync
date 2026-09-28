import { getGoalStatus } from "@/lib/today/goal-status";

function assertKind(
  metric: Parameters<typeof getGoalStatus>[0],
  value: number,
  target: number,
  expected: string,
): void {
  const actual = getGoalStatus(metric, value, target).kind;
  if (actual !== expected) {
    throw new Error(`${metric} ${value}/${target}: expected "${expected}", got "${actual}"`);
  }
}

// The reported case: 197g against a 200g protein target read "below target" while
// the same day's calories, 189kcal short, read "on track". A 1.5% miss is a hit.
assertKind("protein", 197, 200, "on-track");
assertKind("protein", 190, 200, "on-track"); // exactly the 95% floor
assertKind("protein", 189, 200, "under");
assertKind("protein", 220, 200, "on-track"); // exceeding a minimum is always fine
assertKind("fibre", 29, 30, "on-track");
assertKind("fibre", 20, 30, "under");

// Minimum metrics must not be stricter than the near-target band they sit beside.
// Calories 189 short of 2801 is "on track", so protein 3g short cannot be a miss.
assertKind("kcal", 2612, 2801, "on-track");

// Near-target metrics keep their existing behaviour in both directions.
assertKind("kcal", 2000, 2000, "on-track");
assertKind("kcal", 1600, 2000, "under");
assertKind("kcal", 2120, 2000, "over-moderate");
assertKind("kcal", 2400, 2000, "over-high");
assertKind("carbs", 286, 313, "on-track");
assertKind("fat", 81, 83, "on-track");

// Fat is a ceiling on its share of the day's calories (35%), not a gram target.
// The reported day: 2263 kcal and 140 g protein on track, 90 g fat against 74 g
// read red "Well over target". 90 g is 36% of 2263 kcal — amber, not red.
function assertFat(fat: number, kcal: number, expected: string, label?: string): void {
  const status = getGoalStatus("fat", fat, 74, { kcal });
  if (status.kind !== expected || (label && status.label !== label)) {
    throw new Error(`fat ${fat}g at ${kcal} kcal: expected "${expected}", got "${status.kind}" (${status.label})`);
  }
}
assertFat(90, 2263, "over-moderate", "↑ Over 35% of calories");
assertFat(85, 2426, "on-track"); // over the 74 g split, but 31.5% of calories
assertFat(49, 2285, "on-track"); // under the gram split is not flagged
assertFat(88, 2263, "on-track"); // 35.0% — at the line, not over it
assertFat(0, 0, "on-track"); // nothing planned yet
assertKind("fat", 90, 74, "over-high"); // no calories given → the old rule, unchanged

// Degenerate inputs stay "under" rather than dividing by zero.
assertKind("protein", 50, 0, "under");
assertKind("kcal", Number.NaN, 2000, "under");

console.log("goal-status.test.ts: all assertions passed");
