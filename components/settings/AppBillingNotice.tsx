import { Check, Sparkles } from "lucide-react";
import { ds } from "@/lib/ui/classes";
import { TRIAL_DAYS, type Plan } from "@/lib/billing/access";

type Props = {
  plan: Plan;
  trialDaysLeft: number | null;
};

const PRO_SUMMARY = "AI week plans, unlimited recipes and the full vitamin and mineral check";

function copyFor(plan: Plan, trialDaysLeft: number | null) {
  switch (plan) {
    case "pro":
      return {
        title: "BiteSync Pro",
        subtitle: "Every Pro feature is unlocked.",
        heading: "Pro is active",
        body: `${PRO_SUMMARY} are all on.`,
      };
    case "trial": {
      const n = trialDaysLeft ?? 1;
      return {
        title: "Pro trial",
        subtitle: `${n} ${n === 1 ? "day" : "days"} left of your free ${TRIAL_DAYS}-day trial.`,
        heading: "Every Pro feature is on",
        body: `${PRO_SUMMARY} are on until your trial ends. Pro isn't available to buy in the app yet.`,
      };
    }
    case "expired":
      return {
        title: "Your plan",
        subtitle: `Your ${TRIAL_DAYS}-day Pro trial has ended.`,
        heading: "Your recipes and plans are still here",
        body: "You can view your recipes, plans and grocery lists, tick off meals and shopping, and edit your recipes. Planning new weeks and adding recipes need Pro, which isn't available to buy in the app yet.",
      };
    default:
      return {
        title: "Your plan",
        subtitle: "You're on the free plan.",
        heading: "About Pro",
        body: `${PRO_SUMMARY} are part of Pro. Pro isn't available to buy in the app yet.`,
      };
  }
}

/**
 * /billing inside the iPhone app. Apple doesn't allow web checkout (Stripe) in
 * an iOS app, so this page has no prices, buttons or links to buy elsewhere,
 * and doesn't offer the free plan's trial either. Pro will be sold here
 * through Apple's in-app purchase.
 */
export function AppBillingNotice({ plan, trialDaysLeft }: Props) {
  const copy = copyFor(plan, trialDaysLeft);
  const hasPro = plan === "pro" || plan === "trial";

  return (
    <div className={ds.pageContent}>
      <header className={ds.gradientHeader}>
        <span className={ds.kicker}>YOUR PLAN</span>
        <h1 className={`mb-1.5 ${ds.pageTitle}`}>{copy.title}</h1>
        <p className={ds.pageSubtitle}>{copy.subtitle}</p>
      </header>
      <section className={`${ds.mobileGutter} mx-auto max-w-2xl`}>
        <div className={`${ds.card} p-6`}>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--green-deep)] text-[var(--accent-lime)]">
              {hasPro ? <Check className="h-6 w-6" aria-hidden /> : <Sparkles className="h-6 w-6" aria-hidden />}
            </div>
            <div className="min-w-0 space-y-1.5">
              <p className="font-display text-base font-extrabold text-[var(--text-primary)]">{copy.heading}</p>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{copy.body}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
