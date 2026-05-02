import { ConfidenceBadge } from "@/components/grocery/ConfidenceBadge";
import { FreshnessBadge } from "@/components/grocery/FreshnessBadge";
import type { StoreTotal } from "@/lib/pricing/types";

type Props = {
  storeTotals: StoreTotal[];
};

export function StoreComparisonPanel({ storeTotals }: Props) {
  if (!storeTotals.length) return null;

  const ordered = [...storeTotals].sort((a, b) => a.total - b.total);
  const best = ordered[0];

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-800">Store comparison</p>
      {ordered.map((s) => (
        <div key={s.store} className="rounded-lg border border-slate-100 px-3 py-2">
          <p className="text-sm font-medium text-slate-700">
            {s.store.toUpperCase()} ~£{s.total.toFixed(2)}
            {s.store === best.store ? <span className="ml-2 text-xs text-emerald-700">best</span> : null}
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            <FreshnessBadge freshnessDays={s.freshnessDays} />
            <ConfidenceBadge confidence={s.certainty} />
          </div>
        </div>
      ))}
    </div>
  );
}
