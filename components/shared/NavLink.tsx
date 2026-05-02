"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ChefHat, CreditCard, ShoppingBasket, Settings } from "lucide-react";

type NavIcon = "planner" | "recipes" | "grocery" | "billing" | "settings";

const iconMap = {
  planner: CalendarDays,
  recipes: ChefHat,
  grocery: ShoppingBasket,
  billing: CreditCard,
  settings: Settings,
} as const;

type NavLinkProps = {
  href: string;
  label: string;
  icon: NavIcon;
  compact?: boolean;
};

export function NavLink({ href, label, icon, compact = false }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href);
  const Icon = iconMap[icon];

  return (
    <Link
      href={href}
      className={`flex items-center rounded-full font-medium transition ${
        compact ? "w-auto flex-col gap-1 px-2 py-1 text-xs" : "w-full gap-2 px-3 py-2 text-sm"
      } ${
        isActive
          ? "bg-[var(--brand-sage)] text-white"
          : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      <Icon className={`shrink-0 text-current ${compact ? "h-5 w-5" : "h-4 w-4"}`} aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}
