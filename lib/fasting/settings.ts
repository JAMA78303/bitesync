import { expectedRamadan, isEidDay } from "@/lib/fasting/hijri";
import { addDaysISO, daysBetweenISO, isIsoDate, isValidTimeZone, weekdayIndexISO } from "@/lib/fasting/isoDate";
import { fastingTimes, isCalculationMethod, type CalculationMethodId, type FastingTimes } from "@/lib/fasting/prayerTimes";
import {
  computeNutritionTargetsFromProfile,
  nutritionTargetsFor,
  type ProfileForTargets,
  type UserNutritionTargets,
} from "@/lib/utils/nutrition-targets";

/**
 * One person's Ramadan mode and other fasting days (sql/2026-11-17_fasting_settings.sql).
 * Pure: the server reads the row, everything else is worked out from it.
 */
export type FastingSettings = {
  ramadanOn: boolean;
  /** First and last day of fasting; null means the expected Umm al-Qura dates. */
  ramadanStart: string | null;
  ramadanEnd: string | null;
  /** Single fasting days: "Fasting today", Shawwal, Arafah, Ashura or any date picked. */
  extraDays: string[];
  /** Repeating fasts by weekday, 0 = Monday … 6 = Sunday (Monday and Thursday are offered). */
  weeklyDays: number[];
  place: { name: string; latitude: number; longitude: number } | null;
  /** The person's own time zone, from their device. */
  timeZone: string;
  method: CalculationMethodId;
  fajrOffsetMinutes: number;
  maghribOffsetMinutes: number;
  /**
   * Set when the person ticked anything on the safety screen. Only this
   * yes/no is kept, never which answer. Fasting days are then planned
   * without a calorie deficit.
   */
  noDeficit: boolean;
  safetyCheckedAt: string | null;
  suhoorReminder: boolean;
  iftarPlanReminder: boolean;
};

export const DEFAULT_FASTING_SETTINGS: FastingSettings = {
  ramadanOn: false,
  ramadanStart: null,
  ramadanEnd: null,
  extraDays: [],
  weeklyDays: [],
  place: null,
  timeZone: "Europe/London",
  method: "mwl",
  fajrOffsetMinutes: 0,
  maghribOffsetMinutes: 0,
  noDeficit: false,
  safetyCheckedAt: null,
  suhoorReminder: true,
  iftarPlanReminder: false,
};

export const MAX_OFFSET_MINUTES = 30;
export const MAX_EXTRA_DAYS = 120;

const clampOffset = (n: unknown) => {
  const v = Math.round(Number(n));
  return Number.isFinite(v) ? Math.max(-MAX_OFFSET_MINUTES, Math.min(MAX_OFFSET_MINUTES, v)) : 0;
};

/** A database row (or a form's JSON) to settings, dropping anything malformed. */
export function fastingSettingsFromRow(row: Record<string, unknown> | null | undefined): FastingSettings | null {
  if (!row || typeof row !== "object") return null;
  const lat = Number(row.latitude);
  const lng = Number(row.longitude);
  const hasPlace =
    row.latitude != null &&
    row.longitude != null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180;
  const start = isIsoDate(row.ramadan_start) ? row.ramadan_start : null;
  const end = isIsoDate(row.ramadan_end) ? row.ramadan_end : null;
  const dates = Array.isArray(row.extra_days) ? row.extra_days.filter(isIsoDate) : [];
  const weekly = Array.isArray(row.weekly_days)
    ? row.weekly_days.map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    : [];
  return {
    ramadanOn: row.ramadan_on === true,
    ramadanStart: start && end && start <= end ? start : null,
    ramadanEnd: start && end && start <= end ? end : null,
    extraDays: [...new Set(dates)].sort().slice(-MAX_EXTRA_DAYS),
    weeklyDays: [...new Set(weekly)].sort(),
    place: hasPlace
      ? { name: String(row.place_name ?? "").slice(0, 80) || "My location", latitude: lat, longitude: lng }
      : null,
    timeZone: isValidTimeZone(row.time_zone) ? row.time_zone : DEFAULT_FASTING_SETTINGS.timeZone,
    method: isCalculationMethod(row.method) ? row.method : DEFAULT_FASTING_SETTINGS.method,
    fajrOffsetMinutes: clampOffset(row.fajr_offset_minutes),
    maghribOffsetMinutes: clampOffset(row.maghrib_offset_minutes),
    noDeficit: row.no_deficit === true,
    safetyCheckedAt: typeof row.safety_checked_at === "string" ? row.safety_checked_at : null,
    suhoorReminder: row.suhoor_reminder !== false,
    iftarPlanReminder: row.iftar_plan_reminder === true,
  };
}

