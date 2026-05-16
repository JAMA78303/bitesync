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
          <p className="mt-0.5 text-xs text-white/60">{subtitle}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="rounded-xl bg-white/15 px-3 py-1.5 text-center backdrop-blur-sm">
            <p className="text-sm font-bold text-white">
              {checked}/{total}
            </p>
            <p className="text-[9px] text-white/60">items</p>
          </div>
          {actions}
        </div>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/20">
        <div
          className="h-full rounded-full bg-white transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="mt-3 text-[10px] text-white/50">
        Quantities use shopping units (slices → loaf, cloves → bulb).
      </p>
    </header>
  );
}
