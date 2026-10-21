"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { GOAL_STATUS_COLORS } from "@/lib/today/goal-status";
import { weekStatsSentence, type WeekStats } from "@/lib/today/week-stats";
import { toLocalISO } from "@/lib/utils/dates";
import { ds } from "@/lib/ui/classes";

/** Bars top out at 120% of the target, so the target line sits at 5/6 height. */
const BAR_MAX_RATIO = 1.2;

/**
 * Stats has no tab on phones; this card is the way in, on the screen people
 * already check each day. Each bar is a day's planned calories against the
 * target, coloured like Today's ring.
 */
export function WeekStatsCard({ stats }: { stats: WeekStats }) {
  // The server's clock is UTC; which bar is "today" depends on the viewer's.
  const [todayISO, setTodayISO] = useState<string | null>(null);
  useEffect(() => setTodayISO(toLocalISO(new Date())), []);

  if (stats.plannedDays === 0) {
    return (
      <Link
        href="/nutrition"
        className={`${ds.card} mb-4 flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:border-[var(--brand-primary)]`}
      >
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-[var(--text-primary)]">Weekly nutrition</span>
          <span className="block text-xs text-[var(--text-muted)]">Calorie and protein averages, and past weeks</span>
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-[var(--text-muted)]" aria-hidden />
      </Link>
    );
  }

  const sentence = weekStatsSentence(stats);

  return (
    <article className={`${ds.card} mb-4 p-5`}>
      <h2 className={ds.sectionKicker}>This week</h2>
      <div className="relative mt-3 flex h-16 items-end gap-2" aria-hidden>
        <span
          className="absolute inset-x-0 border-t border-dashed border-[var(--border-default)]"
          style={{ bottom: `${(1 / BAR_MAX_RATIO) * 100}%` }}
        />
        {stats.days.map((day) => (
          <span
            key={day.dateISO}
            className="relative flex-1 rounded-md"
            style={
              day.status
                ? {
                    height: `${Math.max(8, (Math.min(day.ratio, BAR_MAX_RATIO) / BAR_MAX_RATIO) * 100)}%`,
                    background: GOAL_STATUS_COLORS[day.status],
                    opacity: day.dateISO === todayISO ? 1 : 0.55,
                  }
                : { height: "8%", background: "var(--border-subtle)" }
            }
          />
        ))}
      </div>
      <div className="mt-1.5 flex gap-2" aria-hidden>
        {stats.days.map((day) => (
          <span
            key={day.dateISO}
            className={`flex-1 text-center text-2xs ${
              day.dateISO === todayISO ? "font-bold text-[var(--text-primary)]" : "text-[var(--text-muted)]"
            }`}
          >
            {day.letter}
          </span>
        ))}
      </div>
      <p className="mt-3 text-sm text-[var(--text-secondary)]">{sentence}</p>
      <Link
        href="/nutrition"
        className="mt-2 inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-[var(--brand-primary)] underline-offset-2 hover:underline"
      >
        See your week&apos;s nutrition
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </article>
  );
}
