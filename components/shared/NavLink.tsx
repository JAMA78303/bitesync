"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, CalendarDays, ChefHat, Home, Package, Settings, ShoppingBasket, Target } from "lucide-react";

type NavIcon ="today" |"planner" |"recipes" |"grocery" |"pantry" |"nutrition" |"goals" |"settings";

const iconMap = {
 today: Home,
 planner: CalendarDays,
 recipes: ChefHat,
 grocery: ShoppingBasket,
 pantry: Package,
 nutrition: Activity,
 goals: Target,
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
 prefetch={true}
 className={`flex items-center rounded-full font-medium transition ${
 compact ?"w-auto flex-col gap-1 px-2 py-1 text-xs" :"w-full gap-2 px-3 py-2 text-sm"
 } ${
 isActive
 ?"bg-[var(--brand-sage)] text-[var(--text-on-brand)]"
 :"text-[var(--text-secondary)] hover:bg-[var(--btn-secondary-hover)]"
 }`}
 >
 <Icon className={`shrink-0 text-current ${compact ?"h-5 w-5" :"h-4 w-4"}`} aria-hidden="true" />
 <span>{label}</span>
 </Link>
 );
}
