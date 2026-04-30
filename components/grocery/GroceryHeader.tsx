import { GroceryProgressBar } from "@/components/grocery/GroceryProgressBar";
import type { ReactNode } from "react";

type Props = {
  weekLabel: string;
  total: number;
  checked: number;
  actions?: ReactNode;
};

export function GroceryHeader({ weekLabel, total, checked, actions }: Props) {
  return (
    <div className="sticky top-0 z-10 border-b border-slate-100 bg-white px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Grocery List</h1>
          <p className="mt-0.5 text-xs text-slate-400">{weekLabel}</p>
        </div>
        {actions}
      </div>
      <GroceryProgressBar total={total} checked={checked} />
    </div>
  );
}
