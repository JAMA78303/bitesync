import { GroceryListSkeleton } from "@/components/shared/skeletons";

export default function GroceryLoading() {
  return (
    <div className="animate-pulse">
      <div className="border-b border-slate-100 px-4 pb-3 pt-4 dark:border-gray-800">
        <div className="mb-1 h-6 w-32 rounded bg-slate-100 dark:bg-gray-800" />
        <div className="h-3 w-24 rounded bg-slate-100 dark:bg-gray-800" />
      </div>
      <GroceryListSkeleton />
    </div>
  );
}
