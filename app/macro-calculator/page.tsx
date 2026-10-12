import type { Metadata } from "next";
import Link from "next/link";
import { MacroCalculator } from "@/components/calculator/MacroCalculator";
import { JsonLd } from "@/components/shared/JsonLd";
import { Logo } from "@/components/shared/Logo";
import { FOUNDER, FOUNDER_BYLINE } from "@/lib/founder";
import { faqPageSchema } from "@/lib/seo/structuredData";
import { ds } from "@/lib/ui/classes";
import { MIN_FAT_G_PER_KG } from "@/lib/utils/nutrition-targets";
import {
  ACTIVITY_OPTIONS,
  GOAL_TDEE_ADJUSTMENT,
  getMinimumCalories,
  PAL,
  PROTEIN_G_PER_KG,
} from "@/lib/utils/tdee";

const BASE = "https://bitesync.io";
const PATH = "/macro-calculator";

export const metadata: Metadata = {
  title: "Macro calculator: daily calories and protein for your goal",
  description:
    "Free macro calculator built by a dietitian. Work out your daily calories, protein, carbs and fat to lose weight, maintain or build muscle. No sign-up, and nothing you enter is saved.",
  alternates: { canonical: `${BASE}${PATH}` },
  openGraph: {
    title: "Free macro calculator, built by a dietitian",
    description: "Your daily calories, protein, carbs and fat for your goal, in seconds.",
    url: `${BASE}${PATH}`,
  },
};

const lossPct = Math.round(Math.abs(GOAL_TDEE_ADJUSTMENT.lose) * 100);
const gainPct = Math.round(GOAL_TDEE_ADJUSTMENT.gain * 100);
const minFemale = getMinimumCalories("female").toLocaleString("en-GB");
const minMale = getMinimumCalories("male").toLocaleString("en-GB");
const proteinValues = Object.values(PROTEIN_G_PER_KG).flatMap((g) => Object.values(g));
const proteinMin = Math.min(...proteinValues).toFixed(1);
const proteinMax = Math.max(...proteinValues).toFixed(1);

/**
 * Shown on the page and used for the FAQPage structured data, so the two can't
 * drift. Every number is read from the same constants the calculator uses.
 */
const CALCULATOR_FAQ = [
  {
    q: "How many calories should I eat to lose weight?",
    a: `This calculator sets your target ${lossPct}% below your maintenance calories, which works out at roughly 0.5–0.75 kg (1–1.5 lb) a week for most people. It never goes below ${minFemale} kcal a day for women or ${minMale} for men, and it won't set a weight-loss target if your BMI is under 18.5.`,
  },
  {
    q: "How much protein do I need a day?",
    a: `It depends on how active you are and on your goal. This calculator uses ${proteinMin}–${proteinMax} g of protein per kg of body weight: towards the lower end if you're mostly sitting down, and the upper end if you train hard most days. Losing weight or building muscle moves you up within your activity level. Above a BMI of 30, protein is based on an adjusted weight so the target stays realistic.`,
  },
  {
    q: "What are maintenance calories?",
    a: "The calories you use in a typical day, also called your TDEE. It's your resting energy use, estimated with the Mifflin-St Jeor equation, multiplied by your activity level. Eat about this much and your weight should stay roughly the same.",
  },
  {
    q: "How accurate is a macro calculator?",
    a: "It's an estimate. Mifflin-St Jeor is one of the most widely used equations, but people vary. Treat the result as a starting point: if your weight isn't moving as you expect after two or three weeks, adjust by a small amount, such as 100–200 kcal a day.",
  },
  {
    q: "Is anything I enter saved?",
    a: "No. The calculation runs in your browser. Nothing you type is sent to BiteSync or stored.",
  },
  {
    q: "Who shouldn't use this calculator?",
    a: "It's for adults aged 16 and over. If you're pregnant or breastfeeding, have kidney disease or another medical condition, or have a history of an eating disorder, speak to your GP or a dietitian instead, because your needs are different.",
  },
  {
    q: "How do I actually hit these numbers every day?",
    a: "Plan ahead. BiteSync works out these same targets for you, plans your week's meals to hit them before you shop, and turns the week into one grocery list. It's free to start.",
  },
] as const;

function calculatorSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "BiteSync Macro Calculator",
    url: `${BASE}${PATH}`,
    description: metadata.description,
    applicationCategory: "HealthApplication",
    operatingSystem: "Any",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: 0, priceCurrency: "GBP" },
    creator: { "@type": "Organization", name: "BiteSync", url: BASE },
  };
}

const activityRows = ACTIVITY_OPTIONS.map((o) => ({
  label: o.label,
  description: o.description,
  multiplier: PAL[o.value],
  maintain: PROTEIN_G_PER_KG[o.value].maintain,
  change: PROTEIN_G_PER_KG[o.value].lose,
}));

