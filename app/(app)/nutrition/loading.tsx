export default function NutritionLoading() {
 return (
 <section className="space-y-4 pb-20 animate-pulse">
 <div className="space-y-2">
 <div className="h-7 w-44 rounded bg-[var(--surface-muted)]" />
 <div className="h-4 w-64 rounded bg-[var(--surface-muted)]" />
 </div>
 <div className="h-12 rounded-xl bg-[var(--surface-muted)]" />
 <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4">
 {Array.from({ length: 12 }, (_, i) => (
 <div key={i} className="mb-3 flex items-center gap-3 last:mb-0">
 <div className="h-2 w-2 rounded-full bg-[var(--surface-muted)]" />
 <div className="h-3 w-24 rounded bg-[var(--surface-muted)]" />
 <div className="h-2 flex-1 rounded bg-[var(--surface-muted)]" />
 <div className="h-4 w-20 rounded bg-[var(--surface-muted)]" />
 </div>
 ))}
 </div>
 </section>
 );
}
