import { Fragment } from "react";
import { ChevronRight } from "lucide-react";
import { MockGrocery, MockPlanner, MockToday } from "@/components/landing/LandingPhoneMockups";

const DEMO_BEATS = [
  {
    step: "1",
    title: "Plan your week",
    caption: "Drop recipes onto the planner — daily calories and protein update as you build each day.",
    Mock: MockPlanner,
  },
  {
    step: "2",
    title: "Get one grocery list",
    caption: "Generate a merged shopping list from that exact week. Check items off as you shop.",
    Mock: MockGrocery,
  },
  {
    step: "3",
    title: "Hit your targets",
    caption: "Open Today to see your calorie ring, macro bars, and every meal against your goals.",
    Mock: MockToday,
  },
] as const;

export function LandingDemoFlow() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <div className="mb-12 text-center">
        <h2 className="mb-3 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
          From plan to plate — in three steps
        </h2>
        <p className="mx-auto max-w-xl text-sm text-[var(--text-muted)] sm:text-base">
          Set your macro targets once. BiteSync connects planning, shopping, and daily tracking so the
          food side stays handled.
        </p>
      </div>

      <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-start lg:justify-center lg:gap-6">
        {DEMO_BEATS.map(({ step, title, caption, Mock }, index) => (
          <Fragment key={step}>
            <article className="flex w-full max-w-[260px] flex-col items-center">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary)] text-sm font-bold text-[var(--text-on-brand)]">
                  {step}
                </span>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>
              </div>
              <div className="mb-4 flex justify-center">
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
