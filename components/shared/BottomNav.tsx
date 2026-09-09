"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
 CalendarDays,
 ChefHat,
 Home,
 MoreHorizontal,
 ShoppingCart,
 BarChart2,
 Target,
} from "lucide-react";
import { MobileNavMoreSheet } from "@/components/shared/MobileNavMoreSheet";

/**
 * Goals was behind the "More" sheet, so changing a calorie or protein target
 * — the numbers every other screen is measured against — took three taps
 * starting from an unlabelled overflow button. It is a primary destination.
 *
 * That makes seven columns. At the narrowest common phone (375px) the bar is
 * ~327px of usable track, so each item gets ~46px: still above the 44px
 * minimum touch target, and the 48px row height is unchanged. "Nutrition" is
 * the one label too wide to survive that at 10px, so it becomes "Stats" —
 * shortening a label is a smaller cost than burying a screen.
 */
const PRIMARY_ITEMS = [
 { href:"/today", label:"Home", Icon: Home },
 { href:"/planner", label:"Plan", Icon: CalendarDays },
 { href:"/recipes", label:"Recipes", Icon: ChefHat },
 { href:"/grocery", label:"Grocery", Icon: ShoppingCart },
 { href:"/nutrition", label:"Stats", Icon: BarChart2 },
 { href:"/goals", label:"Goals", Icon: Target },
] as const;

const MORE_PATHS = ["/pantry","/settings"];

export function BottomNav() {
 const pathname = usePathname();
 const [moreOpen, setMoreOpen] = useState(false);
 const moreActive = MORE_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

 return (
 <>
 {!moreOpen ? (
 <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
 <nav
 className="pointer-events-auto grid w-full max-w-md grid-cols-7 gap-0.5 rounded-2xl bg-[var(--nav-bar-bg)] px-1.5 py-1.5 shadow-2xl shadow-black/25"
 aria-label="Main navigation"
 >
 {PRIMARY_ITEMS.map(({ href, label, Icon }) => {
 const isActive = pathname === href || pathname.startsWith(`${href}/`);

 return (
 <Link
 key={href}
              href={href}
                prefetch
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-[48px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 transition-all duration-200 active:scale-95 ${
 isActive ?"bg-[var(--surface-overlay)]/15" :"hover:bg-[var(--surface-overlay)]/8"
 }`}
 >
 <Icon
 className={`h-5 w-5 shrink-0 transition-colors ${isActive ?"text-[var(--text-on-header)]" :"text-[var(--text-on-header-muted)]"}`}
 strokeWidth={isActive ? 2.5 : 1.8}
 />
 <span
 className={`max-w-full truncate text-2xs font-medium leading-tight ${
 isActive ?"text-[var(--text-on-header)]" :"text-[var(--text-on-header-muted)]"
 }`}
 >
 {label}
 </span>
 </Link>
 );
 })}

 <button
 type="button"
 onClick={() => setMoreOpen(true)}
 className={`flex min-h-[48px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 transition-all duration-200 ${
 moreActive ?"bg-[var(--surface-overlay)]/15" :"hover:bg-[var(--surface-overlay)]/8"
 }`}
 aria-expanded={moreOpen}
 aria-haspopup="dialog"
 aria-label="More destinations"
 >
 <MoreHorizontal
 className={`h-5 w-5 shrink-0 ${moreActive ?"text-[var(--text-on-header)]" :"text-[var(--text-on-header-muted)]"}`}
 strokeWidth={moreActive ? 2.5 : 1.8}
 />
 <span
 className={`text-2xs font-medium leading-tight ${
 moreActive ?"text-[var(--text-on-header)]" :"text-[var(--text-on-header-muted)]"
 }`}
 >
 More
 </span>
 </button>
 </nav>
 </div>
 ) : null}
 <MobileNavMoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
 </>
 );
}
