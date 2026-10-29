"use client";

import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, X } from "lucide-react";
import { startProTrial } from "@/app/(app)/billing/trial-actions";
import { UpgradeCard } from "@/components/billing/UpgradeCard";
import { trackTrialStarted, trackUpgradePrompt } from "@/lib/analytics/events";
import { TRIAL_DAYS, type Access } from "@/lib/billing/access";
import { toLocalISO } from "@/lib/utils/dates";
import { ds } from "@/lib/ui/classes";

type Props = {
  access: Pick<Access, "plan" | "trialDaysLeft" | "trialEndsAt" | "trialThen" | "canStartTrial">;
  /**
   * Inside the iPhone app: no price and no link to web checkout, which the
   * App Store doesn't allow until Pro is sold there (lib/native/server.ts).
   */
  native: boolean;
};

/** The last days of a trial, when the card stands out and links to Pro. */
const ENDING_DAYS = 2;
/** The local date the trial card was hidden on: "Hide for today". */
const HIDDEN_ON_KEY = "bitesync:trial-card-hidden-on";

function hiddenToday(): boolean {
  try {
    return window.localStorage.getItem(HIDDEN_ON_KEY) === toLocalISO(new Date());
  } catch {
    // Storage blocked: show it, it can be hidden again.
    return false;
  }
}

function hideForToday() {
  try {
    window.localStorage.setItem(HIDDEN_ON_KEY, toLocalISO(new Date()));
  } catch {
    // Nothing to do; it comes back on the next visit.
  }
}

function subscribeStorage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

/**
 * Whether the card was hidden today. Hidden until the browser has said, so
 * a card hidden this morning doesn't flash back on every visit.
 */
function useHiddenToday(): [boolean, () => void] {
  const stored = useSyncExternalStore(subscribeStorage, hiddenToday, () => true);
  const [hidden, setHidden] = useState(false);
  return [
    stored || hidden,
    () => {
      hideForToday();
      setHidden(true);
    },
  ];
}

/**
 * The trial on Today (lib/billing/access.ts): days left while it runs, the
 * one-time trial offer for accounts from before it launched, and the upgrade
 * card once a trial has ended. Nothing for Pro, or a free account that has
 * had its trial.
 */
export function TrialStatusCard({ access, native }: Props) {
  if (access.plan === "expired") {
    return (
      <UpgradeCard
        placement="today"
        title="Your 7-day Pro trial has ended"
        body={
          native
            ? "Everything you planned is still here, and you can still tick off meals and your grocery list. Planning new weeks needs BiteSync Pro."
            : "Everything you planned is still here, and you can still tick off meals and your grocery list. Upgrade to BiteSync Pro to plan new weeks."
        }
        native={native}
        className="mb-4"
      />
    );
  }
  if (access.plan === "trial" && access.trialDaysLeft != null) {
    return (
      <TrialDaysCard
        daysLeft={access.trialDaysLeft}
        endsAt={access.trialEndsAt}
        then={access.trialThen ?? "expired"}
        native={native}
      />
    );
  }
  if (access.plan === "free" && access.canStartTrial) {
    return <StartTrialCard native={native} />;
  }
  return null;
}

/** "Ends tomorrow at 14:05", in the browser's time zone. */
function endsLabel(endsAt: string | null): string | null {
  if (!endsAt) return null;
  const end = new Date(endsAt);
  if (Number.isNaN(end.getTime())) return null;
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const day =
    toLocalISO(end) === toLocalISO(now)
      ? "today"
      : toLocalISO(end) === toLocalISO(tomorrow)
        ? "tomorrow"
        : `on ${end.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}`;
  const time = end.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `Ends ${day} at ${time}`;
}

