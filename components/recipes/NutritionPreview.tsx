"use client";

import type { NutritionTotals } from "@/lib/nutrition/calculate";
import { ds } from "@/lib/ui/classes";

type NutritionPreviewProps = {
 totals: NutritionTotals;
};

function formatValue(value: number): string {
 return Number.isFinite(value) ? value.toFixed(1) :"—";
}

export function NutritionPreview({ totals }: NutritionPreviewProps) {
 const approxPrefix = totals.coverage_pct < 100 && totals.coverage_pct > 0 ?"~" :"";
 const isEmpty = totals.coverage_pct === 0;

 function display(value: number): string {
 if (isEmpty) {
 return"—";
 }
 return approxPrefix + formatValue(value);
 }

 return (
 <aside className={`${ds.formCard} p-4`}>
 <div className="mb-3 flex items-center justify-between">
 <h2 className="text-lg font-semibold text-[var(--text-primary)]">Nutrition Preview</h2>
 <span className="text-xs font-medium text-[var(--text-muted)]">
 Total kcal intake: {display(totals.calories)} kcal
 </span>
 </div>
 <div className="grid grid-cols-2 gap-3 text-sm">
 <p className="rounded-md bg-[var(--surface-muted)] p-2 bg-[var(--surface-elevated)]">
 <span className="block text-[var(--text-muted)]">Calories</span>
 <span className="font-medium text-[var(--text-primary)]">{display(totals.calories)}</span>
 </p>
 <p className="rounded-md bg-[var(--surface-muted)] p-2 bg-[var(--surface-elevated)]">
 <span className="block text-[var(--text-muted)]">Protein (g)</span>
 <span className="font-medium text-[var(--text-primary)]">{display(totals.protein_g)}</span>
 </p>
 <p className="rounded-md bg-[var(--surface-muted)] p-2 bg-[var(--surface-elevated)]">
 <span className="block text-[var(--text-muted)]">Carbs (g)</span>
 <span className="font-medium text-[var(--text-primary)]">{display(totals.carbs_g)}</span>
 </p>
 <p className="rounded-md bg-[var(--surface-muted)] p-2 bg-[var(--surface-elevated)]">
 <span className="block text-[var(--text-muted)]">Fat (g)</span>
 <span className="font-medium text-[var(--text-primary)]">{display(totals.fat_g)}</span>
 </p>
 <p className="rounded-md bg-[var(--surface-muted)] p-2 bg-[var(--surface-elevated)]">
 <span className="block text-[var(--text-muted)]">Fibre (g)</span>
 <span className="font-medium text-[var(--text-primary)]">{display(totals.fibre_g)}</span>
 </p>
 <p className="rounded-md bg-[var(--surface-muted)] p-2 bg-[var(--surface-elevated)]">
 <span className="block text-[var(--text-muted)]">Sugar (g)</span>
 <span className="font-medium text-[var(--text-primary)]">{display(totals.sugar_g)}</span>
 </p>
 <p className="rounded-md bg-[var(--surface-muted)] p-2 bg-[var(--surface-elevated)]">
 <span className="block text-[var(--text-muted)]">Sodium (mg)</span>
 <span className="font-medium text-[var(--text-primary)]">{display(totals.sodium_mg)}</span>
 </p>
 <p className="rounded-md bg-[var(--surface-muted)] p-2 bg-[var(--surface-elevated)]">
 <span className="block text-[var(--text-muted)]">Saturated Fat (g)</span>
 <span className="font-medium text-[var(--text-primary)]">{display(totals.saturated_fat_g)}</span>
 </p>
 </div>
 </aside>
 );
}
