"use client";

import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import { BellRing, EllipsisVertical, Share, SquarePlus } from "lucide-react";
import {
  getExistingSubscription,
  getPushSupport,
  serializeSubscription,
  subscribeToPush,
} from "@/lib/push/client";
import { savePushSubscription } from "@/app/(app)/settings/push-actions";
import { isNativeApp } from "@/lib/native/bridge";
import { getNativeReminderPrefs, nativeNotificationPermission, turnOnNativeReminders } from "@/lib/native/reminders";
import { hasInstallPrompt, promptInstall, subscribeInstallPrompt } from "@/lib/pwa/installPrompt";
import { installHelpFor, type InstallHelp } from "@/lib/pwa/platform";
import { isHabitCardSnoozed, snoozeHabitCard } from "@/lib/habit/snooze";
import { trackInstallOffer, trackReminderOffer } from "@/lib/analytics/events";
import { ds } from "@/lib/ui/classes";

type Placement = "welcome" | "today";

type View =
  | { kind: "hidden" }
  | { kind: "reminder"; install: InstallHelp; native?: boolean }
  | { kind: "install"; install: InstallHelp }
  | { kind: "done"; native?: boolean };

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function currentInstallHelp(): InstallHelp {
  return installHelpFor({
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints,
    standalone: isStandalone(),
    hasPrompt: hasInstallPrompt(),
  });
}

/**
 * Asks, once, for the two things that bring people back each week: a Sunday
 * reminder and BiteSync on their home screen. Only 1 account had reminders on
 * (Oct 2026); they were a toggle in Settings that nobody found. On iPhone the
 * home screen comes first, because Safari only allows notifications from
 * home-screen apps. In the iPhone app it only offers the reminder, which the
 * phone itself schedules. "Not now" hides it on this device for three weeks.
 */
