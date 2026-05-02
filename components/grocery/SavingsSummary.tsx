type Props = {
  bestStore: string | null;
  estimatedSavings: number | null;
};

export function SavingsSummary({ bestStore, estimatedSavings }: Props) {
  if (!bestStore || estimatedSavings == null) return null;

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
      <p className="text-sm font-medium text-emerald-900">
        Potential savings: ~£{estimatedSavings.toFixed(2)}
      </p>
      <p className="text-xs text-emerald-800">Best current estimate at {bestStore.toUpperCase()}</p>
    </div>
  );
}
