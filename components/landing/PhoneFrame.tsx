import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  label?: string;
};

export function PhoneFrame({ children, className = "", label }: Props) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div
        role={label ? "img" : undefined}
        aria-label={label}
        className="relative w-[200px] rounded-[2rem] border-[6px] border-slate-900 bg-slate-900 p-1 shadow-2xl shadow-black/25 sm:w-[220px]"
      >
        <div className="absolute top-2 left-1/2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-slate-900" />
        <div className="overflow-hidden rounded-[1.4rem] bg-gray-50">{children}</div>
      </div>
    </div>
  );
}
