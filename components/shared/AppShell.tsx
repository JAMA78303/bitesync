"use client";

import { usePathname } from "next/navigation";
import { AppTopBar } from "@/components/shared/AppTopBar";
import { BottomNav } from "@/components/shared/BottomNav";
import { Sidebar } from "@/components/shared/Sidebar";
import type { Access } from "@/lib/billing/access";

/** What the sidebar and top bar say about the account's plan (lib/billing/access.ts). */
export type ShellPlan = Pick<Access, "plan" | "trialDaysLeft" | "canStartTrial" | "lapsed">;

type AppShellProps = {
  children: React.ReactNode;
  /** First letter of the account email, for the avatar button. */
  initial: string;
  /** Null when nobody is signed in. */
  plan: ShellPlan | null;
  /** Inside the iPhone app: plan status only, no upgrade buttons (App Store rules). */
  native: boolean;
};

/** Routes whose page starts with a header card and sets its own gutters on mobile. */
function hasGradientHeader(pathname: string): boolean {
  const roots = ["/today", "/planner", "/recipes", "/grocery", "/nutrition", "/goals", "/pantry", "/settings", "/billing", "/sample-week"];
  return roots.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

export function AppShell({ children, initial, plan, native }: AppShellProps) {
  const pathname = usePathname() ?? "";
  const gradientHeader = hasGradientHeader(pathname);

  return (
    <div className="app-frame">
      <Sidebar plan={plan} native={native} />
      <div className="app-main">
        <AppTopBar initial={initial} plan={plan} />
        <main
          className={`page-content flex-1 overflow-x-hidden ${gradientHeader ? "" : "app-mobile-gutter py-4 md:py-0"}`}
        >
          <div className="app-content">{children}</div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
