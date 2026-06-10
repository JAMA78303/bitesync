import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
 BarChart3,
 BookOpen,
 CalendarDays,
 Check,
 ChevronRight,
 Flame,
 Leaf,
 Shield,
 ShoppingCart,
 Target,
 Zap,
 Utensils,
 Activity,
 Sparkles,
 MapPin,
} from "lucide-react";
import { LandingFaq } from "@/components/landing/LandingFaq";
import { LandingPhoneMockups, MockPlanner } from "@/components/landing/LandingPhoneMockups";
import { Logo } from "@/components/shared/Logo";

const NAV_LINKS = [
 { href:"#how-it-works", label:"How it works" },
 { href:"#features", label:"Features" },
 { href:"#pricing", label:"Pricing" },
 { href:"#faq", label:"FAQ" },
 { href:"#blog", label:"Blog" },
] as const;

const STEPS: { step: string; Icon: LucideIcon; title: string; desc: string }[] = [
 {
 step:"01",
 Icon: CalendarDays,
 title:"Plan",
 desc:"Drop your recipes onto a weekly planner. See calories and protein update as you build each day.",
 },
 {
 step:"02",
 Icon: ShoppingCart,
 title:"Shop",
 desc:"Generate one merged grocery list from your plan. Check items off in the aisle — Tesco, Asda, and Aldi badges included.",
 },
 {
 step:"03",
 Icon: Activity,
 title:"Track",
 desc:"Open Today to see your calorie ring, macro bars, and every meal lined up against your targets.",
 },
];

const FEATURES: { Icon: LucideIcon; title: string; desc: string; isPro?: boolean }[] = [
 {
 Icon: Flame,
 title:"Automatic nutrition",
 desc:"Calories, protein, carbs, fat, and fibre calculated from your ingredients — no manual logging.",
 },
 {
 Icon: Target,
 title:"Personal calorie targets",
 desc:"TDEE-based daily goals from your weight, activity, and whether you want to lose, maintain, or gain.",
 },
 {
 Icon: Activity,
 title:"Today dashboard",
 desc:"A home screen with your calorie ring and macro progress so you always know where the day stands.",
 },
 {
 Icon: CalendarDays,
 title:"Weekly planner",
 desc:"Plan breakfast through snacks across the week. Mobile day strip and rich meal cards.",
 },
 {
 Icon: ShoppingCart,
 title:"Smart grocery list",
 desc:"Merged ingredients, day-scoped lists, and check-off as you shop.",
 },
 {
 Icon: BarChart3,
 title:"Weekly nutrition",
 desc:"Micronutrient analysis against UK reference values on Pro.",
 isPro: true,
 },
 {
 Icon: BookOpen,
 title:"Recipe import",
 desc:"Paste a URL from popular UK recipe sites — ingredients and nutrition in seconds.",
 },
 {
 Icon: Sparkles,
 title:"AI meal planning",
 desc:"Pro users can fill the week from their own recipe library, respecting dietary preferences.",
 isPro: true,
 },
 {
 Icon: Leaf,
 title:"Dietary preferences",
 desc:"Vegetarian, vegan, gluten-free, halal, and more — wired into AI suggestions from onboarding.",
 },
];

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
"Store price estimates",
"Unlimited history",
"Priority support",
] as const;

