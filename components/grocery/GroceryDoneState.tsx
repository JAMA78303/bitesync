import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export function GroceryDoneState() {
  return (
    <div className="mx-4 mt-4 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-3 dark:border-green-800/50 dark:bg-green-950/30">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D1FAE5] dark:bg-green-900/50">
        <CheckCircle2 className="h-5 w-5 text-[#1A4731] dark:text-green-300" />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">All done!</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">You can still open and uncheck items below.</p>
      </div>
      <Link
        href="/planner"
        className="inline-flex h-8 items-center justify-center rounded-md border border-gray-300 bg-white px-3 text-xs font-medium text-gray-800 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
      >
        Planner
      </Link>
    </div>
  );
}
