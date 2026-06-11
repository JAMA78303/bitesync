import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export function GroceryDoneState() {
 return (
 <div className="mx-4 mt-4 flex items-center gap-3 rounded-xl border border-[var(--semantic-success-border)] bg-[var(--semantic-success-bg)] p-3">
 <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-brand-subtle)]">
 <CheckCircle2 className="h-5 w-5 text-[var(--brand-primary)]" />
 </div>
 <div className="min-w-0 flex-1">
 <h2 className="text-sm font-semibold text-[var(--text-secondary)]">All done!</h2>
 <p className="text-xs text-[var(--text-muted)]">You can still open and uncheck items below.</p>
 </div>
 <Link
 href="/planner"
 className="inline-flex h-8 items-center justify-center rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] px-3 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-muted)]"
 >
 Planner
 </Link>
 </div>
 );
}
