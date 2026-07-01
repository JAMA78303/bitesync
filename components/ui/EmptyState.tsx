import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ds } from "@/lib/ui/classes";

type ActionLink = { href: string; label: string; onClick?: never };
type ActionButton = { onClick: () => void; label: string; href?: never };
type Action = ActionLink | ActionButton;

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: Action;
  secondaryAction?: ActionLink;
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, action, secondaryAction, className = "" }: Props) {
  return (
    <div className={`${ds.card} flex flex-col items-center px-6 py-16 text-center ${className}`.trim()}>
      <div
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-navy-subtle)] text-[var(--brand-navy)] dark:bg-[var(--brand-navy-soft)] dark:text-[var(--text-on-header-muted)]"
        aria-hidden
      >
        <Icon className="h-7 w-7" strokeWidth={1.75} />
      </div>
      <h2 className={`mb-1 ${ds.tierPrimary}`}>{title}</h2>
      <p className={`mb-6 max-w-xs ${ds.tierMeta}`}>{description}</p>
      {action?.href ? (
        <Link href={action.href} className={ds.primaryBtn}>
          {action.label}
        </Link>
      ) : null}
      {action && !action.href ? (
        <button type="button" onClick={action.onClick} className={ds.primaryBtn}>
          {action.label}
        </button>
      ) : null}
      {secondaryAction ? (
        <Link
          href={secondaryAction.href}
          className="mt-3 text-sm font-medium text-[var(--brand-primary)] hover:underline"
        >
          {secondaryAction.label}
        </Link>
      ) : null}
    </div>
  );
}
