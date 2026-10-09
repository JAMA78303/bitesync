import type { LucideIcon } from "lucide-react";

/**
 * The small icon tile at the start of a list row (Settings, Goals, the More
 * sheet). Replaces emoji, which looked different on every phone and out of
 * place in the rest of the design.
 */
export function RowIcon({ Icon, className = "" }: { Icon: LucideIcon; className?: string }) {
  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-brand-subtle)] text-[var(--brand-primary)] ${className}`.trim()}
      aria-hidden
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
    </span>
  );
}
