export function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function toLocalISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Ordinal suffix for a day-of-month (1st, 2nd, 3rd, 11th …). */
export function ordinalSuffix(day: number): string {
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) return "th";
  const mod10 = day % 10;
  if (mod10 === 1) return "st";
  if (mod10 === 2) return "nd";
  if (mod10 === 3) return "rd";
  return "th";
}

/** Day number with ordinal suffix, e.g. "1st", "22nd". */
export function formatDayWithOrdinal(day: number): string {
  return `${day}${ordinalSuffix(day)}`;
}

type WeekdayStyle = "long" | "short" | "narrow";

/** Weekday name + ordinal day, e.g. "Monday 1st" or "Mon 1st". */
export function formatWeekdayWithOrdinal(date: Date, weekday: WeekdayStyle = "long"): string {
  const weekdayLabel = date.toLocaleDateString("en-GB", { weekday });
  return `${weekdayLabel} ${formatDayWithOrdinal(date.getDate())}`;
}

/** Date with ordinal day + month, e.g. "1st Jan". */
export function formatDayMonthOrdinal(date: Date): string {
  const month = date.toLocaleDateString("en-GB", { month: "short" });
  return `${formatDayWithOrdinal(date.getDate())} ${month}`;
}

/** Full date label for headers, e.g. "Tuesday 3rd June". */
export function formatLongDateWithOrdinal(date: Date): string {
  const weekday = date.toLocaleDateString("en-GB", { weekday: "long" });
  const month = date.toLocaleDateString("en-GB", { month: "long" });
  return `${weekday} ${formatDayWithOrdinal(date.getDate())} ${month}`;
}

export function formatWeekLabel(monday: Date): string {
  const sunday = addDays(monday, 6);
  return `${formatDayMonthOrdinal(monday)} – ${formatDayMonthOrdinal(sunday)}, ${sunday.getFullYear()}`;
}

export function isCurrentWeek(monday: Date): boolean {
  return toLocalISO(monday) === toLocalISO(getMonday(new Date()));
}
