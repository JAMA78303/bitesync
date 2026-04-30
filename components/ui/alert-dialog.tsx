"use client";

import type { ReactNode } from "react";

type BaseProps = { children: ReactNode };

export function AlertDialog({ children }: BaseProps) {
  return <>{children}</>;
}

export function AlertDialogContent({ children }: BaseProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-4 shadow-xl">{children}</div>
    </div>
  );
}

export function AlertDialogTitle({ children }: BaseProps) {
  return <h3 className="text-lg font-semibold text-gray-900">{children}</h3>;
}

export function AlertDialogDescription({ children }: BaseProps) {
  return <p className="mt-2 text-sm text-gray-600">{children}</p>;
}

export function AlertDialogFooter({ children }: BaseProps) {
  return <div className="mt-4 flex justify-end gap-2">{children}</div>;
}

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; className?: string };
export function AlertDialogAction({ children, className = "", ...props }: BtnProps) {
  return (
    <button
      className={`inline-flex h-9 items-center justify-center rounded-md bg-[var(--brand-sage)] px-3 text-sm font-medium text-white ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function AlertDialogCancel({ children, className = "", ...props }: BtnProps) {
  return (
    <button
      className={`inline-flex h-9 items-center justify-center rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-800 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
