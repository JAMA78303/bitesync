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
