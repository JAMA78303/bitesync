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
 <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
 <div>
 <h2 className="text-sm font-semibold text-[var(--text-primary)]">Weekly nutrition analysis</h2>
 <p className="mt-0.5 text-xs text-[var(--text-muted)]">
 Based on UK Government dietary reference values · free sugars exclude whole fruit and milk lactose
 </p>
 </div>
 <a
 href="https://www.gov.uk/government/publications/sacn-dietary-reference-values-for-energy"
 target="_blank"
 rel="noopener noreferrer"
 className="text-[var(--text-muted)] hover:text-[var(--text-muted)] dark:hover:text-[var(--text-muted)]"
 >
 <Info className="h-4 w-4" />
 </a>
 </div>

 <div className="p-5">
 <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
 Daily targets (avg per day this week)
 </p>
 <div className="space-y-2">
 {analysis.must_hit.map((nutrient) => (
 <NutrientRow key={nutrient.key} nutrient={nutrient} />
 ))}
 </div>
 </div>

 <div className="border-t border-[var(--border-subtle)] px-5 pb-5 pt-5">
 <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
 Daily limits (must not exceed)
 </p>
 <div className="space-y-2">
 {analysis.must_limit.map((nutrient) => (
 <NutrientRow key={nutrient.key} nutrient={nutrient} />
 ))}
 </div>
 {analysis.covered_items < analysis.total_items ? (
 <p className="mt-3 text-xs text-[var(--text-muted)]">
 Partial estimate: {analysis.total_items - analysis.covered_items} of {analysis.total_items}{" "}
 ingredients this week have no nutrient data, so totals are a floor and may read higher.
 </p>
 ) : null}
 </div>

 <div className="space-y-3 px-5 pb-4">
 <p className="text-center text-xs text-[var(--text-muted)]">
 Source: UK SACN Dietary Reference Values · NHS guidelines for sat fat, salt and sugar
 </p>
 <CofidAttribution className="text-center text-[var(--text-muted)]" />
 </div>
 </div>
 );
}

function NutrientRow({ nutrient }: { nutrient: NutrientResult }) {
 const { label, daily_avg, unit, rni, upper, type, traffic, pct_label } = nutrient;
 const target = type ==="limit" ? (upper ?? 0) : (rni ?? 0);
 const pct = target > 0 ? Math.min((daily_avg / target) * 100, 150) : 0;

 const colours = {
 green: {
 bar: ds.trafficGreen,
 badge: "bg-[var(--semantic-success-bg)] text-[var(--semantic-success-text)]",
 },
 amber: {
 bar: ds.trafficAmber,
 badge: "bg-[var(--semantic-warn-bg)] text-[var(--semantic-warn-text)]",
 },
 red: {
 bar: ds.trafficRed,
      badge: "bg-[var(--semantic-error-bg)] text-[var(--semantic-error-text)]",
 },
 }[traffic];

 return (
 <div className="flex items-center gap-3">
 <div
 className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${
 traffic === "green" ? ds.trafficGreen : traffic === "amber" ? ds.trafficAmber : ds.trafficRed
 }`}
 />
 <span className="w-28 flex-shrink-0 text-sm text-[var(--text-secondary)]">{label}</span>
 <div className="h-1.5 flex-1 rounded-full bg-[var(--surface-muted)]">
 <div className={`h-1.5 rounded-full transition-all ${colours.bar}`} style={{ width: `${Math.min(pct, 100)}%` }} />
 </div>
 <span className="w-20 text-right text-xs text-[var(--text-muted)]">
 {daily_avg.toFixed(1)}
 {unit}
 </span>
 <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs ${colours.badge}`}>{pct_label}</span>
 </div>
 );
}
