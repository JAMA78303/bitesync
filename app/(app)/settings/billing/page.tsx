import { createClient } from "@/lib/supabase/server";
import { isProSubscriptionStatus } from "@/lib/subscription";
import { BillingClient } from "@/components/settings/BillingClient";

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

  let isPro = false;
  let hasStripeCustomer = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_status, stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    isPro = isProSubscriptionStatus(profile?.subscription_status);
    hasStripeCustomer = Boolean(profile?.stripe_customer_id);
  }

  return (
    <BillingClient
      isPro={isPro}
      hasStripeCustomer={hasStripeCustomer}
      showSuccess={params.success === "true"}
      showCancelled={params.cancelled === "true"}
      monthlyPriceId={process.env.STRIPE_PRO_MONTHLY_PRICE_ID!}
      annualPriceId={process.env.STRIPE_PRO_ANNUAL_PRICE_ID!}
    />
  );
}
