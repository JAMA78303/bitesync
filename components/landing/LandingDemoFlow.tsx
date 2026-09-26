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
      "See what your week is missing — iron, iodine, vitamin D — checked against published reference values. Something no calorie-counter shows you.",
    Mock: MockMicros,
    isPro: true,
  },
] as const;

/**
 * Four numbered steps: a swipeable row on phones, 2 × 2 from tablet width,
 * four across on wide screens. Stacked on a phone the four phone mockups ran
 * to about two and a half screens; as a row with the next card peeking in,
 * they take one and the swipe is obvious. This was previously a wrapping flex
 * row with chevrons that overflowed into a lopsided 3 + 1; the numbers carry
 * the order, so the chevrons are gone.
 */
export function LandingDemoFlow() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <div className="mb-12 text-center">
        <h2 className="mb-3 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl text-balance">
          From plan to plate — in four steps
        </h2>
        <p className="mx-auto max-w-xl text-sm text-[var(--text-muted)] sm:text-base">
          Set your macro targets once. BiteSync connects planning, shopping, daily tracking, and
          micronutrient analysis — the full picture, not just calories.
        </p>
      </div>

      <ol
        aria-label="Four steps"
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-auto sm:grid sm:grid-cols-2 sm:gap-x-8 sm:gap-y-14 sm:overflow-visible sm:px-0 sm:pb-0 xl:grid-cols-4 xl:gap-6 [&::-webkit-scrollbar]:hidden"
      >
        {DEMO_BEATS.map(({ step, title, caption, Mock, isPro }) => (
          <li
            key={step}
            className="flex w-[82%] max-w-[340px] shrink-0 snap-center flex-col items-center sm:mx-auto sm:w-full"
          >
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary)] text-sm font-bold text-[var(--text-on-brand)]">
                {step}
              </span>
              <h3 className="text-base font-semibold text-balance text-[var(--text-primary)]">
                {title}
                {isPro ? (
                  <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 align-middle text-2xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                    Pro
                  </span>
                ) : null}
              </h3>
            </div>
            <div className="mb-4 w-full">
              <Mock />
            </div>
            <p className="text-center text-sm leading-relaxed text-[var(--text-muted)]">{caption}</p>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-center text-xs text-[var(--text-muted)] sm:hidden" aria-hidden>
        Swipe to see all four steps →
      </p>
    </div>
  );
}
