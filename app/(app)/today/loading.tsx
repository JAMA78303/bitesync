import { ds } from "@/lib/ui/classes";

export default function TodayLoading() {
  return (
    <div className={`${ds.mobilePage} ${ds.pageContent} animate-pulse`}>
      <div className={ds.gradientHeaderCompact}>
        <div className="mb-2 h-4 w-40 rounded bg-[var(--header-stat-bg)]" />
        <div className="h-7 w-32 rounded bg-[var(--header-stat-bg)]" />
      </div>

      <div className={`${ds.mobileGutter} ${ds.overlap}`}>
        <div className={`mb-4 ${ds.card} p-6`}>
          <div className="mb-6 flex items-center gap-6">
            <div className="h-28 w-28 rounded-full bg-[var(--surface-muted)]" />
            <div className="space-y-2">
              <div className="h-3 w-16 rounded bg-[var(--surface-muted)]" />
              <div className="h-7 w-28 rounded bg-[var(--surface-muted)]" />
              <div className="h-3 w-24 rounded bg-[var(--surface-muted)]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-12 rounded-lg bg-[var(--surface-muted)]" />
            ))}
          </div>
        </div>

        <div className="mb-3 h-5 w-36 rounded bg-[var(--surface-muted)]" />
        <div className="space-y-2">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-[var(--surface-muted)]" />
          ))}
        </div>
      </div>
    </div>
  );
}
