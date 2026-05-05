import Link from "next/link";
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
            {[
              {
                icon: <HelpCircle className="h-5 w-5 text-[#1A4731]" />,
                title: '"What should I eat this week?"',
                desc: "Deciding meals every single day is exhausting. There has to be a better way.",
              },
              {
                icon: <ShoppingCart className="h-5 w-5 text-[#1A4731]" />,
                title: "Buying food with no plan",
                desc: "You shop without a list, buy things you don't need, and forget what you actually wanted.",
              },
              {
                icon: <BarChart3 className="h-5 w-5 text-[#1A4731]" />,
                title: "No idea what you're eating",
                desc: "Calories, protein, macros - you care but tracking everything manually never sticks.",
              },
            ].map((item, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#D1FAE5]">
                  {item.icon}
                </div>
                <h3 className="mb-2 text-sm font-semibold text-slate-700">{item.title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{item.desc}</p>
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
          {[
            {
              step: "01",
              icon: <Utensils className="h-5 w-5 text-[#1A4731]" />,
              title: "Build your recipe library",
              desc: "Add your favourite meals with ingredients. BiteSync calculates the full nutrition automatically - calories, protein, carbs, fat and more.",
            },
            {
              step: "02",
              icon: <CalendarDays className="h-5 w-5 text-[#1A4731]" />,
              title: "Plan your week",
              desc: "Drag meals onto your weekly planner. See your daily calorie and protein totals update in real time as you plan.",
            },
            {
              step: "03",
              icon: <ShoppingCart className="h-5 w-5 text-[#1A4731]" />,
              title: "Generate and shop",
              desc: "Pick which days you're cooking for. BiteSync merges all your ingredients into one clean grocery list. Check items off as you shop.",
            },
          ].map((item, i) => (
            <div key={i} className="relative">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D1FAE5]">
                  {item.icon}
                </div>
                <span className="text-xs font-bold tracking-widest text-slate-300">{item.step}</span>
              </div>
              <h3 className="mb-2 font-semibold text-slate-800">{item.title}</h3>
              <p className="text-sm leading-relaxed text-slate-500">{item.desc}</p>
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
            {[
              {
                icon: <Flame className="h-5 w-5" />,
                title: "Automatic nutrition tracking",
                desc: "Calories, protein, carbs, fat, fibre, sodium - calculated instantly from your ingredients. No manual logging.",
              },
              {
                icon: <Target className="h-5 w-5" />,
                title: "Personal calorie targets",
                desc: "Set your TDEE based on your weight, height, activity level and goal. See daily progress bars in your planner.",
              },
              {
                icon: <ShoppingCart className="h-5 w-5" />,
                title: "Smart grocery list",
                desc: "Ingredients merged automatically. Choose which days to shop for. Check items off on your phone in the supermarket.",
              },
              {
                icon: <BarChart3 className="h-5 w-5" />,
                title: "Weekly nutrition overview",
                desc: "See your total weekly nutrition at a glance. Know if you're on track before the week even starts.",
              },
              {
                icon: <BookOpen className="h-5 w-5" />,
                title: "Recipe import - coming soon",
                desc: "Paste a URL from popular recipe websites and BiteSync will import ingredients automatically. Sign up free to get notified at launch.",
                comingSoon: true,
              },
            ].map((feature, i) => (
              <div
                key={i}
                className={`rounded-xl border p-5 ${
                  feature.comingSoon ? "border-white/5 bg-white/5 opacity-80" : "border-white/10 bg-white/10"
                }`}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 text-white">
                    {feature.icon}
                  </div>
                  {feature.comingSoon ? (
                    <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                      Coming soon
                    </span>
                  ) : null}
                </div>
                <h3 className="mb-2 font-semibold text-white">{feature.comingSoon ? "Recipe import" : feature.title}</h3>
                <p className="text-sm leading-relaxed text-green-200">{feature.desc}</p>
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
              {[
                "Up to 10 recipes",
                "Weekly meal planner",
                "Grocery list generation",
                "Basic macro tracking",
                "2 weeks of history",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                  <Check className="h-4 w-4 shrink-0 text-[#1A4731]" />
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
              {[
                "Unlimited recipes",
                "Full nutrition (macros + micros)",
                "TDEE calculator + targets",
                "Personal macro goals",
                "Unlimited history",
                "Grocery list by day",
                "Priority support",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-green-100">
                  <Check className="h-4 w-4 shrink-0 text-green-300" />
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
          <span className="inline-flex rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-300">
            Coming soon
          </span>
          <h2 className="mt-4 text-2xl font-bold sm:text-3xl">Import recipes from any website</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
            Found a recipe you like online? Paste the URL and BiteSync will import the ingredients automatically, calculate nutrition, and make it ready for planning.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {["Popular recipe sites", "Food blogs", "Healthy cooking sites", "Any recipe website"].map((site) => (
              <span key={site} className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-200">
                {site}
              </span>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link href="/signup" className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900">
              Sign up free - get notified at launch
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
          {[
            { icon: <Smartphone className="h-4 w-4" />, title: "Meal planning on mobile", desc: "Set up your full week in minutes from your phone." },
            { icon: <Shield className="h-4 w-4" />, title: "Balanced nutrition made simple", desc: "How to use weekly metrics without overcomplicating food." },
            { icon: <BarChart3 className="h-4 w-4" />, title: "How to hit macro goals consistently", desc: "A practical approach to daily planning with real food." },
          ].map((post) => (
            <article key={post.title} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">{post.icon}</div>
              <h3 className="text-sm font-semibold text-slate-800">{post.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{post.desc}</p>
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
