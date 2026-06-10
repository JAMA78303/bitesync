import { GroceryListSkeleton } from "@/components/shared/skeletons";

export default function GroceryLoading() {
 return (
 <div className="animate-pulse">
 <div className="border-b border-[var(--border-subtle)] px-4 pb-3 pt-4">
 <div className="mb-1 h-6 w-32 rounded bg-[var(--surface-muted)]" />
 <div className="h-3 w-24 rounded bg-[var(--surface-muted)]" />
 </div>
 <GroceryListSkeleton />
 </div>
 );
}
