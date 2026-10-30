"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/shared/Logo";
import type { ShellPlan } from "@/components/shared/AppShell";
import { pageTitleFor } from "@/components/shared/appNav";
import { ThemeSwitch } from "@/components/shared/ThemeSwitch";

/**
 * On phones (no sidebar), a small note while on a trial or once it has ended,
 * so the days left are never a surprise. Pro and the free plan show nothing.
 */
function trialNote(plan: ShellPlan | null): { short: string; full: string } | null {
  if (plan?.plan === "expired") {
    return plan.lapsed ? { short: "Pro ended", full: "Pro subscription ended" } : { short: "Trial ended", full: "Pro trial ended" };
  }
  if (plan?.plan !== "trial") return null;
  const n = plan.trialDaysLeft ?? 1;
  const days = `${n} ${n === 1 ? "day" : "days"}`;
  return { short: `Trial · ${days}`, full: `Pro trial · ${days} left` };
}

export function AppTopBar({ initial, plan }: { initial: string; plan: ShellPlan | null }) {
  const pathname = usePathname() ?? "";
  const note = trialNote(plan);

  return (
    <header className="app-topbar">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="app-topbar-brand">
          <Logo size="sm" href="/today" />
        </span>
        <span className="app-topbar-title">{pageTitleFor(pathname)}</span>
      </div>
      <div className="app-topbar-right">
        {note ? (
          // Phones only (the sidebar says it on desktop), and not below 360px
          // (22.5rem), where it would push the avatar off the bar.
          <Link
            href="/billing"
            aria-label={note.full}
            title={note.full}
            className="hidden h-9 items-center whitespace-nowrap rounded-full border border-[var(--border-default)] bg-[var(--surface-muted)] px-3 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--brand-primary)] min-[22.5rem]:max-md:inline-flex"
          >
            {note.short}
          </Link>
        ) : null}
        <ThemeSwitch />
        <Link href="/settings" className="app-avatar" aria-label="Account settings" title="Account settings">
          {initial}
        </Link>
      </div>
    </header>
  );
}
