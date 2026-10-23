import type { DayMacros } from "@/lib/planner/weekly-macros";
import { getGoalStatus, type GoalStatusKind } from "@/lib/today/goal-status";

export type WeekStatsDay = {
  dateISO: string;
  /** "M", "T", "W"… */
  letter: string;
  /** Planned calories as a share of the target; 0 when nothing is planned. */
  ratio: number;
  /** Null for a day with nothing planned. */
  status: GoalStatusKind | null;
};

export type WeekStats = {
  days: WeekStatsDay[];
  plannedDays: number;
  onTargetDays: number;
  /** Average planned protein over planned days, as a % of the target. */
  proteinPct: number | null;
};

/**
 * The "This week" card on Today: the Stats screen in one glance. A day counts
 * as on target by the same calorie rule as Today's ring, so the two agree.
 */
export function summariseWeek(days: DayMacros[], targets: { kcal: number; protein: number }): WeekStats {
  const summary = days.map((day) => {
    const planned = day.kcal > 0;
    return {
      dateISO: day.dateISO,
      letter: day.short.charAt(0),
      ratio: planned && targets.kcal > 0 ? day.kcal / targets.kcal : 0,
      status: planned ? getGoalStatus("kcal", day.kcal, targets.kcal).kind : null,
    };
  });
  const planned = days.filter((day) => day.kcal > 0);
  const avgProtein = planned.reduce((sum, day) => sum + day.protein, 0) / (planned.length || 1);

  return {
    days: summary,
    plannedDays: planned.length,
    onTargetDays: summary.filter((day) => day.status === "on-track").length,
    proteinPct: planned.length > 0 && targets.protein > 0 ? Math.round((avgProtein / targets.protein) * 100) : null,
  };
}

/** "On target 5 of 7 days · protein 94% of goal" */
export function weekStatsSentence({ plannedDays, onTargetDays, proteinPct }: WeekStats): string {
  const days = plannedDays === 7 ? "7 days" : `${plannedDays} planned ${plannedDays === 1 ? "day" : "days"}`;
  const protein = proteinPct != null ? ` · protein ${proteinPct}% of goal` : "";
  return `On target ${onTargetDays} of ${days}${protein}`;
}
