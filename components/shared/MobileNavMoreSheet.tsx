"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Settings, X } from "lucide-react";

/** Goals moved into the primary bar — see the note in BottomNav. */
const MORE_ITEMS = [
 { href:"/pantry", label:"Pantry", Icon: Package },
 { href:"/settings", label:"Settings", Icon: Settings },
] as const;

type Props = {
 open: boolean;
 onClose: () => void;
};

export function MobileNavMoreSheet({ open, onClose }: Props) {
 const pathname = usePathname();

 if (!open) return null;

 return (
 <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true" aria-label="More navigation">
 <button
 type="button"
 className="absolute inset-0 bg-black/50"
 aria-label="Close menu"
 onClick={onClose}
 />
 <div className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-[var(--border-default)] bg-[var(--surface-card)] pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl">
 <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
 <p className="text-sm font-semibold text-[var(--text-primary)]">More</p>
 <button
 type="button"
 onClick={onClose}
 className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--btn-secondary-hover)]"
 aria-label="Close"
 >
 <X className="h-5 w-5" />
 </button>
 </div>
 <nav className="p-2">
 {MORE_ITEMS.map(({ href, label, Icon }) => {
 const isActive = pathname === href || pathname.startsWith(`${href}/`);
 return (
 <Link
 key={href}
 href={href}
 onClick={onClose}
 className={`flex min-h-[48px] items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
 isActive
 ?"bg-[var(--surface-brand-subtle)] text-[var(--brand-primary)]"
 :"text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
 }`}
 >
 <Icon className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
 {label}
 </Link>
 );
 })}
 </nav>
 </div>
 </div>
 );
}
