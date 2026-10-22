"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { isActivePath, type AppNavItem } from "@/components/shared/appNav";

type Props = {
 items: readonly AppNavItem[];
 open: boolean;
 onClose: () => void;
};

export function MobileNavMoreSheet({ items, open, onClose }: Props) {
 const pathname = usePathname() ??"";
 const closeRef = useRef<HTMLButtonElement>(null);

 useEffect(() => {
 if (!open) return;
 const opener = document.activeElement as HTMLElement | null;
 closeRef.current?.focus();
 const onKeyDown = (e: KeyboardEvent) => {
 if (e.key ==="Escape") onClose();
 };
 const prevOverflow = document.body.style.overflow;
 document.body.style.overflow ="hidden";
 document.addEventListener("keydown", onKeyDown);
 return () => {
 document.removeEventListener("keydown", onKeyDown);
 document.body.style.overflow = prevOverflow;
 opener?.focus?.();
 };
 }, [open, onClose]);

 if (!open) return null;

 return (
 <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true" aria-labelledby="mobile-more-title">
 <button
 type="button"
 tabIndex={-1}
 className="absolute inset-0 bg-black/50"
 aria-label="Close menu"
 onClick={onClose}
 />
 <div className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-[var(--border-default)] bg-[var(--surface-card)] pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl">
 <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
 <p id="mobile-more-title" className="text-sm font-semibold text-[var(--text-primary)]">More</p>
 <button
 ref={closeRef}
 type="button"
 onClick={onClose}
 className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--btn-secondary-hover)]"
 aria-label="Close"
 >
 <X className="h-5 w-5" aria-hidden />
 </button>
 </div>
 <nav className="p-2" aria-label="More navigation">
 {items.map(({ href, label, Icon }) => {
 const isActive = isActivePath(pathname, href);
 return (
 <Link
 key={href}
 href={href}
 onClick={onClose}
 aria-current={isActive ?"page" : undefined}
 className={`flex min-h-[48px] items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
 isActive
 ?"bg-[var(--surface-brand-subtle)] text-[var(--brand-primary)]"
 :"text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
 }`}
 >
 <Icon className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} aria-hidden />
 {label}
 </Link>
 );
 })}
 </nav>
 </div>
 </div>
 );
}
