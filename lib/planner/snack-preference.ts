import type { SupabaseClient } from "@supabase/supabase-js";

export type SnacksPerDay = 1 | 2;

/**
 * The rule the planner applied to everyone before this was a preference.
 * Kept as the fallback so a user who never set one sees no change.
 */
export function defaultSnacksPerDay(calorieTarget: number | null | undefined): SnacksPerDay {
  return (calorieTarget ?? 0) >= 2200 ? 2 : 1;
}

export function resolveSnacksPerDay(
  preference: number | null | undefined,
  calorieTarget: number | null | undefined,
): SnacksPerDay {
  if (preference === 1 || preference === 2) return preference;
  return defaultSnacksPerDay(calorieTarget);
}

/**
 * Read the preference on its own rather than through getProfile's column
 * list: that list is a single select, and a column that does not exist yet
 * fails the whole call — every page, not just the planner. Until
 * sql/2026-09-14_snacks_per_day.sql runs this returns null and the caller
 * falls back to the calorie rule.
 */
export async function readSnacksPerDay(
  supabase: SupabaseClient,
  userId: string,
): Promise<number | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("snacks_per_day")
    .eq("id", userId)
    .maybeSingle();
  if (error) return null;
  const v = (data as { snacks_per_day?: number | null } | null)?.snacks_per_day;
  return typeof v === "number" ? v : null;
}
