import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type UserTier = "free" | "pro";

/**
 * Pro-gated features (TDEE, unlimited recipes, billing UI).
 * Normalizes DB quirks; `past_due` still has subscription access until Stripe downgrades.
 */
export function isProSubscriptionStatus(
  status: string | null | undefined,
): boolean {
  if (status == null || typeof status !== "string") return false;
  const s = status.trim().toLowerCase();
  // App stores `pro` / `past_due`; tolerate Stripe-native strings if DB was mis-written.
  return s === "pro" || s === "past_due" || s === "active" || s === "trialing";
}

export async function getUserTier(): Promise<UserTier> {
  noStore();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "free";

  const { data } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", user.id)
    .maybeSingle();

  return isProSubscriptionStatus(data?.subscription_status) ? "pro" : "free";
}

export async function canCreateRecipe(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const tier = await getUserTier();
  if (tier === "pro") return true;

  const { count } = await supabase
    .from("recipes")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("archived_at", null);

  return (count ?? 0) < 10;
}

export async function getRecipeCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from("recipes")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("archived_at", null);

  return count ?? 0;
}
