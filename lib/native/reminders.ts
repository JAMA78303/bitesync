import { LocalNotifications, type LocalNotificationSchema } from "@capacitor/local-notifications";
import { Preferences } from "@capacitor/preferences";
import { getPlannedWeekStarts } from "@/app/(app)/planner/upcoming-actions";
import type { PushPreferences } from "@/app/(app)/settings/push-actions";
import { NATIVE_WEEKLY_BODY, REMINDER_PAYLOADS, TEST_REMINDER_PAYLOAD } from "@/lib/push/reminderPayloads";
import { isNativeApp, OFFLINE_GROCERY_KEY } from "@/lib/native/bridge";
import {
  DAILY_REMINDER_HOUR,
  upcomingWeekStarts,
  WEEKLY_REMINDER_WEEKS,
  weeklyReminderTimes,
} from "@/lib/native/reminderSchedule";

/**
 * Reminders in the iPhone app. The app can't receive the site's web push, so
 * it schedules the same two reminders on the phone (lib/native/reminderSchedule.ts
 * says when). They're re-planned when the app opens or comes back to the front,
 * and after a plan changes in the app (refreshNativeReminders), which is how a
 * week planned since then loses its Sunday reminder. Client-side only.
 */

const PREFS_KEY = "reminders";
// Fixed ids, so re-planning replaces our reminders instead of stacking them.
const WEEKLY_IDS = Array.from({ length: WEEKLY_REMINDER_WEEKS }, (_, i) => 1001 + i); // one per Sunday
const DAILY_ID = 2001;
const TEST_ID = 2999;

export const NOTIFICATIONS_BLOCKED_MESSAGE =
  "Notifications are off for BiteSync. Turn them on in your iPhone's Settings → BiteSync → Notifications.";
const PLANNED_WEEKS_FAILED_MESSAGE = "Couldn't check which weeks you've planned. Please try again.";

// Every change to the schedule runs one after another. Otherwise a slow sync
// that started before "Turn off" could finish after it and bring reminders back.
let queue: Promise<unknown> = Promise.resolve();
function oneAtATime<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => {});
  return run;
}

/** Null until reminders are first turned on in the app. */
export async function getNativeReminderPrefs(): Promise<PushPreferences | null> {
  const { value } = await Preferences.get({ key: PREFS_KEY });
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<PushPreferences>;
    return {
      weeklyPlanReminder: parsed.weeklyPlanReminder === true,
      dailyLogReminder: parsed.dailyLogReminder === true,
    };
  } catch {
    return null;
  }
}

/** Whether the phone lets BiteSync notify; "prompt" means it hasn't asked yet. */
export async function nativeNotificationPermission(): Promise<"granted" | "denied" | "prompt"> {
  const { display } = await LocalNotifications.checkPermissions();
  if (display === "granted") return "granted";
  if (display === "denied") return "denied";
  return "prompt";
}

/** Asks the phone for permission, then saves the choice and schedules. Throws if notifications are blocked. */
export async function turnOnNativeReminders(prefs: PushPreferences): Promise<void> {
  const { display } = await LocalNotifications.requestPermissions();
  if (display !== "granted") throw new Error(NOTIFICATIONS_BLOCKED_MESSAGE);
  await saveNativeReminderPrefs(prefs);
}

/**
 * Saves the choice and re-plans. If the schedule can't be fully updated, the
 * previous choice is put back and this throws, so the screen never shows a
 * setting the phone isn't following.
 */
export function saveNativeReminderPrefs(prefs: PushPreferences): Promise<void> {
  return oneAtATime(async () => {
    const previous = await Preferences.get({ key: PREFS_KEY });
    await Preferences.set({ key: PREFS_KEY, value: JSON.stringify(prefs) });
    try {
      await plan(new Date());
    } catch (err) {
      if (previous.value) await Preferences.set({ key: PREFS_KEY, value: previous.value });
      else await Preferences.remove({ key: PREFS_KEY });
      await plan(new Date()).catch(() => {});
      throw err;
    }
  });
}

export function turnOffNativeReminders(): Promise<void> {
  return oneAtATime(async () => {
    await Preferences.remove({ key: PREFS_KEY });
    await cancelReminders();
  });
}

/** Re-plans from the saved choice. Rejects if the planned weeks couldn't be checked. */
export function syncNativeReminders(now = new Date()): Promise<void> {
  if (!isNativeApp()) return Promise.resolve();
  return oneAtATime(() => plan(now));
}

