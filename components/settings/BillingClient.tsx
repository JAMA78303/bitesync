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
  "AI meal & grocery smarts (rolling out)",
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
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");
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
        billing === "monthly" ? monthlyPriceId : annualPriceId,
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
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Billing</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Subscription, Pro benefits, and what&apos;s next
        </p>
      </header>

      {/* AI roadmap — visible to everyone (solid bg: Tailwind v4 uses bg-linear-* not bg-gradient-*) */}
      <div className="rounded-2xl border border-dashed border-amber-400/70 bg-amber-50 p-5 shadow-sm ring-1 ring-amber-200/50 dark:border-amber-700/60 dark:bg-amber-950/30 dark:ring-amber-900/40">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-sage)] text-white shadow-sm">
            <Sparkles className="h-6 w-6" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-gray-900 dark:text-gray-100">AI assistance</p>
              <span className="rounded-full bg-amber-200/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-950 dark:bg-amber-800/80 dark:text-amber-50">
                Coming soon
              </span>
            </div>
            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              Quick meal ideas, ingredient swaps, and smarter grocery suggestions tuned to your plan
              — planned as part of Pro; not available in the app yet.
            </p>
          </div>
        </div>
      </div>

      {showSuccess && isPro && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/40">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand-sage)]">
            <Check className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
              Welcome to BiteSync Pro
            </p>
            <p className="mt-0.5 text-xs text-emerald-800 dark:text-emerald-300/90">
              All Pro features are unlocked — jump into Settings for TDEE or Recipes for unlimited
              slots.
            </p>
          </div>
        </div>
      )}

      {showSuccess && !isPro && (
        <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                Payment received — activating Pro
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-200/80">
                Stripe is confirming your subscription. This page refreshes automatically.
              </p>
            </div>
          </div>
          {hasStripeCustomer && (
            <div className="border-t border-amber-200/80 pt-3 dark:border-amber-800/60">
              <p className="mb-2 text-xs text-amber-900 dark:text-amber-100/90">
                Still on Free after a minute? Sync directly from Stripe.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-amber-300 bg-white text-amber-950 hover:bg-amber-50 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-50 dark:hover:bg-amber-900"
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
                <p className="mt-2 text-xs text-red-600 dark:text-red-400">{syncMessage}</p>
              )}
            </div>
          )}
        </div>
      )}

      {showCancelled && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Upgrade cancelled — you&apos;re still on the free plan.
          </p>
        </div>
      )}

      {isPro ? (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="border-b border-gray-100 bg-gray-50/80 px-5 py-4 dark:border-gray-800 dark:bg-gray-800/50">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
                <Zap className="h-5 w-5 text-[var(--brand-sage)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 dark:text-gray-100">BiteSync Pro</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">All features unlocked</p>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-100">
                Active
              </span>
            </div>
          </div>
          <div className="p-5">
            <ul className="mb-6 space-y-2.5">
              {PRO_FEATURES.map((f, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300"
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
              className="w-full border-gray-300 bg-white text-gray-900 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="mr-2 h-4 w-4" />
              )}
              Manage subscription
            </Button>

            <p className="mt-3 text-center text-xs text-gray-500 dark:text-gray-400">
              Cancel or update payment in the secure Stripe portal
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <p className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
              Current plan: Free
            </p>
            <ul className="space-y-2">
              {FREE_FEATURES.map((f, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                >
                  <Check className="h-4 w-4 shrink-0 text-gray-300 dark:text-gray-600" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="overflow-hidden rounded-2xl bg-[var(--brand-sage)] shadow-lg ring-1 ring-black/5">
            <div className="p-5 sm:p-6">
              <div className="mb-1 flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-300" />
                <p className="font-semibold text-white">Upgrade to Pro</p>
              </div>
              <p className="mb-5 text-sm text-emerald-100/90">
                Unlimited recipes, full nutrition, TDEE, and upcoming AI smarts.
              </p>

              <div className="mb-5 flex rounded-xl bg-white/10 p-1">
                <button
                  type="button"
                  onClick={() => setBilling("monthly")}
                  className={`flex-1 rounded-lg py-2.5 text-xs font-medium transition ${
                    billing === "monthly"
                      ? "bg-white text-[var(--brand-sage)] shadow-sm"
                      : "text-emerald-100 hover:text-white"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBilling("annual")}
                  className={`flex-1 rounded-lg py-2.5 text-xs font-medium transition ${
                    billing === "annual"
                      ? "bg-white text-[var(--brand-sage)] shadow-sm"
                      : "text-emerald-100 hover:text-white"
                  }`}
                >
                  Annual
                  <span className="ml-1 text-amber-300">−30%</span>
                </button>
              </div>

              <div className="mb-5">
                {billing === "monthly" ? (
                  <div>
                    <span className="text-3xl font-bold text-white">£6.99</span>
                    <span className="ml-1 text-sm text-emerald-200">/month</span>
                  </div>
                ) : (
                  <div>
                    <span className="text-3xl font-bold text-white">£59</span>
                    <span className="ml-1 text-sm text-emerald-200">/year</span>
                    <p className="mt-0.5 text-xs text-emerald-200/90">
                      ~£4.92/month — save vs monthly
                    </p>
                  </div>
                )}
              </div>

              <ul className="mb-5 space-y-2">
                {PRO_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-emerald-50">
                    <Check className="h-4 w-4 shrink-0 text-emerald-300" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                onClick={handleUpgrade}
                disabled={isPending}
                className="w-full bg-white font-semibold text-[var(--brand-sage)] shadow-md hover:bg-emerald-50"
              >
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isPending
                  ? "Redirecting to checkout..."
                  : `Upgrade — ${billing === "monthly" ? "£6.99/mo" : "£59/yr"}`}
              </Button>

              <p className="mt-3 text-center text-xs text-emerald-200/90">
                Cancel anytime · Secure checkout with Stripe
              </p>
            </div>
          </div>

          {!isPro && hasStripeCustomer && !showSuccess && (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
              <p className="mb-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                Paid but still seeing Free?
              </p>
              <p className="mb-3 text-xs text-gray-600 dark:text-gray-400">
                Pull your live Stripe subscription into BiteSync (same path as webhooks).
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-gray-300 dark:border-gray-600"
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
                <p className="mt-2 text-xs text-red-600 dark:text-red-400">{syncMessage}</p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
