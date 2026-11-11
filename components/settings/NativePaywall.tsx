"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { syncApplePurchase } from "@/app/(app)/billing/iap-actions";
import { TRIAL_DAYS, type Plan } from "@/lib/billing/access";
import { trackUpgradePrompt } from "@/lib/analytics/events";
import { buyPro, loadProOffers, restorePro, type ProOffer } from "@/lib/native/purchases";
import { ds } from "@/lib/ui/classes";

type Props = {
  userId: string;
  plan: Plan;
  /** Who bills a paying account; "apple" means it was bought here. */
  store: "stripe" | "apple" | null;
  trialDaysLeft: number | null;
  /** A paid subscription ended, rather than a trial running out. */
  lapsed: boolean;
};

const PRO_FEATURES = [
  "AI week plans built around your targets",
  "Vitamins and minerals for the week, not just macros",
  "Unlimited recipes",
  "Week planner and grocery lists",
];

/** Where Apple lets people manage or cancel a subscription. */
const MANAGE_URL = "https://apps.apple.com/account/subscriptions";

function heading(plan: Plan, trialDaysLeft: number | null, lapsed: boolean): { title: string; subtitle: string } {
  if (plan === "trial") {
    const n = trialDaysLeft ?? 1;
    return {
      title: "Keep Pro after your trial",
      subtitle: `${n} ${n === 1 ? "day" : "days"} left of your free ${TRIAL_DAYS}-day trial.`,
    };
  }
  if (plan === "expired") {
    return lapsed
      ? { title: "BiteSync Pro", subtitle: "Your Pro subscription has ended. Everything you made is still here." }
      : { title: "BiteSync Pro", subtitle: `Your ${TRIAL_DAYS}-day trial has ended. Everything you made is still here.` };
  }
  return { title: "BiteSync Pro", subtitle: "Plan every week to your targets." };
}

/**
 * /billing inside the iPhone app once in-app purchase is set up: Pro as an
 * App Store subscription. Prices are Apple's own for the buyer's country, and
 * the wording Apple requires for auto-renewing subscriptions (price, period,
 * renewal, terms and privacy links) is on the screen before the purchase.
 */