/** After a plan changes in the app: re-plan in the background, ignoring failures. */
export function refreshNativeReminders(): void {
  syncNativeReminders().catch(() => {
    // Offline or signed out: the next open or resume tries again.
  });
}

/**
 * Signing out or deleting the account: stop this phone's reminders and forget
 * the saved grocery list, so the next person to use the phone doesn't get them.
 */
export async function clearNativeAccountData(): Promise<void> {
  if (!isNativeApp()) return;
  await Promise.allSettled([
    turnOffNativeReminders(),
    Preferences.remove({ key: OFFLINE_GROCERY_KEY }),
    LocalNotifications.removeAllDeliveredNotifications(),
  ]);
}

async function cancelReminders(ids?: number[]): Promise<void> {
  const ours = new Set(ids ?? [...WEEKLY_IDS, DAILY_ID]);
  const { notifications } = await LocalNotifications.getPending();
  const pending = notifications.filter((n) => ours.has(n.id));
  if (pending.length) await LocalNotifications.cancel({ notifications: pending.map((n) => ({ id: n.id })) });
}

/**
 * A Sunday reminder before each of the next few weeks that is still empty, and
 * the evening one if it's on. Once the account can't plan (a trial that ended
 * without paying) there are no Sunday reminders, since planning needs Pro; the
 * evening one stays. If the planned weeks can't be fetched, the Sunday
 * reminders already scheduled are kept, the evening one is still updated, and
 * this rejects so a caller can say so.
 */
async function plan(now: Date): Promise<void> {
  const prefs = await getNativeReminderPrefs();
  if (!prefs || (await nativeNotificationPermission()) !== "granted") {
    await cancelReminders();
    return;
  }

  const notifications: LocalNotificationSchema[] = [];
  let weeklyFailed = false;

  if (prefs.weeklyPlanReminder) {
    const weeks = upcomingWeekStarts(now);
    const result = await getPlannedWeekStarts(weeks);
    if ("error" in result) {
      weeklyFailed = true;
    } else if ("canPlan" in result && result.canPlan === false) {
      // Nothing to schedule: the cancel below removes any Sunday reminders left.
    } else {
      const planned = new Set(result.planned);
      const { title, url } = REMINDER_PAYLOADS.weekly;
      const until = "planUntil" in result && result.planUntil ? Date.parse(result.planUntil) : Infinity;
      // Copy that stays true if the week gets planned elsewhere before Sunday.
      weeklyReminderTimes(
        now,
        weeks.filter((w) => !planned.has(w)),
      )
        .filter(({ at }) => at.getTime() < until)
        .forEach(({ at }, i) => {
          notifications.push({
            id: WEEKLY_IDS[i]!,
            title,
            body: NATIVE_WEEKLY_BODY,
            schedule: { at, allowWhileIdle: true },
            extra: { url },
          });
        });
    }
  }

  if (prefs.dailyLogReminder) {
    const { title, body, url } = REMINDER_PAYLOADS.daily;
    notifications.push({
      id: DAILY_ID,
      title,
      body,
      schedule: { on: { hour: DAILY_REMINDER_HOUR, minute: 0 }, allowWhileIdle: true },
      extra: { url },
    });
  }

  await cancelReminders(weeklyFailed ? [DAILY_ID] : undefined);
  if (notifications.length) await LocalNotifications.schedule({ notifications });
  if (weeklyFailed) throw new Error(PLANNED_WEEKS_FAILED_MESSAGE);
}

/** The "Send test" button: a reminder five seconds from now. */
export async function sendTestNativeReminder(): Promise<void> {
  const { title, body, url } = TEST_REMINDER_PAYLOAD;
  await LocalNotifications.schedule({
    notifications: [{ id: TEST_ID, title, body, schedule: { at: new Date(Date.now() + 5000) }, extra: { url } }],
  });
}

/**
 * Opens the page a reminder points to when it's tapped. The phone holds the
 * tap until this listener is added, so it also works when the tap launched
 * the app. Returns a function that removes the listener.
 */
export function listenForReminderTaps(): () => void {
  const handle = LocalNotifications.addListener("localNotificationActionPerformed", ({ notification }) => {
    const url: unknown = notification.extra?.url;
    if (typeof url === "string" && url.startsWith("/") && !url.startsWith("//")) {
      window.location.assign(url);
    }
  });
  return () => {
    void handle.then((h) => h.remove());
  };
}
