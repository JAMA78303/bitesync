"use client";

import { track } from "@vercel/analytics";

export function trackFirstRunCompleted() {
  track("first_run_completed");
}

export function trackWeekGenerated(source: "ai" | "heuristic" | "manual") {
  track("week_generated", { source });
}

export function trackFirstRunSkipped(step: number) {
  track("first_run_skipped", { step: String(step) });
}

/**
 * Fired once per step shown. Completed and skipped were already tracked, but
 * nothing recorded which step a user was looking at when they closed the tab —
 * so a 47% bounce on /onboarding could not be attributed to any screen. The
 * gap between step 1 views and step 2 views is the number that matters.
 */
export function trackFirstRunStepViewed(step: number) {
  track("first_run_step_viewed", { step: String(step) });
}
