export default function NutritionLoading() {
  return (
    <section className="space-y-4 pb-20 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-44 rounded bg-slate-200 dark:bg-gray-800" />
        <div className="h-4 w-64 rounded bg-slate-200 dark:bg-gray-800" />
      </div>
      <div className="h-12 rounded-xl bg-slate-100 dark:bg-gray-800" />
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="mb-3 flex items-center gap-3 last:mb-0">
            <div className="h-2 w-2 rounded-full bg-slate-200 dark:bg-gray-700" />
            <div className="h-3 w-24 rounded bg-slate-200 dark:bg-gray-700" />
            <div className="h-2 flex-1 rounded bg-slate-100 dark:bg-gray-800" />
            <div className="h-4 w-20 rounded bg-slate-100 dark:bg-gray-800" />
          </div>
        ))}
      </div>
    </section>
  );
}
