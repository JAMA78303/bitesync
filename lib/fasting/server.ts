import type { SupabaseClient } from "@supabase/supabase-js";
import { fastingSettingsFromRow, type FastingSettings } from "@/lib/fasting/settings";

/**
 * The person's fasting settings, or null when they have none. Until
 * sql/2026-11-17_fasting_settings.sql runs the table doesn't exist: the query
 * fails and this quietly returns null, so every page behaves as before (the
 * same tolerance as loggedMealMacros in lib/planner/today.ts).
 */
export async function getFastingSettings(supabase: SupabaseClient, userId: string): Promise<FastingSettings | null> {
  try {
    const { data, error } = await supabase.from("fasting_settings").select("*").eq("user_id", userId).maybeSingle();
    if (error || !data) return null;
    return fastingSettingsFromRow(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

/** PostgREST's answer when a table isn't there yet (Postgres 42P01, or the schema cache's PGRST205). */
export function isMissingTableError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    /relation "?(public\.)?fasting_settings"? does not exist|could not find the table/i.test(error.message ?? "")
  );
}
