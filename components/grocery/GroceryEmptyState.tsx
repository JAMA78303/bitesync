import Link from "next/link";
import { ShoppingCart } from "lucide-react";

export function GroceryEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
        <ShoppingCart className="h-8 w-8 text-slate-300" />
      </div>
      <h2 className="mb-1 text-base font-medium text-slate-600">No grocery list yet</h2>
      <p className="mb-6 max-w-xs text-sm text-slate-400">Add meals to your planner and generate your list</p>
      <Link
        href="/planner"
        className="inline-flex h-10 items-center justify-center rounded-md bg-[#1A4731] px-4 text-sm font-medium text-white transition-colors hover:bg-[#153928]"
      >
        Go to planner
      </Link>
    </div>
  );
}
