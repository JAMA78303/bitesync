"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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

/** Focus on one of these opens the on-screen keyboard. */
function opensKeyboard(target: EventTarget | null): boolean {
 if (!(target instanceof HTMLElement)) return false;
 if (target.isContentEditable || target.tagName ==="TEXTAREA") return true;
 if (target.tagName !=="INPUT") return false;
 const type = (target as HTMLInputElement).type;
 return !["button","checkbox","radio","submit","reset","range","file","color"].includes(type);
}

/**
 * Whether a text field currently has focus — i.e. the keyboard is up.
 *
 * iOS Safari pins `position: fixed; bottom: 0` to the top of the on-screen
 * keyboard rather than the bottom of the screen, and keeps it there as the
 * page scrolls underneath. On the Recipes page that meant tapping search and
 * scrolling results left the nav floating at mid-screen. Native apps hide
 * the tab bar behind the keyboard; this does the same.
 */
function useKeyboardOpen(): boolean {
 const [open, setOpen] = useState(false);
 useEffect(() => {
 const onFocusIn = (e: FocusEvent) => {
 if (opensKeyboard(e.target)) setOpen(true);
 };
 const onFocusOut = (e: FocusEvent) => {
 if (opensKeyboard(e.target)) setOpen(false);
 };
 document.addEventListener("focusin", onFocusIn);
 document.addEventListener("focusout", onFocusOut);
 return () => {
 document.removeEventListener("focusin", onFocusIn);
 document.removeEventListener("focusout", onFocusOut);
 };
 }, []);
 return open;
}

export function BottomNav() {
 const pathname = usePathname();
 const [moreOpen, setMoreOpen] = useState(false);
 const keyboardOpen = useKeyboardOpen();
 const moreActive = MORE_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

 return (
 <>
 {!moreOpen && !keyboardOpen ? (
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
