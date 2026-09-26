import type { ReactNode } from "react";

type Props = {
 children: ReactNode;
 className?: string;
 label?: string;
 /** Inner viewport width in px — must match capture width for 1:1 frame ratio. */
 innerWidthPx?: number;
};

export function PhoneFrame({ children, className ="", label, innerWidthPx = 390 }: Props) {
 const bezel = 10;
 const outerWidth = innerWidthPx + bezel * 2;
 // w-full is what makes max-w-full below mean "no wider than the space you're
 // given". Without it the wrapper shrink-wrapped the 410 px frame, so
 // max-w-full resolved to 410: the phone hung off both sides of a 375 px
 // screen (and the page scrolled sideways), and on desktop four of them in
 // 260 px columns overlapped and wrapped into a lopsided 3 + 1. The screens
 // inside are fluid, so the frame can shrink and they reflow.
 return (
 <div className={`flex w-full flex-col items-center ${className}`}>
 <div
 role={label ?"img" : undefined}
 aria-label={label}
 className="relative max-w-full rounded-[2.5rem] border-[5px] border-[var(--border-default)] bg-[var(--border-default)] p-1 shadow-xl shadow-black/10 dark:shadow-black/30"
 style={{ width: outerWidth }}
 >
 <div className="absolute top-2.5 left-1/2 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-[var(--border-default)]" />
 <div className="overflow-hidden rounded-[1.85rem] bg-[var(--surface-muted)]">{children}</div>
 </div>
 </div>
 );
}
