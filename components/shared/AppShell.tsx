"use client";

import { usePathname } from "next/navigation";
import { AppTopBar } from "@/components/shared/AppTopBar";
import { BottomNav } from "@/components/shared/BottomNav";
import { Sidebar } from "@/components/shared/Sidebar";

type AppShellProps = {
  children: React.ReactNode;
  /** First letter of the account email, for the avatar button. */
  initial: string;
  isPro: boolean;
};

/** Routes whose page starts with a header card and sets its own gutters on mobile. */
function hasGradientHeader(pathname: string): boolean {
  const roots = ["/today", "/planner", "/recipes", "/grocery", "/nutrition", "/goals", "/pantry", "/settings", "/billing", "/sample-week"];
  return roots.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

export function AppShell({ children, initial, isPro }: AppShellProps) {
  const pathname = usePathname() ?? "";
  const gradientHeader = hasGradientHeader(pathname);

  return (
    <div className="app-frame">
      <Sidebar isPro={isPro} />
      <div className="app-main">
        <AppTopBar initial={initial} />
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
