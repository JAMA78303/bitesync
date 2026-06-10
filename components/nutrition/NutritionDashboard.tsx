"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { DayMacros } from "@/lib/planner/weekly-macros";
import type { UserNutritionTargets } from "@/lib/utils/nutrition-targets";
import { getGoalStatus, type GoalMetric } from "@/lib/today/goal-status";
import { formatWeekdayWithOrdinal } from "@/lib/utils/dates";
import { ds } from "@/lib/ui/classes";
import { CofidAttribution } from "@/components/nutrition/CofidAttribution";
import { DeficiencyRecommendations } from "@/components/planner/DeficiencyRecommendations";
import { MicronutrientPanel } from "@/components/planner/MicronutrientPanel";
import type { MicroAnalysis } from "@/lib/supabase/nutrition";

type Props = {
 weekAvg: { kcal: number; protein: number; carbs: number; fat: number };
 days: DayMacros[];
 targets: UserNutritionTargets;
 isProUser: boolean;
 microAnalysis: MicroAnalysis | null;
 weekNav: React.ReactNode;
};

export function NutritionDashboard({
 weekAvg,
 days,
 targets,
 isProUser,
 microAnalysis,
 weekNav,
}: Props) {
 const defaultDay = days.find((d) => d.kcal > 0)?.dateISO ?? days[0]?.dateISO ??"";
 const [selectedDay, setSelectedDay] = useState(defaultDay);

 const day = useMemo(() => days.find((d) => d.dateISO === selectedDay) ?? days[0], [days, selectedDay]);
 const selectedDayLabel = day
 ? formatWeekdayWithOrdinal(new Date(`${day.dateISO}T12:00:00`),"long")
 :"Selected day";

 const macros: { label: string; metric: GoalMetric; value: number; target: number; unit: string }[] = [
 { label:"Calories", metric:"kcal", value: day?.kcal ?? 0, target: targets.kcal, unit:"kcal" },
 { label:"Protein", metric:"protein", value: day?.protein ?? 0, target: targets.protein, unit:"g" },
 { label:"Carbs", metric:"carbs", value: day?.carbs ?? 0, target: targets.carbs, unit:"g" },
 { label:"Fat", metric:"fat", value: day?.fat ?? 0, target: targets.fat, unit:"g" },
 ];

 const weekPills = [
 { label:"Avg. Calories", value: weekAvg.kcal, target: targets.kcal, unit:"kcal" },
 { label:"Avg. Protein", value: weekAvg.protein, target: targets.protein, unit:"g" },
 { label:"Avg. Carbs", value: weekAvg.carbs, target: targets.carbs, unit:"g" },
 { label:"Avg. Fat", value: weekAvg.fat, target: targets.fat, unit:"g" },
 ];

 const microDeficiencies = useMemo(
 () => microAnalysis?.must_hit.filter((n) => n.traffic ==="red" || n.traffic ==="amber") ?? [],
 [microAnalysis],
 );
 const microExcesses = useMemo(
 () => microAnalysis?.must_limit.filter((n) => n.traffic ==="red") ?? [],
 [microAnalysis],
 );

 return (
 <div className={ds.mobilePage}>
 <header className={ds.gradientHeader}>
 <h1 className={`${ds.pageTitle} mb-1`}>Nutrition</h1>
 <p className={`mb-4 ${ds.pageSubtitle}`}>Weekly averages vs your daily targets</p>
 <div className="mb-4">{weekNav}</div>
 <p className={`mb-2 text-2xs font-semibold uppercase tracking-wider ${ds.headerStatLabel}`}>
 Weekly average
 </p>
 <div className="grid grid-cols-2 gap-2">
 {weekPills.map((m) => {
 const pct = m.target > 0 ? Math.round((m.value / m.target) * 100) : 0;
 const onTrack = pct >= 80 && pct <= 115;
 return (
 <div key={m.label} className={ds.headerStatCard}>
 <p className={`mb-0.5 ${ds.headerStatLabel}`}>{m.label}</p>
 <p className={ds.headerStatValue}>
 {Math.round(m.value)}
 <span className={ds.headerStatUnit}> {m.unit}</span>
 </p>
 <p
 className={`mt-0.5 text-2xs font-semibold ${onTrack ? ds.headerStatAccent : ds.headerStatWarn}`}
 >
 {pct}% of daily target (week avg)
 </p>
 </div>
 );
 })}
 </div>
 </header>

 <div className={`${ds.mobileGutter} ${ds.overlap} ${ds.pageContent}`}>
 <div className="mb-3">
 <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
 Selected day
 </p>
 <div className={`${ds.card} flex gap-1 p-2`}>
 {days.map((d) => (
 <button
 key={d.dateISO}
 type="button"
 onClick={() => setSelectedDay(d.dateISO)}
 className={`flex-1 rounded-xl py-2 text-center transition-all ${
 selectedDay === d.dateISO
 ?"bg-[var(--brand-primary)] text-[var(--text-on-brand)]"
 :"text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
 }`}
 >
 <p className="text-2xs font-medium">{d.short}</p>
 <p className="text-xs font-bold">{d.num}</p>
 </button>
 ))}
 </div>
 </div>

 <p className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
 {selectedDayLabel}
 <span className="ml-2 text-xs font-normal text-[var(--text-muted)]">vs {targets.kcal} kcal daily target</span>
 </p>

 <div className={`space-y-3 ${ds.sectionGap}`}>
 {macros.map((m) => {
 const status = getGoalStatus(m.metric, m.value, m.target);
 const safeTarget = m.target > 0 ? m.target : 1;
 return (
 <div key={m.label} className={`${ds.card} ${ds.cardPadding}`}>
 <div className="mb-2 flex items-center justify-between">
 <span className="text-sm font-semibold text-[var(--text-primary)]">{m.label}</span>
 <span className="text-sm font-bold text-[var(--text-secondary)]">
 {Math.round(m.value)}
 <span className="text-xs font-normal text-[var(--text-muted)]">
 /{m.target}
 {m.unit}
 </span>
 </span>
 </div>
 <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-muted)]">
 <div
 className="h-full rounded-full transition-all duration-500"
 style={{
 width: `${Math.min((m.value / safeTarget) * 100, 100)}%`,
 backgroundColor: status.color,
 }}
 />
 </div>
 <p className="mt-1.5 text-xs font-medium text-[var(--text-muted)]">
 vs {m.target}
 {m.unit} daily target
 </p>
 <p className={`text-xs font-medium ${status.textClassName}`}>{status.label}</p>
 </div>
 );
 })}
 </div>

 <div className="mb-4">
 <div className="mb-3 flex items-center justify-between">
 <h2 className={ds.sectionTitle}>Micronutrients</h2>
 <span className="text-xs text-[var(--text-muted)]">vs UK DRVs</span>
 </div>
 {isProUser && microAnalysis ? (
 <div className="space-y-4">
 <DeficiencyRecommendations deficiencies={microDeficiencies} excesses={microExcesses} />
 <MicronutrientPanel analysis={microAnalysis} />
 </div>
 ) : isProUser ? (
 <div className={`${ds.card} ${ds.cardPadding} text-center`}>
 <p className="text-sm text-[var(--text-muted)]">Add meals to your planner to see micronutrient analysis.</p>
 <Link href="/planner" className="mt-2 inline-block text-sm font-semibold text-[var(--brand-primary)]">
 Go to planner →
 </Link>
 </div>
 ) : (
 <div className="rounded-2xl bg-[var(--surface-brand-subtle)] p-5 text-center">
 <p className="mb-2 text-2xl" aria-hidden>
 🧬
 </p>
 <p className="mb-1 text-sm font-bold text-[var(--text-primary)]">Micronutrient analysis</p>
 <p className="mb-4 text-xs text-[var(--text-muted)]">
 See how your diet compares to UK Government DRVs for vitamins and minerals.
 </p>
 <Link href="/billing" className={ds.primaryBtn}>
 Upgrade to Pro
 </Link>
 </div>
 )}
 </div>

 <CofidAttribution className="mt-6 px-1" />
 </div>
 </div>
 );
}
