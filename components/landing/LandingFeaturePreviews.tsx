"use client";

import { useCallback, useId, useRef, useState, type KeyboardEvent } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  BookOpen,
  CalendarDays,
  Flame,
  Leaf,
  Refrigerator,
  Sparkles,
  Target,
} from "lucide-react";
import {
  LANDING_FEATURE_PREVIEW_DEFAULT_ID,
  LANDING_FEATURE_SHOTS,
  type LandingFeaturePreviewId,
} from "@/lib/landing/featurePreviewShots";

type FeaturePreview = {
  id: LandingFeaturePreviewId;
  Icon: LucideIcon;
  title: string;
  desc: string;
  previewCaption: string;
  isPro?: boolean;
};

const FEATURE_PREVIEWS: FeaturePreview[] = [
  {
    id: "targets",
    Icon: Target,
    title: "Personal calorie & protein targets",
    desc: "TDEE-based daily goals from your weight, activity, and whether you want to lose, maintain, or build.",
    previewCaption: "Set daily calories and macros once — TDEE, activity, and goal drive the numbers.",
  },
  {
    id: "planner",
    Icon: CalendarDays,
    title: "Weekly planner with running totals",
    desc: "Plan breakfast through snacks across the week. See each day's calories and protein as you build the plan.",
    previewCaption: "Drag recipes onto the week — daily totals update as you fill each slot.",
  },
  {
    id: "today",
    Icon: Activity,
    title: "Today dashboard",
    desc: "A home screen with your calorie ring and macro progress — always know where the day stands.",
    previewCaption: "Open Today to see progress at a glance and every meal lined up for the day.",
  },
  {
    id: "nutrition",
    Icon: Flame,
    title: "Automatic nutrition",
    desc: "Calories, protein, carbs, fat, and fibre calculated from your ingredients — no manual logging.",
    previewCaption: "Macros are calculated from your recipe ingredients — no spreadsheet required.",
  },
  {
    id: "ai-plans",
    Icon: Sparkles,
    title: "AI weekly meal plans",
    desc: "Pro users can fill the week from their own recipe library, tuned to hit daily macro targets.",
    previewCaption: "Generate a full week from your library, sized to your calorie and protein goals.",
    isPro: true,
  },
  {
    id: "grocery",
    Icon: Refrigerator,
    title: "Pantry-aware grocery lists",
    desc: "Skip what you already have at home so you buy less and waste less.",
    previewCaption: "One merged list from your plan — check items off as you shop.",
  },
  {
    id: "import",
    Icon: BookOpen,
    title: "Recipe import",
    desc: "Paste a URL from popular recipe sites — ingredients and nutrition in seconds.",
    previewCaption: "Imported recipes land in your library, ready to drop onto the planner.",
  },
  {
    id: "dietary",
    Icon: Leaf,
    title: "Dietary preferences",
    desc: "Vegetarian, vegan, gluten-free, and more — wired into planning from onboarding.",
    previewCaption: "Your diet settings filter recipe generation and planning from day one.",
  },
  {
    id: "micros",
    Icon: BarChart3,
    title: "Weekly micronutrient analysis",
    desc: "Track vitamins and minerals against reference values on Pro.",
    previewCaption: "Weekly nutrition view flags gaps and helps you adjust the plan.",
    isPro: true,
  },
];

