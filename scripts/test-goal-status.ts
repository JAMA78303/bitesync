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

// Under and over must never share the same colour (spec: over ≠ amber)
const underCarbs = getGoalStatus("carbs", 100, 200);
const overCarbs = getGoalStatus("carbs", 220, 200);
if (underCarbs.color === overCarbs.color) {
  throw new Error("carbs under and over must use different colours");
}
if (underCarbs.kind !== "under" || overCarbs.kind !== "over-moderate") {
  throw new Error("expected under vs over-moderate kinds for carbs");
}

// High protein over target stays on-track, not red
const highProtein = getGoalStatus("protein", 180, 120);
if (highProtein.kind !== "on-track" || highProtein.color === underCarbs.color) {
  throw new Error("protein over minimum must be green, not amber/red");
}

console.log("OK: goal status colour logic");
