import { unstable_noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAccess, isProSubscriptionStatus, type Plan } from "@/lib/subscription";
import { checkoutTrialEnd } from "@/lib/billing/access";
import { reconcileBillingSubscriptionFromStripe } from "@/lib/stripe/reconcile-billing-subscription";
import { BillingClient } from "@/components/settings/BillingClient";
import { AppBillingNotice } from "@/components/settings/AppBillingNotice";
import { isNativeAppRequest } from "@/lib/native/server";

type Props = {
  searchParams: Promise<{ success?: string; cancelled?: string }>;
};

export const dynamic = "force-dynamic";

export default async function BillingPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Paying through Stripe: the Stripe controls. Pro features come from `access`.
  let paying = false;
  let hasStripeCustomer = false;
  if (user) {
    unstable_noStore();
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_status, stripe_customer_id, stripe_subscription_id")
      .eq("id", user.id)
      .maybeSingle();

    paying = isProSubscriptionStatus(profile?.subscription_status);
    hasStripeCustomer = Boolean(profile?.stripe_customer_id?.trim());

    if (!paying) {
      const reconciled = await reconcileBillingSubscriptionFromStripe({
        userId: user.id,
        subscriptionStatus: profile?.subscription_status,
        stripeCustomerId: profile?.stripe_customer_id ?? null,
        stripeSubscriptionId: profile?.stripe_subscription_id ?? null,
      });
      if (reconciled.isPro) {
        paying = true;
      }
      if (reconciled.hasStripeCustomer) {
        hasStripeCustomer = true;
      }
    }
  }

  // getAccess is cached for the request and may predate the reconcile above,
  // so a subscription found just now counts as Pro here too.
  const access = await getAccess();
  const plan: Plan = paying ? "pro" : (access?.plan ?? "free");
  const onTrial = plan === "trial" && access !== null;

  if (await isNativeAppRequest()) {
    return <AppBillingNotice plan={plan} trialDaysLeft={onTrial ? access.trialDaysLeft : null} />;
  }

  return (
    <BillingClient
      plan={plan}
      paying={paying}
      comped={plan === "pro" && !paying && Boolean(access?.comped)}
      hasStripeCustomer={hasStripeCustomer}
      trialDaysLeft={onTrial ? access.trialDaysLeft : null}
      trialEndsAt={access?.trialEndsAt ?? null}
      chargeAtTrialEnd={onTrial && checkoutTrialEnd(access, new Date()) !== null}
      canStartTrial={!paying && Boolean(access?.canStartTrial)}
      lapsed={!paying && Boolean(access?.lapsed)}
      showSuccess={params.success === "true"}
      showCancelled={params.cancelled === "true"}
      monthlyPriceId={process.env.STRIPE_PRO_MONTHLY_PRICE_ID!}
      annualPriceId={process.env.STRIPE_PRO_ANNUAL_PRICE_ID!}
    />
  );
}
