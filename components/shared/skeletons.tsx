import { Skeleton } from "@/components/ui/skeleton";

export function PlannerSkeleton() {
 return (
 <div className="grid gap-3 md:grid-cols-7">
 {Array.from({ length: 7 }).map((_, i) => (
 <Skeleton key={`head-${i}`} className="h-12 w-full" />
 ))}
 {Array.from({ length: 21 }).map((_, i) => (
 <Skeleton key={`cell-${i}`} className={i % 7 === 0 ?"h-14 w-full" :"h-20 w-full"} />
 ))}
 </div>
 );
}

export function GroceryListSkeleton() {
 return (
 <div className="space-y-2 px-4 pt-4">
 {Array.from({ length: 8 }).map((_, i) => (
 <Skeleton key={i} className="h-[56px] w-full rounded-xl" />
 ))}
 </div>
 );
}