export default function MacroCalculatorPage() {
  return (
    <div className="min-h-screen bg-[var(--surface-page)]">
      <JsonLd data={calculatorSchema()} />
      <JsonLd data={faqPageSchema(CALCULATOR_FAQ)} />
      <header className="border-b border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Logo size="sm" href="/" />
          <Link href="/signup" className={`${ds.primaryBtn} px-4 py-2.5`}>
            Start free
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        <p className={ds.sectionKicker}>Free tool</p>
        <h1 className="font-display text-3xl font-extrabold tracking-[-0.03em] text-balance text-[var(--text-primary)] sm:text-4xl">
          Macro calculator
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--text-secondary)]">
          Work out how many calories and how much protein, carbs and fat to eat each day to lose weight, maintain or
          build muscle. It uses the same method as BiteSync&apos;s planner, built by a dietitian. Free, no sign-up, and
          nothing you enter is saved.
        </p>

        <div className="mt-8">
          <MacroCalculator />
        </div>

        <section className="mt-14 max-w-3xl" aria-labelledby="how-calculated">
          <h2 id="how-calculated" className="font-display text-2xl font-extrabold tracking-[-0.02em] text-[var(--text-primary)]">
            How it&apos;s calculated
          </h2>
          <ol className="mt-4 list-decimal space-y-3 pl-6 text-base leading-relaxed text-[var(--text-secondary)]">
            <li>
              <strong className="text-[var(--text-primary)]">Resting energy</strong> with the Mifflin-St Jeor
              equation: 10 × weight (kg) + 6.25 × height (cm) − 5 × age, then +5 for men or −161 for women.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">Maintenance calories</strong>: resting energy × your
              activity level, from {PAL.sedentary} for sedentary to {PAL.extra_active} for extremely active.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">Your goal</strong>: {lossPct}% below maintenance to lose
              weight, or {gainPct}% above to build muscle. A percentage scales with you, unlike a flat 500 kcal.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">Protein</strong> per kg of body weight, by activity and
              goal (table below). Above a BMI of 30 it&apos;s based on an adjusted weight.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">Carbs and fat</strong> share the remaining calories 5:3,
              with at least {MIN_FAT_G_PER_KG} g of fat per kg of body weight. Fibre is set at 30 g a day.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">Safety limits</strong>: never below {minFemale} kcal a
              day for women or {minMale} for men, and no weight-loss target if your BMI is under 18.5.
            </li>
          </ol>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <caption className="mb-2 text-left text-sm text-[var(--text-muted)]">
                Protein, grams per kg of body weight a day
              </caption>
              <thead>
                <tr>
                  <th className="border-b border-[var(--border-default)] px-3 py-2 text-left font-semibold text-[var(--text-primary)]">
                    Activity
                  </th>
                  <th className="border-b border-[var(--border-default)] px-3 py-2 text-left font-semibold text-[var(--text-primary)]">
                    Maintain
                  </th>
                  <th className="border-b border-[var(--border-default)] px-3 py-2 text-left font-semibold text-[var(--text-primary)]">
                    Lose or build
                  </th>
                </tr>
              </thead>
              <tbody>
                {activityRows.map((row) => (
                  <tr key={row.label}>
                    <td className="border-b border-[var(--border-subtle)] px-3 py-2 align-top text-[var(--text-secondary)]">
                      {row.label}
                      <span className="block text-xs text-[var(--text-muted)]">{row.description}</span>
                    </td>
                    <td className="border-b border-[var(--border-subtle)] px-3 py-2 align-top tabular-nums text-[var(--text-secondary)]">
                      {row.maintain.toFixed(1)} g/kg
                    </td>
                    <td className="border-b border-[var(--border-subtle)] px-3 py-2 align-top tabular-nums text-[var(--text-secondary)]">
                      {row.change.toFixed(1)} g/kg
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-14 max-w-3xl" aria-labelledby="calculator-faq">
          <h2 id="calculator-faq" className="font-display text-2xl font-extrabold tracking-[-0.02em] text-[var(--text-primary)]">
            Questions
          </h2>
          <div className="mt-4 divide-y divide-[var(--border-subtle)] rounded-[20px] border border-[var(--border-default)] bg-[var(--surface-card)]">
            {CALCULATOR_FAQ.map((item) => (
              <details key={item.q} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-[var(--text-primary)]">
                  <h3 className="text-base">{item.q}</h3>
                  <span aria-hidden className="text-xl text-[var(--brand-primary)] transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-2 text-base leading-relaxed text-[var(--text-secondary)]">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className={`${ds.card} mt-14 max-w-3xl p-6`}>
          <h2 className="font-display text-xl font-extrabold tracking-[-0.02em] text-[var(--text-primary)]">
            Targets are the easy part
          </h2>
          <p className="mt-2 text-base leading-relaxed text-[var(--text-secondary)]">
            Knowing your numbers doesn&apos;t tell you what to eat on Tuesday. BiteSync plans your week to these
            targets before you shop, gives you one grocery list, and checks your vitamins and minerals across the
            week.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/signup" className={ds.primaryBtn}>
              Plan my week free
            </Link>
            <Link href="/blog/best-meal-planner-apps-macros" className={ds.secondaryBtn}>
              Compare meal planners
            </Link>
          </div>
          <p className="mt-6 text-sm text-[var(--text-muted)]">
            Built by{" "}
            <Link href={FOUNDER.path} className="font-medium text-[var(--text-link)] hover:underline">
              {FOUNDER_BYLINE}
            </Link>
            . For general guidance only, not a substitute for advice from your GP or dietitian.
          </p>
        </section>
      </main>
    </div>
  );
}
