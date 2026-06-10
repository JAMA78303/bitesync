import type { ReactNode } from "react";

type Props = {
 children: ReactNode;
 className?: string;
 label?: string;
};

export function PhoneFrame({ children, className ="", label }: Props) {
 return (
 <div className={`flex flex-col items-center ${className}`}>
 <div
 role={label ?"img" : undefined}
 aria-label={label}
 className="relative w-[200px] rounded-[2rem] border-[5px] border-[var(--border-default)] bg-[var(--border-default)] p-1 shadow-xl shadow-black/10 sm:w-[220px] dark:shadow-black/30"
 >
 <div className="absolute top-2 left-1/2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-[var(--border-default)]" />
 <div className="overflow-hidden rounded-[1.4rem] bg-[var(--surface-muted)]">{children}</div>
 </div>
 </div>
 );
}
