type Props = {
 bestStore: string | null;
 estimatedSavings: number | null;
};

export function SavingsSummary({ bestStore, estimatedSavings }: Props) {
 if (!bestStore || estimatedSavings == null) return null;

 return (
 <div className="rounded-xl border border-[var(--semantic-success-border)] bg-[var(--semantic-success-bg)] p-3">
 <p className="text-sm font-medium text-[var(--semantic-success-text)]">
 Potential savings: ~£{estimatedSavings.toFixed(2)}
 </p>
 <p className="text-xs text-[var(--semantic-success-text)]/90">Best current estimate at {bestStore.toUpperCase()}</p>
 </div>
 );
}
