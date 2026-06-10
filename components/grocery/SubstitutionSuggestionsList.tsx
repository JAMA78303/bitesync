import type { SubstitutionSuggestion } from "@/lib/pricing/types";

type Props = {
 suggestions: SubstitutionSuggestion[];
};

export function SubstitutionSuggestionsList({ suggestions }: Props) {
 if (!suggestions.length) return null;

 return (
 <div className="space-y-2 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4">
 <p className="text-sm font-semibold text-[var(--text-primary)]">AI substitutions</p>
 {suggestions.map((s, idx) => (
 <div key={`${s.fromItem}-${idx}`} className="rounded-lg border border-[var(--border-subtle)] px-3 py-2 bg-[var(--surface-elevated)]">
 <p className="text-sm text-[var(--text-secondary)]">
 Swap <strong>{s.fromItem}</strong> to <strong>{s.toItem}</strong>
 </p>
 <p className="text-xs text-[var(--text-muted)]">
 Save ~£{s.estimatedSavings.toFixed(2)} · {s.nutritionNote}
 </p>
 </div>
 ))}
 </div>
 );
}
