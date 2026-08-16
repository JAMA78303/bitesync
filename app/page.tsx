import Link from "next/link";
import {
  Check,
  ChevronRight,
  MapPin,
  Shield,
  Utensils,
} from "lucide-react";
import dynamic from "next/dynamic";
import { Logo } from "@/components/shared/Logo";
import { Reveal } from "@/components/landing/Reveal";
import { LandingMobileNav } from "@/components/landing/LandingMobileNav";
import { LandingTrustSignals } from "@/components/landing/LandingTrustSignals";

const LandingFeaturePreviews = dynamic(
  () =>
    import("@/components/landing/LandingFeaturePreviews").then((m) => ({
      default: m.LandingFeaturePreviews,
    })),
  {
    loading: () => (
      <div className="mx-auto h-96 max-w-6xl animate-pulse rounded-2xl bg-[var(--surface-muted)]" aria-hidden />
    ),
  },
);

const LandingDemoFlow = dynamic(
  () => import("@/components/landing/LandingDemoFlow").then((m) => ({ default: m.LandingDemoFlow })),
  {
    loading: () => (
      <div className="mx-auto h-80 max-w-6xl animate-pulse rounded-2xl bg-[var(--surface-muted)]" aria-hidden />
    ),
  },
);

const LandingFaq = dynamic(
  () => import("@/components/landing/LandingFaq").then((m) => ({ default: m.LandingFaq })),
  { loading: () => <div className="h-48" aria-hidden /> },
);

const MockPlanner = dynamic(
  () =>
    import("@/components/landing/LandingPhoneMockups").then((m) => ({
      default: m.MockPlanner,
    })),
  {
    loading: () => (
      <div className="relative z-10 hidden h-[320px] w-[280px] sm:block" aria-hidden />
    ),
  },
);

const NAV_LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#privacy-trust", label: "Privacy" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
  { href: "#blog", label: "Blog" },
] as const;

const FREE_FEATURES = [
  "Up to 10 recipes",
  "Recipe import from URL",
  "Weekly meal planner",
  "Grocery list generation",
  "Today dashboard",
  "Basic macro tracking",
  "2 weeks of history",
] as const;

const PRO_FEATURES = [
  "Unlimited recipes",
  "Full nutrition (macros + micros)",
  "TDEE calculator + targets",
  "AI weekly meal plans",
  "Unlimited history",
  "Priority support",
] as const;