function TrialDaysCard({
  daysLeft,
  endsAt,
  then,
  native,
}: {
  daysLeft: number;
  endsAt: string | null;
  /** What the trial becomes without paying (Access.trialThen). */
  then: "free" | "expired";
  native: boolean;
}) {
  const [hidden, hide] = useHiddenToday();
  const ending = daysLeft <= ENDING_DAYS;
  const offerUpgrade = ending && !native;
  const placement = "today_trial_ending";

  useEffect(() => {
    if (hidden || !offerUpgrade) return;
    // Once per visit, as UpgradeCard counts it.
    const key = `bitesync:upgrade-viewed:${placement}`;
    try {
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "1");
    } catch {
      // Storage blocked: still count it.
    }
    trackUpgradePrompt(placement, "viewed");
  }, [hidden, offerUpgrade]);

  if (hidden) return null;
  const ends = endsLabel(endsAt);

  return (
    <article
      className={`mb-4 rounded-[20px] border bg-[var(--card-surface)] px-4 py-3.5 shadow-[var(--card-shadow)] ${
        ending ? "border-[var(--brand-primary)]" : "border-[var(--border-default)]"
      }`}
      aria-labelledby="trial-days-title"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-brand-subtle)]">
          <Sparkles className="h-4 w-4 text-[var(--brand-primary)]" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="trial-days-title" className="text-sm font-bold text-[var(--text-primary)]">
            <span className={ending ? "text-[var(--brand-primary)]" : ""}>
              {daysLeft} {daysLeft === 1 ? "day" : "days"} left
            </span>{" "}
            of your BiteSync Pro trial
          </h2>
          {ends ? <p className={`mt-0.5 ${ds.tierMeta}`}>{ends}</p> : null}
          {ending ? (
            <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
              {then === "free"
                ? native
                  ? "Afterwards you're back on the free plan. AI week plans, micronutrients and unlimited recipes are part of BiteSync Pro."
                  : "Afterwards you're back on the free plan. Upgrade to keep AI week plans, micronutrients and unlimited recipes."
                : native
                  ? "Your recipes and plans stay afterwards, but planning new weeks needs BiteSync Pro."
                  : "Your recipes and plans stay afterwards. Upgrade to keep planning, with AI week plans and micronutrients."}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={hide}
          aria-label="Hide for today"
          title="Hide for today"
          className="-mr-2 -mt-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
      {offerUpgrade ? (
        <Link
          href="/billing"
          onClick={() => trackUpgradePrompt(placement, "clicked")}
          className={`${ds.primaryBtn} mt-3 flex w-full items-center justify-center`}
        >
          See BiteSync Pro
        </Link>
      ) : null}
    </article>
  );
}

/** The one-time trial for accounts from before it launched; afterwards they're back on the free plan. */
function StartTrialCard({ native }: { native: boolean }) {
  const router = useRouter();
  const [hidden, hide] = useHiddenToday();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (hidden) return null;

  function start() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await startProTrial();
        if ("error" in result) {
          setError(result.error);
          return;
        }
        trackTrialStarted("legacy_opt_in");
        router.refresh();
      } catch {
        setError("Couldn't start your trial. Please try again.");
      }
    });
  }

  return (
    <article className={`${ds.card} mb-4 p-5`} aria-labelledby="start-trial-title">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-brand-subtle)]">
          <Sparkles className="h-4 w-4 text-[var(--brand-primary)]" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="start-trial-title" className="text-base font-bold text-[var(--text-primary)]">
            Try BiteSync Pro free for {TRIAL_DAYS} days
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            AI week plans, micronutrient analysis and unlimited recipes. When it ends you go back to the free plan and
            keep everything you&apos;ve added.{native ? "" : " No card needed."}
          </p>
        </div>
      </div>
      {error ? <p className={`mt-3 text-sm ${ds.errorText}`}>{error}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={start}
          disabled={isPending}
          className={`${ds.primaryBtn} flex-1 disabled:opacity-70`}
        >
          {isPending ? "Starting your trial…" : "Start free trial"}
        </button>
        <button type="button" onClick={hide} disabled={isPending} className={ds.secondaryBtn}>
          Not now
        </button>
      </div>
      {isPending ? (
        <p role="status" className="sr-only">
          Starting your trial
        </p>
      ) : null}
    </article>
  );
}
