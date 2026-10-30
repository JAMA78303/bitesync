"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { trackUpgradePrompt } from "@/lib/analytics/events";
import { ds } from "@/lib/ui/classes";

type Props = {
  /** Where it's shown, for analytics: "today", "planner", "recipes"… */
  placement: string;
  title: string;
  body: string;
  /**
   * Inside the iPhone app: no price and no link to web checkout, which the
   * App Store doesn't allow until Pro is sold there (lib/native/server.ts).
   */
  native?: boolean;
  className?: string;
};

/**
 * The one upgrade prompt for trial and plan limits (lib/billing/access.ts),
 * so the wording and the analytics stay the same everywhere it appears.
 */
export function UpgradeCard({ placement, title, body, native = false, className = "" }: Props) {
  useEffect(() => {
    // Once per placement per visit, not on every render or refresh.
    const key = `bitesync:upgrade-viewed:${placement}`;
    try {
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "1");
    } catch {
      // Storage blocked: still count it.
    }
    trackUpgradePrompt(placement, "viewed");
  }, [placement]);

  return (
    <article className={`${ds.card} p-5 ${className}`} aria-labelledby={`upgrade-${placement}`}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-brand-subtle)]">
          <Sparkles className="h-4 w-4 text-[var(--brand-primary)]" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={`upgrade-${placement}`} className="text-base font-bold text-[var(--text-primary)]">
            {title}
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{body}</p>
        </div>
      </div>
      {native ? null : (
        <Link
          href="/billing"
          onClick={() => trackUpgradePrompt(placement, "clicked")}
          className={`${ds.primaryBtn} mt-4 flex w-full items-center justify-center`}
        >
          See BiteSync Pro
        </Link>
      )}
    </article>
  );
}
