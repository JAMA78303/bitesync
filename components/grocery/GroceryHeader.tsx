import { GroceryProgressBar } from "@/components/grocery/GroceryProgressBar";
import type { ReactNode } from "react";

type Props = {
  /** Week range, or selected days + range when the list was generated for part of the week */
  subtitle: string;
  total: number;
  checked: number;
  actions?: ReactNode;
};

export function GroceryHeader({ subtitle, total, checked, actions }: Props) {
  return (
    <div className="sticky top-0 z-10 border-b border-slate-100 bg-white px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Grocery List</h1>
          <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
        </div>
        {actions}
      </div>
      <GroceryProgressBar total={total} checked={checked} />
      <p className="mt-2 text-[11px] text-slate-500">
        Quantities are converted to shopping units (for example, slices {"->"} loaf and cloves {"->"} bulb).
      </p>
    </div>
  );
}
