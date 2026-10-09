"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
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

export function Sidebar({ isPro }: { isPro: boolean }) {
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
        {isPro ? null : (
          <div className="app-pro-card">
            <Sparkles className="h-4 w-4" aria-hidden />
            <div>
              <b>Upgrade to Pro</b>
              <small>Unlock micronutrients &amp; AI plans</small>
            </div>
            <Link href="/billing" className="app-pro-btn">
              View plan
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
