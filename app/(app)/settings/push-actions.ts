"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { toUserFacingError } from "@/lib/errors/userFacing";
import { pushEnvReady, sendPushNotification } from "@/lib/push/send";
import { TEST_REMINDER_PAYLOAD } from "@/lib/push/reminderPayloads";
import type { ActionResult } from "@/types";

export type PushPreferences = {
  weeklyPlanReminder: boolean;
  dailyLogReminder: boolean;
};

export type PushSubscriptionInput = {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
};

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

/** Upsert this device's subscription. Re-subscribing keeps existing preferences. */
export async function savePushSubscription(
  input: PushSubscriptionInput,
  preferences?: PushPreferences,
): Promise<ActionResult<PushPreferences>> {
  const { supabase, userId } = await requireUser();
  if (!userId) return { error: "Unauthorized" };
  if (!input.endpoint || !input.p256dh || !input.auth) {
    return { error: "Invalid push subscription." };
  }

  const row: Record<string, unknown> = {
    user_id: userId,
    endpoint: input.endpoint,
    p256dh: input.p256dh,
    auth: input.auth,
    user_agent: input.userAgent ?? null,
    updated_at: new Date().toISOString(),
  };
  if (preferences) {
    row.weekly_plan_reminder = preferences.weeklyPlanReminder;
    row.daily_log_reminder = preferences.dailyLogReminder;
  }

  const { data, error } = await supabase
    .from("push_subscriptions")
    .upsert(row, { onConflict: "endpoint" })
    .select("weekly_plan_reminder, daily_log_reminder")
    .maybeSingle();

  if (error) return { error: toUserFacingError(error, "profile", "savePushSubscription") };

  revalidatePath("/settings");
  return {
    success: true,
    data: {
      weeklyPlanReminder: data?.weekly_plan_reminder ?? true,
      dailyLogReminder: data?.daily_log_reminder ?? false,
    },
  };
}

export async function deletePushSubscription(endpoint: string): Promise<ActionResult> {
  const { supabase, userId } = await requireUser();
  if (!userId) return { error: "Unauthorized" };
  if (!endpoint) return { error: "Invalid push subscription." };

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)
    .eq("user_id", userId);

  if (error) return { error: toUserFacingError(error, "profile", "deletePushSubscription") };

  revalidatePath("/settings");
  return { success: true, message: "Notifications turned off for this device." };
}

export async function updatePushPreferences(
  endpoint: string,
  preferences: PushPreferences,
): Promise<ActionResult> {
  const { supabase, userId } = await requireUser();
  if (!userId) return { error: "Unauthorized" };
  if (!endpoint) return { error: "Invalid push subscription." };

  const { error } = await supabase
    .from("push_subscriptions")
    .update({
      weekly_plan_reminder: preferences.weeklyPlanReminder,
      daily_log_reminder: preferences.dailyLogReminder,
      updated_at: new Date().toISOString(),
    })
    .eq("endpoint", endpoint)
    .eq("user_id", userId);

  if (error) return { error: toUserFacingError(error, "profile", "updatePushPreferences") };

  revalidatePath("/settings");
  return { success: true };
}

/** Preferences for this specific device, or null when it has never subscribed. */
export async function getPushPreferences(
  endpoint: string,
): Promise<ActionResult<PushPreferences | null>> {
  const { supabase, userId } = await requireUser();
  if (!userId) return { error: "Unauthorized" };
  if (!endpoint) return { success: true, data: null };

  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("weekly_plan_reminder, daily_log_reminder")
    .eq("endpoint", endpoint)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return { error: toUserFacingError(error, "profile", "getPushPreferences") };
  if (!data) return { success: true, data: null };

  return {
    success: true,
    data: {
      weeklyPlanReminder: data.weekly_plan_reminder,
      dailyLogReminder: data.daily_log_reminder,
    },
  };
}

/** Fires one notification to this device so the user can confirm delivery works. */
export async function sendTestPushNotification(endpoint: string): Promise<ActionResult> {
  const { supabase, userId } = await requireUser();
  if (!userId) return { error: "Unauthorized" };
  if (!pushEnvReady()) {
    return { error: "Push notifications are not configured on this server yet." };
  }

  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("endpoint", endpoint)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return { error: toUserFacingError(error, "profile", "sendTestPushNotification") };
  if (!data) return { error: "This device is not subscribed to notifications." };

  const result = await sendPushNotification(data, TEST_REMINDER_PAYLOAD);

  if (!result.ok) {
    if (result.gone) {
      await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint).eq("user_id", userId);
      return { error: "This device's subscription expired — turn notifications on again." };
    }
    return { error: "Could not send the test notification." };
  }

  return { success: true, message: "Test notification sent." };
}
