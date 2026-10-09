"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
 CalendarDays,
 Leaf,
 Home,
 Package,
 ShoppingBasket,
 BarChart2,
 Target,
} from "lucide-react";

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
 *
 * Pantry was then the one screen left behind "More" (with Settings), and
 * people couldn't find it. It now takes More's place, next to Grocery, which
 * it feeds. Settings needs no tab: it's the account button in the top bar.
 */
const PRIMARY_ITEMS = [
 { href:"/today", label:"Today", Icon: Home },
 { href:"/planner", label:"Plan", Icon: CalendarDays },
 { href:"/recipes", label:"Recipes", Icon: Leaf },
 { href:"/grocery", label:"Grocery", Icon: ShoppingBasket },
 { href:"/pantry", label:"Pantry", Icon: Package },
 { href:"/nutrition", label:"Stats", Icon: BarChart2 },
 { href:"/goals", label:"Goals", Icon: Target },
] as const;

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
 {PRIMARY_ITEMS.map(({ href, label, Icon }) => {
 const isActive = pathname === href || pathname.startsWith(`${href}/`);

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
