import { LocalNotifications, type LocalNotificationSchema } from "@capacitor/local-notifications";
import { Preferences } from "@capacitor/preferences";
import { getPlannedWeekStarts } from "@/app/(app)/planner/upcoming-actions";
import { getFastingReminders } from "@/app/(app)/settings/fasting/actions";
import type { PushPreferences } from "@/app/(app)/settings/push-actions";
import { FASTING_REMINDER_DAYS } from "@/lib/fasting/reminderTimes";
import { NATIVE_WEEKLY_BODY, REMINDER_PAYLOADS, TEST_REMINDER_PAYLOAD } from "@/lib/push/reminderPayloads";
import { isNativeApp, OFFLINE_GROCERY_KEY } from "@/lib/native/bridge";
import { signOutOfPurchases } from "@/lib/native/purchases";
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
// Ramadan and other fasting days (lib/fasting/reminderTimes.ts): suhoor and
// "plan tomorrow's iftar", at most one of each a day for two weeks. With the
// four Sundays and the evening one that's 33 of iOS's 64 pending notifications.
const SUHOOR_IDS = Array.from({ length: FASTING_REMINDER_DAYS }, (_, i) => 3001 + i);
const IFTAR_PLAN_IDS = Array.from({ length: FASTING_REMINDER_DAYS }, (_, i) => 3101 + i);
const FASTING_IDS = [...SUHOOR_IDS, ...IFTAR_PLAN_IDS];
const GENERAL_IDS = [...WEEKLY_IDS, DAILY_ID];

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

/**
 * Turning on fasting reminders in Settings → Ramadan & fasting: asks the
 * phone once if it hasn't been asked. They follow the fasting settings, not
 * the weekly/evening reminder switch.
 */
export async function ensureNativeNotificationPermission(): Promise<boolean> {
  if (!isNativeApp()) return false;
  const current = await nativeNotificationPermission();
  if (current !== "prompt") return current === "granted";
  const { display } = await LocalNotifications.requestPermissions();
  return display === "granted";
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
    turnOffNativeReminders().then(() => oneAtATime(() => cancelReminders(FASTING_IDS))),
    Preferences.remove({ key: OFFLINE_GROCERY_KEY }),
    LocalNotifications.removeAllDeliveredNotifications(),
    signOutOfPurchases(),
  ]);
}

/** Cancels the given reminders; by default the Sunday and evening ones. */
async function cancelReminders(ids: number[] = GENERAL_IDS): Promise<void> {
  const ours = new Set(ids);
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
 *
 * Fasting reminders (suhoor, "plan tomorrow's iftar") follow the fasting
 * settings instead of the switch above, so they're planned even when the
 * Sunday and evening ones are off. If they can't be fetched, the ones already
 * scheduled are kept, quietly: the next open tries again.
 */
async function plan(now: Date): Promise<void> {
  const prefs = await getNativeReminderPrefs();
  if ((await nativeNotificationPermission()) !== "granted") {
    await cancelReminders([...GENERAL_IDS, ...FASTING_IDS]);
    return;
  }

  const notifications: LocalNotificationSchema[] = [];
  let weeklyFailed = false;

  if (prefs?.weeklyPlanReminder) {
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

  if (prefs?.dailyLogReminder) {
    const { title, body, url } = REMINDER_PAYLOADS.daily;
    notifications.push({
      id: DAILY_ID,
      title,
      body,
      schedule: { on: { hour: DAILY_REMINDER_HOUR, minute: 0 }, allowWhileIdle: true },
      extra: { url },
    });
  }

  const fasting = await fastingNotifications();
  if (fasting) notifications.push(...fasting);

  const keep = new Set([...(weeklyFailed ? WEEKLY_IDS : []), ...(fasting ? [] : FASTING_IDS)]);
  await cancelReminders([...GENERAL_IDS, ...FASTING_IDS].filter((id) => !keep.has(id)));
  if (notifications.length) await LocalNotifications.schedule({ notifications });
  if (weeklyFailed) throw new Error(PLANNED_WEEKS_FAILED_MESSAGE);
}

/** The next two weeks of fasting reminders, or null if they couldn't be fetched. */
async function fastingNotifications(): Promise<LocalNotificationSchema[] | null> {
  let result: Awaited<ReturnType<typeof getFastingReminders>>;
  try {
    result = await getFastingReminders();
  } catch {
    return null;
  }
  if ("error" in result) return null;
  let suhoor = 0;
  let iftarPlan = 0;
  return result.reminders.flatMap((r) => {
    const id = r.kind === "suhoor" ? SUHOOR_IDS[suhoor++] : IFTAR_PLAN_IDS[iftarPlan++];
    if (id == null) return [];
    return [{ id, title: r.title, body: r.body, schedule: { at: new Date(r.at), allowWhileIdle: true }, extra: { url: r.url } }];
  });
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