export function fastingSettingsToRow(s: FastingSettings, userId: string) {
  return {
    user_id: userId,
    ramadan_on: s.ramadanOn,
    ramadan_start: s.ramadanStart,
    ramadan_end: s.ramadanEnd,
    extra_days: s.extraDays,
    weekly_days: s.weeklyDays,
    place_name: s.place?.name ?? null,
    latitude: s.place?.latitude ?? null,
    longitude: s.place?.longitude ?? null,
    time_zone: s.timeZone,
    method: s.method,
    fajr_offset_minutes: s.fajrOffsetMinutes,
    maghrib_offset_minutes: s.maghribOffsetMinutes,
    no_deficit: s.noDeficit,
    safety_checked_at: s.safetyCheckedAt,
    suhoor_reminder: s.suhoorReminder,
    iftar_plan_reminder: s.iftarPlanReminder,
    updated_at: new Date().toISOString(),
  };
}

/** The Ramadan these settings mean on `todayISO`: the person's own dates, else the expected ones. */
export function ramadanRange(s: FastingSettings, todayISO: string): { start: string; end: string } | null {
  if (s.ramadanStart && s.ramadanEnd) return { start: s.ramadanStart, end: s.ramadanEnd };
  const expected = expectedRamadan(todayISO);
  return expected ? { start: expected.start, end: expected.end } : null;
}

/**
 * Days since the last fast of a Ramadan that ended within the past week (1 =
 * Eid), or null. Uses the person's own end date, else the expected one: a
 * week back is still inside, or at the end of, the Ramadan that just finished.
 */
export function daysSinceRamadanEnded(s: FastingSettings | null, todayISO: string): number | null {
  if (!s) return null;
  const end = s.ramadanEnd ?? expectedRamadan(addDaysISO(todayISO, -7))?.end;
  if (!end) return null;
  const days = daysBetweenISO(end, todayISO);
  return days >= 1 && days <= 7 ? days : null;
}

export function isRamadanDay(s: FastingSettings | null, iso: string): boolean {
  if (!s?.ramadanOn) return false;
  const range = ramadanRange(s, iso);
  return !!range && iso >= range.start && iso <= range.end;
}

/** Whether `iso` is a fasting day: in Ramadan, picked by date, or a repeating weekday fast. */
export function isFastingDay(s: FastingSettings | null, iso: string): boolean {
  if (!s) return false;
  if (isRamadanDay(s, iso)) return true;
  if (s.extraDays.includes(iso)) return true;
  return s.weeklyDays.includes(weekdayIndexISO(iso)) && !isEidDay(iso);
}

/** Planner days (0 = Monday) in the week starting `weekStartISO` that are fasting days. */
export function fastingDayIndexes(s: FastingSettings | null, weekStartISO: string): number[] {
  if (!s) return [];
  return Array.from({ length: 7 }, (_, i) => i).filter((i) => isFastingDay(s, addDaysISO(weekStartISO, i)));
}

export function timesForDay(s: FastingSettings, iso: string): FastingTimes | null {
  if (!s.place) return null;
  return fastingTimes(iso, {
    latitude: s.place.latitude,
    longitude: s.place.longitude,
    method: s.method,
    fajrOffsetMinutes: s.fajrOffsetMinutes,
    maghribOffsetMinutes: s.maghribOffsetMinutes,
  });
}

/**
 * The calorie target on a fasting day. Unchanged (DEC-007), so someone losing
 * weight keeps their normal percentage deficit and never a bigger one, unless
 * the safety screen said otherwise: then a fasting day is planned at
 * maintenance. Protein never changes.
 */
export function fastingDayCalorieTarget(
  profile: ProfileForTargets,
  s: FastingSettings | null,
  normalKcal: number,
): number {
  if (!s?.noDeficit || profile?.goal !== "lose") return normalKcal;
  const maintain = computeNutritionTargetsFromProfile({ ...profile, goal: "maintain" });
  return maintain ? Math.max(normalKcal, maintain.kcal) : normalKcal;
}

/** A fasting day's full targets: the normal ones, re-split only if the calories change. */
export function fastingDayTargets(
  profile: ProfileForTargets,
  s: FastingSettings | null,
  normal: UserNutritionTargets,
): UserNutritionTargets {
  const kcal = fastingDayCalorieTarget(profile, s, normal.kcal);
  if (kcal === normal.kcal) return normal;
  const weight = Number(profile?.weight_kg);
  return nutritionTargetsFor(kcal, normal.protein, Number.isFinite(weight) ? weight : undefined);
}
