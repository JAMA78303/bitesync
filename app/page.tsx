import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  HelpCircle,
  ShoppingCart,
  Flame,
  Target,
  Check,
  ChevronRight,
  Utensils,
  BarChart3,
  Zap,
  BookOpen,
  Smartphone,
  Shield,
} from "lucide-react";
import { LandingFaq } from "@/components/landing/LandingFaq";

const PAIN_POINTS: { Icon: LucideIcon; title: string; desc: string }[] = [
  {
    Icon: HelpCircle,
    title: '"What should I eat this week?"',
    desc: "Deciding meals every single day is exhausting. There has to be a better way.",
  },
  {
    Icon: ShoppingCart,
    title: "Buying food with no plan",
    desc: "You shop without a list, buy things you don't need, and forget what you actually wanted.",
  },
  {
    Icon: BarChart3,
    title: "No idea what you're eating",
    desc: "Calories, protein, macros - you care but tracking everything manually never sticks.",
  },
];

const HOW_IT_WORKS: { step: string; Icon: LucideIcon; title: string; desc: string }[] = [
  {
    step: "01",
    Icon: Utensils,
    title: "Build your recipe library",
    desc: "Add recipes manually or paste a URL to import from many websites. BiteSync calculates full nutrition automatically — calories, protein, carbs, fat and more.",
  },
  {
    step: "02",
    Icon: CalendarDays,
    title: "Plan your week",
    desc: "Drag meals onto your weekly planner. See your daily calorie and protein totals update in real time as you plan.",
  },
  {
    step: "03",
    Icon: ShoppingCart,
    title: "Generate and shop",
    desc: "Pick which days you're cooking for. BiteSync merges all your ingredients into one clean grocery list. Check items off as you shop.",
  },
];

const FEATURES: { Icon: LucideIcon; title: string; desc: string }[] = [
  {
    Icon: Flame,
    title: "Automatic nutrition tracking",
    desc: "Calories, protein, carbs, fat, fibre, sodium - calculated instantly from your ingredients. No manual logging.",
  },
  {
    Icon: Target,
    title: "Personal calorie targets",
    desc: "Set your TDEE based on your weight, height, activity level and goal. See daily progress bars in your planner.",
  },
  {
    Icon: ShoppingCart,
    title: "Smart grocery list",
    desc: "Ingredients merged automatically. Choose which days to shop for. Check items off on your phone in the supermarket.",
  },
  {
    Icon: BarChart3,
    title: "Weekly nutrition overview",
    desc: "See your total weekly nutrition at a glance. Know if you're on track before the week even starts.",
  },
  {
    Icon: BookOpen,
    title: "Recipe import from the web",
    desc: "Paste a URL from popular recipe sites and blogs. We pull in ingredients so you can edit, get nutrition, and add the meal to your planner in seconds.",
  },
];

const BLOG_TEASERS: { Icon: LucideIcon; title: string; desc: string }[] = [
  {
    Icon: Smartphone,
    title: "Meal planning on mobile",
    desc: "Set up your full week in minutes from your phone.",
  },
  {
    Icon: Shield,
    title: "Balanced nutrition made simple",
    desc: "How to use weekly metrics without overcomplicating food.",
  },
  {
    Icon: BarChart3,
    title: "How to hit macro goals consistently",
    desc: "A practical approach to daily planning with real food.",
  },
];

const IMPORT_SOURCE_EXAMPLES = ["Popular recipe sites", "Food blogs", "Healthy cooking sites", "Many recipe pages"] as const;

const FREE_FEATURES = [
  "Up to 10 recipes",
  "Recipe import from URL",
  "Weekly meal planner",
  "Grocery list generation",
  "Basic macro tracking",
  "2 weeks of history",
] as const;

