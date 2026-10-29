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
import { SUPPORT_EMAIL, supportMailto } from "@/lib/support";
import { trackTrialStarted } from "@/lib/analytics/events";
import {
  FREE_RECIPE_LIMIT,
  TRIAL_AI_PLAN_CAP,
  TRIAL_AI_RECIPE_CAP,
  TRIAL_DAYS,
  type Plan,
} from "@/lib/billing/access";
import {
  PRO_ANNUAL_MONTHLY_EQUIVALENT,
  PRO_ANNUAL_PRICE,
  PRO_MONTHLY_PRICE,
} from "@/lib/stripe/pricing";
import {
  createCheckoutSession,
  createCustomerPortalSession,
  syncSubscriptionFromStripe,
} from "@/lib/stripe/actions";
import { startProTrial } from "@/app/(app)/billing/trial-actions";

type Props = {
  plan: Plan;
  /** A Stripe subscription: Manage subscription goes to the Stripe portal. */
  paying: boolean;
  /** Pro given through app_metadata: nothing in Stripe to manage. */
  comped: boolean;
  hasStripeCustomer: boolean;
  trialDaysLeft: number | null;
  /** End of the current or last trial (ISO), if there was one. */
  trialEndsAt: string | null;
  /** Upgrading now first charges when the trial ends (checkoutTrialEnd in lib/billing/access.ts). */
  chargeAtTrialEnd: boolean;
  /** A free-plan account from before the trial that hasn't had its trial. */
  canStartTrial: boolean;
  /** A paid subscription ended (not a trial running out): no "nothing was charged". */
  lapsed: boolean;
  showSuccess: boolean;
  showCancelled: boolean;
  monthlyPriceId: string;
  annualPriceId: string;
};

/** Everything Pro includes. Targets, macros and plan history are on every plan, so they aren't sold here. */
const PRO_FEATURES = [
  "AI week plans built around your targets",
  "Vitamins and minerals for the week, not just macros",
  "Unlimited recipes",
  "AI-written methods for new recipes",
  "Week planner and grocery lists",
];

/** The free plan that accounts from before the trial kept. */
const FREE_FEATURES = [
  `Up to ${FREE_RECIPE_LIMIT} recipes`,
  "Week planner",
  "Grocery lists from your plan",
  "Calorie and macro targets",
  "Macro tracking",
];

/** What an account keeps once its trial ends without paying (lib/billing/access.ts). */
const KEPT_AFTER_TRIAL = [
  "Your recipes, meal plans and grocery lists, to view any time",
  "Ticking off meals and grocery items as you go",
  "Editing your recipes, targets and diet",
];

function formatDay(iso: string, timeZone?: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone,
  });
}

/**
 * "Thursday 5 November". The server renders it in UTC; in the browser it
 * switches to the viewer's own time zone, so a trial ending near midnight
 * shows the right day without a hydration mismatch.
 */
function useDayLabel(iso: string | null): string | null {
  const [label, setLabel] = useState(() => (iso ? formatDay(iso, "UTC") : null));
  useEffect(() => {
    setLabel(iso ? formatDay(iso) : null);
  }, [iso]);
  return label;
}

function daysLeftLabel(days: number | null): string {
  const n = days ?? 1;
  return `${n} ${n === 1 ? "day" : "days"} left`;
}

function FeatureList({ items, tone }: { items: string[]; tone: "card" | "brand" | "muted" }) {
  const text =
    tone === "brand"
      ? "text-[var(--text-on-brand)]"
      : tone === "muted"
        ? "text-[var(--text-muted)]"
        : "text-[var(--text-secondary)]";
  const tick =
    tone === "brand"
      ? "text-[var(--header-stat-accent)]"
      : tone === "muted"
        ? "text-[var(--text-muted)]"
        : "text-[var(--brand-sage)]";
  return (
    <ul className="space-y-2">
      {items.map((f) => (
        <li key={f} className={`flex items-start gap-2 text-sm ${text}`}>
          <Check className={`mt-0.5 h-4 w-4 shrink-0 ${tick}`} aria-hidden />
          <span>{f}</span>
        </li>
      ))}
    </ul>
  );
}

