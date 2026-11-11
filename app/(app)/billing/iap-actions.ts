"use server";

import { revalidatePath } from "next/cache";
import { syncAppleEntitlement } from "@/lib/iap/revenuecat";
import { createClient } from "@/lib/supabase/server";

/**
 * After a purchase or "Restore purchases" in the iPhone app: check with
 * RevenueCat what this account has paid Apple for, and unlock Pro if so. The
 * app's own word isn't taken for it.
 */
export async function syncApplePurchase(): Promise<{ ok: true; pro: boolean } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

  const result = await syncAppleEntitlement(user.id);
  if ("error" in result) return { error: result.error };

  revalidatePath("/", "layout");
  return { ok: true, pro: result.proUntil !== null && Date.parse(result.proUntil) > Date.now() };
}
