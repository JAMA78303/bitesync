import Link from "next/link";
import { Logo } from "@/components/shared/Logo";

export const metadata = {
  title: "Terms of service — BiteSync",
  description: "Terms and conditions for using BiteSync.",
};

const SECTIONS = [
  {
    title: "Agreement",
    body: [
      "By creating an account or using BiteSync, you agree to these terms. If you do not agree, do not use the service.",
    ],
  },
  {
    title: "The service",
    body: [
      "BiteSync helps you plan meals, track nutrition, and build grocery lists. Features may change over time. Some features require a paid subscription.",
    ],
  },
  {
    title: "Your account",
    body: [
      "You are responsible for keeping your login credentials secure and for activity under your account.",
      "You must provide accurate information and be at least 16 years old to use the service.",
      "You may delete your account at any time from Settings. Deletion is permanent and removes your recipes, meal plans, and profile data from our systems.",
    ],
  },
  {
    title: "Subscriptions and billing",
    body: [
      "Paid plans are billed through Stripe. Prices and billing intervals are shown at checkout.",
      "You can manage or cancel your subscription from the billing page. Cancellation stops future charges; access continues until the end of the current billing period unless stated otherwise.",
    ],
  },
  {
    title: "Acceptable use",
    body: [
      "Do not misuse the service, attempt to access others’ accounts, scrape or overload our systems, or use BiteSync for unlawful purposes.",
      "You retain ownership of content you create (recipes, plans). You grant us a licence to store and process it solely to operate the service.",
    ],
  },
  {
    title: "Health disclaimer",
    body: [
      "BiteSync provides general nutrition and meal-planning tools only. It is not medical advice, diagnosis, or treatment.",
      "Calorie and macro targets are estimates based on information you provide. Individual needs vary. Consult a qualified health professional before making significant dietary changes, especially if you have a medical condition, are pregnant, or take medication.",
      "We do not guarantee any particular health or weight outcome.",
    ],
  },
  {
    title: "Disclaimer of warranties",
    body: [
      "The service is provided “as is” without warranties of any kind, to the fullest extent permitted by law.",
    ],
  },
  {
    title: "Limitation of liability",
    body: [
      "To the fullest extent permitted by law, BiteSync is not liable for indirect, incidental, or consequential damages arising from your use of the service.",
    ],
  },
  {
    title: "Changes and contact",
    body: [
      "We may update these terms. Material changes will be reflected by updating the date below. Continued use after changes constitutes acceptance.",
      "Questions: hello@bitesync.io",
    ],
  },
] as const;

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--surface-card)]">
      <header className="border-b border-[var(--border-subtle)] px-4 py-4">
        <Logo size="sm" href="/" />
      </header>
      <article className="mx-auto max-w-2xl px-4 py-12">
        <p className="text-sm font-medium text-[var(--brand-primary)]">Legal</p>
        <h1 className="mt-2 text-3xl font-bold text-[var(--text-primary)]">Terms of service</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Last updated: 13 June 2026</p>
        <div className="mt-10 space-y-8">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">{section.title}</h2>
              <div className="mt-3 space-y-3 text-base leading-relaxed text-[var(--text-secondary)]">
                {section.body.map((paragraph) => (
                  <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
        <p className="mt-10">
          <Link href="/privacy" className="text-sm font-medium text-[var(--brand-primary)] hover:underline">
            Privacy policy →
          </Link>
        </p>
        <p className="mt-4">
          <Link href="/" className="text-sm text-[var(--text-muted)] hover:text-[var(--brand-primary)]">
            ← Back to home
          </Link>
        </p>
      </article>
    </div>
  );
}
