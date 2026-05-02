import { StoreComparisonPanel } from "@/components/grocery/StoreComparisonPanel";
import { SavingsSummary } from "@/components/grocery/SavingsSummary";
import type { StoreItemEstimate, StoreTotal } from "@/lib/pricing/types";

type Props = {
  liveStoreTotals: StoreTotal[];
  liveEstimates?: StoreItemEstimate[];
  /** Optional: last explicit AI grocery run (history only; totals above are live). */
  lastSnapshot?: {
    recommendedStore: string | null;
    estimatedTotalGbp: number | null;
    createdLabel: string;
  } | null;
};

export function GroceryBasketSnapshotSection({ liveStoreTotals, liveEstimates = [], lastSnapshot }: Props) {
  if (!liveStoreTotals.length) return null;

  const ordered = [...liveStoreTotals].sort((a, b) => a.total - b.total);
  const best = ordered[0];
  const secondBest = ordered[1];
  const estimatedSavings = best && secondBest ? Math.max(0, secondBest.total - best.total) : null;

  return (
    <section className="mt-8 space-y-3 border-t border-slate-100 px-4 pt-6">
      <div>
        <p className="text-sm font-semibold text-slate-800">Store price estimate</p>
        <p className="text-xs text-slate-500">Based on your current meal plan ingredients (updates when the plan changes).</p>
        {lastSnapshot?.createdLabel ? (
          <p className="mt-1 text-xs text-slate-400">
            Last AI grocery run: {lastSnapshot.createdLabel}
            {lastSnapshot.recommendedStore ? (
              <>
                {" "}
                · suggested <span className="font-medium uppercase">{lastSnapshot.recommendedStore}</span>
                {lastSnapshot.estimatedTotalGbp != null
                  ? ` ~£${Number(lastSnapshot.estimatedTotalGbp).toFixed(2)} at that time`
                  : null}
              </>
            ) : null}
          </p>
        ) : null}
      </div>
      <SavingsSummary bestStore={best?.store ?? null} estimatedSavings={estimatedSavings} />
      <StoreComparisonPanel storeTotals={liveStoreTotals} estimates={liveEstimates} />
    </section>
  );
}
