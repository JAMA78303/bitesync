"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
 CalendarDays,
 Leaf,
 Home,
 ShoppingBasket,
 Target,
} from "lucide-react";

/**
 * Five tabs, and no "More". Seven made each tab ~46px wide on a 375px phone
 * with 10px labels: busy, and easy to tap the wrong one. A "More" sheet was
 * tried before and people couldn't find what was behind it (Goals and Pantry
 * were both moved out of one), so nothing hides behind an overflow button.
 *
 * Instead the two quieter screens live inside the one they belong to:
 * - Pantry is a List | Pantry switch on Grocery, the list it trims.
 * - Stats is the "This week" card on Today, where people check their day.
 * Those screens light up the tab they live under (`also`). Settings needs no
 * tab: it's the account button in the top bar.
 */
const PRIMARY_ITEMS = [
 { href:"/today", label:"Today", Icon: Home, also: ["/nutrition"] },
 { href:"/planner", label:"Plan", Icon: CalendarDays, also: [] },
 { href:"/recipes", label:"Recipes", Icon: Leaf, also: [] },
 { href:"/grocery", label:"Grocery", Icon: ShoppingBasket, also: ["/pantry"] },
 { href:"/goals", label:"Goals", Icon: Target, also: [] },
] as const;

function isUnder(pathname: string, href: string): boolean {
 return pathname === href || pathname.startsWith(`${href}/`);
}

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
 const keyboardOpen = useKeyboardOpen();

 if (keyboardOpen) return null;

 return (
 <div className="app-mobile-nav-wrap">
 <nav className="app-mobile-nav" aria-label="Main navigation">
 {PRIMARY_ITEMS.map(({ href, label, Icon, also }) => {
 const isActive = [href, ...also].some((path) => isUnder(pathname, path));

 return (
 <Link
 key={href}
 href={href}
 prefetch
 aria-current={isActive ? "page" : undefined}
 className="app-mobile-nav-item"
 >
 <Icon className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2.2 : 1.8} aria-hidden />
 <small>{label}</small>
 </Link>
 );
 })}
 </nav>
 </div>
 );
}
