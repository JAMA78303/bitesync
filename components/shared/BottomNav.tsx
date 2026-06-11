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
} from "lucide-react";
import { MobileNavMoreSheet } from "@/components/shared/MobileNavMoreSheet";

const PRIMARY_ITEMS = [
 { href:"/today", label:"Home", Icon: Home },
 { href:"/planner", label:"Plan", Icon: CalendarDays },
 { href:"/recipes", label:"Recipes", Icon: ChefHat },
 { href:"/grocery", label:"Grocery", Icon: ShoppingCart },
 { href:"/nutrition", label:"Nutrition", Icon: BarChart2 },
] as const;

const MORE_PATHS = ["/pantry","/goals","/settings"];

export function BottomNav() {
 const pathname = usePathname();
 const [moreOpen, setMoreOpen] = useState(false);
 const moreActive = MORE_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

 return (
 <>
 {!moreOpen ? (
 <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
 <nav
 className="pointer-events-auto grid w-full max-w-md grid-cols-6 gap-0.5 rounded-[28px] bg-[var(--nav-bar-bg)] px-1.5 py-1.5 shadow-2xl shadow-black/25"
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
                className={`flex min-h-[48px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-[20px] px-1 py-1.5 transition-all duration-200 active:scale-95 ${
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
 className={`flex min-h-[48px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-[20px] px-1 py-1.5 transition-all duration-200 ${
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
