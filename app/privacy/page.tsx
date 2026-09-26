import Link from "next/link";
import { Logo } from "@/components/shared/Logo";

export const metadata = {
  title: "Privacy policy — BiteSync",
  description: "How BiteSync collects, uses, and protects your personal data.",
};

const SECTIONS = [
  {
    title: "Who we are",
    body: [
      "BiteSync (“we”, “us”) operates the BiteSync meal-planning app and website at bitesync.io.",
      "For privacy questions, contact us at hello@bitesync.io.",
    ],
  },
  {
    title: "What we collect",
    body: [
      "Account information: your email address and authentication credentials when you sign up.",
      "Profile and health-related inputs you choose to provide: body stats (weight, height, age, sex), activity level, nutrition goals, dietary preferences, and any recipes or meal plans you create.",
      "Usage data: how you use the app (e.g. pages visited, features used) to improve the product.",
      "How you heard about BiteSync, if you choose to tell us when you sign up — used only to understand which channels bring people to the app.",
      "Payment information: billing is handled by Stripe. We store Stripe customer and subscription IDs, not full card numbers.",
    ],
  },
  {
    title: "How we use your data",
    body: [
      "To provide meal planning, grocery lists, nutrition tracking, and related features.",
      "To calculate calorie and macro targets from the profile information you enter.",
      "To process subscriptions and send service-related emails.",
      "To improve reliability, security, and product quality.",
    ],
  },
  {
    title: "Processors and storage",
    body: [
      "We use Supabase (database and authentication) and Stripe (payments) as data processors. Your data is stored on servers in regions chosen by those providers.",
      "We do not sell your personal data.",
    ],
  },
  {
    title: "Health information",
    body: [
      "Nutrition targets and dietary preferences are used only to personalise your experience in the app.",
      "BiteSync is not a medical device and does not provide medical advice. See our terms for the full health disclaimer.",
    ],
  },
  {
    title: "Your rights",
    body: [
      "You can update profile and goal settings in the app at any time.",
      "You can delete your account and associated data from Settings → Delete account.",
      "If you are in the UK or EEA, you may have rights to access, rectify, erase, restrict, or port your data, and to object to certain processing. Contact hello@bitesync.io to exercise these rights.",
    ],
  },
  {
    title: "Retention",
    body: [
      "We keep your data while your account is active. When you delete your account, we remove your personal data from our systems, subject to legal or billing record requirements.",
    ],
  },
  {
    title: "Changes",
    body: [
      "We may update this policy from time to time. The “Last updated” date below will change when we do. Continued use after changes means you accept the updated policy.",
    ],
  },
] as const;

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--surface-card)]">
      <header className="border-b border-[var(--border-subtle)] px-4 py-4">
        <Logo size="sm" href="/" />
      </header>
      <article className="mx-auto max-w-2xl px-4 py-12">
        <p className="text-sm font-medium text-[var(--brand-primary)]">Legal</p>
        <h1 className="mt-2 text-3xl font-bold text-[var(--text-primary)]">Privacy policy</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Last updated: 13 June 2026</p>
        <p className="mt-6 text-base leading-relaxed text-[var(--text-secondary)]">
          This policy explains what personal data BiteSync collects, why we collect it, and your choices.
        </p>
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
          <Link href="/terms" className="text-sm font-medium text-[var(--brand-primary)] hover:underline">
            Terms of service →
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