const BLOG_POSTS = [
  {
    slug: "thermic-effect-of-protein",
    category: "Nutrition science",
    title: "Why protein keeps you fuller for longer",
    desc: "The thermic effect of food — and how to use it when you plan your week in BiteSync.",
    readTime: "4 min read",
  },
  {
    slug: "meal-planning-reduce-food-waste",
    category: "Sustainable shopping",
    title: "How meal planning cuts food waste",
    desc: "Shop once with a list built from your plan — fewer impulse buys and less in the bin.",
    readTime: "5 min read",
  },
] as const;

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--surface-page)]">
      <nav className="sticky top-0 z-50 border-b border-[var(--border-subtle)]/80 bg-[var(--surface-overlay)]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Logo size="sm" href="/" />
          <div className="hidden items-center gap-6 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-link)]"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] sm:block"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-[var(--btn-primary-bg)] px-4 py-2 text-sm font-medium text-[var(--btn-primary-text)] transition-colors hover:bg-[var(--btn-primary-hover)]"
            >
              Get started free
            </Link>
            <LandingMobileNav links={NAV_LINKS} />
          </div>
        </div>
      </nav>

      <main id="main-content">
        <header className="relative overflow-hidden bg-[image:var(--hero-gradient)] px-4 pt-14 pb-10 text-center text-[var(--text-on-brand)] sm:pt-20 sm:pb-28">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
              backgroundSize: "200px 200px",
            }}
          />
          <div
            aria-hidden
            className="hero-glow pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-[var(--brand-sage-accent)]/25 blur-3xl"
          />
          <div
            aria-hidden
            className="hero-glow pointer-events-none absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-[var(--header-stat-accent)]/15 blur-3xl"
            style={{ animationDelay: "-7s" }}
          />
          <div className="relative z-10 mx-auto max-w-3xl">
            <h1 className="mb-4 text-4xl leading-tight font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Your week of meals, planned to your macros.
            </h1>
            <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-[var(--text-on-brand-muted)] sm:text-lg">
              Plan your week, hit your protein, calorie, and micronutrient targets, and get one grocery
              list — automatically.
            </p>
            <Link
              href="/signup"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--surface-card)] px-6 py-3 text-sm font-semibold text-[var(--text-link)] shadow-lg transition-all hover:-translate-y-0.5 hover:bg-[var(--surface-brand-subtle)] hover:shadow-xl sm:w-auto"
            >
              Start planning for free
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
            <LandingTrustSignals variant="hero" />
            <p className="mt-4 text-xs text-[var(--text-on-brand-subtle)]">
              Evidence-based nutrition targets · Free to start — no card needed
            </p>
            <div className="mt-10 hidden justify-center sm:flex">
              <div className="relative z-10 drop-shadow-2xl">
                <MockPlanner />
              </div>
            </div>
          </div>
        </header>

        <section id="how-it-works" className="scroll-mt-24 bg-[var(--surface-muted)] py-16 sm:py-20">
          <Reveal>
            <LandingDemoFlow />
          </Reveal>
        </section>

        <section id="features" className="scroll-mt-24 bg-[var(--surface-card)] py-16 sm:py-20">
          <Reveal>
            <LandingFeaturePreviews />
          </Reveal>
        </section>

        <section id="pricing" className="scroll-mt-24 bg-[var(--surface-muted)] py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <Reveal>
              <div className="mb-12 text-center">
                <h2 className="mb-3 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
                  Simple, honest pricing
                </h2>
                <p className="text-sm text-[var(--text-muted)]">Start free. Upgrade when you want the full picture.</p>
              </div>
            </Reveal>
            <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
              <article className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6">
                <h3 className="mb-1 font-bold text-[var(--text-primary)]">Free</h3>
                <p className="text-3xl font-bold text-[var(--text-primary)]">
                  £0 <span className="text-sm font-normal text-[var(--text-muted)]">forever</span>
                </p>
                <ul className="mb-8 mt-6 space-y-3">
                  {FREE_FEATURES.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <Check className="h-4 w-4 shrink-0 text-[var(--text-link)]" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className="block w-full rounded-xl border border-[var(--border-default)] py-2.5 text-center text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
                >
                  Get started free
                </Link>
              </article>
              <article className="relative rounded-2xl bg-[var(--brand-primary)] p-6 text-[var(--text-on-brand)] shadow-lg">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-900">
                  MOST POPULAR
                </span>
                <h3 className="mb-1 font-bold">Pro</h3>
                <p className="text-3xl font-bold">
                  £6.99<span className="text-base font-normal text-[var(--text-on-brand-muted)]">/month</span>
                </p>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span className="rounded-full bg-amber-300 px-2 py-0.5 text-2xs font-semibold text-amber-950">
                    SAVE 30%
                  </span>
                  <span className="text-xs text-[var(--text-on-brand-muted)]">£59/year · works out to £4.92/mo</span>
                </div>
                <ul className="mb-8 mt-6 space-y-3">
                  {PRO_FEATURES.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-[var(--text-on-brand)]">
                      <Check className="h-4 w-4 shrink-0 text-[var(--text-on-brand-muted)]" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className="block w-full rounded-xl bg-[var(--surface-card)] py-2.5 text-center text-sm font-semibold text-[var(--text-link)] hover:bg-[var(--surface-brand-subtle)]"
                >
                  Upgrade to Pro
                </Link>
              </article>
            </div>
          </div>
        </section>

        <LandingTrustSignals />

        <section className="border-y border-[var(--border-subtle)] bg-[var(--surface-card)] py-12">
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 px-4 sm:grid-cols-3">
            <article className="text-center">
              <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-brand-subtle)]">
                <Shield className="h-6 w-6 text-[var(--brand-primary)]" aria-hidden />
              </span>
              <h3 className="mb-1 text-sm font-semibold text-[var(--text-primary)]">Evidence-based targets</h3>
              <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                TDEE and macro goals grounded in established nutrition science.
              </p>
            </article>
            <article className="text-center">
              <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-brand-subtle)]">
                <MapPin className="h-6 w-6 text-[var(--brand-primary)]" aria-hidden />
              </span>
              <h3 className="mb-1 text-sm font-semibold text-[var(--text-primary)]">Built in the UK</h3>
              <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                GBP pricing and nutrition data tuned for British shoppers.
              </p>
            </article>
            <article className="text-center">
              <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-brand-subtle)]">
                <Utensils className="h-6 w-6 text-[var(--brand-primary)]" aria-hidden />
              </span>
              <h3 className="mb-1 text-sm font-semibold text-[var(--text-primary)]">Your data stays yours</h3>
              <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                Recipes and plans are private to your account. Payments via Stripe.
              </p>
            </article>
          </div>
        </section>

        <LandingFaq />

        <section id="blog" className="scroll-mt-24 bg-[var(--surface-card)] py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">From the BiteSync blog</h2>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Nutrition science and practical planning tips from the BiteSync team.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {BLOG_POSTS.map((post) => (
                <article
                  key={post.slug}
                  className="group flex flex-col rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 transition-shadow hover:shadow-md"
                >
                  <p className="text-xs font-medium text-[var(--text-link)]">{post.category}</p>
                  <h3 className="mt-2 text-base font-semibold text-[var(--text-primary)] group-hover:text-[var(--text-link)]">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--text-muted)]">{post.desc}</p>
                  <p className="mt-4 text-xs text-[var(--text-muted)]">{post.readTime}</p>
                  <Link
                    href="/signup"
                    className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--text-link)] hover:underline"
                  >
                    Try BiteSync free
                    <ChevronRight className="h-3 w-3" aria-hidden />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[image:var(--hero-gradient)] px-4 py-16 text-center text-[var(--text-on-brand)] sm:py-20">
          <div
            aria-hidden
            className="hero-glow pointer-events-none absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-[var(--brand-sage-accent)]/20 blur-3xl"
          />
          <Reveal>
            <div className="relative z-10 mx-auto max-w-2xl">
              <h2 className="mb-4 text-2xl font-bold sm:text-3xl">Hit your macros without the spreadsheet</h2>
              <p className="mb-8 text-sm text-[var(--text-on-brand-muted)] sm:text-base">
                Plan your week, shop once, and track every day — free to start, no credit card required.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--surface-card)] px-8 py-3 text-sm font-semibold text-[var(--text-link)] shadow-lg transition-all hover:-translate-y-0.5 hover:bg-[var(--surface-brand-subtle)] hover:shadow-xl"
              >
                Get started free
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
              <LandingTrustSignals variant="cta" />
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-[var(--border-subtle)] bg-[var(--surface-muted)] py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4">
          <div className="flex w-full flex-col items-center justify-between gap-6 sm:flex-row">
            <Logo size="sm" href="/" />
            <nav className="flex flex-wrap items-center justify-center gap-6">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                >
                  {link.label}
                </a>
              ))}
              <Link href="/login" className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
                Sign in
              </Link>
            </nav>
          </div>
          <p className="text-center text-xs text-[var(--text-muted)]">
            © {new Date().getFullYear()} BiteSync ·{" "}
            <Link href="/privacy" className="font-medium hover:underline">
              Privacy policy
            </Link>
            {" · "}
            <Link href="/terms" className="hover:underline">
              Terms
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
