/**
 * Calendar dates as "YYYY-MM-DD" strings, and wall-clock times in a named time
 * zone. Fasting days are calendar dates where the person is, and the server
 * runs in UTC, so nothing here reads the machine's own time zone.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_DATE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Whole days from `a` to `b` (positive when b is later). */
export function daysBetweenISO(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

/** 0 = Monday … 6 = Sunday, the planner's day numbering. */
export function weekdayIndexISO(iso: string): number {
  const day = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return day === 0 ? 6 : day - 1;
}

export function isValidTimeZone(timeZone: unknown): timeZone is string {
  if (typeof timeZone !== "string" || !timeZone) return false;
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone });
    return true;
  } catch {
    return false;
  }
}

const partFormatters = new Map<string, Intl.DateTimeFormat>();
function partsIn(date: Date, timeZone: string) {
  let f = partFormatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    partFormatters.set(timeZone, f);
  }
  const out: Record<string, number> = {};
  for (const p of f.formatToParts(date)) {
    if (p.type !== "literal") out[p.type] = Number(p.value);
  }
  return out as { year: number; month: number; day: number; hour: number; minute: number; second: number };
}

/** The calendar date it is in `timeZone` at `date`. */
export function isoDateInZone(date: Date, timeZone: string): string {
  const p = partsIn(date, timeZone);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

function zoneOffsetMs(date: Date, timeZone: string): number {
  const p = partsIn(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** The instant the clock reads `hour:minute` on `iso` in `timeZone`. */
export function zonedDateTime(iso: string, hour: number, minute: number, timeZone: string): Date {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  const wall = Date.UTC(y, m - 1, d, hour, minute);
  const first = zoneOffsetMs(new Date(wall), timeZone);
  let at = wall - first;
  const second = zoneOffsetMs(new Date(at), timeZone);
  if (second !== first) at = wall - second;
  return new Date(at);
}

/** "05:34" in the place's own time. */
export function formatClock(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
}

/** "Mon 8 Feb" for a calendar date. */
export function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" }).format(
    new Date(`${iso}T12:00:00Z`),
  );
}
