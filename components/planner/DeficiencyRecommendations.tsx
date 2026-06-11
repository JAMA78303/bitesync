"use client";

import { AlertTriangle, TrendingUp } from "lucide-react";
import { ds } from "@/lib/ui/classes";
import { GenerateMicroSnackButton } from "@/components/nutrition/GenerateMicroSnackButton";
import { MICRO_RICH_FOODS } from "@/lib/nutrition/micro-rich-foods";
import type { NutrientResult } from "@/lib/supabase/nutrition";

const LIMIT_TIPS: Record<string, string> = {
 saturated_fat_g:"Try swapping butter for olive oil and choosing leaner cuts of meat.",
 salt_g:"Check stock cubes, soy sauce, and processed foods — these are the biggest sources.",
 sugar_g:"Watch yoghurts, sauces, and fruit juices — sugar hides in many packaged foods.",
};

type Props = {
 deficiencies: NutrientResult[];
 excesses: NutrientResult[];
};

export function DeficiencyRecommendations({ deficiencies, excesses }: Props) {
 if (!deficiencies.length && !excesses.length) {
 return (
 <div className="flex items-center gap-3 rounded-xl border border-[var(--brand-primary)] bg-[var(--surface-brand-subtle)] p-4 dark:border-[var(--semantic-success-border)] dark:bg-[var(--semantic-success-bg)]">
 <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--btn-primary-bg)]">
 <TrendingUp className="h-4 w-4 text-[var(--text-on-brand)]" />
 </div>
 <div>
 <p className="text-sm font-semibold text-[var(--brand-primary)]">Great nutrition this week</p>
 <p className="text-xs text-[var(--brand-primary)] opacity-70">All nutrients within healthy ranges</p>
 </div>
 </div>
 );
 }

 return (
 <div className="space-y-3">
 {deficiencies.map((nutrient) => {
 const richFoods = MICRO_RICH_FOODS[nutrient.key] ?? [];
 return (
 <div
 key={nutrient.key}
 className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/60 dark:bg-red-950/30"
 >
 <div className="mb-2 flex items-start gap-2">
 <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
 <div>
 <p className="text-sm font-semibold text-red-700 dark:text-red-300">Low {nutrient.label}</p>
 <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">
 {nutrient.pct_label} — below 70% of daily target
 </p>
 </div>
 </div>
 {richFoods.length > 0 ? (
 <p className="ml-6 text-xs text-red-600 dark:text-red-400">
 Add more: <span className="font-medium">{richFoods.slice(0, 3).join(",")}</span>
 </p>
 ) : null}
 <GenerateMicroSnackButton nutrientKey={nutrient.key} nutrientLabel={nutrient.label} />
 </div>
 );
 })}

 {excesses.map((nutrient) => {
 const tip = LIMIT_TIPS[nutrient.key];
 return (
 <div
 key={nutrient.key}
 className={ds.warnCallout + " p-4"}
 >
 <div className="mb-2 flex items-start gap-2">
 <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
 <div>
 <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">High {nutrient.label}</p>
 <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
 {nutrient.pct_label} — exceeding daily limit
 </p>
 </div>
 </div>
 {tip ? <p className="ml-6 text-xs text-amber-600 dark:text-amber-400">{tip}</p> : null}
 </div>
 );
 })}
 </div>
 );
}
