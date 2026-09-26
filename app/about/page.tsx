import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/shared/Logo";
import { JsonLd } from "@/components/shared/JsonLd";
import { aboutPageSchema } from "@/lib/seo/structuredData";
import { FOUNDER, FOUNDER_BYLINE } from "@/lib/founder";

export const metadata: Metadata = {
  title: "Why I built BiteSync",
  description: `${FOUNDER_BYLINE}, on why BiteSync exists: people know the goal they want to reach, but not the steps that get them there. Planning meals in advance gives a goal structure.`,
  alternates: { canonical: FOUNDER.path },
};

/**
 * The founder's note. Written from the founder's own account of why they
 * built it; every product claim here is one the app delivers today.
 */
export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--surface-card)]">
      <JsonLd data={aboutPageSchema()} />
      <header className="border-b border-[var(--border-subtle)] px-4 py-4">
        <Logo size="sm" href="/" />
      </header>
      <article className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <p className="text-sm font-medium text-[var(--brand-primary)]">A note from the founder</p>
        <h1 className="mt-2 text-3xl font-bold text-balance text-[var(--text-primary)] sm:text-4xl">
          Why I built BiteSync
        </h1>

        <div className="mt-8 space-y-5 text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg sm:leading-relaxed">
          <p>
            As a dietitian, there&rsquo;s one problem I see more than any other. People know the goal
            they want to reach &mdash; to lose weight, to build muscle, or simply to eat better &mdash;
            but not the steps that get them there.
          </p>
          <p>
            A target on its own doesn&rsquo;t tell you what to eat on Tuesday. The gap between
            &ldquo;I want to hit my protein&rdquo; and a week of meals that actually does it is where
            most people get stuck.
          </p>
          <p>
            Planning meals in advance closes that gap. When the week is planned, you can see your
            intake before you eat it, track it as you go, and make changes while there&rsquo;s still
            time. It gives your goal a structure, rather than leaving it to good intentions.
          </p>
          <p>
            The evidence points the same way. In a large study of 40,554 adults, people who planned
            their meals ahead ate a more varied, better-quality diet.{" "}
            <Link href="/blog/does-meal-planning-help" className="font-medium text-[var(--text-link)] underline underline-offset-2">
              Here&rsquo;s what that study found
            </Link>
            .
          </p>
          <p>
            That&rsquo;s why I built BiteSync. It works out your calorie and protein targets, plans a
            week of meals from your own recipes to hit them, and turns that week into one shopping
            list &mdash; with the nutrition calculated from UK food composition data, not guessed.
          </p>
          <p>It&rsquo;s the structure I want everyone working towards a goal to have.</p>
        </div>

        <p className="mt-10 border-t border-[var(--border-subtle)] pt-6 text-base font-semibold text-[var(--text-primary)]">
          {FOUNDER.name}
          <span className="block text-sm font-normal text-[var(--text-muted)]">
            {FOUNDER.credential}, founder of BiteSync
          </span>
        </p>

        <Link
          href="/signup"
          className="mt-10 inline-flex rounded-xl bg-[var(--btn-primary-bg)] px-5 py-3 text-sm font-semibold text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)]"
        >
          Start planning for free
        </Link>
      </article>
    </div>
  );
}
