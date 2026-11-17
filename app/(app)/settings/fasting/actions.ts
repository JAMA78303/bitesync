"use server";

import { revalidatePath } from "next/cache";
import { fastingModeVisible } from "@/lib/fasting/access";
import { isIsoDate } from "@/lib/fasting/isoDate";
import { fastingReminderTimes, type FastingReminder } from "@/lib/fasting/reminderTimes";
import { getFastingSettings, isMissingTableError } from "@/lib/fasting/server";
import {
  DEFAULT_FASTING_SETTINGS,
  fastingSettingsFromRow,
  fastingSettingsToRow,
  type FastingSettings,
} from "@/lib/fasting/settings";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types";

const NOT_AVAILABLE = "Ramadan mode isn't available on your account yet. Please try again later.";
const SAVE_FAILED = "Couldn't save your fasting settings. Please try again.";

function revalidateFastingPages() {
  revalidatePath("/today");
  revalidatePath("/planner");
  revalidatePath("/settings/fasting");
}

/** The form's answers, as the settings page sends them. */
export type FastingSettingsInput = Omit<FastingSettings, "safetyCheckedAt"> & {
  /** True once the safety screen has been answered (either way). */
  safetyAnswered: boolean;
  /** True when the place came from the phone's location: stored to about 1 km. */
  placeFromDevice?: boolean;
};

export async function saveFastingSettings(input: FastingSettingsInput): Promise<ActionResult<FastingSettings>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };
  if (!fastingModeVisible(user.id)) return { error: NOT_AVAILABLE };
  if (!input.safetyAnswered) return { error: "Please answer the health question first." };

  const existing = await getFastingSettings(supabase, user.id);
  const round = (n: number) => Math.round(n * 100) / 100;
  const place = input.place
    ? input.placeFromDevice
      ? { name: "My location", latitude: round(input.place.latitude), longitude: round(input.place.longitude) }
      : input.place
    : null;
  const row = fastingSettingsToRow(
    {
      ...DEFAULT_FASTING_SETTINGS,
      ...input,
      place,
      safetyCheckedAt: existing?.safetyCheckedAt ?? new Date().toISOString(),
    },
    user.id,
  );
  // Through the same reader as every page, so nothing malformed is stored.
  const clean = fastingSettingsFromRow(row);
  if (!clean) return { error: SAVE_FAILED };
  if (input.ramadanStart && input.ramadanEnd && !clean.ramadanStart) {
    return { error: "Ramadan's last day must be on or after its first day." };
  }

  const { error } = await supabase.from("fasting_settings").upsert(fastingSettingsToRow(clean, user.id));
  if (error) {
    console.error("[fasting] save failed:", error.message);
    return isMissingTableError(error) ? { error: NOT_AVAILABLE, code: "fasting_table_missing" } : { error: SAVE_FAILED };
  }
  revalidateFastingPages();
  return { success: true, data: clean };
}

/** "Fasting today" on Today: adds or removes one date from the person's single fasting days. */
export async function setFastingOnDate(iso: string, fasting: boolean): Promise<ActionResult> {
  if (!isIsoDate(iso)) return { error: SAVE_FAILED };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };
  const settings = await getFastingSettings(supabase, user.id);
  if (!settings) return { error: "Set up Ramadan and fasting days in Settings first." };

  const extraDays = fasting
    ? [...new Set([...settings.extraDays, iso])].sort()
    : settings.extraDays.filter((d) => d !== iso);
  const { error } = await supabase
    .from("fasting_settings")
    .update({ extra_days: extraDays, updated_at: new Date().toISOString() })
    .eq("user_id", user.id);
  if (error) {
    console.error("[fasting] fasting today failed:", error.message);
    return { error: SAVE_FAILED };
  }
  revalidateFastingPages();
  return { success: true };
}

/** After Eid: "Back to normal meals". Turns Ramadan mode off and forgets this year's dates. */
export async function endRamadanMode(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };
  if (!fastingModeVisible(user.id)) return { error: NOT_AVAILABLE };
  const { error } = await supabase
    .from("fasting_settings")
    .update({ ramadan_on: false, ramadan_start: null, ramadan_end: null, updated_at: new Date().toISOString() })
    .eq("user_id", user.id);
  if (error) {
    console.error("[fasting] end Ramadan failed:", error.message);
    return { error: SAVE_FAILED };
  }
  revalidateFastingPages();
  return { success: true };
}

/**
 * The iPhone app's suhoor and "plan tomorrow's iftar" reminders for the next
 * two weeks (lib/fasting/reminderTimes.ts). An empty list when fasting isn't
 * set up, or before the table exists.
 */
export async function getFastingReminders(): Promise<{ reminders: FastingReminder[] } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };
  const settings = await getFastingSettings(supabase, user.id);
  return { reminders: fastingReminderTimes(settings, new Date()) };
}
