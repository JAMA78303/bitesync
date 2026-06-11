import Link from "next/link";
import { Activity } from "lucide-react";
import { DeficiencyRecommendations } from "@/components/planner/DeficiencyRecommendations";
import { ds } from "@/lib/ui/classes";
import type { MicroAnalysis } from "@/lib/supabase/nutrition";

type Props = {
 analysis: MicroAnalysis;
 weekStartISO: string;
};

export function PlannerMicroSummary({ analysis, weekStartISO }: Props) {
 const deficiencies = analysis.must_hit.filter((n) => n.traffic ==="red" || n.traffic ==="amber");
 const excesses = analysis.must_limit.filter((n) => n.traffic ==="red");
 const reds = [
 ...analysis.must_hit.filter((n) => n.traffic ==="red"),
 ...analysis.must_limit.filter((n) => n.traffic ==="red"),
 ];

 return (
 <div className="space-y-3">
 {deficiencies.length || excesses.length ? (
 <DeficiencyRecommendations deficiencies={deficiencies} excesses={excesses} />
 ) : null}

 <Link
 href={`/nutrition?week=${weekStartISO}`}
 className={`${ds.card} group flex items-center justify-between px-4 py-3 transition-all hover:border-[var(--brand-sage)]`}
 >
 <div className="flex items-center gap-3">
 <Activity className="h-4 w-4 text-[var(--brand-primary)]" />
 <div>
 <p className="text-sm font-semibold text-[var(--text-primary)]">Weekly nutrition</p>
 <p className="text-xs text-[var(--text-muted)]">
 {reds.length === 0
 ?"All nutrients on track this week"
 : `${reds
 .slice(0, 2)
 .map((n) => n.label)
 .join(" and")} need${reds.length === 1 ?"s" :""} attention`}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
 {[...analysis.must_hit, ...analysis.must_limit].slice(0, 6).map((n) => (
 <div
 key={n.key}
 className={`h-2 w-2 rounded-full ${
 n.traffic === "green" ? ds.trafficGreen : n.traffic === "amber" ? ds.trafficAmber : ds.trafficRed
 }`}
 />
 ))}
 →
 </div>
 </Link>
 </div>
 );
}
