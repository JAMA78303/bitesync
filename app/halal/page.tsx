import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { after } from "next/server";
import { HalalWaitlistForm } from "@/components/halal/HalalWaitlistForm";
import { Logo } from "@/components/shared/Logo";
import { FOUNDER, FOUNDER_BYLINE } from "@/lib/founder";
import { ds } from "@/lib/ui/classes";
import { cleanCountry, cleanRef } from "@/lib/waitlist/halal";
import { recordHalalVisit } from "@/lib/waitlist/halalStore";

const BASE = "https://bitesync.io";
const PATH = "/halal";

export const metadata: Metadata = {
  title: "Halal macros for Muslims who train",
  description:
    "Coming to BiteSync: snap a meal to see its protein, halal ingredient checks explained clearly, and Ramadan plans that keep your gains. Built by a dietitian. Join the waitlist.",
  alternates: { canonical: `${BASE}${PATH}` },
  openGraph: {
    title: "Halal macros for Muslims who train",
    description: "Snap your meal, hit your protein, and know what's in your food. Every day, and every fast.",
    url: `${BASE}${PATH}`,
  },
};

const FEATURES = [
  "Snap your meal and see calories and protein in seconds",
  "Ingredients to check, explained clearly: gelatine, alcohol, E120 and more",
  "Weekly halal meal plans and one grocery list",
  "Ramadan mode: suhoor and iftar plans that keep your gains, plus Mondays, Thursdays and other fasts",
];

export default async function HalalPage({ searchParams }: { searchParams: Promise<{ ref?: string | string[] }> }) {
  const raw = (await searchParams).ref;
  const ref = cleanRef(Array.isArray(raw) ? raw[0] : raw);
  const country = cleanCountry((await headers()).get("x-vercel-ip-country"));
  after(() => recordHalalVisit(ref, country));

  return (
    <div className="min-h-screen bg-[var(--surface-page)]">
      <header className="border-b border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Logo size="sm" href="/" />
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-10 sm:py-14">
        <p className={ds.sectionKicker}>Coming to BiteSync</p>
        <h1 className="font-display text-3xl font-extrabold tracking-[-0.03em] text-balance text-[var(--text-primary)] sm:text-4xl">
          Halal macros for Muslims who train.
        </h1>
        <p className="mt-3 text-base leading-relaxed text-[var(--text-secondary)]">
          Snap your meal, hit your protein, and know what&apos;s in your food. Every day, and every fast.
        </p>

        <ul className="mt-6 space-y-3">
          {FEATURES.map((f) => (
            <li key={f} className="flex gap-3 text-base leading-relaxed text-[var(--text-secondary)]">
              <span aria-hidden className="font-bold text-[var(--brand-primary)]">
                ✓
              </span>
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <div className="relative mt-8">
          <HalalWaitlistForm refCode={ref} />
        </div>

        <p className="mt-8 text-sm text-[var(--text-muted)]">
          Built by{" "}
          <Link href={FOUNDER.path} className="font-medium text-[var(--text-link)] hover:underline">
            {FOUNDER_BYLINE}
          </Link>
          . General nutrition guidance, not medical advice. If you have a health condition, are pregnant or take
          medication, speak to your GP before changing your diet or fasting. Halal flags point out ingredients to
          check; they aren&apos;t a religious ruling.
        </p>
      </main>
    </div>
  );
}
