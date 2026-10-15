"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus } from "lucide-react";
import { planUpcomingWeek } from "@/app/(app)/planner/upcoming-actions";
import { trackUpcomingWeekPlanned } from "@/lib/analytics/events";
import { toLocalISO } from "@/lib/utils/dates";
import { ds } from "@/lib/ui/classes";

type Props = {
  /** Monday of the week this would plan. */
  weekStart: string;
  isNextWeek: boolean;
  /** Arrived from the Sunday reminder: start planning without a second tap. */
  autoStart?: boolean;
};

/**
 * Shown on Today while the coming week is empty. Of the first 12 people who
 * planned a week, 3 ever planned a second (Oct 2026): each new week started
 * blank. One tap here, or on the Sunday reminder, fills it from their recipes.
 */
export function UpcomingWeekCard({ weekStart, isNextWeek, autoStart = false }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const monday = new Date(`${weekStart}T12:00:00`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  function plan(trigger: "card" | "reminder") {
    if (started.current) return;
    started.current = true;
    setError(null);
    startTransition(async () => {
      const result = await planUpcomingWeek(toLocalISO(new Date()));
      if ("error" in result) {
        started.current = false;
        setError(result.error ?? "Couldn't plan your week. Please try again.");
        return;
      }
      trackUpcomingWeekPlanned(trigger);
      router.push(`/planner?week=${result.weekStart}`);
    });
  }

  useEffect(() => {
    if (autoStart) plan("reminder");
    // Once, on arrival from the reminder link.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <article className={`${ds.card} mb-4 p-5`}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-brand-subtle)]">
          <CalendarPlus className="h-4 w-4 text-[var(--brand-primary)]" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <span className={ds.sectionKicker}>{isNextWeek ? "NEXT WEEK" : "THIS WEEK"}</span>
          <h2 className="text-base font-bold text-[var(--text-primary)]">
            {isNextWeek ? "Next week isn’t planned yet" : "This week isn’t planned yet"}
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            One tap plans the week starting {monday} from your recipes, sized to your targets, with your grocery
            list ready.
          </p>
        </div>
      </div>
      {error ? <p className={`mt-3 text-sm ${ds.errorText}`}>{error}</p> : null}
      <button
        type="button"
        onClick={() => plan("card")}
        disabled={isPending}
        className={`${ds.primaryBtn} mt-4 w-full disabled:opacity-70`}
      >
        {isPending ? "Planning your week… a few seconds" : isNextWeek ? "Plan next week" : "Plan this week"}
      </button>
      {isPending ? (
        <p role="status" className="sr-only">
          Planning your week
        </p>
      ) : null}
    </article>
  );
}
