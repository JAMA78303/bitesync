/**
 * Calorie tolerance bands for AI weekly planning.
 *
 * Per-day band: target ± min(7%, 150 kcal) — whichever is tighter.
 * Week average band: target ± 5%.
 */

export const DAILY_CAL_BAND_PCT = 0.07;
export const DAILY_CAL_BAND_KCAL = 150;
export const WEEK_AVG_BAND_PCT = 0.05;

export function dailyCalorieHalfBand(target: number): number {
  return Math.min(target * DAILY_CAL_BAND_PCT, DAILY_CAL_BAND_KCAL);
}

export function dailyCalorieBand(target: number): { min: number; max: number } {
  const half = dailyCalorieHalfBand(target);
  return { min: Math.round(target - half), max: Math.round(target + half) };
}

export function weekAvgCalorieBand(target: number): { min: number; max: number } {
  const half = target * WEEK_AVG_BAND_PCT;
  return { min: Math.round(target - half), max: Math.round(target + half) };
}

export function isWithinDailyCalorieBand(actual: number, target: number): boolean {
  const { min, max } = dailyCalorieBand(target);
  return actual >= min && actual <= max;
}

export function isWithinWeekAvgCalorieBand(avg: number, target: number): boolean {
  const { min, max } = weekAvgCalorieBand(target);
  return avg >= min && avg <= max;
}

export function formatDailyCalorieBand(target: number): string {
  const { min, max } = dailyCalorieBand(target);
  return `${min}–${max} kcal`;
}
