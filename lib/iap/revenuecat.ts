import { APPLE_PRO_UNTIL_KEY } from "@/lib/billing/access";
import { createSupabaseAuthAdmin } from "@/lib/supabase/admin";

/**
 * Pro bought inside the iPhone app. Apple doesn't allow Stripe checkout in an
 * iOS app, so there Pro is an App Store subscription, sold through RevenueCat
 * (lib/native/purchases.ts shows the paywall). RevenueCat is the record of who
 * has paid Apple; this copies its answer into the account's auth app_metadata,
 * which lib/billing/access.ts reads. Stripe subscriptions are untouched: they
 * stay in profiles.subscription_status. Server-side only.
 *
 * The RevenueCat customer id is the Supabase user id.
 */

/** The entitlement both App Store products unlock, as named in RevenueCat. */
export const PRO_ENTITLEMENT = "pro";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** RevenueCat reports no expiry for a non-expiring entitlement. We only sell subscriptions, but don't lock anyone out over it. */
const NO_EXPIRY = "9999-12-31T00:00:00.000Z";

export function isAccountId(id: unknown): id is string {
  return typeof id === "string" && UUID.test(id);
}

/** True when the server has what it needs to check purchases. */
export function iapConfigured(): boolean {
  return Boolean(process.env.REVENUECAT_SECRET_KEY);
}

type Entitlement = { expires_date?: string | null; grace_period_expires_date?: string | null };

/**
 * Until when RevenueCat's subscriber record grants Pro (ISO), or null if it
 * never has. A date in the past means the subscription ended. Apple's billing
 * grace period counts, so a card retry doesn't cut someone off. Pure.
 */
export function proUntilFromSubscriber(subscriber: unknown): string | null {
  const entitlements = (subscriber as { entitlements?: Record<string, Entitlement> } | null)?.entitlements;
  const pro = entitlements?.[PRO_ENTITLEMENT];
  if (!pro) return null;
  if (pro.expires_date == null) return NO_EXPIRY;
  const times = [pro.expires_date, pro.grace_period_expires_date]
    .map((d) => (typeof d === "string" ? Date.parse(d) : NaN))
    .filter(Number.isFinite);
  return times.length ? new Date(Math.max(...times)).toISOString() : null;
}

export type AppleSync = { ok: true; proUntil: string | null } | { error: string };

/**
 * Asks RevenueCat what this account has paid for and records it. Called after
 * a purchase or restore in the app, and by RevenueCat's webhook on renewals,
 * cancellations and refunds.
 */
export async function syncAppleEntitlement(userId: string): Promise<AppleSync> {
  const key = process.env.REVENUECAT_SECRET_KEY;
  if (!key) return { error: "In-app purchases aren't set up yet." };
  if (!isAccountId(userId)) return { error: "Unknown account." };

  let subscriber: unknown;
  try {
    const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[revenuecat] subscriber lookup failed", res.status);
      return { error: "Couldn't check your purchase. Please try again." };
    }
    subscriber = ((await res.json()) as { subscriber?: unknown }).subscriber;
  } catch (err) {
    console.error("[revenuecat] subscriber lookup failed", err instanceof Error ? err.message : err);
    return { error: "Couldn't check your purchase. Please try again." };
  }
  const proUntil = proUntilFromSubscriber(subscriber);

  const admin = createSupabaseAuthAdmin();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data.user) return { error: "Unknown account." };
  const meta = data.user.app_metadata ?? {};
  if ((meta[APPLE_PRO_UNTIL_KEY] ?? null) === proUntil) return { ok: true, proUntil };

  const { error: writeError } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { ...meta, [APPLE_PRO_UNTIL_KEY]: proUntil },
  });
  if (writeError) {
    console.error("[revenuecat] app_metadata update failed", writeError.message);
    return { error: "Couldn't update your account. Please try again." };
  }
  return { ok: true, proUntil };
}

/** Every account a RevenueCat webhook event is about (purchases can move between accounts on restore). */
export function accountIdsInEvent(event: unknown): string[] {
  const e = (event ?? {}) as Record<string, unknown>;
  const list = (v: unknown) => (Array.isArray(v) ? v : []);
  const ids = [e.app_user_id, e.original_app_user_id, ...list(e.aliases), ...list(e.transferred_from), ...list(e.transferred_to)];
  return [...new Set(ids.filter(isAccountId))];
}
