"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import type { ShellPlan } from "@/components/shared/AppShell";
import { SETTINGS_ITEM, SIDEBAR_ITEMS, isActivePath, type AppNavItem } from "@/components/shared/appNav";

function SidebarLink({ item, pathname }: { item: AppNavItem; pathname: string }) {
  const { href, label, Icon } = item;
  return (
    <Link
      href={href}
      prefetch
      aria-current={isActivePath(pathname, href) ? "page" : undefined}
      className="app-nav-item"
    >
      <Icon className="h-[19px] w-[19px] shrink-0" strokeWidth={1.8} aria-hidden />
      <span>{label}</span>
    </Link>
  );
}

function daysLeft(days: number | null): string {
  const n = days ?? 1;
  return `${n} ${n === 1 ? "day" : "days"} left`;
}

/**
 * The plan, under Settings. Pro, and a trial with days to spare, are one quiet
 * line; the last two days of a trial, the free plan and an ended trial get the
 * upgrade card. In the iPhone app the card only says where the account stands,
 * with no upgrade button (App Store rules, lib/native/server.ts).
 */
function PlanStatus({ plan, native }: { plan: ShellPlan; native: boolean }) {
  const trialWithDaysToSpare = plan.plan === "trial" && (plan.trialDaysLeft ?? 0) > 2;
  const quiet =
    plan.plan === "pro" ? "Pro plan" : trialWithDaysToSpare ? `Pro trial · ${daysLeft(plan.trialDaysLeft)}` : null;

  if (quiet) {
    return (
      <Link
        href="/billing"
        className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-white/65 transition-colors hover:text-white"
      >
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-[var(--accent-lime)]" aria-hidden />
        {quiet}
      </Link>
    );
  }

  const card =
    plan.plan === "trial"
      ? {
          title: `Pro trial · ${daysLeft(plan.trialDaysLeft)}`,
          body: native ? "Every Pro feature is on." : "Upgrade to keep AI plans & micronutrients.",
          cta: "See Pro plans",
        }
      : plan.plan === "expired"
        ? {
            title: plan.lapsed ? "Pro ended" : "Trial ended",
            body: native ? "Your recipes and plans are still here." : "Your recipes and plans are still here. Upgrade to keep planning.",
            cta: "See Pro plans",
          }
        : {
            title: "Free plan",
            body: native
              ? null
              : plan.canStartTrial
                ? "Try Pro free for 7 days: AI plans & micronutrients."
                : "Upgrade for AI plans & micronutrients.",
            cta: plan.canStartTrial ? "Try Pro free" : "See Pro plans",
          };

  return (
    <div className="app-pro-card">
      <Sparkles className="h-4 w-4" aria-hidden />
      <div>
        <b>{card.title}</b>
        {card.body ? <small>{card.body}</small> : null}
      </div>
      {native ? null : (
        <Link href="/billing" className="app-pro-btn">
          {card.cta}
        </Link>
      )}
    </div>
  );
}

export function Sidebar({ plan, native }: { plan: ShellPlan | null; native: boolean }) {
  const pathname = usePathname() ?? "";

  return (
    <aside className="app-sidebar" aria-label="Sidebar">
      <div className="app-sidebar-logo">
        <Logo size="sm" href="/today" onDark />
      </div>
      <nav className="app-sidebar-nav" aria-label="Main navigation">
        {SIDEBAR_ITEMS.map((item) => (
          <SidebarLink key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>
      <div className="app-sidebar-bottom">
        <SidebarLink item={SETTINGS_ITEM} pathname={pathname} />
        {plan ? <PlanStatus plan={plan} native={native} /> : null}
      </div>
    </aside>
  );
}
