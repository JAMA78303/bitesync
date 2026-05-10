import { ConfidenceBadge } from "@/components/grocery/ConfidenceBadge";
import { FreshnessBadge } from "@/components/grocery/FreshnessBadge";
import { formatGroceryItem } from "@/lib/grocery/storeUnits";
import type { StoreItemEstimate, StoreTotal } from "@/lib/pricing/types";

type Props = {
  storeTotals: StoreTotal[];
  estimates?: StoreItemEstimate[];
};

function packNotesForStore(store: string, estimates: StoreItemEstimate[]): string[] {
  const lines: string[] = [];
  const seen = new Set<string>();
  for (const e of estimates) {
    if (e.store !== store || !e.displayNote?.trim()) continue;
    const label = formatGroceryItem(e.ingredientName, e.quantity, e.unit);
    const key = `${label}\0${e.displayNote}`;
    if (seen.has(key)) continue;
    seen.add(key);
    lines.push(`${label}: ${e.displayNote}`);
    if (lines.length >= 8) break;
  }
  return lines;
}

export function StoreComparisonPanel({ storeTotals, estimates = [] }: Props) {
  if (!storeTotals.length) return null;

  const ordered = [...storeTotals].sort((a, b) => a.total - b.total);
  const best = ordered[0];

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-800">Store comparison</p>
      {ordered.map((s) => {
        const notes = packNotesForStore(s.store, estimates);
        return (
          <div key={s.store} className="rounded-lg border border-slate-100 px-3 py-2">
            <p className="text-sm font-medium text-slate-700">
              {s.store.toUpperCase()} ~£{s.total.toFixed(2)}
              {s.store === best.store ? <span className="ml-2 text-xs text-emerald-700">best</span> : null}
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              <FreshnessBadge freshnessDays={s.freshnessDays} />
              <ConfidenceBadge confidence={s.certainty} />
            </div>
            {notes.length > 0 ? (
              <ul className="mt-2 list-inside list-disc space-y-0.5 text-[11px] leading-snug text-slate-500">
                {notes.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}
      <p className="text-[11px] leading-snug text-slate-400">
        * Estimated pack quantities. Actual cost may vary by store and pack size available.
      </p>
    </div>
  );
}
