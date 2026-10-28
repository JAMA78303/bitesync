"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import type { PushPreferences } from "@/app/(app)/settings/push-actions";
import {
  getNativeReminderPrefs,
  nativeNotificationPermission,
  NOTIFICATIONS_BLOCKED_MESSAGE,
  saveNativeReminderPrefs,
  sendTestNativeReminder,
  turnOffNativeReminders,
  turnOnNativeReminders,
} from "@/lib/native/reminders";
import { useToast } from "@/components/ui/use-toast";
import { ds } from "@/lib/ui/classes";

const DEFAULT_PREFS: PushPreferences = { weeklyPlanReminder: true, dailyLogReminder: false };

/**
 * The Reminders card inside the iPhone app. Same choices as the web version
 * (NotificationSettings), but the phone schedules them (lib/native/reminders.ts),
 * so there's no push subscription and nothing to add to the home screen.
 */
export function NativeReminderSettings() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [prefs, setPrefs] = useState<PushPreferences | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([getNativeReminderPrefs(), nativeNotificationPermission()])
      .then(([stored, permission]) => {
        if (cancelled) return;
        setBlocked(permission === "denied");
        setPrefs(permission === "granted" ? stored : null);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleEnable = useCallback(() => {
    startTransition(async () => {
      try {
        await turnOnNativeReminders(DEFAULT_PREFS);
        setPrefs(DEFAULT_PREFS);
        setBlocked(false);
        toast({ title: "Reminders on", description: "We'll nudge you on Sunday to plan your week." });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Please try again.";
        if (message === NOTIFICATIONS_BLOCKED_MESSAGE) setBlocked(true);
        toast({ title: "Couldn't turn on reminders", description: message, variant: "destructive" });
      }
    });
  }, [toast]);

  const handleToggle = useCallback(
    (key: keyof PushPreferences) => {
      if (!prefs) return;
      const next = { ...prefs, [key]: !prefs[key] };
      setPrefs(next);
      startTransition(async () => {
        try {
          await saveNativeReminderPrefs(next);
        } catch (err) {
          // saveNativeReminderPrefs has already put the saved choice back.
          setPrefs(prefs);
          toast({
            title: "Couldn't save",
            description: err instanceof Error ? err.message : "Please try again.",
            variant: "destructive",
          });
        }
      });
    },
    [prefs, toast],
  );

  const handleTest = useCallback(() => {
    startTransition(async () => {
      try {
        await sendTestNativeReminder();
        toast({ title: "Sent", description: "It arrives in about five seconds." });
      } catch {
        toast({ title: "Test failed", description: "Please try again.", variant: "destructive" });
      }
    });
  }, [toast]);

  const handleDisable = useCallback(() => {
    startTransition(async () => {
      await turnOffNativeReminders().catch(() => {});
      setPrefs(null);
      toast({ title: "Reminders off", description: "You won't get reminders on this phone." });
    });
  }, [toast]);

  if (!ready) return <p className="text-xs text-[var(--text-muted)]">Checking notification support…</p>;

  if (!prefs) {
    return (
      <>
        <p className="text-xs text-[var(--text-muted)]">
          {blocked
            ? NOTIFICATIONS_BLOCKED_MESSAGE
            : "A Sunday afternoon nudge to plan the week ahead."}
        </p>
        {blocked ? null : (
          <button
            type="button"
            onClick={handleEnable}
            disabled={isPending}
            className={`${ds.primaryBtn} px-4 py-2 text-sm disabled:opacity-60`}
          >
            {isPending ? "Turning on…" : "Turn on reminders"}
          </button>
        )}
      </>
    );
  }

  return (
    <>
      <label className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-[var(--border-subtle)] px-3 py-2">
        <span className="min-w-0">
          <span className="block text-sm font-medium text-[var(--text-primary)]">Plan your week</span>
          <span className="block text-xs text-[var(--text-muted)]">Sunday afternoon, to plan next week</span>
        </span>
        <input
          type="checkbox"
          checked={prefs.weeklyPlanReminder}
          onChange={() => handleToggle("weeklyPlanReminder")}
          disabled={isPending}
          className="mt-1 h-4 w-4 shrink-0 accent-[var(--brand-primary)]"
        />
      </label>

      <label className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-[var(--border-subtle)] px-3 py-2">
        <span className="min-w-0">
          <span className="block text-sm font-medium text-[var(--text-primary)]">Evening prep reminder</span>
          <span className="block text-xs text-[var(--text-muted)]">Each evening, showing tomorrow&apos;s plan</span>
        </span>
        <input
          type="checkbox"
          checked={prefs.dailyLogReminder}
          onChange={() => handleToggle("dailyLogReminder")}
          disabled={isPending}
          className="mt-1 h-4 w-4 shrink-0 accent-[var(--brand-primary)]"
        />
      </label>

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={handleTest}
          disabled={isPending}
          className="cursor-pointer rounded-xl border border-[var(--border-default)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-muted)] disabled:opacity-60"
        >
          Send test
        </button>
        <button
          type="button"
          onClick={handleDisable}
          disabled={isPending}
          className="cursor-pointer rounded-xl px-3 py-1.5 text-xs font-medium text-[var(--semantic-error-text)] transition-colors hover:bg-[var(--semantic-error-bg)] disabled:opacity-60"
        >
          Turn off on this phone
        </button>
      </div>
    </>
  );
}