export function LandingFeaturePreviews() {
  const baseId = useId();
  const [activeId, setActiveId] = useState<LandingFeaturePreviewId>(LANDING_FEATURE_PREVIEW_DEFAULT_ID);
  const cardRefs = useRef<Partial<Record<LandingFeaturePreviewId, HTMLButtonElement | null>>>({});

  const activeMeta = FEATURE_PREVIEWS.find((f) => f.id === activeId) ?? FEATURE_PREVIEWS[0]!;
  const ActiveMock = LANDING_FEATURE_SHOTS[activeMeta.id].Mock;

  /** Keep the tapped card in view after the accordion above it collapses (mobile only). */
  const selectFeature = useCallback((id: LandingFeaturePreviewId) => {
    setActiveId(id);
    if (typeof window === "undefined" || window.matchMedia("(min-width: 1024px)").matches) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(
      () => {
        cardRefs.current[id]?.scrollIntoView({
          block: "nearest",
          behavior: reduceMotion ? "auto" : "smooth",
        });
      },
      reduceMotion ? 0 : 220,
    );
  }, []);

  const onKeyDown = useCallback(
    (e: KeyboardEvent, index: number) => {
      const last = FEATURE_PREVIEWS.length - 1;
      let next = index;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        next = index >= last ? 0 : index + 1;
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        next = index <= 0 ? last : index - 1;
      } else if (e.key === "Home") {
        e.preventDefault();
        next = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        next = last;
      } else {
        return;
      }
      selectFeature(FEATURE_PREVIEWS[next]!.id);
    },
    [selectFeature],
  );

  return (
    <div className="mx-auto max-w-6xl px-4">
      <div className="mb-10 text-center">
        <h2 className="mb-3 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
          Built for people with a nutrition goal
        </h2>
        <p className="mx-auto max-w-lg text-sm text-[var(--text-muted)] sm:text-base">
          Tap a feature to preview the app — planning, shopping, and tracking in one place.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,300px)] lg:items-start">
        <div
          role="tablist"
          aria-label="App features"
          className="grid grid-cols-1 gap-2 lg:grid-cols-2"
        >
          {FEATURE_PREVIEWS.map((feature, index) => {
            const selected = feature.id === activeId;
            const tabId = `${baseId}-tab-${feature.id}`;
            const panelId = `${baseId}-panel`;
            const Mock = LANDING_FEATURE_SHOTS[feature.id].Mock;
            return (
              <div key={feature.id} className="min-w-0">
                <button
                  id={tabId}
                  ref={(el) => {
                    cardRefs.current[feature.id] = el;
                  }}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls={panelId}
                  aria-expanded={selected}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => selectFeature(feature.id)}
                  onKeyDown={(e) => onKeyDown(e, index)}
                  className={`w-full rounded-2xl border p-4 text-left transition-[border-color,background-color,box-shadow,transform] duration-200 motion-reduce:transition-none ${
                    selected
                      ? "border-[var(--brand-action-mid)] bg-[var(--surface-brand-subtle)] shadow-md"
                      : "border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm hover:border-[var(--brand-action-mid)]/40 hover:shadow-md"
                  }`}
                >
                  <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-card)]">
                    <feature.Icon className="h-5 w-5 text-[var(--brand-primary)]" aria-hidden />
                  </span>
                  <span className="block font-semibold text-[var(--text-primary)]">
                    {feature.title}
                    {feature.isPro ? (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-2xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                        Pro
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-[var(--text-muted)]">{feature.desc}</span>
                </button>

                {/* Mobile accordion: preview expands inline beneath its card */}
                <div
                  className={`grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none lg:hidden ${
                    selected ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                  aria-hidden={!selected}
                >
                  <div className="min-h-0">
                    <div className="flex flex-col items-center px-2 pt-4 pb-2">
                      <Mock />
                      <p className="mt-3 text-center text-sm leading-relaxed text-[var(--text-muted)]">
                        {feature.previewCaption}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop: sticky side-by-side preview */}
        <div
          id={`${baseId}-panel`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${activeMeta.id}`}
          className="mx-auto hidden w-full max-w-[300px] lg:sticky lg:top-24 lg:block"
        >
          <div className="flex flex-col items-center transition-opacity duration-200 motion-reduce:transition-none">
            <ActiveMock key={activeMeta.id} />
            <p className="mt-4 text-center text-sm leading-relaxed text-[var(--text-muted)]">{activeMeta.previewCaption}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
