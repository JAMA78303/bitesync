import type { LucideIcon } from "lucide-react";
import { BookOpen, Flame, Leaf, Refrigerator, Sparkles, Target } from "lucide-react";

type Feature = { Icon: LucideIcon; title: string; desc: string; isPro?: boolean };

/**
 * The features the four-step flow above doesn't already show. This replaced a
 * nine-card grid that opened a second phone preview per card: it repeated the
 * planner, grocery and Today screens from the steps, and on a phone it ran to
 * nearly three screens of stacked cards. Server-rendered, no client script.
 */
const FEATURES: Feature[] = [
  {
    Icon: Target,
    title: "Personal calorie & protein targets",
    desc: "Daily goals worked out from your weight, activity and whether you want to lose, maintain or build.",
  },
  {
    Icon: Flame,
    title: "Automatic nutrition",
    desc: "Calories, protein, carbs, fat and fibre calculated from your ingredients, using UK food composition data.",
  },
  {
    Icon: Sparkles,
    title: "AI weekly meal plans",
    desc: "Fill the whole week from your own recipes in seconds, sized to your calorie and protein targets.",
    isPro: true,
  },
  {
    Icon: Refrigerator,
    title: "Pantry-aware shopping",
    desc: "Tell it what's in the cupboard and the grocery list skips it — buy less, waste less.",
  },
  {
    Icon: BookOpen,
    title: "Recipe import",
    desc: "Paste a link from a recipe site and get the ingredients and nutrition in seconds.",
  },
  {
    Icon: Leaf,
    title: "Dietary preferences",
    desc: "Vegetarian, vegan, gluten-free and dairy-free — built into every plan and recipe.",
  },
];

export function LandingFeatureGrid() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <div className="mb-10 text-center">
        <h2 className="mb-3 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl text-balance">
          Built for people with a nutrition goal
        </h2>
        <p className="mx-auto max-w-xl text-sm text-[var(--text-muted)] sm:text-base">
          Everything else you need to plan, shop and eat to your targets.
        </p>
      </div>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {FEATURES.map(({ Icon, title, desc, isPro }) => (
          <li
            key={title}
            className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 sm:p-5"
          >
            <div className="mb-2 flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-brand-subtle)]">
                <Icon className="h-5 w-5 text-[var(--brand-primary)]" aria-hidden />
              </span>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                {title}
                {isPro ? (
                  <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 align-middle text-2xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                    Pro
                  </span>
                ) : null}
              </h3>
            </div>
            <p className="text-sm leading-relaxed text-[var(--text-muted)]">{desc}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
