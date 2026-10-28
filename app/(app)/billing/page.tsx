import { unstable_noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isProSubscriptionStatus } from "@/lib/subscription";
import { reconcileBillingSubscriptionFromStripe } from "@/lib/stripe/reconcile-billing-subscription";
import { BillingClient } from "@/components/settings/BillingClient";
import { AppBillingNotice } from "@/components/settings/AppBillingNotice";
import { isNativeAppRequest } from "@/lib/native/server";

type Props = {
 searchParams: Promise<{ success?: string; cancelled?: string }>;
};

export const dynamic ="force-dynamic";

export default async function BillingPage({ searchParams }: Props) {
 const params = await searchParams;
 const supabase = await createClient();
 const {
 data: { user },
 } = await supabase.auth.getUser();

 let isPro = false;
 let hasStripeCustomer = false;
 if (user) {
 unstable_noStore();
 const { data: profile } = await supabase
 .from("profiles")
 .select("subscription_status, stripe_customer_id, stripe_subscription_id")
 .eq("id", user.id)
 .maybeSingle();

 isPro = isProSubscriptionStatus(profile?.subscription_status);
 hasStripeCustomer = Boolean(profile?.stripe_customer_id?.trim());

 if (!isPro) {
 const reconciled = await reconcileBillingSubscriptionFromStripe({
 userId: user.id,
 subscriptionStatus: profile?.subscription_status,
 stripeCustomerId: profile?.stripe_customer_id ?? null,
 stripeSubscriptionId: profile?.stripe_subscription_id ?? null,
 });
 if (reconciled.isPro) {
 isPro = true;
 }
 if (reconciled.hasStripeCustomer) {
 hasStripeCustomer = true;
 }
 }
 }

 if (await isNativeAppRequest()) {
 return <AppBillingNotice isPro={isPro} />;
 }

 return (
 <BillingClient
 isPro={isPro}
 hasStripeCustomer={hasStripeCustomer}
 showSuccess={params.success ==="true"}
 showCancelled={params.cancelled ==="true"}
 monthlyPriceId={process.env.STRIPE_PRO_MONTHLY_PRICE_ID!}
 annualPriceId={process.env.STRIPE_PRO_ANNUAL_PRICE_ID!}
 />
 );
}
