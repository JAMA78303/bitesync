import type Stripe from "stripe";

export function normalizeStripeId(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof (value as { id: unknown }).id === "string"
  ) {
    return (value as { id: string }).id;
  }
  return null;
}

type SubscriptionFacts = Pick<Stripe.Subscription, "status" | "trial_end" | "items">;

/**
 * A subscription started during a 7-day trial whose first real charge, at the
 * trial's end, hasn't been paid: it is still in its first paid period. Without
 * this, the grace a failed payment gets (past_due) would let someone keep Pro
 * for weeks without ever paying.
 */
export function firstChargeAfterTrialUnpaid(subscription: Pick<SubscriptionFacts, "trial_end" | "items">): boolean {
  if (!subscription.trial_end) return false;
  const starts = (subscription.items?.data ?? []).map((item) => item.current_period_start);
  if (!starts.length) return false;
  return Math.max(...starts) <= subscription.trial_end;
}

/**
 * Align with app billing rules: a failed renewal (past_due) keeps Pro until
 * Stripe ends access, but only for customers who have paid before. Unpaid
 * (retries used up) and a failed first charge after a trial don't.
 */
export function stripeSubscriptionStatusToDbProfileStatus(
  subscription: SubscriptionFacts,
): "pro" | "past_due" | "free" {
  const { status } = subscription;
  if (status === "active" || status === "trialing") return "pro";
  if (status === "past_due") return firstChargeAfterTrialUnpaid(subscription) ? "free" : "past_due";
  return "free";
}
