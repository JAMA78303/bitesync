import type { SubstitutionSuggestion } from "@/lib/pricing/types";

type Props = {
  suggestions: SubstitutionSuggestion[];
};

export function SubstitutionSuggestionsList({ suggestions }: Props) {
  if (!suggestions.length) return null;

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <p className="text-sm font-semibold text-slate-800 dark:text-gray-100">AI substitutions</p>
      {suggestions.map((s, idx) => (
        <div key={`${s.fromItem}-${idx}`} className="rounded-lg border border-slate-100 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/50">
          <p className="text-sm text-slate-700 dark:text-gray-200">
            Swap <strong>{s.fromItem}</strong> to <strong>{s.toItem}</strong>
          </p>
          <p className="text-xs text-slate-500 dark:text-gray-400">
            Save ~£{s.estimatedSavings.toFixed(2)} · {s.nutritionNote}
          </p>
        </div>
      ))}
    </div>
  );
}
