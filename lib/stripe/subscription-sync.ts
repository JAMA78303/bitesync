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

/** Align with app billing rules: past_due/unpaid still unlock until Stripe ends access. */
export function stripeSubscriptionStatusToDbProfileStatus(
  status: Stripe.Subscription.Status,
): "pro" | "past_due" | "free" {
  if (status === "active" || status === "trialing") return "pro";
  if (status === "past_due" || status === "unpaid") return "past_due";
  return "free";
}