export function NativePaywall({ userId, plan, store, trialDaysLeft, lapsed }: Props) {
  const router = useRouter();
  const [offers, setOffers] = useState<ProOffer[] | null>(null);
  const [selected, setSelected] = useState<"month" | "year">("year");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isPro = plan === "pro";

  const load = useCallback(() => {
    setError(null);
    loadProOffers(userId)
      .then((found) => {
        setOffers(found);
        if (found.length && !found.some((o) => o.period === "year")) setSelected(found[0]!.period);
      })
      .catch(() => {
        setOffers([]);
        setError("Couldn't load the subscription options. Check your connection and try again.");
      });
  }, [userId]);

  useEffect(() => {
    if (isPro) return;
    trackUpgradePrompt("app_paywall", "viewed");
    load();
  }, [isPro, load]);

  /** Asks the server what Apple says this account has, then shows it. */
  async function confirmWithServer(whenNothing: string) {
    const result = await syncApplePurchase();
    if ("error" in result) {
      setError(result.error);
    } else if (result.pro) {
      router.refresh();
    } else {
      setNotice(whenNothing);
    }
  }

  function subscribe() {
    const offer = offers?.find((o) => o.period === selected);
    if (!offer) return;
    setError(null);
    setNotice(null);
    trackUpgradePrompt("app_paywall", "clicked");
    startTransition(async () => {
      try {
        if ((await buyPro(userId, offer.pkg)) === "cancelled") return;
        await confirmWithServer("Your purchase went through, but it isn't showing yet. Tap Restore purchases in a minute.");
      } catch {
        setError("The purchase didn't go through. You haven't been charged. Please try again.");
      }
    });
  }

  function restore() {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      try {
        await restorePro(userId);
        await confirmWithServer("No BiteSync Pro subscription was found for this Apple Account.");
      } catch {
        setError("Couldn't restore purchases. Please try again.");
      }
    });
  }

  if (isPro) {
    return (
      <div className={ds.pageContent}>
        <header className={ds.gradientHeader}>
          <span className={ds.kicker}>YOUR PLAN</span>
          <h1 className={`mb-1.5 ${ds.pageTitle}`}>BiteSync Pro</h1>
          <p className={ds.pageSubtitle}>Every Pro feature is unlocked.</p>
        </header>
        <section className={`${ds.mobileGutter} mx-auto max-w-2xl`}>
          <div className={`${ds.card} space-y-3 p-6`}>
            <p className="font-display text-base font-extrabold text-[var(--text-primary)]">Pro is active</p>
            {store === "apple" ? (
              <>
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                  Apple bills this subscription. It renews automatically until you cancel, which you can do any time in
                  your Apple Account.
                </p>
                <a href={MANAGE_URL} className={`${ds.secondaryBtn} flex w-full items-center justify-center`}>
                  Manage subscription
                </a>
              </>
            ) : (
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                Your Pro access wasn&apos;t bought in this app, so there&apos;s nothing to manage here.
              </p>
            )}
          </div>
        </section>
      </div>
    );
  }

  const copy = heading(plan, trialDaysLeft, lapsed);
  const chosen = offers?.find((o) => o.period === selected) ?? null;

  return (
    <div className={ds.pageContent}>
      <header className={ds.gradientHeader}>
        <span className={ds.kicker}>YOUR PLAN</span>
        <h1 className={`mb-1.5 ${ds.pageTitle}`}>{copy.title}</h1>
        <p className={ds.pageSubtitle}>{copy.subtitle}</p>
      </header>
      <section className={`${ds.mobileGutter} mx-auto max-w-2xl space-y-4`}>
        <div className={`${ds.card} p-6`}>
          <ul className="space-y-2.5">
            {PRO_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm text-[var(--text-primary)]">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-primary)]" aria-hidden />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {offers === null ? (
          <p className="text-center text-sm text-[var(--text-muted)]">Loading subscription options…</p>
        ) : offers.length ? (
          <div role="radiogroup" aria-label="Choose a subscription" className="space-y-2.5">
            {offers.map((offer) => {
              const active = offer.period === selected;
              return (
                <button
                  key={offer.period}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSelected(offer.period)}
                  className={`flex w-full items-center justify-between gap-3 rounded-2xl border-2 bg-[var(--surface-card)] px-4 py-3.5 text-left ${
                    active ? "border-[var(--brand-primary)]" : "border-[var(--border-default)]"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-[var(--text-primary)]">
                      BiteSync Pro {offer.period === "year" ? "Yearly" : "Monthly"}
                    </span>
                    {offer.perMonth ? (
                      <span className="block text-xs text-[var(--text-muted)]">Works out to {offer.perMonth} a month</span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-sm font-bold text-[var(--text-primary)]">
                    {offer.price}
                    <span className="font-medium text-[var(--text-muted)]"> / {offer.period}</span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}

        {error ? <p className={`text-sm ${ds.errorText}`}>{error}</p> : null}
        {notice ? <p className="text-sm text-[var(--text-secondary)]">{notice}</p> : null}

        {chosen ? (
          <button type="button" onClick={subscribe} disabled={isPending} className={`${ds.primaryBtn} w-full disabled:opacity-70`}>
            {isPending ? "One moment…" : `Subscribe for ${chosen.price} a ${chosen.period}`}
          </button>
        ) : offers !== null && !offers.length ? (
          <button type="button" onClick={load} className={`${ds.secondaryBtn} w-full`}>
            Try again
          </button>
        ) : null}

        <button
          type="button"
          onClick={restore}
          disabled={isPending}
          className="w-full py-2 text-center text-sm font-medium text-[var(--text-link)] disabled:opacity-60"
        >
          Restore purchases
        </button>

        <p className="text-xs leading-relaxed text-[var(--text-muted)]">
          {chosen
            ? `BiteSync Pro ${chosen.period === "year" ? "Yearly" : "Monthly"} costs ${chosen.price} a ${chosen.period}. `
            : ""}
          Payment is charged to your Apple Account when you confirm. The subscription renews automatically at the same
          price until you cancel, which you can do in your Apple Account settings at least 24 hours before it renews.
          {plan === "trial" ? " Subscribing ends your free trial: the paid subscription starts today." : ""}{" "}
          <Link href="/terms" className="underline">
            Terms of use
          </Link>{" "}
          ·{" "}
          <Link href="/privacy" className="underline">
            Privacy policy
          </Link>
        </p>
      </section>
    </div>
  );
}
