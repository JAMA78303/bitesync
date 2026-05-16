"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, CalendarDays, Home, ShoppingCart, User } from "lucide-react";

const NAV_ITEMS = [
  { href: "/today", label: "Home", Icon: Home },
  { href: "/planner", label: "Plan", Icon: CalendarDays },
  { href: "/grocery", label: "Grocery", Icon: ShoppingCart },
  { href: "/nutrition", label: "Nutrition", Icon: BarChart2 },
  { href: "/settings", label: "Profile", Icon: User },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-6 md:hidden">
      <nav className="pointer-events-auto flex items-center gap-1 rounded-[28px] bg-[#2d4a32] px-3 py-2 shadow-2xl shadow-black/20 dark:bg-[#1a2e1d]">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              prefetch
              className={`flex min-w-[52px] flex-col items-center gap-0.5 rounded-[20px] px-3.5 py-2 transition-all duration-200 ${
                isActive ? "bg-white/15" : "hover:bg-white/8"
              }`}
            >
              <Icon
                className={`h-5 w-5 transition-colors ${isActive ? "text-white" : "text-white/50"}`}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isActive ? "text-white" : "text-white/50"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
