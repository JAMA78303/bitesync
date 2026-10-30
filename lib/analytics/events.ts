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

/** Coming back each week: the reminder offer, add to home screen, one-tap planning. */
export function trackReminderOffer(placement: "welcome" | "today", outcome: "on" | "not_now" | "failed") {
  track("reminder_offer", { placement, outcome });
}

export function trackInstallOffer(placement: "welcome" | "today", outcome: string) {
  track("install_offer", { placement, outcome });
}

export function trackUpcomingWeekPlanned(trigger: "card" | "reminder") {
  track("upcoming_week_planned", { trigger });
}

/**
 * The 7-day trial (lib/billing/access.ts). Who started one, and where people
 * saw and pressed an upgrade prompt. Trial-to-paid itself comes from Stripe.
 */
export function trackTrialStarted(source: "signup" | "legacy_opt_in") {
  track("trial_started", { source });
}

export function trackUpgradePrompt(placement: string, action: "viewed" | "clicked") {
  track("upgrade_prompt", { placement, action });
}
