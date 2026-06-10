"use server";

import { toUserFacingError } from "@/lib/errors/userFacing";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getStripeServer } from "@/lib/stripe/server";
import { fetchProfileStripeCustomerId, updateOrInsertProfile } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function createCheckoutSession(
  priceId: string,
  billingPeriod: "monthly" | "annual",
) {
  const stripe = getStripeServer();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  let customerId = profile?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;

    const { error: persistError } = await supabase.from("profiles").upsert(
      { id: user.id, stripe_customer_id: customerId },
      { onConflict: "id" },
    );
    if (persistError) {
      throw new Error(persistError.message);
    }
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?cancelled=true`,
    metadata: { supabase_user_id: user.id, billing_period: billingPeriod },
    subscription_data: {
      metadata: { supabase_user_id: user.id, billing_period: billingPeriod },
    },
    allow_promotion_codes: true,
  });

  if (!session.url) {
    throw new Error("Failed to create checkout session");
  }

  redirect(session.url);
}

export async function createCustomerPortalSession() {
  const stripe = getStripeServer();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.stripe_customer_id) {
    redirect("/billing");
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
  });

  redirect(portalSession.url);
}

/**
 * Pulls subscription state from Stripe and updates Supabase (same source of truth as webhooks).
 * Use when payment succeeded but Pro did not unlock yet (webhook delay or misconfiguration).
 */
export async function syncSubscriptionFromStripe(): Promise<
  { ok: true } | { error: string }
> {
  const stripe = getStripeServer();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in." };
  }

  const profileResult = await fetchProfileStripeCustomerId(user.id);
  if ("error" in profileResult) {
    return { error: profileResult.error };
  }

  if (!profileResult.stripe_customer_id) {
    return {
      error:
        "No Stripe customer linked yet. Use Upgrade to checkout once so your account is connected.",
    };
  }

  const subs = await stripe.subscriptions.list({
    customer: profileResult.stripe_customer_id,
    status: "all",
    limit: 20,
  });

  const active = subs.data.find(
    (s) => s.status === "active" || s.status === "trialing",
  );
  if (!active) {
    return {
      error:
        "Stripe shows no active subscription for this customer. Check Stripe Dashboard or use test/live keys that match your payment.",
    };
  }

  const { error } = await updateOrInsertProfile(user.id, {
    subscription_status: "pro",
    stripe_customer_id: profileResult.stripe_customer_id,
    stripe_subscription_id: active.id,
  });

  if (error) {
    return { error: toUserFacingError(error, "billing", "syncBillingSubscription") };
  }

  revalidatePath("/billing");
  revalidatePath("/settings/billing");
  revalidatePath("/settings");
  return { ok: true };
}
