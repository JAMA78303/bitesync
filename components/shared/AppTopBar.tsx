"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/shared/Logo";
import { pageTitleFor } from "@/components/shared/appNav";
import { ThemeSwitch } from "@/components/shared/ThemeSwitch";

export function AppTopBar({ initial }: { initial: string }) {
  const pathname = usePathname() ?? "";

  return (
    <header className="app-topbar">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="app-topbar-brand">
          <Logo size="sm" href="/today" />
        </span>
        <span className="app-topbar-title">{pageTitleFor(pathname)}</span>
      </div>
      <div className="app-topbar-right">
        <ThemeSwitch />
        <Link href="/settings" className="app-avatar" aria-label="Account settings" title="Account settings">
          {initial}
        </Link>
      </div>
    </header>
  );
}
