export default function SettingsLoading() {
  return (
    <section className="mx-auto max-w-lg space-y-4 pb-20 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-32 rounded bg-slate-200" />
        <div className="h-4 w-56 rounded bg-slate-200" />
      </div>
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="h-32 rounded-xl border border-slate-200 bg-white dark:border-gray-800 dark:bg-gray-900" />
      ))}
    </section>
  );
}
