"use client";

import { AlertTriangle, TrendingUp } from "lucide-react";
import { ds } from "@/lib/ui/classes";
import { GenerateMicroSnackButton } from "@/components/nutrition/GenerateMicroSnackButton";
import { getOverLimitBandLabel, getUnderTargetBandLabel } from "@/lib/nutrition/drv";
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
            className={`${ds.errorCallout} rounded-xl p-4`}
          >
 <div className="mb-2 flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold">Low {nutrient.label}</p>
                <p className="mt-0.5 text-xs opacity-80">
                  {nutrient.pct_label} — {getUnderTargetBandLabel(nutrient.traffic)}
                </p>
 </div>
 </div>
 {richFoods.length > 0 ? (
              <p className="ml-6 text-xs opacity-80">
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
 className={`${ds.warnCallout} rounded-xl p-4`}
 >
 <div className="mb-2 flex items-start gap-2">
 <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--semantic-warn-text)]" />
 <div>
 <p className="text-sm font-semibold">High {nutrient.label}</p>
                <p className="mt-0.5 text-xs opacity-80">
                  {nutrient.pct_label} — {getOverLimitBandLabel(nutrient.traffic)}
                </p>
 </div>
 </div>
 {tip ? <p className="ml-6 text-xs opacity-80">{tip}</p> : null}
 </div>
 );
 })}
 </div>
 );
}
