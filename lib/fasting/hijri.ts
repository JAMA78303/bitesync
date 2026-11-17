import { addDaysISO, daysBetweenISO } from "@/lib/fasting/isoDate";

/**
 * Hijri dates from the Umm al-Qura calendar, which every modern browser and
 * Node ship in Intl. They are the *expected* dates: the real start of a month
 * depends on the moon sighting where the person lives, so the dates are a
 * pre-fill the person can change, never a ruling.
 */

export type HijriDate = { year: number; month: number; day: number };

/** Hijri months by number, as used below. */
export const HIJRI_MONTH = { muharram: 1, ramadan: 9, shawwal: 10, dhulHijjah: 12 } as const;

/** Ramadan mode is offered from six weeks before the expected start. */
export const RAMADAN_OFFER_DAYS = 42;

let formatter: Intl.DateTimeFormat | null = null;

export function hijriDate(iso: string): HijriDate {
  formatter ??= new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
    timeZone: "UTC",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const parts = formatter.formatToParts(new Date(`${iso}T12:00:00Z`));
  const get = (type: string) => Number.parseInt(parts.find((p) => p.type === type)?.value ?? "", 10);
  return { year: get("year"), month: get("month"), day: get("day") };
}

/** The first date on or after `fromISO` that is `day` of Hijri `month`. A Hijri year is under 356 days. */
export function nextHijriDay(fromISO: string, month: number, day: number): string | null {
  for (let i = 0; i < 400; i += 1) {
    const iso = addDaysISO(fromISO, i);
    const h = hijriDate(iso);
    if (h.month === month && h.day === day) return iso;
  }
  return null;
}

export type RamadanDates = {
  /** First day of fasting. */
  start: string;
  /** Last day of fasting. */
  end: string;
  /** Eid al-Fitr, the day after the last fast. */
  eid: string;
  hijriYear: number;
};

/** The Ramadan that is under way on `todayISO`, or else the next one. */
export function expectedRamadan(todayISO: string): RamadanDates | null {
  const today = hijriDate(todayISO);
  const start =
    today.month === HIJRI_MONTH.ramadan
      ? addDaysISO(todayISO, -(today.day - 1))
      : nextHijriDay(todayISO, HIJRI_MONTH.ramadan, 1);
  if (!start) return null;
  let end = start;
  for (let i = 1; i <= 31; i += 1) {
    const next = addDaysISO(start, i);
    if (hijriDate(next).month !== HIJRI_MONTH.ramadan) {
      end = addDaysISO(start, i - 1);
      break;
    }
  }
  return { start, end, eid: addDaysISO(end, 1), hijriYear: hijriDate(start).year };
}

/** From six weeks before Ramadan until its last day. */
export function ramadanOfferOpen(todayISO: string, ramadan: Pick<RamadanDates, "start" | "end">): boolean {
  const daysToStart = daysBetweenISO(todayISO, ramadan.start);
  return daysToStart <= RAMADAN_OFFER_DAYS && todayISO <= ramadan.end;
}

/**
 * Days nobody fasts: Eid al-Fitr (1 Shawwal) and Eid al-Adha with the three
 * days after it (10–13 Dhu al-Hijjah). A repeating Monday or Thursday fast
 * skips them. A date the person picks themselves is left alone, as their
 * local calendar may differ by a day.
 */
export function isEidDay(iso: string): boolean {
  const h = hijriDate(iso);
  if (h.month === HIJRI_MONTH.shawwal && h.day === 1) return true;
  return h.month === HIJRI_MONTH.dhulHijjah && h.day >= 10 && h.day <= 13;
}

export type FastingPresetId = "shawwal" | "arafah" | "ashura";

export const FASTING_PRESETS: { id: FastingPresetId; label: string; detail: string }[] = [
  { id: "shawwal", label: "Six days of Shawwal", detail: "The six days after Eid al-Fitr (2–7 Shawwal)" },
  { id: "arafah", label: "Day of Arafah", detail: "9 Dhu al-Hijjah" },
  { id: "ashura", label: "Ashura", detail: "10 Muharram" },
];

/** The expected dates of a preset's next occurrence on or after `fromISO`. */
export function presetDates(id: FastingPresetId, fromISO: string): string[] {
  if (id === "arafah") {
    const d = nextHijriDay(fromISO, HIJRI_MONTH.dhulHijjah, 9);
    return d ? [d] : [];
  }
  if (id === "ashura") {
    const d = nextHijriDay(fromISO, HIJRI_MONTH.muharram, 10);
    return d ? [d] : [];
  }
  // 2 Shawwal, or today if we're already inside the six days.
  const today = hijriDate(fromISO);
  const first =
    today.month === HIJRI_MONTH.shawwal && today.day >= 2 && today.day <= 7
      ? addDaysISO(fromISO, -(today.day - 2))
      : nextHijriDay(fromISO, HIJRI_MONTH.shawwal, 2);
  return first ? Array.from({ length: 6 }, (_, i) => addDaysISO(first, i)) : [];
}
