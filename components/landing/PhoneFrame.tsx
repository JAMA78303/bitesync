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
        className="relative w-[200px] rounded-[2rem] border-[5px] border-slate-300 bg-slate-300 p-1 shadow-xl shadow-black/10 sm:w-[220px] dark:border-gray-600 dark:bg-gray-700 dark:shadow-black/30"
      >
        <div className="absolute top-2 left-1/2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-slate-300 dark:bg-gray-600" />
        <div className="overflow-hidden rounded-[1.4rem] bg-gray-50">{children}</div>
      </div>
    </div>
  );
}
