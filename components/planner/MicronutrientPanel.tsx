import { Info } from "lucide-react";
import { CofidAttribution } from "@/components/nutrition/CofidAttribution";
import { ds } from "@/lib/ui/classes";
import type { MicroAnalysis, NutrientResult } from "@/lib/supabase/nutrition";

type Props = {
  analysis: MicroAnalysis;
};

export function MicronutrientPanel({ analysis }: Props) {
  return (
    <div className={`overflow-hidden rounded-xl ${ds.card}`}>
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Weekly nutrition analysis</h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Based on UK Government dietary reference values
          </p>
        </div>
        <a
          href="https://www.gov.uk/government/publications/sacn-dietary-reference-values-for-energy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400"
        >
          <Info className="h-4 w-4" />
        </a>
      </div>

      <div className="p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Daily targets (avg per day this week)
        </p>
        <div className="space-y-2">
          {analysis.must_hit.map((nutrient) => (
            <NutrientRow key={nutrient.key} nutrient={nutrient} />
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100 px-5 pb-5 pt-5 dark:border-gray-800">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Daily limits (must not exceed)
        </p>
        <div className="space-y-2">
          {analysis.must_limit.map((nutrient) => (
            <NutrientRow key={nutrient.key} nutrient={nutrient} />
          ))}
        </div>
      </div>

      <div className="space-y-3 px-5 pb-4">
        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
          Source: UK SACN Dietary Reference Values · NHS guidelines for sat fat, salt and sugar
        </p>
        <CofidAttribution className="text-center text-gray-400 dark:text-gray-500" />
      </div>
    </div>
  );
}

function NutrientRow({ nutrient }: { nutrient: NutrientResult }) {
  const { label, daily_avg, unit, rni, upper, type, traffic, pct_label } = nutrient;
  const target = type === "limit" ? (upper ?? 0) : (rni ?? 0);
  const pct = target > 0 ? Math.min((daily_avg / target) * 100, 150) : 0;

  const colours = {
    green: {
      bar: "bg-green-500",
      badge: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    },
    amber: {
      bar: "bg-amber-400",
      badge: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    },
    red: {
      bar: "bg-red-500",
      badge: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    },
  }[traffic];

  return (
    <div className="flex items-center gap-3">
      <div
        className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${
          traffic === "green" ? "bg-green-500" : traffic === "amber" ? "bg-amber-400" : "bg-red-500"
        }`}
      />
      <span className="w-28 flex-shrink-0 text-sm text-gray-700 dark:text-gray-300">{label}</span>
      <div className="h-1.5 flex-1 rounded-full bg-gray-100 dark:bg-gray-800">
        <div className={`h-1.5 rounded-full transition-all ${colours.bar}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="w-20 text-right text-xs text-gray-500 dark:text-gray-400">
        {daily_avg.toFixed(1)}
        {unit}
      </span>
      <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs ${colours.badge}`}>{pct_label}</span>
    </div>
  );
}
