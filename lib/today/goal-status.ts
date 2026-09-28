/**
 * Status-based colour logic for macro targets (Today goals card + Nutrition view).
 *
 * Each nutrient has an explicit "good direction":
 * - kcal, carbs: land near target — under is amber, over is red
 * - protein, fibre: at least target — meeting/exceeding is green, under is amber
 * - fat: a ceiling on its share of the day's calories, not a gram target (below)
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

/**
 * Fat is flagged only when it goes above 35% of the day's calories — the UK
 * dietary reference value — not against the gram split in the user's targets.
 * With calories and protein on target, fat and carbs are what is left of the
 * day, and they trade against each other: a real AI-planned day at 2263 kcal
 * and 140 g protein, both on track, showed 90 g fat against 74 g as "Well over
 * target" in red. That day is 36% fat, so it now reads amber, "Over 35% of
 * calories". Fat under its gram split is not flagged at all.
 */
const FAT_MAX_ENERGY_SHARE = 0.35;
const KCAL_PER_G_FAT = 9;

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

function buildStatus(kind: GoalStatusKind, labelOverride?: string): GoalStatus {
  const label =
    labelOverride ??
    (kind === "on-track"
      ? "On track"
      : kind === "under"
        ? "↓ Below target"
        : kind === "over-moderate"
          ? "↑ Over target"
          : "↑ Well over target");
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

function fatShareStatus(fatG: number, kcal: number): GoalStatus {
  if (!(kcal > 0)) return buildStatus("on-track");
  return (fatG * KCAL_PER_G_FAT) / kcal > FAT_MAX_ENERGY_SHARE
    ? buildStatus("over-moderate", "↑ Over 35% of calories")
    : buildStatus("on-track");
}

/**
 * Shared status for calorie ring, macro bars, and nutrition dashboard.
 * Pass the same day's calories as `context.kcal` for fat; without them fat
 * falls back to the near-target rule.
 */
export function getGoalStatus(
  metric: GoalMetric,
  value: number,
  target: number,
  context?: { kcal?: number },
): GoalStatus {
  if (metric === "fat" && context?.kcal !== undefined && Number.isFinite(value)) {
    return fatShareStatus(value, context.kcal);
  }

  if (!Number.isFinite(value) || !Number.isFinite(target) || target <= 0) {
    return buildStatus("under");
  }

  const ratio = value / target;

  if (MINIMUM_METRICS.has(metric)) {
    return minimumTargetStatus(ratio);
  }

  return nearTargetStatus(ratio);
}
