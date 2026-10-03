import { addDays, getMonday, toLocalISO } from "@/lib/utils/dates";

/**
 * Which weeks a new user's first plan covers.
 *
 * The first plan used to be "this week", Monday to Sunday, whatever the day.
 * 17 of the first 22 signups joined between Thursday and Sunday — 11 on a
 * Saturday — so most people's first look at a planned week was mostly days
 * already gone, and their first grocery list was for meals they would never
 * cook. From Thursday on, the rest of this week is planned (so Today is not
 * empty) and next week becomes the main plan: the one the grocery list is for.
 */

/** Planner day index: Monday 0 … Sunday 6. */
function plannerDay(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/** Thursday — the first day on which most of the week is already behind you. */
const LATE_WEEK_FROM = 3;

export type FirstRunWeeks = {
  /** Monday of the week containing today. */
  thisWeekStart: string;
  /** Monday of next week, when the first plan should cover it; otherwise null. */
  nextWeekStart: string | null;
  /** Planner days of this week from today to Sunday. */
  remainingDays: number[];
  /** The week the grocery list is for. */
  mainWeekStart: string;
};

export function firstRunWeeks(today: Date): FirstRunWeeks {
  const day = plannerDay(today);
  const monday = getMonday(today);
  const thisWeekStart = toLocalISO(monday);
  const nextWeekStart = day >= LATE_WEEK_FROM ? toLocalISO(addDays(monday, 7)) : null;
  return {
    thisWeekStart,
    nextWeekStart,
    remainingDays: Array.from({ length: 7 - day }, (_, i) => day + i),
    mainWeekStart: nextWeekStart ?? thisWeekStart,
  };
}

/**
 * The user's own date, sent from their browser. The server runs on UTC, so on
 * a Sunday evening in the US it is already Monday there — and a plan built
 * for the server's day would leave the user's actual today empty. Anything
 * malformed, or more than a day from the server's date, is ignored.
 */
export function resolveUserToday(localDate: string | null | undefined, serverNow: Date = new Date()): Date {
  if (typeof localDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(localDate)) {
    const parsed = new Date(`${localDate}T12:00:00`);
    const serverNoon = new Date(`${toLocalISO(serverNow)}T12:00:00`);
    const dayMs = 24 * 60 * 60 * 1000;
    if (!Number.isNaN(parsed.getTime()) && Math.abs(parsed.getTime() - serverNoon.getTime()) <= dayMs) {
      return parsed;
    }
  }
  return serverNow;
}
