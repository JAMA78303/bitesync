import Link from "next/link";
import { Lock, Shield } from "lucide-react";

type Variant = "hero" | "section" | "cta";

type Props = {
  variant?: Variant;
};

/** Plain-language trust copy — keep aligned with app/privacy/page.tsx. */
export function LandingTrustSignals({ variant = "section" }: Props) {
  if (variant === "hero") {
    return (
      <div className="mt-5 space-y-2">
        <p className="inline-flex items-center justify-center gap-2 text-sm text-[var(--text-on-brand-muted)]">
          <Lock className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
          Your data is private — we never sell it, no ads, ever.
        </p>
        <p className="text-xs text-[var(--text-on-brand-subtle)]">
          <Link href="/privacy" className="font-medium underline underline-offset-2 hover:text-[var(--text-on-brand)]">
            Read our privacy policy
          </Link>
          {" · "}
          Delete your account any time from Settings
        </p>
      </div>
    );
  }

  if (variant === "cta") {
    return (
      <p className="mt-5 text-xs text-[var(--text-on-brand-subtle)]">
        <Lock className="mr-1 inline h-3.5 w-3.5 opacity-90" aria-hidden />
        Private by default — no ads, data never sold.{" "}
        <Link href="/privacy" className="font-medium underline underline-offset-2 hover:text-[var(--text-on-brand)]">
          Privacy policy
        </Link>
      </p>
    );
  }

  return (
    <section id="privacy-trust" className="scroll-mt-24 border-y border-[var(--border-subtle)] bg-[var(--surface-muted)] py-14 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-brand-subtle)]">
          <Shield className="h-6 w-6 text-[var(--brand-primary)]" aria-hidden />
        </span>
        <h2 className="mb-3 text-xl font-bold text-[var(--text-primary)] sm:text-2xl">Privacy &amp; security</h2>
        <div className="space-y-3 text-sm leading-relaxed text-[var(--text-secondary)]">
          <p>
            We collect only what we need to plan your meals — email, profile stats you enter, recipes, and meal
            plans. Dietary preferences are used to personalise your experience, not for advertising.
          </p>
          <p>We do not sell your data or share it with advertisers. Payments are handled by Stripe; we never store card numbers.</p>
          <p>
            Your account and data can be deleted any time from{" "}
            <span className="font-medium text-[var(--text-primary)]">Settings → Delete account</span>.
          </p>
          <p className="text-[var(--text-muted)]">
            Built on{" "}
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[var(--text-link)] hover:underline"
            >
              Supabase
            </a>{" "}
            for authentication and storage — the same infrastructure used by thousands of apps worldwide.
          </p>
        </div>
        <Link
          href="/privacy"
          className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-[var(--text-link)] hover:underline"
        >
          Full privacy policy
        </Link>
      </div>
    </section>
  );
}
