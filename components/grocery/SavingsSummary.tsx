type Props = {
  bestStore: string | null;
  estimatedSavings: number | null;
};

export function SavingsSummary({ bestStore, estimatedSavings }: Props) {
  if (!bestStore || estimatedSavings == null) return null;

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/35">
      <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
        Potential savings: ~£{estimatedSavings.toFixed(2)}
      </p>
      <p className="text-xs text-emerald-800 dark:text-emerald-200/90">Best current estimate at {bestStore.toUpperCase()}</p>
    </div>
  );
}
