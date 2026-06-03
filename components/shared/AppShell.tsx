"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/shared/BottomNav";
import { Sidebar } from "@/components/shared/Sidebar";
import { Logo } from "@/components/shared/Logo";

type AppShellProps = {
  children: React.ReactNode;
};

/** Routes that render their own full-bleed green gradient header on mobile. */
function hasGradientHeader(pathname: string): boolean {
  const roots = ["/today", "/planner", "/recipes", "/grocery", "/nutrition", "/goals"];
  if (roots.some((r) => pathname === r || pathname.startsWith(`${r}/`))) return true;
  return pathname === "/settings" || pathname.startsWith("/settings/");
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname() ?? "";
  const gradientHeader = hasGradientHeader(pathname);

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <Sidebar />
      <div className="flex w-full flex-1 flex-col">
        {!gradientHeader ? (
          <header className="border-b border-gray-200 bg-white px-4 py-3 md:hidden dark:border-gray-800 dark:bg-gray-950">
            <Logo size="sm" href="/today" />
          </header>
        ) : null}
        <main
          className={`page-content flex-1 md:p-8 md:pb-8 ${
            gradientHeader ? "p-0 md:p-8" : "p-4"
          }`}
        >
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
