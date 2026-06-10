import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className ="", ...props }: InputProps) {
 return (
 <input
 className={`h-10 w-full rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-sage)] focus:outline-none ${className}`}
 {...props}
 />
 );
}
