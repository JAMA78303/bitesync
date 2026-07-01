import { Fragment } from "react";
import { ChevronRight } from "lucide-react";
import { LandingDemoShot } from "@/components/landing/LandingDemoShot";
import { MockGrocery, MockMicros, MockPlanner, MockToday } from "@/components/landing/LandingPhoneMockups";
import { landingFeatureShot } from "@/lib/landing/featurePreviewShots";

const plannerShot = landingFeatureShot("planner");
const groceryShot = landingFeatureShot("grocery");
const todayShot = landingFeatureShot("today");
const microsShot = landingFeatureShot("micros");

const DEMO_BEATS = [
  {
    step: "1",
    title: "Plan your week",
    caption: "Drop recipes onto the planner — daily calories and protein update as you build each day.",
    Mock: MockPlanner,
    image: { light: plannerShot.light, dark: plannerShot.dark, width: plannerShot.width, height: plannerShot.height },
    imageAlt: plannerShot.alt,
    isPro: false,
  },
  {
    step: "2",
    title: "Get one grocery list",
    caption: "Generate a merged shopping list from that exact week. Check items off as you shop.",
    Mock: MockGrocery,
    image: { light: groceryShot.light, dark: groceryShot.dark, width: groceryShot.width, height: groceryShot.height },
    imageAlt: groceryShot.alt,
    isPro: false,
  },
  {
    step: "3",
    title: "Hit your targets",
    caption: "Open Today to see your calorie ring, macro bars, and every meal against your goals.",
    Mock: MockToday,
    image: { light: todayShot.light, dark: todayShot.dark, width: todayShot.width, height: todayShot.height },
    imageAlt: todayShot.alt,
    isPro: false,
  },
  {
    step: "4",
    title: "Spot micronutrient gaps",
    caption:
      "See what your week is missing — iron, iodine, vitamin D — checked against UK reference values. Something no calorie-counter shows you.",
    Mock: MockMicros,
    image: { light: microsShot.light, dark: microsShot.dark, width: microsShot.width, height: microsShot.height },
    imageAlt: microsShot.alt,
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

      <div className="flex flex-col items-center gap-8 lg:flex-row lg:flex-wrap lg:items-start lg:justify-center lg:gap-6">
        {DEMO_BEATS.map(({ step, title, caption, Mock, image, imageAlt, isPro }, index) => (
          <Fragment key={step}>
            <article className="flex w-full max-w-[260px] flex-col items-center">
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
              <div className="mb-4 flex justify-center">
                <LandingDemoShot
                  srcLight={image.light}
                  srcDark={image.dark}
                  alt={imageAlt}
                  width={image.width}
                  height={image.height}
                  fallback={<Mock />}
                />
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
