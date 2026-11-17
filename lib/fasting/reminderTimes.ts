import { addDaysISO, formatClock, isoDateInZone, zonedDateTime } from "@/lib/fasting/isoDate";
import { isFastingDay, timesForDay, type FastingSettings } from "@/lib/fasting/settings";
import { SUHOOR_REMINDER_MINUTES } from "@/lib/fasting/slots";

/**
 * The iPhone app's fasting reminders. iOS keeps at most 64 pending local
 * notifications per app, and Fajr moves a minute or two a day, so the app
 * schedules a rolling two weeks and re-plans whenever it opens or comes back
 * to the front (lib/native/reminders.ts). Pure, so it can be tested.
 */

export const FASTING_REMINDER_DAYS = 14;
/** "Plan tomorrow's iftar" goes off at midday, in the person's time zone. */
export const IFTAR_PLAN_REMINDER_HOUR = 12;

export type FastingReminder = {
  kind: "suhoor" | "iftarPlan";
  /** The fasting day it's about. */
  date: string;
  at: string;
  title: string;
  body: string;
  url: string;
};

export function fastingReminderTimes(
  s: FastingSettings | null,
  now: Date,
  days = FASTING_REMINDER_DAYS,
): FastingReminder[] {
  if (!s) return [];
  const out: FastingReminder[] = [];
  const today = isoDateInZone(now, s.timeZone);
  for (let i = 0; i < days; i += 1) {
    const iso = addDaysISO(today, i);

    if (s.suhoorReminder && isFastingDay(s, iso)) {
      const times = timesForDay(s, iso);
      if (times) {
        const at = new Date(times.fajr.getTime() - SUHOOR_REMINDER_MINUTES * 60_000);
        if (at.getTime() > now.getTime()) {
          out.push({
            kind: "suhoor",
            date: iso,
            at: at.toISOString(),
            title: "Time for suhoor",
            body: `Fajr is at ${formatClock(times.fajr, s.timeZone)}. Your suhoor is on Today.`,
            url: "/today",
          });
        }
      }
    }

    const tomorrow = addDaysISO(iso, 1);
    if (s.iftarPlanReminder && isFastingDay(s, tomorrow)) {
      const at = zonedDateTime(iso, IFTAR_PLAN_REMINDER_HOUR, 0, s.timeZone);
      if (at.getTime() > now.getTime()) {
        out.push({
          kind: "iftarPlan",
          date: tomorrow,
          at: at.toISOString(),
          title: "Plan tomorrow's iftar",
          body: "Check tomorrow's iftar and suhoor now, so you can shop on the way home.",
          url: "/planner",
        });
      }
    }
  }
  return out;
}