export function BillingClient({
  plan,
  paying,
  comped,
  hasStripeCustomer,
  trialDaysLeft,
  trialEndsAt,
  chargeAtTrialEnd,
  canStartTrial,
  lapsed,
  showSuccess,
  showCancelled,
  monthlyPriceId,
  annualPriceId,
}: Props) {
  const router = useRouter();
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");
  const [isPending, startTransition] = useTransition();
  const [trialPending, startTrialTransition] = useTransition();
  const [trialError, setTrialError] = useState<string | null>(null);
  const [syncPending, setSyncPending] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const trialEndDay = useDayLabel(trialEndsAt);
  const isPro = plan === "pro";
  const deferCharge = plan === "trial" && chargeAtTrialEnd;
  const trialEndsOn = trialEndDay ? ` on ${trialEndDay}` : "";

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

  function handleStartTrial() {
    setTrialError(null);
    startTrialTransition(async () => {
      const result = await startProTrial();
      if ("error" in result) {
        setTrialError(result.error);
        return;
      }
      trackTrialStarted("legacy_opt_in");
      router.refresh();
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

  const badge = {
    pro: "Pro · active",
    trial: `Pro trial · ${daysLeftLabel(trialDaysLeft)}`,
    free: "Free plan",
    expired: lapsed ? "Pro ended" : "Trial ended",
  }[plan];

  return (
    <div className={ds.pageContent}>
      <header className={`${ds.gradientHeader} flex flex-col gap-4 md:flex-row md:items-center md:justify-between`}>
        <div>
          <span className={ds.kicker}>YOUR PLAN</span>
          <h1 className={`mb-1.5 ${ds.pageTitle}`}>Billing</h1>
          <p className={ds.pageSubtitle}>Subscription, Pro benefits, and what&apos;s next</p>
        </div>
        <span className="inline-flex self-start rounded-full bg-[var(--accent-lime)] px-3.5 py-2 font-display text-xs font-bold uppercase tracking-[0.06em] text-[var(--on-lime)] md:self-center">
          {badge}
        </span>
      </header>
      <section className={`${ds.mobileGutter} mx-auto max-w-2xl space-y-6`}>

        {/* Pro AI tools — visible to everyone (solid bg: Tailwind v4 uses bg-linear-* not bg-gradient-*) */}
        <div className="rounded-[20px] border border-[var(--border-default)] bg-[var(--surface-brand-subtle)] p-5 md:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--green-deep)] text-[var(--accent-lime)] shadow-sm">
              <Sparkles className="h-6 w-6" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-display text-base font-extrabold tracking-[-0.01em] text-[var(--text-primary)]">AI-assisted planning</p>
                <span className="rounded-full bg-[var(--accent-lime)] px-2 py-0.5 text-2xs font-bold uppercase tracking-wide text-[var(--on-lime)]">
                  Pro · beta
                </span>
              </div>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                On Pro, the planner can draft your week with AI, built around your targets.
                We&apos;re still tightening quality and availability.
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
                Every Pro feature is on: AI week plans in the planner, vitamins and minerals on
                Nutrition, and unlimited recipes.
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
                  Checkout complete — activating Pro
                </p>
                <p className="text-xs text-[var(--semantic-warn-text)]/80">
                  Stripe is confirming your subscription. This page refreshes automatically.
                </p>
              </div>
            </div>
            {hasStripeCustomer && (
              <div className="border-t border-[var(--semantic-warn-border)] pt-3">
                <p className="mb-2 text-xs text-[var(--semantic-warn-text)]">
                  Still not on Pro after a minute? Sync directly from Stripe.
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

        {showCancelled && !isPro && (
          <div className={`rounded-2xl p-4 ${ds.warnCallout}`}>
            <p className="text-sm text-[var(--semantic-warn-text)]">
              Checkout cancelled. Nothing was charged.
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
              <div className="mb-6">
                <FeatureList items={PRO_FEATURES} tone="card" />
              </div>

              {paying ? (
                <>
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
                </>
              ) : (
                <p className="text-center text-xs text-[var(--text-muted)]">
                  {comped
                    ? "Pro is included with your account at no charge, so there's nothing to manage or cancel."
                    : "There's no subscription to manage here."}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {plan === "trial" ? (
              <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-brand-subtle)]">
                    <Sparkles className="h-5 w-5 text-[var(--brand-sage)]" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[var(--text-primary)]">Your {TRIAL_DAYS}-day Pro trial</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {daysLeftLabel(trialDaysLeft)}
                      {trialEndDay ? ` · ends ${trialEndDay}` : ""}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-[var(--text-secondary)]">
                  Every Pro feature is on. Nothing is charged when the trial ends, and your recipes
                  and plans stay in your account.
                </p>
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  The trial includes {TRIAL_AI_PLAN_CAP} AI week plans and AI-written methods for{" "}
                  {TRIAL_AI_RECIPE_CAP} new recipes. After that, the standard planner and recipe
                  templates carry on.
                </p>
              </div>
            ) : null}

            {plan === "free" ? (
              <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 shadow-sm">
                <p className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
                  Current plan: Free
                </p>
                <FeatureList items={FREE_FEATURES} tone="muted" />
                {!canStartTrial && trialEndDay ? (
                  <p className="mt-3 text-xs text-[var(--text-muted)]">
                    Your free Pro trial ended on {trialEndDay}.
                  </p>
                ) : null}
              </div>
            ) : null}

            {plan === "free" && canStartTrial ? (
              <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-brand-subtle)]">
                    <Sparkles className="h-5 w-5 text-[var(--brand-sage)]" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[var(--text-primary)]">
                      Try BiteSync Pro free for {TRIAL_DAYS} days
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      Every Pro feature, with no card needed. Afterwards you&apos;re back on the free
                      plan unless you upgrade, and nothing you made is lost.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={handleStartTrial}
                  disabled={trialPending}
                  className="mt-4 w-full"
                >
                  {trialPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  {trialPending ? "Starting your trial..." : "Start my free trial"}
                </Button>
                {trialError ? (
                  <p role="alert" className={`mt-2 text-xs ${ds.errorText}`}>
                    {trialError}
                  </p>
                ) : null}
              </div>
            ) : null}

            {plan === "expired" ? (
              <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 shadow-sm">
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {lapsed ? "Your BiteSync Pro subscription has ended" : `Your ${TRIAL_DAYS}-day Pro trial has ended`}
                </p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {lapsed
                    ? "Everything you made is still here. You can keep:"
                    : `${trialEndDay ? `It ended on ${trialEndDay}. ` : ""}Nothing was charged, and everything you made is still here. You can keep:`}
                </p>
                <div className="mt-3">
                  <FeatureList items={KEPT_AFTER_TRIAL} tone="card" />
                </div>
                <p className="mt-3 text-sm text-[var(--text-secondary)]">
                  Planning new weeks, adding recipes and making grocery lists need Pro.
                </p>
              </div>
            ) : null}

            <div className="overflow-hidden rounded-2xl bg-[var(--brand-sage)] shadow-lg ring-1 ring-black/5">
              <div className="p-5 sm:p-6">
                <div className="mb-1 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-300" />
                  <p className="font-semibold text-[var(--text-on-brand)]">
                    {plan === "trial" ? "Keep Pro after your trial" : "Upgrade to Pro"}
                  </p>
                </div>
                <p className="mb-5 text-sm text-[var(--text-on-brand-muted)]">
                  AI week plans, vitamins and minerals, and unlimited recipes.
                </p>

                {plan === "trial" ? (
                  <p className="mb-5 rounded-xl bg-[var(--surface-overlay)]/10 px-3 py-2.5 text-sm text-[var(--text-on-brand)]">
                    {deferCharge
                      ? `Upgrade now and you won't be charged until your trial ends${trialEndsOn}.`
                      : "Your trial has less than 2 days left, so if you upgrade now you'll be charged today."}
                  </p>
                ) : null}

                <div className="mb-5 flex rounded-xl bg-[var(--surface-overlay)]/10 p-1">
                  <button
                    type="button"
                    onClick={() => setBilling("monthly")}
                    className={`flex-1 rounded-lg py-2.5 text-xs font-medium transition ${
                      billing === "monthly"
                        ? "bg-[var(--surface-card)] text-[var(--brand-sage)] shadow-sm"
                        : "text-[var(--text-on-brand-muted)] hover:text-[var(--text-on-brand)]"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setBilling("annual")}
                    className={`flex-1 rounded-lg py-2.5 text-xs font-medium transition ${
                      billing === "annual"
                        ? "bg-[var(--surface-card)] text-[var(--brand-sage)] shadow-sm"
                        : "text-[var(--text-on-brand-muted)] hover:text-[var(--text-on-brand)]"
                    }`}
                  >
                    Annual
                    <span className="ml-1 text-amber-300">−30%</span>
                  </button>
                </div>

                <div className="mb-5">
                  {billing === "monthly" ? (
                    <div>
                      <span className="text-3xl font-bold text-[var(--text-on-brand)]">{PRO_MONTHLY_PRICE}</span>
                      <span className="ml-1 text-sm text-[var(--text-on-brand-muted)]">/month</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-3xl font-bold text-[var(--text-on-brand)]">{PRO_ANNUAL_PRICE}</span>
                      <span className="ml-1 text-sm text-[var(--text-on-brand-muted)]">/year</span>
                      <p className="mt-0.5 text-xs text-[var(--text-on-brand-muted)]">
                        ~{PRO_ANNUAL_MONTHLY_EQUIVALENT}/month — save vs monthly
                      </p>
                    </div>
                  )}
                </div>

                <div className="mb-5">
                  <FeatureList items={PRO_FEATURES} tone="brand" />
                </div>

                <Button
                  onClick={handleUpgrade}
                  disabled={isPending}
                  className="w-full bg-[var(--surface-card)] font-semibold text-[var(--brand-sage)] shadow-md hover:bg-[var(--surface-brand-subtle)]"
                >
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isPending
                    ? "Redirecting to checkout..."
                    : `Upgrade — ${billing === "monthly" ? `${PRO_MONTHLY_PRICE}/mo` : `${PRO_ANNUAL_PRICE}/yr`}`}
                </Button>

                {/* Say it renews before they pay, not only that they can cancel — UK
                    consumer rules expect automatic renewal to be clear up front. */}
                <p className="mt-3 text-center text-xs text-[var(--text-on-brand-muted)]">
                  {deferCharge ? `First payment when your trial ends${trialEndsOn}, then renews` : "Renews"} automatically
                  every {billing === "monthly" ? "month" : "year"} until you cancel · Cancel anytime ·
                  Secure checkout with Stripe
                </p>
              </div>
            </div>

            {hasStripeCustomer && !showSuccess && (
              <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-4 bg-[var(--surface-elevated)]">
                <p className="mb-1 text-sm font-medium text-[var(--text-primary)]">
                  Paid but Pro isn&apos;t showing?
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

        <p className="text-center text-xs text-[var(--text-muted)]">
          Questions about billing or a payment?{" "}
          <a
            href={supportMailto("BiteSync billing")}
            className="font-medium text-[var(--text-link)] underline underline-offset-2"
          >
            {SUPPORT_EMAIL}
          </a>
        </p>
      </section>
    </div>
  );
}
