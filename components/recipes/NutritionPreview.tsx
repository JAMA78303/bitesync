"use client";

import type { NutritionTotals } from "@/lib/nutrition/calculate";
import { ds } from "@/lib/ui/classes";

type NutritionPreviewProps = {
  totals: NutritionTotals;
};

function formatValue(value: number): string {
  return Number.isFinite(value) ? value.toFixed(1) : "—";
}

export function NutritionPreview({ totals }: NutritionPreviewProps) {
  const approxPrefix = totals.coverage_pct < 100 && totals.coverage_pct > 0 ? "~" : "";
  const isEmpty = totals.coverage_pct === 0;

  function display(value: number): string {
    if (isEmpty) {
      return "—";
    }
    return approxPrefix + formatValue(value);
  }

  return (
    <aside className={`${ds.formCard} p-4`}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Nutrition Preview</h2>
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
          Total kcal intake: {display(totals.calories)} kcal
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <p className="rounded-md bg-gray-50 p-2 dark:bg-gray-800/80">
          <span className="block text-gray-600 dark:text-gray-400">Calories</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">{display(totals.calories)}</span>
        </p>
        <p className="rounded-md bg-gray-50 p-2 dark:bg-gray-800/80">
          <span className="block text-gray-600 dark:text-gray-400">Protein (g)</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">{display(totals.protein_g)}</span>
        </p>
        <p className="rounded-md bg-gray-50 p-2 dark:bg-gray-800/80">
          <span className="block text-gray-600 dark:text-gray-400">Carbs (g)</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">{display(totals.carbs_g)}</span>
        </p>
        <p className="rounded-md bg-gray-50 p-2 dark:bg-gray-800/80">
          <span className="block text-gray-600 dark:text-gray-400">Fat (g)</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">{display(totals.fat_g)}</span>
        </p>
        <p className="rounded-md bg-gray-50 p-2 dark:bg-gray-800/80">
          <span className="block text-gray-600 dark:text-gray-400">Fibre (g)</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">{display(totals.fibre_g)}</span>
        </p>
        <p className="rounded-md bg-gray-50 p-2 dark:bg-gray-800/80">
          <span className="block text-gray-600 dark:text-gray-400">Sugar (g)</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">{display(totals.sugar_g)}</span>
        </p>
        <p className="rounded-md bg-gray-50 p-2 dark:bg-gray-800/80">
          <span className="block text-gray-600 dark:text-gray-400">Sodium (mg)</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">{display(totals.sodium_mg)}</span>
        </p>
        <p className="rounded-md bg-gray-50 p-2 dark:bg-gray-800/80">
          <span className="block text-gray-600 dark:text-gray-400">Saturated Fat (g)</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">{display(totals.saturated_fat_g)}</span>
        </p>
      </div>
    </aside>
  );
}
