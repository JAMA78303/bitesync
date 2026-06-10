import Link from "next/link";
import { ds } from "@/lib/ui/classes";

export function GroceryEmptyState() {
 return (
 <div className={`${ds.card} flex flex-col items-center px-6 py-16 text-center`}>
 <div className="mb-4 text-5xl" aria-hidden>
 🛒
 </div>
 <h2 className="mb-1 text-base font-bold text-[var(--text-primary)]">No grocery list yet</h2>
 <p className="mb-6 max-w-xs text-sm text-[var(--text-muted)]">Add meals to your planner and generate your list</p>
 <Link href="/planner" className={ds.primaryBtn}>
 Go to planner
 </Link>
 </div>
 );
}
