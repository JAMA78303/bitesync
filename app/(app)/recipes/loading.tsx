export default function RecipesLoading() {
 return (
 <section className="space-y-4 animate-pulse">
 <div className="space-y-2">
 <div className="h-7 w-36 rounded bg-[var(--surface-muted)]" />
 <div className="h-4 w-72 rounded bg-[var(--surface-muted)]" />
 </div>
 <div className="grid gap-3 md:grid-cols-2">
 {Array.from({ length: 6 }, (_, i) => (
 <div key={i} className="h-36 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)]" />
 ))}
 </div>
 </section>
 );
}
