"use client";

import type { AppEventName, AppEventProps } from "@/lib/analytics/appEvents";

/**
 * Product events, stored in our own app_events table through /api/events and
 * shown at /admin/events.
 *
 * These used to go to Vercel Analytics with track(), but Vercel only records
 * custom events on its paid plans, so on the free plan every one of them was
 * dropped. Page views still go to Vercel (the <Analytics /> in app/layout.tsx).
 *
 * keepalive lets an event fired just before a navigation (an upgrade click, a
 * finished first run) still arrive. Failures are ignored: analytics must never
 * break or slow the screen that sent it.
 */
export function sendAppEvent(name: AppEventName, props: AppEventProps = {}): void {
  if (typeof window === "undefined") return;
  try {
    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, props }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Old browsers without keepalive, or a blocked request: drop the event.
  }
}

export function trackFirstRunCompleted() {
  sendAppEvent("first_run_completed");
}

export function trackWeekGenerated(source: "ai" | "heuristic" | "manual") {
  sendAppEvent("week_generated", { source });
}

export function trackFirstRunSkipped(step: number) {
  sendAppEvent("first_run_skipped", { step: String(step) });
}

/**
 * Fired once per step shown. Completed and skipped were already tracked, but
 * nothing recorded which step a user was looking at when they closed the tab —
 * so a 47% bounce on /onboarding could not be attributed to any screen. The
 * gap between step 1 views and step 2 views is the number that matters.
 */
export function trackFirstRunStepViewed(step: number) {
  sendAppEvent("first_run_step_viewed", { step: String(step) });
}

/** Coming back each week: the reminder offer, add to home screen, one-tap planning. */
export function trackReminderOffer(placement: "welcome" | "today", outcome: "on" | "not_now" | "failed") {
  sendAppEvent("reminder_offer", { placement, outcome });
}

export function trackInstallOffer(placement: "welcome" | "today", outcome: string) {
  sendAppEvent("install_offer", { placement, outcome });
}

export function trackUpcomingWeekPlanned(trigger: "card" | "reminder") {
  sendAppEvent("upcoming_week_planned", { trigger });
}

/**
 * The 7-day trial (lib/billing/access.ts). Who started one, and where people
 * saw and pressed an upgrade prompt. Trial-to-paid itself comes from Stripe.
 */
export function trackTrialStarted(source: "signup" | "legacy_opt_in") {
  sendAppEvent("trial_started", { source });
}

export function trackUpgradePrompt(placement: string, action: "viewed" | "clicked") {
  sendAppEvent("upgrade_prompt", { placement, action });
}
