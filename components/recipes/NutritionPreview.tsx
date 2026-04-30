"use client";

import type { NutritionTotals } from "@/lib/nutrition/calculate";

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
    <aside className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Nutrition Preview</h2>
        <span className="text-xs font-medium text-gray-600">
          Total kcal intake: {display(totals.calories)} kcal
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <p className="rounded-md bg-gray-50 p-2">
          <span className="block text-gray-600">Calories</span>
          <span className="font-medium text-gray-900">{display(totals.calories)}</span>
        </p>
        <p className="rounded-md bg-gray-50 p-2">
          <span className="block text-gray-600">Protein (g)</span>
          <span className="font-medium text-gray-900">{display(totals.protein_g)}</span>
        </p>
        <p className="rounded-md bg-gray-50 p-2">
          <span className="block text-gray-600">Carbs (g)</span>
          <span className="font-medium text-gray-900">{display(totals.carbs_g)}</span>
        </p>
        <p className="rounded-md bg-gray-50 p-2">
          <span className="block text-gray-600">Fat (g)</span>
          <span className="font-medium text-gray-900">{display(totals.fat_g)}</span>
        </p>
        <p className="rounded-md bg-gray-50 p-2">
          <span className="block text-gray-600">Fibre (g)</span>
          <span className="font-medium text-gray-900">{display(totals.fibre_g)}</span>
        </p>
        <p className="rounded-md bg-gray-50 p-2">
          <span className="block text-gray-600">Sugar (g)</span>
          <span className="font-medium text-gray-900">{display(totals.sugar_g)}</span>
        </p>
        <p className="rounded-md bg-gray-50 p-2">
          <span className="block text-gray-600">Sodium (mg)</span>
          <span className="font-medium text-gray-900">{display(totals.sodium_mg)}</span>
        </p>
        <p className="rounded-md bg-gray-50 p-2">
          <span className="block text-gray-600">Saturated Fat (g)</span>
          <span className="font-medium text-gray-900">{display(totals.saturated_fat_g)}</span>
        </p>
      </div>
    </aside>
  );
}
