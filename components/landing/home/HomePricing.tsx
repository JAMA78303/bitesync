"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";
import { TRIAL_AI_PLAN_CAP, TRIAL_AI_RECIPE_CAP, TRIAL_DAYS } from "@/lib/billing/access";
import {
  FREE_PRICE,
  PRO_ANNUAL_MONTHLY_EQUIVALENT,
  PRO_ANNUAL_PRICE,
  PRO_MONTHLY_PRICE,
} from "@/lib/stripe/pricing";

// Only what the product enforces (lib/billing/access.ts). The trial is Pro
// with two AI caps, needs no card, and simply ends: nothing is deleted, but
// planning new weeks and adding recipes need Pro after that.
const TRIAL_FEATURES = [
  "Everything in Pro",
  `Up to ${TRIAL_AI_PLAN_CAP} AI weekly plans`,
  `Up to ${TRIAL_AI_RECIPE_CAP} AI-written recipes`,
  "No card needed",
  "Nothing to cancel — it ends on its own",
  "Your recipes and plans stay viewable afterwards",
] as const;

const PRO_FEATURES = [
  "AI weekly meal plans",
  "Unlimited recipes",
  "AI-written recipes",
  "All macros + micronutrient analysis",
  "Planner, grocery lists & recipe import",
  "Priority support",
] as const;

function Features({ items }: { items: readonly string[] }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item}>
          <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function HomePricing() {
  const [yearly, setYearly] = useState(false);

  return (
    <div className="wrap pricing">
      <div className="lp-reveal">
        <p className="kicker">Pricing</p>
        <h2 className="h2">Try Pro free for {TRIAL_DAYS} days. Keep it if it earns it.</h2>
        <p className="body" style={{ marginTop: 16 }}>
          Every new account starts with {TRIAL_DAYS} days of BiteSync Pro, with no card needed: AI weekly plans,
          unlimited recipes and the full micronutrient picture. Nothing is charged unless you choose to upgrade.
        </p>
        <div className="bill-toggle" role="group" aria-label="Billing period">
          <button type="button" aria-pressed={!yearly} onClick={() => setYearly(false)}>
            Monthly
          </button>
          <button type="button" aria-pressed={yearly} onClick={() => setYearly(true)}>
            Yearly <span className="save">SAVE 30%</span>
          </button>
        </div>
      </div>
      <div className="prices lp-reveal">
        <article className="price">
          <h3>Free trial</h3>
          <div className="amount">
            {FREE_PRICE}
            <small> for {TRIAL_DAYS} days</small>
          </div>
          <div className="sub">
            Then {PRO_MONTHLY_PRICE}/month or {PRO_ANNUAL_PRICE}/year if you upgrade
          </div>
          <Features items={TRIAL_FEATURES} />
          <Link className="btn btn-outline" href="/signup">
            Start free trial
          </Link>
          <p className="renew">After {TRIAL_DAYS} days, planning new weeks and adding recipes need Pro.</p>
        </article>
        <article className="price price--pro">
          <span className="tag">Recommended</span>
          <h3>Pro</h3>
          <div className="amount" aria-live="polite">
            {yearly ? PRO_ANNUAL_PRICE : PRO_MONTHLY_PRICE}
            <small>{yearly ? "/year" : "/month"}</small>
          </div>
          <div className="sub">
            {yearly
              ? `Works out to ${PRO_ANNUAL_MONTHLY_EQUIVALENT}/month`
              : `or ${PRO_ANNUAL_PRICE}/year — works out to ${PRO_ANNUAL_MONTHLY_EQUIVALENT}/mo`}
          </div>
          <Features items={PRO_FEATURES} />
          <Link className="btn btn-primary" href="/signup">
            Try Pro free for {TRIAL_DAYS} days
          </Link>
          <p className="renew">Renews automatically until you cancel. Cancel anytime.</p>
        </article>
      </div>
    </div>
  );
}
