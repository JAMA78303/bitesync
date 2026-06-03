import { getGoalStatus } from "@/lib/today/goal-status";

function assertStatus(
  metric: Parameters<typeof getGoalStatus>[0],
  value: number,
  target: number,
  expectedKind: string,
  note: string,
) {
  const status = getGoalStatus(metric, value, target);
  if (status.kind !== expectedKind) {
    throw new Error(
      `${metric} ${value}/${target}: expected ${expectedKind}, got ${status.kind} (${note})`,
    );
  }
}

// Spec example: Today goals card observed state
assertStatus("kcal", 1797, 2027, "on-track", "under budget, near target — not a warning");
assertStatus("protein", 162, 122, "on-track", "exceeding minimum target is good");
assertStatus("fat", 33, 51, "under", "below up-to target");
assertStatus("fibre", 22, 30, "under", "below minimum target");
assertStatus("carbs", 212, 192, "over-moderate", "moderately over up-to target");

// Calorie ring must not warn while under budget
assertStatus("kcal", 2026, 2027, "on-track", "just under budget");
assertStatus("kcal", 2100, 2027, "on-track", "within 5% of target");
assertStatus("kcal", 2180, 2027, "over-moderate", "moderately over budget");
assertStatus("kcal", 2400, 2027, "over-high", "well over budget");

// Protein/fibre over should stay green
assertStatus("protein", 200, 122, "on-track", "well over protein minimum");
assertStatus("fibre", 45, 30, "on-track", "well over fibre minimum");

console.log("OK: goal status colour logic");
