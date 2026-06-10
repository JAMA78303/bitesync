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
 const roots = ["/today","/planner","/recipes","/grocery","/nutrition","/goals","/pantry"];
 if (roots.some((r) => pathname === r || pathname.startsWith(`${r}/`))) return true;
 return pathname ==="/settings" || pathname.startsWith("/settings/");
}

export function AppShell({ children }: AppShellProps) {
 const pathname = usePathname() ??"";
 const gradientHeader = hasGradientHeader(pathname);

 return (
 <div className="flex min-h-screen overflow-x-hidden bg-[var(--surface-muted)] text-[var(--text-primary)]">
 <Sidebar />
 <div className="flex w-full flex-1 flex-col">
 {!gradientHeader ? (
 <header className="border-b border-[var(--border-default)] bg-[var(--surface-card)] px-4 py-3 md:hidden">
 <Logo size="sm" href="/today" />
 </header>
 ) : null}
 <main
 className={`page-content flex-1 overflow-x-hidden md:p-8 md:pb-8 ${
 gradientHeader ?"p-0 md:p-8" :"app-mobile-gutter py-4 md:p-8"
 }`}
 >
 {children}
 </main>
 <BottomNav />
 </div>
 </div>
 );
}
