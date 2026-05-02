"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Zap, CreditCard, RefreshCw } from "lucide-react";
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
  "Full nutrition - macros and micros",
  "TDEE calculator and calorie targets",
  "Personal macro goals with progress bars",
  "Unlimited meal plan history",
  "Grocery list by selected days",
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
    <div className="mx-auto max-w-lg px-4 pb-20">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-800">Billing</h1>
        <p className="mt-0.5 text-sm text-slate-400">
          Manage your BiteSync subscription
        </p>
      </div>

      {showSuccess && isPro && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-[#6EE7B7] bg-[#D1FAE5] p-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1A4731]">
            <Check className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1A4731]">
              Welcome to BiteSync Pro!
            </p>
            <p className="text-xs text-[#1A4731] opacity-70">
              All Pro features are now unlocked.
            </p>
          </div>
        </div>
      )}

      {showSuccess && !isPro && (
        <div className="mb-6 space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                Payment received — activating Pro
              </p>
              <p className="text-xs text-amber-800 opacity-80">
                Your account updates as soon as Stripe confirms (usually a few seconds). This page
                refreshes automatically.
              </p>
            </div>
          </div>
          {hasStripeCustomer && (
            <div className="border-t border-amber-200/80 pt-3">
              <p className="mb-2 text-xs text-amber-900/90">
                Still on Free after a minute? Pull your subscription state directly from Stripe.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-amber-300 bg-white text-amber-950 hover:bg-amber-50"
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
                <p className="mt-2 text-xs text-red-700">{syncMessage}</p>
              )}
            </div>
          )}
        </div>
      )}

      {showCancelled && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-700">
            Upgrade cancelled - you&apos;re still on the free plan.
          </p>
        </div>
      )}

      {isPro ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D1FAE5]">
              <Zap className="h-5 w-5 text-[#1A4731]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-800 dark:text-slate-100">BiteSync Pro</p>
              <p className="text-xs text-slate-400 dark:text-slate-400">All features unlocked</p>
            </div>
            <span className="ml-0 shrink-0 rounded-full bg-[#D1FAE5] px-2.5 py-1 text-xs font-medium text-[#1A4731] sm:ml-auto">
              Active
            </span>
          </div>

          <ul className="mb-6 space-y-2">
            {PRO_FEATURES.map((f, i) => (
              <li
                key={i}
                className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"
              >
                <Check className="h-4 w-4 shrink-0 text-[#1A4731]" />
                {f}
              </li>
            ))}
          </ul>

          <Button
            onClick={handleManage}
            disabled={isPending}
            variant="outline"
            className="w-full border-slate-300 dark:border-slate-600 dark:text-slate-100"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="mr-2 h-4 w-4" />
            )}
            Manage subscription
          </Button>

          <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-400">
            Cancel anytime from the billing portal
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="mb-3 text-sm font-semibold text-slate-700">
              Current plan: Free
            </p>
            <ul className="space-y-2">
              {FREE_FEATURES.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-500">
                  <Check className="h-4 w-4 shrink-0 text-slate-300" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl bg-[#1A4731] p-5">
            <div className="mb-1 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <p className="font-semibold text-white">Upgrade to Pro</p>
            </div>
            <p className="mb-5 text-xs text-green-200">
              Unlock everything BiteSync has to offer
            </p>

            <div className="mb-4 flex rounded-lg bg-white/10 p-1">
              <button
                type="button"
                onClick={() => setBilling("monthly")}
                className={`flex-1 rounded-md py-2 text-xs font-medium transition-all duration-150 ${
                  billing === "monthly"
                    ? "bg-white text-[#1A4731]"
                    : "text-green-200 hover:text-white"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBilling("annual")}
                className={`flex-1 rounded-md py-2 text-xs font-medium transition-all duration-150 ${
                  billing === "annual"
                    ? "bg-white text-[#1A4731]"
                    : "text-green-200 hover:text-white"
                }`}
              >
                Annual
                <span className="ml-1 text-amber-400">-30%</span>
              </button>
            </div>

            <div className="mb-5">
              {billing === "monthly" ? (
                <div>
                  <span className="text-3xl font-bold text-white">£6.99</span>
                  <span className="ml-1 text-sm text-green-300">/month</span>
                </div>
              ) : (
                <div>
                  <span className="text-3xl font-bold text-white">£59</span>
                  <span className="ml-1 text-sm text-green-300">/year</span>
                  <p className="mt-0.5 text-xs text-green-300">
                    That&apos;s £4.92/month - save £24.88
                  </p>
                </div>
              )}
            </div>

            <ul className="mb-5 space-y-2">
              {PRO_FEATURES.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-green-100">
                  <Check className="h-4 w-4 shrink-0 text-green-300" />
                  {f}
                </li>
              ))}
            </ul>

            <Button
              onClick={handleUpgrade}
              disabled={isPending}
              className="w-full bg-white font-semibold text-[#1A4731] hover:bg-green-50"
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isPending
                ? "Redirecting to checkout..."
                : `Upgrade to Pro - ${billing === "monthly" ? "£6.99/mo" : "£59/yr"}`}
            </Button>

            <p className="mt-3 text-center text-xs text-green-300">
              Cancel anytime - Secure payment by Stripe
            </p>
          </div>

          {!isPro && hasStripeCustomer && !showSuccess && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-2 text-sm font-medium text-slate-700">
                Paid but still seeing Free?
              </p>
              <p className="mb-3 text-xs text-slate-500">
                Sync reads your live Stripe subscription and unlocks Pro here (same data webhooks
                use).
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
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
                <p className="mt-2 text-xs text-red-600">{syncMessage}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
