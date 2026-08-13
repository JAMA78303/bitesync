import { Fragment } from "react";
import { ChevronRight } from "lucide-react";
import {
  MockGrocery,
  MockMicros,
  MockPlanner,
  MockToday,
} from "@/components/landing/LandingPhoneMockups";

const DEMO_BEATS = [
  {
    step: "1",
    title: "Plan your week",
    caption: "Drop recipes onto the planner — daily calories and protein update as you build each day.",
    Mock: MockPlanner,
    isPro: false,
  },
  {
    step: "2",
    title: "Get one grocery list",
    caption: "Generate a merged shopping list from that exact week. Check items off as you shop.",
    Mock: MockGrocery,
    isPro: false,
  },
  {
    step: "3",
    title: "Hit your targets",
    caption: "Open Today to see your calorie ring, macro bars, and every meal against your goals.",
    Mock: MockToday,
    isPro: false,
  },
  {
    step: "4",
    title: "Spot micronutrient gaps",
    caption:
      "See what your week is missing — iron, iodine, vitamin D — checked against UK reference values. Something no calorie-counter shows you.",
    Mock: MockMicros,
    isPro: true,
  },
] as const;

export function LandingDemoFlow() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <div className="mb-12 text-center">
        <h2 className="mb-3 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
          From plan to plate — in four steps
        </h2>
        <p className="mx-auto max-w-xl text-sm text-[var(--text-muted)] sm:text-base">
          Set your macro targets once. BiteSync connects planning, shopping, daily tracking, and
          micronutrient analysis — the full picture, not just calories.
        </p>
      </div>

      <div className="flex flex-col items-center gap-5 sm:gap-8 lg:flex-row lg:flex-wrap lg:items-start lg:justify-center lg:gap-6">
        {DEMO_BEATS.map(({ step, title, caption, Mock, isPro }, index) => (
          <Fragment key={step}>
            <article className="flex w-full max-w-[360px] flex-col items-center lg:max-w-[260px]">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary)] text-sm font-bold text-[var(--text-on-brand)]">
                  {step}
                </span>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  {title}
                  {isPro ? (
                    <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-2xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                      Pro
                    </span>
                  ) : null}
                </h3>
              </div>
              <div className="mb-4 flex w-full justify-center">
                <Mock />
              </div>
              <p className="text-center text-sm leading-relaxed text-[var(--text-muted)]">{caption}</p>
            </article>
            {index < DEMO_BEATS.length - 1 ? (
              <div className="flex shrink-0 items-center text-[var(--text-muted)] lg:pt-28" aria-hidden>
                <ChevronRight className="h-6 w-6 rotate-90 lg:rotate-0" />
              </div>
            ) : null}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
