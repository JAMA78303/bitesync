import { Check, Sparkles } from "lucide-react";
import { ds } from "@/lib/ui/classes";

type Props = {
  isPro: boolean;
};

/**
 * /billing inside the iPhone app. Apple doesn't allow web checkout (Stripe) in
 * an iOS app, so this page has no prices, buttons or links to buy elsewhere.
 * Pro will be sold here through Apple's in-app purchase.
 */
export function AppBillingNotice({ isPro }: Props) {
  return (
    <div className={ds.pageContent}>
      <header className={ds.gradientHeader}>
        <span className={ds.kicker}>YOUR PLAN</span>
        <h1 className={`mb-1.5 ${ds.pageTitle}`}>{isPro ? "BiteSync Pro" : "Your plan"}</h1>
        <p className={ds.pageSubtitle}>{isPro ? "Every Pro feature is unlocked." : "You're on the free plan."}</p>
      </header>
      <section className={`${ds.mobileGutter} mx-auto max-w-2xl`}>
        <div className={`${ds.card} p-6`}>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--green-deep)] text-[var(--accent-lime)]">
              {isPro ? <Check className="h-6 w-6" aria-hidden /> : <Sparkles className="h-6 w-6" aria-hidden />}
            </div>
            <div className="min-w-0 space-y-1.5">
              <p className="font-display text-base font-extrabold text-[var(--text-primary)]">
                {isPro ? "Pro is active" : "Pro is coming to the app"}
              </p>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                {isPro
                  ? "AI week plans, unlimited recipes and the full vitamin and mineral check are all on."
                  : "AI week plans, unlimited recipes and the full vitamin and mineral check. You'll be able to upgrade right here soon."}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
