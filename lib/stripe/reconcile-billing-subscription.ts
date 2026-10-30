import type Stripe from "stripe";
import { updateOrInsertProfile } from "@/lib/supabase/admin";
import { isProSubscriptionStatus } from "@/lib/subscription";
import { getStripeServer } from "@/lib/stripe/server";
import {
  normalizeStripeId,
  stripeSubscriptionStatusToDbProfileStatus,
} from "@/lib/stripe/subscription-sync";

/**
 * When the DB is behind Stripe (webhook delay, misconfig), align profile on Billing load.
 * No-op if already Pro, or if there is nothing to look up in Stripe.
 */
export async function reconcileBillingSubscriptionFromStripe(params: {
  userId: string;
  subscriptionStatus: string | null | undefined;
  stripeCustomerId: string | null | undefined;
  stripeSubscriptionId: string | null | undefined;
}): Promise<{ isPro: boolean; hasStripeCustomer: boolean }> {
  const hasCustomer = Boolean(params.stripeCustomerId?.trim());
  const hasSubId = Boolean(params.stripeSubscriptionId?.trim());

  if (isProSubscriptionStatus(params.subscriptionStatus)) {
    return { isPro: true, hasStripeCustomer: hasCustomer || hasSubId };
  }

  if (!hasCustomer && !hasSubId) {
    return { isPro: false, hasStripeCustomer: false };
  }

  try {
    const stripe = getStripeServer();
    let subscription: Stripe.Subscription | null = null;

    if (hasSubId && params.stripeSubscriptionId) {
      try {
        subscription = await stripe.subscriptions.retrieve(params.stripeSubscriptionId);
      } catch {
        subscription = null;
      }
    }

    if (!subscription && hasCustomer && params.stripeCustomerId) {
      const subs = await stripe.subscriptions.list({
        customer: params.stripeCustomerId,
        status: "all",
        limit: 20,
      });
      subscription =
        subs.data.find((s) => s.status === "active" || s.status === "trialing") ??
        subs.data.find((s) => s.status === "past_due" || s.status === "unpaid") ??
        null;
    }

    if (!subscription) {
      return { isPro: false, hasStripeCustomer: hasCustomer };
    }

    const mapped = stripeSubscriptionStatusToDbProfileStatus(subscription);
    const grantsPro = mapped === "pro" || mapped === "past_due";

    const cid = normalizeStripeId(subscription.customer);

    if (grantsPro) {
      await updateOrInsertProfile(params.userId, {
        subscription_status: mapped === "past_due" ? "past_due" : "pro",
        stripe_subscription_id: subscription.id,
        ...(cid ? { stripe_customer_id: cid } : {}),
      });
      // No revalidatePath: this runs while /billing and /settings render, where
      // Next 16 throws on it (which landed in the catch below and reported "not
      // Pro"). Both pages are dynamic, so the next render reads the new status.
      return { isPro: true, hasStripeCustomer: true };
    }

    return { isPro: false, hasStripeCustomer: hasCustomer || Boolean(cid) };
  } catch {
    return { isPro: false, hasStripeCustomer: hasCustomer };
  }
}
