import type { ReactNode } from "react";
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
        <div>
          <h1 className={ds.pageTitle}>Grocery List</h1>
          <p className={`mt-0.5 text-xs ${ds.pageSubtitle}`}>{subtitle}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className={`${ds.headerStatCard} text-center`}>
            <p className={ds.headerStatValue}>
              {checked}/{total}
            </p>
            <p className={ds.headerStatLabel}>items</p>
          </div>
          {actions}
        </div>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/20 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-[var(--text-on-header)] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className={`mt-3 text-[10px] ${ds.headerStatLabel}`}>
        Quantities use shopping units (slices → loaf, cloves → bulb).
      </p>
    </header>
  );
}
