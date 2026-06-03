/**
 * Status-based colour logic for the Today "Your Goals" card (ring + macro bars).
 *
 * Each nutrient has an explicit "good direction":
 * - kcal, fat, carbs: land near target — under is neutral, over is undesirable
 * - protein, fibre: at least target — meeting/exceeding is good, under is neutral
 */

export type GoalMetric = "kcal" | "protein" | "fibre" | "fat" | "carbs";

export type GoalStatusKind = "on-track" | "under" | "over-moderate" | "over-high";

export type GoalStatus = {
  kind: GoalStatusKind;
  label: string;
  color: string;
  textClassName: string;
};

/** Nutrients where meeting or exceeding the target is desirable. */
const MINIMUM_METRICS = new Set<GoalMetric>(["protein", "fibre"]);

const ON_TRACK_MIN = 0.85;
const ON_TRACK_MAX = 1.05;
const OVER_MODERATE_MAX = 1.15;

export const GOAL_STATUS_COLORS = {
  "on-track": "#3a5a40",
  under: "#f59e0b",
  "over-moderate": "#f59e0b",
  "over-high": "#ef4444",
} as const;

export const GOAL_STATUS_TEXT_CLASS: Record<GoalStatusKind, string> = {
  "on-track": "text-[#3a5a40] dark:text-[#a7d4a9]",
  under: "text-amber-500",
  "over-moderate": "text-amber-500",
  "over-high": "text-red-500",
};

function buildStatus(kind: GoalStatusKind): GoalStatus {
  const label =
    kind === "on-track" ? "On track" : kind === "under" ? "Under" : "Over";
  return {
    kind,
    label,
    color: GOAL_STATUS_COLORS[kind],
    textClassName: GOAL_STATUS_TEXT_CLASS[kind],
  };
}

function nearTargetStatus(ratio: number): GoalStatus {
  if (ratio > OVER_MODERATE_MAX) return buildStatus("over-high");
  if (ratio > ON_TRACK_MAX) return buildStatus("over-moderate");
  if (ratio >= ON_TRACK_MIN) return buildStatus("on-track");
  return buildStatus("under");
}

function minimumTargetStatus(ratio: number): GoalStatus {
  if (ratio >= 1) return buildStatus("on-track");
  return buildStatus("under");
}

/** Shared status for the calorie ring and macro bars. */
export function getGoalStatus(metric: GoalMetric, value: number, target: number): GoalStatus {
  if (!Number.isFinite(value) || !Number.isFinite(target) || target <= 0) {
    return buildStatus("under");
  }

  const ratio = value / target;

  if (MINIMUM_METRICS.has(metric)) {
    return minimumTargetStatus(ratio);
  }

  return nearTargetStatus(ratio);
}
