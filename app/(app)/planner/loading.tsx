export default function PlannerLoading() {
 return (
 <section className="space-y-4 animate-pulse">
 <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
 <div className="space-y-2">
 <div className="h-7 w-44 rounded bg-[var(--surface-muted)]" />
 <div className="h-4 w-64 rounded bg-[var(--surface-muted)]" />
 </div>
 <div className="h-10 w-52 rounded bg-[var(--surface-muted)]" />
 </div>
 <div className="h-20 rounded-xl bg-[var(--surface-muted)]" />
 <div className="grid grid-cols-4 gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-3 sm:grid-cols-8">
 {Array.from({ length: 32 }, (_, i) => (
 <div key={i} className="h-12 rounded bg-[var(--surface-muted)]" />
 ))}
 </div>
 </section>
 );
}
