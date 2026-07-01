import Link from "next/link";
import { PlannerGrid } from "@/components/planner/PlannerGrid";
import {
  SCREENSHOT_AI_PLAN_ENTRIES,
  SCREENSHOT_AI_PLAN_GRID,
  SCREENSHOT_PLANNER_RECIPES,
  SCREENSHOT_TARGETS,
  SCREENSHOT_WEEK_DATES,
  SCREENSHOT_WEEK_ISO,
} from "@/lib/landing/screenshotFixtures";
import { ds } from "@/lib/ui/classes";

export const dynamic = "force-dynamic";

/** Read-only demo of a planned week — fixture data, not the user's plan. */
export default function SampleWeekPage() {
  return (
    <div className={`${ds.mobilePage} ${ds.pageContent}`}>
      <div className={ds.gradientHeaderCompact}>
        <Link href="/onboarding" className={`mb-2 inline-block text-sm font-medium ${ds.pageSubtitle}`}>
          ← Setup guide
        </Link>
        <p className={`mb-1 text-xs font-semibold uppercase tracking-wide ${ds.pageSubtitle}`}>Sample</p>
        <h1 className={ds.pageTitle}>A week at its best</h1>
        <p className={`mt-1 max-w-md ${ds.pageSubtitle}`}>
          Varied meals, on-target macros, one grocery list — this is what BiteSync looks like when your week is
          planned.
        </p>
      </div>

      <div className={`${ds.mobileGutter} ${ds.overlap} space-y-4`}>
        <div className="rounded-2xl border border-[var(--brand-primary)]/30 bg-[var(--surface-brand-subtle)] px-4 py-3 text-sm text-[var(--text-secondary)]">
          <strong className="text-[var(--text-primary)]">Sample — generate your own.</strong> This plan uses demo
          data. Your real week will match your targets and dietary preferences.
        </div>

        <div className="pointer-events-none select-none opacity-[0.98]" aria-hidden={false}>
          <PlannerGrid
            grid={SCREENSHOT_AI_PLAN_GRID}
            entries={SCREENSHOT_AI_PLAN_ENTRIES}
            mealPlanId="sample-plan"
            recipes={SCREENSHOT_PLANNER_RECIPES}
            weekDates={SCREENSHOT_WEEK_DATES}
            weekStartIso={SCREENSHOT_WEEK_ISO}
            dailyCalorieTarget={SCREENSHOT_TARGETS.kcal}
            dailyProteinTarget={SCREENSHOT_TARGETS.protein}
            dietaryPreferences={[]}
          />
        </div>

        <div className="flex flex-col gap-2 pb-8 sm:flex-row">
          <Link href="/onboarding" className={`${ds.primaryBtn} text-center`}>
            Generate your own week
          </Link>
          <Link
            href="/today"
            className="rounded-2xl border border-[var(--border-default)] px-4 py-3 text-center text-sm font-semibold text-[var(--text-secondary)]"
          >
            Explore the app
          </Link>
        </div>
      </div>
    </div>
  );
}
