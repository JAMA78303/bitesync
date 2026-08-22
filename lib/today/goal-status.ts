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

/**
 * Minimum-metric tolerance. Requiring a literal 100% flagged 197g against a 200g
 * protein target as "below target", while calories 189kcal short read "on track"
 * off their 0.85 band — the same day both passing and failing.
 *
 * 0.95 matches PROTEIN_FLOOR_RATIO in lib/planner/plan-calorie-tuning.ts, which is
 * the floor the week generator already treats as success. Kept as a local constant
 * so this client-side module does not pull in planner internals; the two must move
 * together.
 */
const MINIMUM_ON_TRACK_RATIO = 0.95;

export const GOAL_STATUS_COLORS = {
  "on-track": "var(--brand-primary)",
  under: "var(--traffic-amber)",
  "over-moderate": "var(--traffic-amber)",
  "over-high": "var(--traffic-red)",
} as const;

export const GOAL_STATUS_TEXT_CLASS: Record<GoalStatusKind, string> = {
  "on-track": "text-[var(--brand-primary)] dark:text-[var(--traffic-green)]",
  under: "text-[var(--traffic-amber)]",
  "over-moderate": "text-[var(--traffic-amber)]",
  "over-high": "text-[var(--traffic-red)]",
};

function buildStatus(kind: GoalStatusKind): GoalStatus {
  const label =
    kind === "on-track"
      ? "On track"
      : kind === "under"
        ? "↓ Below target"
        : kind === "over-moderate"
          ? "↑ Over target"
          : "↑ Well over target";
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
  if (ratio >= MINIMUM_ON_TRACK_RATIO) return buildStatus("on-track");
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
