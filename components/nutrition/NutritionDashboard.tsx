"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { DayMacros } from "@/lib/planner/weekly-macros";
import type { UserNutritionTargets } from "@/lib/utils/nutrition-targets";
import { ds } from "@/lib/ui/classes";
import { CofidAttribution } from "@/components/nutrition/CofidAttribution";
import { MicronutrientPanel } from "@/components/planner/MicronutrientPanel";
import { DAY_NAMES } from "@/types";
import type { MicroAnalysis } from "@/lib/supabase/nutrition";

type Props = {
  weekAvg: { kcal: number; protein: number; carbs: number; fat: number };
  days: DayMacros[];
  targets: UserNutritionTargets;
  isProUser: boolean;
  microAnalysis: MicroAnalysis | null;
  weekNav: React.ReactNode;
};

function macroStatus(value: number, target: number) {
  if (value >= target * 0.8 && value <= target * 1.15) return { label: "✓ On track", className: "text-[#3a5a40]" };
  if (value < target * 0.8) return { label: "↑ Below target", className: "text-amber-500" };
  return { label: "↓ Over target", className: "text-red-500" };
}

export function NutritionDashboard({
  weekAvg,
  days,
  targets,
  isProUser,
  microAnalysis,
  weekNav,
}: Props) {
  const defaultDay = days.find((d) => d.kcal > 0)?.dateISO ?? days[0]?.dateISO ?? "";
  const [selectedDay, setSelectedDay] = useState(defaultDay);

  const day = useMemo(() => days.find((d) => d.dateISO === selectedDay) ?? days[0], [days, selectedDay]);
  const selectedDayLabel = day ? `${DAY_NAMES[day.dayOfWeek] ?? day.short} ${day.num}` : "Selected day";

  const macros = [
    { label: "Calories", value: day?.kcal ?? 0, target: targets.kcal, unit: "kcal", color: "#3a5a40" },
    { label: "Protein", value: day?.protein ?? 0, target: targets.protein, unit: "g", color: "#3a5a40" },
    { label: "Carbs", value: day?.carbs ?? 0, target: targets.carbs, unit: "g", color: "#f97316" },
    { label: "Fat", value: day?.fat ?? 0, target: targets.fat, unit: "g", color: "#f59e0b" },
  ];

  const weekPills = [
    { label: "Avg. Calories", value: weekAvg.kcal, target: targets.kcal, unit: "kcal" },
    { label: "Avg. Protein", value: weekAvg.protein, target: targets.protein, unit: "g" },
    { label: "Avg. Carbs", value: weekAvg.carbs, target: targets.carbs, unit: "g" },
    { label: "Avg. Fat", value: weekAvg.fat, target: targets.fat, unit: "g" },
  ];

  return (
    <div className="-mx-4 min-h-screen bg-gray-50 dark:bg-gray-950 md:mx-0">
      <header className={ds.gradientHeader}>
        <h1 className={`${ds.pageTitle} mb-1`}>Nutrition</h1>
        <p className="mb-4 text-xs text-white/60">Weekly averages vs your daily targets</p>
        <div className="mb-4">{weekNav}</div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/50">Weekly average</p>
        <div className="grid grid-cols-2 gap-2">
          {weekPills.map((m) => {
            const pct = m.target > 0 ? Math.round((m.value / m.target) * 100) : 0;
            const onTrack = pct >= 80 && pct <= 115;
            return (
              <div key={m.label} className="rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
                <p className="mb-0.5 text-[9px] text-white/60">{m.label}</p>
                <p className="text-base font-bold text-white">
                  {Math.round(m.value)}
                  <span className="text-xs font-normal text-white/60"> {m.unit}</span>
                </p>
                <p className={`mt-0.5 text-[9px] font-semibold ${onTrack ? "text-[#7ab87a]" : "text-amber-300"}`}>
                  {pct}% of daily target (week avg)
                </p>
              </div>
            );
          })}
        </div>
      </header>

      <div className={`px-4 ${ds.overlap} ${ds.pageContent}`}>
        <div className="mb-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
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
                  ? "bg-[#3a5a40] text-white"
                  : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <p className="text-[8px] font-medium">{d.short}</p>
              <p className="text-xs font-bold">{d.num}</p>
            </button>
          ))}
          </div>
        </div>

        <p className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
          {selectedDayLabel}
          <span className="ml-2 text-xs font-normal text-gray-500">vs {targets.kcal} kcal daily target</span>
        </p>

        <div className={`space-y-3 ${ds.sectionGap}`}>
          {macros.map((m) => {
            const status = macroStatus(m.value, m.target);
            return (
              <div key={m.label} className={`${ds.card} ${ds.cardPadding}`}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{m.label}</span>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    {Math.round(m.value)}
                    <span className="text-xs font-normal text-gray-400">
                      /{m.target}
                      {m.unit}
                    </span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((m.value / m.target) * 100, 100)}%`,
                      backgroundColor: m.color,
                    }}
                  />
                </div>
                <p className="mt-1.5 text-xs font-medium text-gray-500">
                  vs {m.target}
                  {m.unit} daily target
                </p>
                <p className={`text-xs font-medium ${status.className}`}>{status.label}</p>
              </div>
            );
          })}
        </div>

        <div className="mb-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className={ds.sectionTitle}>Micronutrients</h2>
            <span className="text-xs text-gray-400">vs UK DRVs</span>
          </div>
          {isProUser && microAnalysis ? (
            <MicronutrientPanel analysis={microAnalysis} />
          ) : isProUser ? (
            <div className={`${ds.card} ${ds.cardPadding} text-center`}>
              <p className="text-sm text-gray-500">Add meals to your planner to see micronutrient analysis.</p>
              <Link href="/planner" className="mt-2 inline-block text-sm font-semibold text-[#3a5a40]">
                Go to planner →
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl bg-[#f0f7f0] p-5 text-center dark:bg-[#1a2e1d]">
              <p className="mb-2 text-2xl" aria-hidden>
                🧬
              </p>
              <p className="mb-1 text-sm font-bold text-gray-900 dark:text-white">Micronutrient analysis</p>
              <p className="mb-4 text-xs text-gray-500">
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
