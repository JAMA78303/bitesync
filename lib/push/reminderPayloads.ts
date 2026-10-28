import type { PushPayload } from "@/lib/push/send";

export type ReminderKind = "weekly" | "daily";

/**
 * What each reminder says and opens. Shared by the web push (the cron in
 * app/api/cron/push-reminders) and the iPhone app's own reminders
 * (lib/native/reminders.ts), so the two never drift apart.
 */
export const REMINDER_PAYLOADS: Record<ReminderKind, PushPayload> = {
  // Opens Today with plan=upcoming, which plans the empty week on arrival, so
  // the tap that opens the app is the only one needed.
  weekly: {
    title: "Plan next week in one tap",
    body: "Next week is still empty. Tap and BiteSync plans it from your recipes, grocery list included.",
    url: "/today?plan=upcoming",
    tag: "bitesync-weekly",
  },
  // BiteSync plans meals; it has no food log. The old copy ("Log what you ate")
  // asked users to do something the app cannot do. An evening nudge is useful for
  // a planner when it is about the next day's cooking, not yesterday's intake.
  daily: {
    title: "Check tomorrow's plan",
    body: "See what's planned so you can defrost or prep anything you need.",
    url: "/planner",
    tag: "bitesync-daily",
  },
};

/**
 * The iPhone app's Sunday reminder is scheduled on the phone in advance, so it
 * can't know about a week planned since on the website or another device.
 * Unlike the web push, it doesn't claim the week is empty; tapping it only
 * fills next week if it still is.
 */
export const NATIVE_WEEKLY_BODY =
  "If next week is still empty, tap and BiteSync plans it from your recipes, grocery list included.";

/** The "Send test" notification from Settings. */
export const TEST_REMINDER_PAYLOAD: PushPayload = {
  title: "BiteSync notifications are on",
  body: "This is what a reminder will look like.",
  url: "/planner",
  tag: "bitesync-test",
};
