import Link from "next/link";
import type { ReactNode } from "react";
import { Package } from "lucide-react";
import { ds } from "@/lib/ui/classes";

type Props = {
 subtitle: string;
 total: number;
 checked: number;
 actions?: ReactNode;
};

export function GroceryHeader({ subtitle, total, checked, actions }: Props) {
 const pct = total > 0 ? (checked / total) * 100 : 0;

 return (
 <header className={ds.gradientHeader}>
 <div className="mb-1 flex items-start justify-between gap-3">
 <div className="min-w-0">
 <span className={ds.kicker}>SHOP ONCE</span>
 <h1 className={`mb-1.5 ${ds.pageTitle}`}>Grocery List</h1>
 <p className={ds.pageSubtitle}>{subtitle}</p>
 </div>
 <div className={`${ds.headerStatCard} shrink-0 text-center`}>
 <p className={ds.headerStatValue}>
 {checked}/{total}
 </p>
 <p className={ds.headerStatLabel}>ticked</p>
 </div>
 </div>

 <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/15">
 <div
 className="h-full rounded-full bg-[var(--accent-lime)] transition-all duration-500"
 style={{ width: `${pct}%` }}
 />
 </div>

 {actions ? <div className="mt-4">{actions}</div> : null}

 <p className={`mt-3 text-2xs ${ds.headerStatLabel}`}>
 Quantities use shopping units (slices → loaf, cloves → bulb).
 </p>
 {/* The pantry is what trims this list, so the way to it lives here too. */}
 <Link
 href="/pantry"
 className="mt-2 inline-flex min-h-8 items-center gap-1.5 text-xs font-semibold text-[var(--accent-lime)] underline-offset-2 hover:underline"
 >
 <Package className="h-3.5 w-3.5" aria-hidden />
 Pantry items are left off new lists · Manage pantry →
 </Link>
 </header>
 );
}
