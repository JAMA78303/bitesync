"use server";

import { revalidatePath } from "next/cache";
import { getAccess } from "@/lib/subscription";
import { createSupabaseAuthAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Starts the one-time 7-day Pro trial for an account from before the trial
 * launch (still on the free plan). Stored as app_metadata.trial_started_at,
 * which only the service role can write, so it can't be reset from the browser.
 */
export async function startProTrial(): Promise<{ ok: true } | { error: string }> {
  const access = await getAccess();
  if (!access) return { error: "Please sign in again." };
  if (!access.canStartTrial) {
    return { error: access.hasPro ? "You already have Pro." : "Your free Pro trial has already been used." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

  const { error } = await createSupabaseAuthAdmin().auth.admin.updateUserById(user.id, {
    app_metadata: { ...user.app_metadata, trial_started_at: new Date().toISOString() },
  });
  if (error) {
    console.error("[startProTrial] app_metadata update failed", error.message);
    return { error: "Couldn't start your trial. Please try again." };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