const PRO_FEATURES = [
  "Unlimited recipes",
  "Full nutrition (macros + micros)",
  "TDEE calculator + targets",
  "Personal macro goals",
  "Unlimited history",
  "Grocery list by day",
  "Priority support",
] as const;

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1A4731]">
              <Utensils className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-slate-800">
              Bite<span className="text-[#1A4731]">Sync</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm text-slate-500 transition-colors hover:text-slate-700"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-[#1A4731] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#153928]"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-5xl px-4 pt-16 pb-20 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#D1FAE5] px-3 py-1.5 text-xs font-medium text-[#1A4731]">
          <Zap className="h-3 w-3" />
          Free to start - no credit card needed
        </div>

        <h1 className="mb-4 text-4xl leading-tight tracking-tight font-bold text-slate-900 sm:text-5xl">
          Meal planning that
          <span className="text-[#1A4731]"> actually works.</span>
        </h1>

        <p className="mx-auto mb-8 max-w-xl text-lg leading-relaxed text-slate-500">
          Build your recipe library, plan your week, hit your nutrition targets, and
          generate your grocery list - automatically. In under 10 minutes.
        </p>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1A4731] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#153928] sm:w-auto"
          >
            Start planning for free
            <ChevronRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 px-6 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 sm:w-auto"
          >
            Log in
          </Link>
        </div>

        <p className="mt-6 text-xs text-slate-400">Join people planning smarter meals every week</p>
      </section>

      <section className="border-y border-slate-100 bg-slate-50 py-12">
        <div className="mx-auto max-w-5xl px-4">
          <p className="mb-8 text-center text-sm font-medium tracking-wide text-slate-400 uppercase">
            Sound familiar?
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {PAIN_POINTS.map(({ Icon, title, desc }, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#D1FAE5]">
                  <Icon className="h-5 w-5 text-[#1A4731]" aria-hidden />
                </div>
                <h3 className="mb-2 text-sm font-semibold text-slate-700">{title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-2xl font-bold text-slate-900 sm:text-3xl">
            From zero to sorted in 10 minutes
          </h2>
          <p className="mx-auto max-w-md text-sm text-slate-500">
            One Sunday session sets you up for the whole week. BiteSync connects everything so you
            don't have to.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {HOW_IT_WORKS.map(({ step, Icon, title, desc }, i) => (
            <div key={i} className="relative">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D1FAE5]">
                  <Icon className="h-5 w-5 text-[#1A4731]" aria-hidden />
                </div>
                <span className="text-xs font-bold tracking-widest text-slate-300">{step}</span>
              </div>
              <h3 className="mb-2 font-semibold text-slate-800">{title}</h3>
              <p className="text-sm leading-relaxed text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#1A4731] py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-2xl font-bold text-white sm:text-3xl">Everything in one place</h2>
            <p className="mx-auto max-w-md text-sm text-green-200">
              No more switching between apps. BiteSync connects your meals, nutrition, and shopping
              list.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FEATURES.map(({ Icon, title, desc }, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/10 p-5">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 text-white">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                </div>
                <h3 className="mb-2 font-semibold text-white">{title}</h3>
                <p className="text-sm leading-relaxed text-green-200">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-2xl font-bold text-slate-900 sm:text-3xl">Simple, honest pricing</h2>
          <p className="text-sm text-slate-500">Start free. Upgrade when you're ready.</p>
        </div>

        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-6">
            <h3 className="mb-1 font-bold text-slate-800">Free</h3>
            <div className="mb-1 text-3xl font-bold text-slate-900">£0</div>
            <p className="mb-6 text-xs text-slate-400">Forever free</p>
            <ul className="mb-8 space-y-3">
              {FREE_FEATURES.map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                  <Check className="h-4 w-4 shrink-0 text-[#1A4731]" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="block w-full rounded-xl border border-slate-200 py-2.5 text-center text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Get started free
            </Link>
          </div>

          <div className="relative rounded-2xl bg-[#1A4731] p-6">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-900">
                MOST POPULAR
              </span>
            </div>
            <h3 className="mb-1 font-bold text-white">Pro</h3>
            <div className="mb-1 text-3xl font-bold text-white">
              £6.99
              <span className="text-base font-normal text-green-300">/month</span>
            </div>
            <p className="mb-6 text-xs text-green-300">or £59/year - save 30%</p>
            <ul className="mb-8 space-y-3">
              {PRO_FEATURES.map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-green-100">
                  <Check className="h-4 w-4 shrink-0 text-green-300" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="block w-full rounded-xl bg-white py-2.5 text-center text-sm font-medium text-[#1A4731] transition-colors hover:bg-green-50"
            >
              Start free trial
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-16">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-600">
          Free is perfect for getting started. Pro is for people who want full macro and micronutrient coverage.
        </div>
      </section>

      <LandingFaq />

      <section className="mx-auto max-w-5xl px-4 pb-20">
        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-8 text-white">
          <span className="inline-flex rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/25">
            Available now
          </span>
          <h2 className="mt-4 text-2xl font-bold sm:text-3xl">Import recipes from the web</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
            Found a recipe online? Paste the URL from your recipes page and BiteSync pulls in ingredients, estimates nutrition, and saves it to your library — ready for your weekly plan and grocery list.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {IMPORT_SOURCE_EXAMPLES.map((site) => (
              <span key={site} className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-200">
                {site}
              </span>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link href="/signup" className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900">
              Get started free
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="text-sm text-slate-300 underline underline-offset-2 hover:text-white">
              Already have an account? Log in →
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-20">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">From the BiteSync blog</h2>
          <p className="mt-2 text-sm text-slate-500">Planning tips, nutrition guides, and product updates.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {BLOG_TEASERS.map(({ Icon, title, desc }) => (
            <article key={title} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Icon className="h-4 w-4" aria-hidden />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
              <p className="mt-1 text-sm text-slate-500">{desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-100 bg-slate-50 py-16">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <h2 className="mb-4 text-2xl font-bold text-slate-900 sm:text-3xl">
            Ready to stop guessing and start planning?
          </h2>
          <p className="mx-auto mb-8 max-w-md text-sm text-slate-500">
            Join people who've taken the chaos out of mealtime. Free to start. No credit card
            required.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-[#1A4731] px-8 py-3 font-medium text-white transition-colors hover:bg-[#153928]"
          >
            Get started free
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#1A4731]">
              <Utensils className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-700">
              Bite<span className="text-[#1A4731]">Sync</span>
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <Link href="/login" className="text-xs text-slate-400 hover:text-slate-600">
              Log in
            </Link>
            <Link href="/signup" className="text-xs text-slate-400 hover:text-slate-600">
              Sign up
            </Link>
          </div>

          <p className="text-xs text-slate-300">© 2026 BiteSync. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
