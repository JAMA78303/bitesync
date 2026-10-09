"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";
import {
  FREE_PRICE,
  PRO_ANNUAL_MONTHLY_EQUIVALENT,
  PRO_ANNUAL_PRICE,
  PRO_MONTHLY_PRICE,
} from "@/lib/stripe/pricing";

// Only what the product enforces. Targets moved to Free on 14 September, and
// no history limit exists in the code, so "2 weeks of history" / "Unlimited
// history" described a difference nobody would ever experience.
const FREE_FEATURES = [
  "Personal calorie & protein targets",
  "Weekly meal planner",
  "Calorie & protein tracking",
  "Grocery list generation",
  "Recipe import from URL",
  "Up to 10 recipes",
] as const;

const PRO_FEATURES = [
  "Everything in Free",
  "Unlimited recipes",
  "AI weekly meal plans",
  "AI-written recipes",
  "All macros + micronutrient analysis",
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
        <h2 className="h2">Start free. Upgrade when it earns it.</h2>
        <p className="body" style={{ marginTop: 16 }}>
          Plan by hand and build grocery lists for free. Pro adds AI weekly plans, unlimited recipes and the full
          micronutrient picture.
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
          <h3>Free</h3>
          <div className="amount">{FREE_PRICE}</div>
          <div className="sub">Free forever</div>
          <Features items={FREE_FEATURES} />
          <Link className="btn btn-outline" href="/signup">
            Get started free
          </Link>
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
            Upgrade to Pro
          </Link>
          <p className="renew">Renews automatically until you cancel. Cancel anytime.</p>
        </article>
      </div>
    </div>
  );
}
