"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Bell } from "lucide-react";
import {
  getExistingSubscription,
  getPushSupport,
  serializeSubscription,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push/client";
import {
  deletePushSubscription,
  getPushPreferences,
  savePushSubscription,
  sendTestPushNotification,
  updatePushPreferences,
  type PushPreferences,
} from "@/app/(app)/settings/push-actions";
import { useToast } from "@/components/ui/use-toast";
import { ds } from "@/lib/ui/classes";

type Props = {
  vapidPublicKey: string;
};

const DEFAULT_PREFS: PushPreferences = { weeklyPlanReminder: true, dailyLogReminder: false };

export function NotificationSettings({ vapidPublicKey }: Props) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [ready, setReady] = useState(false);
  const [blockedReason, setBlockedReason] = useState<"unsupported" | "needs-install" | null>(null);
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<PushPreferences>(DEFAULT_PREFS);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const support = getPushSupport();
      if (!support.supported) {
        if (!cancelled) {
          setBlockedReason(support.reason);
          setReady(true);
        }
        return;
      }

      try {
        const sub = await getExistingSubscription();
        if (cancelled) return;
        if (!sub) {
          setReady(true);
          return;
        }
        setEndpoint(sub.endpoint);
        const stored = await getPushPreferences(sub.endpoint);
        if (cancelled) return;
        if ("success" in stored && stored.data) setPrefs(stored.data);
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleEnable = useCallback(() => {
    startTransition(async () => {
      try {
        const sub = await subscribeToPush(vapidPublicKey);
        const serialized = serializeSubscription(sub);
        const result = await savePushSubscription(serialized, DEFAULT_PREFS);
        if ("error" in result) {
          toast({ title: "Couldn't enable notifications", description: result.error, variant: "destructive" });
          return;
        }
        setEndpoint(serialized.endpoint);
        setPrefs(result.data ?? DEFAULT_PREFS);
        toast({ title: "Notifications on", description: "We'll nudge you on Sunday to plan your week." });
      } catch (err) {
        toast({
          title: "Couldn't enable notifications",
          description: err instanceof Error ? err.message : "Please try again.",
          variant: "destructive",
        });
      }
    });
  }, [toast, vapidPublicKey]);

  const handleDisable = useCallback(() => {
    startTransition(async () => {
      const removed = await unsubscribeFromPush();
      const target = removed ?? endpoint;
      if (target) await deletePushSubscription(target);
      setEndpoint(null);
      setPrefs(DEFAULT_PREFS);
      toast({ title: "Notifications off", description: "You won't get reminders on this device." });
    });
  }, [endpoint, toast]);

  const handleToggle = useCallback(
    (key: keyof PushPreferences) => {
      if (!endpoint) return;
      const next = { ...prefs, [key]: !prefs[key] };
      setPrefs(next);
      startTransition(async () => {
        const result = await updatePushPreferences(endpoint, next);
        if ("error" in result) {
          setPrefs(prefs);
          toast({ title: "Couldn't save", description: result.error, variant: "destructive" });
        }
      });
    },
    [endpoint, prefs, toast],
  );

  const handleTest = useCallback(() => {
    if (!endpoint) return;
    startTransition(async () => {
      const result = await sendTestPushNotification(endpoint);
      if ("error" in result) {
        toast({ title: "Test failed", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Sent", description: "Check your notifications." });
    });
  }, [endpoint, toast]);

  if (!vapidPublicKey) return null;

  return (
    <div className={`${ds.card} ${ds.cardPadding} space-y-3`}>
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 text-[var(--brand-primary)]" aria-hidden />
        <h2 className="text-sm font-bold text-[var(--text-primary)]">Reminders</h2>
      </div>

      {!ready ? (
        <p className="text-xs text-[var(--text-muted)]">Checking notification support…</p>
      ) : blockedReason === "needs-install" ? (
        <p className="text-xs text-[var(--text-muted)]">
          To get reminders on iPhone or iPad, add BiteSync to your Home Screen first (Share → Add to
          Home Screen), then open it from there.
        </p>
      ) : blockedReason === "unsupported" ? (
        <p className="text-xs text-[var(--text-muted)]">
          This browser doesn&apos;t support notifications. Try Chrome, Edge, or Firefox on desktop or Android.
        </p>
      ) : !endpoint ? (
        <>
          <p className="text-xs text-[var(--text-muted)]">
            A Sunday nudge to plan the week ahead — only sent when your next week is still empty.
          </p>
          <button
            type="button"
            onClick={handleEnable}
            disabled={isPending}
            className={`${ds.primaryBtn} px-4 py-2 text-sm disabled:opacity-60`}
          >
            {isPending ? "Enabling…" : "Turn on reminders"}
          </button>
        </>
      ) : (
        <>
          <label className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-[var(--border-subtle)] px-3 py-2">
            <span className="min-w-0">
              <span className="block text-sm font-medium text-[var(--text-primary)]">Plan your week</span>
              <span className="block text-xs text-[var(--text-muted)]">
                Sunday afternoon, only if next week is empty
              </span>
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
              <span className="block text-xs text-[var(--text-muted)]">Each evening, showing tomorrow's plan</span>
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
              Turn off on this device
            </button>
          </div>
        </>
      )}
    </div>
  );
}
