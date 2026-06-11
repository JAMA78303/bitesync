"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
 Check,
 CreditCard,
 Loader2,
 RefreshCw,
 Sparkles,
 Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ds } from "@/lib/ui/classes";
import {
 createCheckoutSession,
 createCustomerPortalSession,
 syncSubscriptionFromStripe,
} from "@/lib/stripe/actions";

type Props = {
 isPro: boolean;
 hasStripeCustomer: boolean;
 showSuccess: boolean;
 showCancelled: boolean;
 monthlyPriceId: string;
 annualPriceId: string;
};

const PRO_FEATURES = [
"Unlimited recipes",
"Full nutrition — macros & micros",
"TDEE calculator & calorie targets",
"Personal macro goals & planner bars",
"Unlimited meal plan history",
"Grocery list for chosen days",
"AI meal & grocery smarts (Pro beta)",
"Priority support",
];

const FREE_FEATURES = [
"Up to 10 recipes",
"Weekly meal planner",
"Grocery list generation",
"Basic macro tracking",
"2 weeks of history",
];

export function BillingClient({
 isPro,
 hasStripeCustomer,
 showSuccess,
 showCancelled,
 monthlyPriceId,
 annualPriceId,
}: Props) {
 const router = useRouter();
 const [billing, setBilling] = useState<"monthly" |"annual">("annual");
 const [isPending, startTransition] = useTransition();
 const [syncPending, setSyncPending] = useState(false);
 const [syncMessage, setSyncMessage] = useState<string | null>(null);

 useEffect(() => {
 if (!showSuccess || isPro) return;

 let ticks = 0;
 const maxTicks = 30;
 const id = setInterval(() => {
 router.refresh();
 ticks += 1;
 if (ticks >= maxTicks) clearInterval(id);
 }, 2000);

 return () => clearInterval(id);
 }, [showSuccess, isPro, router]);

 function handleUpgrade() {
 startTransition(async () => {
 await createCheckoutSession(
 billing ==="monthly" ? monthlyPriceId : annualPriceId,
 billing,
 );
 });
 }

 function handleManage() {
 startTransition(async () => {
 await createCustomerPortalSession();
 });
 }

 async function handleSyncFromStripe() {
 setSyncMessage(null);
 setSyncPending(true);
 const result = await syncSubscriptionFromStripe();
 setSyncPending(false);
 if ("error" in result) {
 setSyncMessage(result.error);
 } else {
 router.refresh();
 }
 }

 return (
 <section className="mx-auto max-w-2xl space-y-6 px-0 pb-24 sm:px-1 md:pb-8">
 <header className="space-y-1">
 <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Billing</h1>
 <p className="text-sm text-[var(--text-muted)]">
 Subscription, Pro benefits, and what&apos;s next
 </p>
 </header>

 {/* Pro AI tools — visible to everyone (solid bg: Tailwind v4 uses bg-linear-* not bg-gradient-*) */}
 <div className="rounded-2xl border border-dashed border-[var(--semantic-warn-border)] bg-[var(--semantic-warn-bg)] p-5 shadow-sm ring-1 ring-[var(--semantic-warn-border)]/50">
 <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
 <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-sage)] text-[var(--text-on-brand)] shadow-sm">
 <Sparkles className="h-6 w-6" aria-hidden />
 </div>
 <div className="min-w-0 flex-1 space-y-2">
 <div className="flex flex-wrap items-center gap-2">
 <p className="font-semibold text-[var(--text-primary)]">AI-assisted planning</p>
 <span className="rounded-full bg-amber-200/90 px-2 py-0.5 text-2xs font-semibold uppercase tracking-wide text-amber-950 dark:bg-amber-800/80 dark:text-amber-50">
 Pro · beta
 </span>
 </div>
 <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
 On Pro, use the planner to generate an AI weekly meal draft and smarter grocery baskets
 (store comparisons and substitutions where enabled). We&apos;re still tightening quality and availability.
 </p>
 </div>
 </div>
 </div>

 {showSuccess && isPro && (
 <div className={`flex items-start gap-3 rounded-2xl p-4 ${ds.successCallout}`}>
 <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand-sage)]">
 <Check className="h-4 w-4 text-[var(--text-on-brand)]" />
 </div>
 <div>
 <p className="text-sm font-semibold text-[var(--semantic-success-text)]">
 Welcome to BiteSync Pro
 </p>
 <p className="mt-0.5 text-xs text-[var(--semantic-success-text)]/90">
 All Pro features are unlocked — jump into Settings for TDEE or Recipes for unlimited
 slots.
 </p>
 </div>
 </div>
 )}

 {showSuccess && !isPro && (
 <div className={`space-y-3 rounded-2xl p-4 ${ds.warnCallout}`}>
 <div className="flex items-center gap-3">
 <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[var(--semantic-warn-text)]" />
 <div>
 <p className="text-sm font-semibold text-[var(--semantic-warn-text)]">
 Payment received — activating Pro
 </p>
 <p className="text-xs text-[var(--semantic-warn-text)]/80">
 Stripe is confirming your subscription. This page refreshes automatically.
 </p>
 </div>
 </div>
 {hasStripeCustomer && (
 <div className="border-t border-[var(--semantic-warn-border)] pt-3">
 <p className="mb-2 text-xs text-[var(--semantic-warn-text)]">
 Still on Free after a minute? Sync directly from Stripe.
 </p>
 <Button
 type="button"
 variant="outline"
 size="sm"
 className="border-[var(--semantic-warn-border)] bg-[var(--surface-card)] text-[var(--semantic-warn-text)] hover:bg-[var(--semantic-warn-bg)]"
 disabled={syncPending || isPending}
 onClick={handleSyncFromStripe}
 >
 {syncPending ? (
 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
 ) : (
 <RefreshCw className="mr-2 h-4 w-4" />
 )}
 Sync subscription from Stripe
 </Button>
 {syncMessage && (
 <p className={`mt-2 text-xs ${ds.errorText}`}>{syncMessage}</p>
 )}
 </div>
 )}
 </div>
 )}

 {showCancelled && (
 <div className={`rounded-2xl p-4 ${ds.warnCallout}`}>
 <p className="text-sm text-[var(--semantic-warn-text)]">
 Upgrade cancelled — you&apos;re still on the free plan.
 </p>
 </div>
 )}

 {isPro ? (
 <div className="overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm">
 <div className="border-b border-[var(--border-subtle)] bg-[var(--surface-muted)]/80 px-5 py-4 bg-[var(--surface-elevated)]">
 <div className="flex flex-wrap items-center gap-3">
 <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-brand-subtle)]">
 <Zap className="h-5 w-5 text-[var(--brand-sage)]" />
 </div>
 <div className="min-w-0 flex-1">
 <p className="font-semibold text-[var(--text-primary)]">BiteSync Pro</p>
 <p className="text-xs text-[var(--text-muted)]">All features unlocked</p>
 </div>
 <span className="rounded-full bg-[var(--semantic-success-bg)] px-3 py-1 text-xs font-semibold text-[var(--semantic-success-text)]">
 Active
 </span>
 </div>
 </div>
 <div className="p-5">
 <ul className="mb-6 space-y-2.5">
 {PRO_FEATURES.map((f, i) => (
 <li
 key={i}
 className="flex items-start gap-2.5 text-sm text-[var(--text-secondary)]"
 >
 <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-sage)]" />
 <span>{f}</span>
 </li>
 ))}
 </ul>

 <Button
 onClick={handleManage}
 disabled={isPending}
 variant="outline"
 className="w-full border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-primary)] hover:bg-[var(--surface-muted)]"
 >
 {isPending ? (
 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
 ) : (
 <CreditCard className="mr-2 h-4 w-4" />
 )}
 Manage subscription
 </Button>

 <p className="mt-3 text-center text-xs text-[var(--text-muted)]">
 Cancel or update payment in the secure Stripe portal
 </p>
 </div>
 </div>
 ) : (
 <div className="space-y-5">
 <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 shadow-sm">
 <p className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
 Current plan: Free
 </p>
 <ul className="space-y-2">
 {FREE_FEATURES.map((f, i) => (
 <li
 key={i}
 className="flex items-center gap-2 text-sm text-[var(--text-muted)]"
 >
 <Check className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
 {f}
 </li>
 ))}
 </ul>
 </div>

 <div className="overflow-hidden rounded-2xl bg-[var(--brand-sage)] shadow-lg ring-1 ring-black/5">
 <div className="p-5 sm:p-6">
 <div className="mb-1 flex items-center gap-2">
 <Zap className="h-4 w-4 text-amber-300" />
 <p className="font-semibold text-[var(--text-on-brand)]">Upgrade to Pro</p>
 </div>
 <p className="mb-5 text-sm text-[var(--text-on-brand-muted)]">
 Unlimited recipes, full nutrition, TDEE, and upcoming AI smarts.
 </p>

 <div className="mb-5 flex rounded-xl bg-[var(--surface-overlay)]/10 p-1">
 <button
 type="button"
 onClick={() => setBilling("monthly")}
 className={`flex-1 rounded-lg py-2.5 text-xs font-medium transition ${
 billing ==="monthly"
 ?"bg-[var(--surface-card)] text-[var(--brand-sage)] shadow-sm"
 :"text-[var(--text-on-brand-muted)] hover:text-[var(--text-on-brand)]"
 }`}
 >
 Monthly
 </button>
 <button
 type="button"
 onClick={() => setBilling("annual")}
 className={`flex-1 rounded-lg py-2.5 text-xs font-medium transition ${
 billing ==="annual"
 ?"bg-[var(--surface-card)] text-[var(--brand-sage)] shadow-sm"
 :"text-[var(--text-on-brand-muted)] hover:text-[var(--text-on-brand)]"
 }`}
 >
 Annual
 <span className="ml-1 text-amber-300">−30%</span>
 </button>
 </div>

 <div className="mb-5">
 {billing ==="monthly" ? (
 <div>
 <span className="text-3xl font-bold text-[var(--text-on-brand)]">£6.99</span>
 <span className="ml-1 text-sm text-[var(--text-on-brand-muted)]">/month</span>
 </div>
 ) : (
 <div>
 <span className="text-3xl font-bold text-[var(--text-on-brand)]">£59</span>
 <span className="ml-1 text-sm text-[var(--text-on-brand-muted)]">/year</span>
 <p className="mt-0.5 text-xs text-[var(--text-on-brand-muted)]">
 ~£4.92/month — save vs monthly
 </p>
 </div>
 )}
 </div>

 <ul className="mb-5 space-y-2">
 {PRO_FEATURES.map((f, i) => (
 <li key={i} className="flex items-center gap-2 text-sm text-[var(--text-on-brand)]">
 <Check className="h-4 w-4 shrink-0 text-[var(--header-stat-accent)]" />
 {f}
 </li>
 ))}
 </ul>

 <Button
 onClick={handleUpgrade}
 disabled={isPending}
 className="w-full bg-[var(--surface-card)] font-semibold text-[var(--brand-sage)] shadow-md hover:bg-[var(--surface-brand-subtle)]"
 >
 {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
 {isPending
 ?"Redirecting to checkout..."
 : `Upgrade — ${billing ==="monthly" ?"£6.99/mo" :"£59/yr"}`}
 </Button>

 <p className="mt-3 text-center text-xs text-[var(--text-on-brand-muted)]">
 Cancel anytime · Secure checkout with Stripe
 </p>
 </div>
 </div>

 {!isPro && hasStripeCustomer && !showSuccess && (
 <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-4 bg-[var(--surface-elevated)]">
 <p className="mb-1 text-sm font-medium text-[var(--text-primary)]">
 Paid but still seeing Free?
 </p>
 <p className="mb-3 text-xs text-[var(--text-muted)]">
 Pull your live Stripe subscription into BiteSync (same path as webhooks).
 </p>
 <Button
 type="button"
 variant="outline"
 size="sm"
 className="border-[var(--border-default)]"
 disabled={syncPending || isPending}
 onClick={handleSyncFromStripe}
 >
 {syncPending ? (
 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
 ) : (
 <RefreshCw className="mr-2 h-4 w-4" />
 )}
 Sync subscription from Stripe
 </Button>
 {syncMessage && (
 <p className={`mt-2 text-xs ${ds.errorText}`}>{syncMessage}</p>
 )}
 </div>
 )}
 </div>
 )}
 </section>
 );
}