export function WeeklyHabitCard({ placement }: { placement: Placement }) {
  const [view, setView] = useState<View>({ kind: "hidden" });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // Re-render when Chrome hands over its install dialog after load.
  const promptReady = useSyncExternalStore(subscribeInstallPrompt, hasInstallPrompt, () => false);

  useEffect(() => {
    let cancelled = false;
    async function decide(): Promise<View> {
      if (isHabitCardSnoozed(window.localStorage)) return { kind: "hidden" };
      if (isNativeApp()) {
        const [prefs, permission] = await Promise.all([
          getNativeReminderPrefs().catch(() => null),
          nativeNotificationPermission().catch(() => "prompt" as const),
        ]);
        if (prefs?.weeklyPlanReminder || permission === "denied") return { kind: "hidden" };
        return { kind: "reminder", install: "installed", native: true };
      }
      const install = currentInstallHelp();
      const support = getPushSupport();
      if (VAPID_PUBLIC_KEY && support.supported && Notification.permission !== "denied") {
        const existing = await getExistingSubscription().catch(() => null);
        if (!existing) return { kind: "reminder", install };
      }
      // iPhone in Safari: reminders need the home screen first.
      if (install !== "installed" && install !== "none") return { kind: "install", install };
      return { kind: "hidden" };
    }
    void decide().then((next) => {
      if (!cancelled) setView(next);
    });
    return () => {
      cancelled = true;
    };
  }, [promptReady]);

  if (view.kind === "hidden") return null;

  function notNow() {
    snoozeHabitCard(window.localStorage);
    if (view.kind === "reminder") trackReminderOffer(placement, "not_now");
    else trackInstallOffer(placement, "not_now");
    setView({ kind: "hidden" });
  }

  function turnOnReminder() {
    setError(null);
    startTransition(async () => {
      try {
        if (isNativeApp()) {
          const existing = await getNativeReminderPrefs();
          await turnOnNativeReminders({ dailyLogReminder: existing?.dailyLogReminder ?? false, weeklyPlanReminder: true });
          trackReminderOffer(placement, "on");
          setView({ kind: "done", native: true });
          return;
        }
        const sub = await subscribeToPush(VAPID_PUBLIC_KEY);
        const result = await savePushSubscription(serializeSubscription(sub), {
          weeklyPlanReminder: true,
          dailyLogReminder: false,
        });
        if ("error" in result) throw new Error(result.error);
        trackReminderOffer(placement, "on");
        const install = currentInstallHelp();
        setView(install === "prompt" || install === "android-steps" ? { kind: "install", install } : { kind: "done" });
      } catch (err) {
        trackReminderOffer(placement, "failed");
        setError(err instanceof Error ? err.message : "Couldn't turn reminders on. Please try again.");
      }
    });
  }

  function addToHomeScreen() {
    startTransition(async () => {
      const outcome = await promptInstall();
      trackInstallOffer(placement, outcome);
      if (outcome === "accepted") setView({ kind: "done" });
    });
  }

  if (view.kind === "done") {
    return (
      <div role="status" className={`mb-4 rounded-2xl px-4 py-3 text-sm ${ds.successCallout}`}>
        {view.native
          ? "You’re set. We’ll nudge you on Sunday afternoon to plan next week. Change it any time in Settings."
          : "You’re set. We’ll nudge you on Sunday if next week is still empty. Change it any time in Settings."}
      </div>
    );
  }

  const install = view.install;
  const isReminder = view.kind === "reminder";

  return (
    <article className={`${ds.card} mb-4 p-5`} aria-labelledby="habit-card-title">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-brand-subtle)]">
          {isReminder ? (
            <BellRing className="h-4 w-4 text-[var(--brand-primary)]" aria-hidden />
          ) : (
            <SquarePlus className="h-4 w-4 text-[var(--brand-primary)]" aria-hidden />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="habit-card-title" className="text-base font-bold text-[var(--text-primary)]">
            {isReminder ? "Want a nudge to plan next week?" : "Add BiteSync to your home screen"}
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {isReminder && view.native
              ? "One notification on Sunday afternoon. Tap it and, if next week is still empty, BiteSync plans it for you. Turn it off any time in Settings."
              : isReminder
              ? "One notification on Sunday afternoon, only if next week is still empty. Tap it and your week is planned. Turn it off any time in Settings."
              : install === "ios-steps"
                ? "It opens like an app, and on iPhone it’s what lets us send your Sunday reminder to plan next week."
                : "It opens like an app, so next week’s plan is one tap away."}
          </p>
        </div>
      </div>

      {!isReminder && install === "ios-steps" ? (
        <ol className="mt-3 space-y-1.5 rounded-xl bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text-secondary)]">
          <li className="flex items-center gap-2">
            <span className="font-semibold">1.</span> Tap
            <Share className="h-4 w-4 text-[var(--brand-primary)]" aria-label="Share" /> at the bottom of Safari
          </li>
          <li className="flex items-center gap-2">
            <span className="font-semibold">2.</span> Choose <span className="font-semibold">Add to Home Screen</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="font-semibold">3.</span> Open BiteSync from your home screen
          </li>
        </ol>
      ) : null}

      {!isReminder && install === "android-steps" ? (
        <p className="mt-3 flex flex-wrap items-center gap-1.5 rounded-xl bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text-secondary)]">
          Tap <EllipsisVertical className="h-4 w-4 text-[var(--brand-primary)]" aria-label="the menu button" /> in your
          browser, then <span className="font-semibold">Add to Home screen</span>.
        </p>
      ) : null}

      {error ? <p className={`mt-3 text-sm ${ds.errorText}`}>{error}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {isReminder ? (
          <button
            type="button"
            onClick={turnOnReminder}
            disabled={isPending}
            className={`${ds.primaryBtn} flex-1 disabled:opacity-70`}
          >
            {isPending ? "Turning on…" : "Yes, remind me"}
          </button>
        ) : install === "prompt" ? (
          <button
            type="button"
            onClick={addToHomeScreen}
            disabled={isPending}
            className={`${ds.primaryBtn} flex-1 disabled:opacity-70`}
          >
            Add to home screen
          </button>
        ) : null}
        <button type="button" onClick={notNow} className={`${ds.secondaryBtn} ${isReminder || install === "prompt" ? "" : "flex-1"}`}>
          {isReminder || install === "prompt" ? "Not now" : "Got it"}
        </button>
      </div>
    </article>
  );
}
