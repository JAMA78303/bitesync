import { ds } from "@/lib/ui/classes";

export default function PantryLoading() {
  return (
    <div className={`${ds.mobilePage} ${ds.pageContent} animate-pulse`}>
      <div className={ds.gradientHeaderCompact}>
        <div className="mb-2 h-7 w-28 rounded bg-[var(--header-stat-bg)]" />
        <div className="h-4 w-56 rounded bg-[var(--header-stat-bg)]" />
      </div>

      <div className={`${ds.mobileGutter} ${ds.overlap} space-y-4`}>
        <div className={`${ds.card} p-4`}>
          <div className="mb-3 h-5 w-40 rounded bg-[var(--surface-muted)]" />
          <div className="h-24 rounded-xl bg-[var(--surface-muted)]" />
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="h-8 w-24 rounded-full bg-[var(--surface-muted)]" />
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-14 rounded-2xl bg-[var(--surface-muted)]" />
          ))}
        </div>
      </div>
    </div>
  );
}
