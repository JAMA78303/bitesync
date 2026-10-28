import { addDays, getMonday, toLocalISO } from "@/lib/utils/dates";

/**
 * When the iPhone app's own reminders go off. The web sends its Sunday push
 * from a server cron (vercel.json); the app can't receive web push, so it
 * schedules the same reminders on the phone instead. Pure, so it can be tested
 * without a phone.
 */

/**
 * How many Sundays ahead the app schedules. Someone who stops opening the app
 * still gets a few weekly nudges, but not forever.
 */
export const WEEKLY_REMINDER_WEEKS = 4;
/** Sunday afternoon in the phone's own time zone, like the web push at 16:00. */
export const WEEKLY_REMINDER_HOUR = 16;
/** The evening reminder to check tomorrow's plan, like the web push at 19:00. */
export const DAILY_REMINDER_HOUR = 19;

/** The Mondays (YYYY-MM-DD) of the weeks a Sunday reminder could be about, soonest first. */
export function upcomingWeekStarts(now: Date, weeks = WEEKLY_REMINDER_WEEKS): string[] {
  const nextMonday = addDays(getMonday(now), 7);
  return Array.from({ length: weeks }, (_, i) => toLocalISO(addDays(nextMonday, i * 7)));
}

/**
 * One reminder at 16:00 on the Sunday before each week that is still empty.
 * Times already past are dropped: the phone would deliver them straight away.
 */
export function weeklyReminderTimes(
  now: Date,
  unplannedWeekStarts: string[],
): { weekStart: string; at: Date }[] {
  return unplannedWeekStarts
    .map((weekStart) => {
      const at = addDays(new Date(`${weekStart}T00:00:00`), -1);
      at.setHours(WEEKLY_REMINDER_HOUR, 0, 0, 0);
      return { weekStart, at };
    })
    .filter(({ at }) => at.getTime() > now.getTime());
}