const BLOG_POSTS = [
 {
 slug:"thermic-effect-of-protein",
 category:"Nutrition science",
 title:"Why protein keeps you fuller for longer",
 desc:"The thermic effect of food — and how to use it when you plan your week in BiteSync.",
 readTime:"4 min read",
 },
 {
 slug:"meal-planning-reduce-food-waste",
 category:"Sustainable shopping",
 title:"How meal planning cuts food waste",
 desc:"Shop once with a list built from your plan — fewer impulse buys and less in the bin.",
 readTime:"5 min read",
 },
 {
 slug:"tesco-asda-aldi-grocery-comparison",
 category:"UK supermarkets",
 title:"Tesco vs Asda vs Aldi for your weekly shop",
 desc:"What to expect when BiteSync estimates your basket across UK stores.",
 readTime:"6 min read",
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
 className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--brand-primary)]"
 >
 {link.label}
 </a>
 ))}
 </div>
 <div className="flex items-center gap-2">
 <Link
 href="/login"
 className="rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
 >
 Sign in
 </Link>
 <Link
 href="/signup"
 className="rounded-lg bg-[var(--btn-primary-bg)] px-4 py-2 text-sm font-medium text-[var(--btn-primary-text)] transition-colors hover:bg-[var(--btn-primary-hover)]"
 >
 Get started free
 </Link>
 </div>
 </div>
 </nav>

 <header className="relative overflow-hidden bg-[var(--hero-gradient)] px-4 pt-14 pb-10 text-center text-[var(--text-on-brand)] sm:pt-20 sm:pb-28">
 <div
 aria-hidden
 className="pointer-events-none absolute inset-0 opacity-[0.04]"
 style={{
 backgroundImage:
"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
 backgroundSize:"200px 200px",
 }}
 />
 <div className="relative z-10 mx-auto max-w-3xl">
 <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--surface-overlay)]/15 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
 <Zap className="h-3.5 w-3.5" aria-hidden />
 Free to start — no credit card needed
 </p>
 <h1 className="mb-4 text-4xl leading-tight font-bold tracking-tight sm:text-5xl lg:text-6xl">
 Meal planning that actually works.
 </h1>
 <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-[var(--text-on-brand-muted)] sm:text-lg">
 Build your recipe library, plan your week, hit your nutrition targets, and generate your
 grocery list — automatically.
 </p>
 <Link
 href="/signup"
 className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--surface-card)] px-6 py-3 text-sm font-semibold text-[var(--brand-primary)] transition-colors hover:bg-[var(--surface-brand-subtle)] sm:w-auto"
 >
 Start planning for free
 <ChevronRight className="h-4 w-4" aria-hidden />
 </Link>
 <p className="mt-6 text-xs text-[var(--text-on-brand-subtle)]">
 Built for UK households · NHS-aligned nutrition references · Private by default
 </p>
 <div className="mt-10 hidden justify-center sm:flex">
 <div className="relative z-10 -mb-20 drop-shadow-2xl">
 <MockPlanner />
 </div>
 </div>
 </div>
 </header>

 <section id="how-it-works" className="scroll-mt-24 bg-[var(--surface-muted)] py-16 sm:py-20">
 <div className="mx-auto max-w-6xl px-4">
 <div className="mb-12 text-center">
 <h2 className="mb-3 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">Plan. Shop. Track.</h2>
 <p className="mx-auto max-w-lg text-sm text-[var(--text-muted)]">
 Three steps from &quot;what should we eat?&quot; to a full week sorted.
 </p>
 </div>
 <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
 {STEPS.map(({ step, Icon, title, desc }) => (
 <article
 key={title}
 className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6"
 >
 <div className="mb-4 flex items-center gap-3">
 <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--surface-brand-subtle)]">
 <Icon className="h-5 w-5 text-[var(--brand-primary)]" aria-hidden />
 </span>
 <span className="text-xs font-bold tracking-widest text-[var(--text-muted)]">{step}</span>
 </div>
 <h3 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
 <p className="text-sm leading-relaxed text-[var(--text-muted)]">{desc}</p>
 </article>
 ))}
 </div>
 </div>
 </section>

 <section className="overflow-hidden bg-[var(--landing-accent-surface)] py-12 sm:py-16">
 <div className="mx-auto mb-8 max-w-2xl px-4 text-center">
 <h2 className="mb-2 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">See it in action</h2>
 <p className="text-sm text-[var(--text-muted)]">
 Real BiteSync screens — Today, your weekly plan, and your grocery list.
 </p>
 </div>
 <LandingPhoneMockups />
 </section>

 <section id="features" className="scroll-mt-24 bg-[var(--surface-muted)] py-16 sm:py-20">
 <div className="mx-auto max-w-6xl px-4">
 <div className="mb-12 text-center">
 <h2 className="mb-3 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
 Everything you need to eat well
 </h2>
 <p className="mx-auto max-w-lg text-sm text-[var(--text-muted)]">
 Recipes, planning, nutrition, and shopping — connected in one app.
 </p>
 </div>
 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
 {FEATURES.map(({ Icon, title, desc, isPro }) => (
 <article
 key={title}
 className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 shadow-sm transition-shadow hover:shadow-md"
 >
 <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--surface-brand-subtle)]">
 <Icon className="h-6 w-6 text-[var(--brand-primary)]" aria-hidden />
 </span>
 <h3 className="mb-2 font-semibold text-[var(--text-primary)]">
 {title}
 {isPro ? (
 <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
 Pro
 </span>
 ) : null}
 </h3>
 <p className="text-sm leading-relaxed text-[var(--text-muted)]">{desc}</p>
 </article>
 ))}
 </div>
 </div>
 </section>

 <section id="pricing" className="scroll-mt-24 bg-[var(--surface-muted)] py-16 sm:py-20">
 <div className="mx-auto max-w-6xl px-4">
 <div className="mb-12 text-center">
 <h2 className="mb-3 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
 Simple, honest pricing
 </h2>
 <p className="text-sm text-[var(--text-muted)]">Start free. Upgrade when you want the full picture.</p>
 </div>
 <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
 <article className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6">
 <h3 className="mb-1 font-bold text-[var(--text-primary)]">Free</h3>
 <p className="text-3xl font-bold text-[var(--text-primary)]">
 £0 <span className="text-sm font-normal text-[var(--text-muted)]">forever</span>
 </p>
 <ul className="mb-8 mt-6 space-y-3">
 {FREE_FEATURES.map((item) => (
 <li key={item} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
 <Check className="h-4 w-4 shrink-0 text-[var(--brand-primary)]" aria-hidden />
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
 <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
 SAVE 30%
 </span>
 <span className="text-xs text-[var(--text-on-brand-muted)]">£59/year · works out to £4.92/mo</span>
 </div>
 <ul className="mb-8 mt-6 space-y-3">
 {PRO_FEATURES.map((item) => (
 <li key={item} className="flex items-center gap-2 text-sm text-green-50">
 <Check className="h-4 w-4 shrink-0 text-green-200" aria-hidden />
 {item}
 </li>
 ))}
 </ul>
 <Link
 href="/signup"
 className="block w-full rounded-xl bg-[var(--surface-card)] py-2.5 text-center text-sm font-semibold text-[var(--brand-primary)] hover:bg-[var(--surface-brand-subtle)]"
 >
 Start free trial
 </Link>
 </article>
 </div>
 </div>
 </section>

 <section className="border-y border-[var(--border-subtle)] bg-[var(--surface-card)] py-12">
 <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 px-4 sm:grid-cols-3">
 <article className="text-center">
 <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-brand-subtle)]">
 <Shield className="h-6 w-6 text-[var(--brand-primary)]" aria-hidden />
 </span>
 <h3 className="mb-1 text-sm font-semibold text-[var(--text-primary)]">NHS-aligned guidance</h3>
 <p className="text-xs leading-relaxed text-[var(--text-muted)]">
 Micronutrient targets reference UK dietary reference values on Pro.
 </p>
 </article>
 <article className="text-center">
 <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-brand-subtle)]">
 <MapPin className="h-6 w-6 text-[var(--brand-primary)]" aria-hidden />
 </span>
 <h3 className="mb-1 text-sm font-semibold text-[var(--text-primary)]">Built in the UK</h3>
 <p className="text-xs leading-relaxed text-[var(--text-muted)]">
 GBP pricing, UK supermarkets, and nutrition data for British shoppers.
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
 Nutrition science and practical planning — also shared on our social channels.
 </p>
 </div>
 <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
 {BLOG_POSTS.map((post) => (
 <article
 key={post.slug}
 className="group flex flex-col rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 transition-shadow hover:shadow-md"
 >
 <p className="text-xs font-medium text-[var(--brand-primary)]">{post.category}</p>
 <h3 className="mt-2 text-base font-semibold text-[var(--text-primary)] group-hover:text-[var(--brand-primary)]">
 <Link href={`/blog/${post.slug}`}>{post.title}</Link>
 </h3>
 <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--text-muted)]">{post.desc}</p>
 <p className="mt-4 text-xs text-[var(--text-muted)]">{post.readTime}</p>
 <Link
 href="/signup"
 className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--brand-primary)] hover:underline"
 >
 Try BiteSync free
 <ChevronRight className="h-3 w-3" aria-hidden />
 </Link>
 </article>
 ))}
 </div>
 </div>
 </section>

 <section className="bg-[var(--brand-primary)] px-4 py-16 text-center text-[var(--text-on-brand)] sm:py-20">
 <div className="mx-auto max-w-2xl">
 <h2 className="mb-4 text-2xl font-bold sm:text-3xl">Ready to plan your week?</h2>
 <p className="mb-8 text-sm text-[var(--text-on-brand-muted)] sm:text-base">
 Join people who&apos;ve taken the chaos out of mealtime. Free to start — no credit card
 required.
 </p>
 <Link
 href="/signup"
 className="inline-flex items-center gap-2 rounded-xl bg-[var(--surface-card)] px-8 py-3 text-sm font-semibold text-[var(--brand-primary)] transition-colors hover:bg-[var(--surface-brand-subtle)]"
 >
 Get started free
 <ChevronRight className="h-4 w-4" aria-hidden />
 </Link>
 </div>
 </section>

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
 <Link
 href="/login"
 className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
 >
 Sign in
 </Link>
 </nav>
 <div className="flex items-center gap-3">
 <a
 href="https://x.com"
 target="_blank"
 rel="noopener noreferrer"
 className="text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
 aria-label="BiteSync on X"
 >
 <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
 <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
 </svg>
 </a>
 <a
 href="https://instagram.com"
 target="_blank"
 rel="noopener noreferrer"
 className="text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
 aria-label="BiteSync on Instagram"
 >
 <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
 <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
 <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
 <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
 </svg>
 </a>
 </div>
 </div>
 <p className="text-center text-xs text-[var(--text-muted)]">
 © {new Date().getFullYear()} BiteSync · GDPR compliant ·{""}
 <Link href="/privacy" className="ml-1 hover:underline">
 Privacy
 </Link>
 </p>
 </div>
 </footer>
 </div>
 );
}
