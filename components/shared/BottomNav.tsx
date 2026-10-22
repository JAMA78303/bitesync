"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
 CalendarDays,
 Leaf,
 Home,
 MoreHorizontal,
 Package,
 Settings,
 ShoppingBasket,
 BarChart2,
 Target,
} from "lucide-react";
import { isActivePath } from "@/components/shared/appNav";
import { MobileNavMoreSheet } from "@/components/shared/MobileNavMoreSheet";

/**
 * Five tabs, the most a phone tab bar holds comfortably. Seven squeezed each
 * item to ~46px at 375px, labels had to be cut ("Nutrition" became "Stats")
 * and the icons crowded together. The four screens people use every week —
 * Today, Plan, Recipes, Grocery — keep their own tab; the rest sit behind
 * More, which is labelled and lights up when you're on one of its screens,
 * so nothing is hidden behind an unlabelled overflow button.
 *
 * Pantry is also linked from the grocery list, which it feeds, and Settings
 * from the account button in the top bar.
 */
const PRIMARY_ITEMS = [
 { href:"/today", label:"Today", Icon: Home },
 { href:"/planner", label:"Plan", Icon: CalendarDays },
 { href:"/recipes", label:"Recipes", Icon: Leaf },
 { href:"/grocery", label:"Grocery", Icon: ShoppingBasket },
] as const;

const MORE_ITEMS = [
 { href:"/goals", label:"Goals", Icon: Target },
 { href:"/nutrition", label:"Nutrition", Icon: BarChart2 },
 { href:"/pantry", label:"Pantry", Icon: Package },
 { href:"/settings", label:"Settings", Icon: Settings },
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
 const pathname = usePathname() ??"";
 const keyboardOpen = useKeyboardOpen();
 const [moreOpen, setMoreOpen] = useState(false);
 const closeMore = useCallback(() => setMoreOpen(false), []);
 const moreActive = MORE_ITEMS.some(({ href }) => isActivePath(pathname, href));

 if (keyboardOpen) return null;

 return (
 <>
 <div className="app-mobile-nav-wrap">
 <nav className="app-mobile-nav" aria-label="Main navigation">
 {PRIMARY_ITEMS.map(({ href, label, Icon }) => {
 const isActive = isActivePath(pathname, href);

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
 <button
 type="button"
 className="app-mobile-nav-item"
 data-active={moreActive ? "true" : undefined}
 aria-haspopup="dialog"
 aria-expanded={moreOpen}
 onClick={() => setMoreOpen(true)}
 >
 <MoreHorizontal className="h-5 w-5 shrink-0" strokeWidth={moreActive ? 2.2 : 1.8} aria-hidden />
 <small>More</small>
 </button>
 </nav>
 </div>
 <MobileNavMoreSheet items={MORE_ITEMS} open={moreOpen} onClose={closeMore} />
 </>
 );
}
