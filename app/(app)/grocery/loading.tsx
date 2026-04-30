import { GroceryListSkeleton } from "@/components/shared/skeletons";

export default function GroceryLoading() {
  return (
    <div>
      <div className="border-b border-slate-100 px-4 pb-3 pt-4">
        <div className="mb-1 h-6 w-32 animate-pulse rounded bg-slate-100" />
        <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
      </div>
      <GroceryListSkeleton />
    </div>
  );
}
