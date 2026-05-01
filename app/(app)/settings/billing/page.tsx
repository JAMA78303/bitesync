import { createClient } from "@/lib/supabase/server";
import { BillingClient } from "@/components/settings/BillingClient";

type Props = {
  searchParams: Promise<{ success?: string; cancelled?: string }>;
};

export default async function BillingPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status, stripe_customer_id")
    .single();

  const isPro = profile?.subscription_status === "pro";

  return (
    <BillingClient
      isPro={isPro}
      showSuccess={params.success === "true"}
      showCancelled={params.cancelled === "true"}
      monthlyPriceId={process.env.STRIPE_PRO_MONTHLY_PRICE_ID!}
      annualPriceId={process.env.STRIPE_PRO_ANNUAL_PRICE_ID!}
    />
  );
}
