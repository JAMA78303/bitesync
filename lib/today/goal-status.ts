/**
 * Status-based colour logic for macro targets (Today goals card + Nutrition view).
 *
 * Each nutrient has an explicit "good direction":
 * - kcal, fat, carbs: land near target — under is amber, over is red
 * - protein, fibre: at least target — meeting/exceeding is green, under is amber
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
  "over-moderate": "#f97316",
  "over-high": "#ef4444",
} as const;

export const GOAL_STATUS_TEXT_CLASS: Record<GoalStatusKind, string> = {
  "on-track": "text-[#3a5a40] dark:text-[#86efac]",
  under: "text-amber-600 dark:text-amber-400",
  "over-moderate": "text-orange-600 dark:text-orange-400",
  "over-high": "text-red-600 dark:text-red-400",
};

function buildStatus(kind: GoalStatusKind): GoalStatus {
  const label =
    kind === "on-track"
      ? "On track"
      : kind === "under"
        ? "↑ Below target"
        : kind === "over-moderate"
          ? "↓ Over target"
          : "↓ Well over target";
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

/** Shared status for calorie ring, macro bars, and nutrition dashboard. */
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
