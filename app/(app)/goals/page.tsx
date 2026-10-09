import Link from "next/link";
import { Leaf, Settings, Target } from "lucide-react";
import { RowIcon } from "@/components/ui/RowIcon";
import { getProfile } from "@/lib/supabase/profile";
import { deriveNutritionTargets, hasCompleteTdeeProfile } from "@/lib/utils/nutrition-targets";
import { ds } from "@/lib/ui/classes";

export const dynamic ="force-dynamic";

const GOALS_ITEMS = [
 {
 icon: Leaf,
 label:"Dietary preferences",
 desc:"Vegetarian, vegan, gluten-free — used for AI meal plans",
 href:"/goals/dietary",
 },
 {
 icon: Target,
 label:"Calorie & macro targets",
 desc:"Body stats, activity, and daily goals from TDEE",
 href:"/goals/targets",
 },
] as const;

export default async function GoalsPage() {
 const profile = await getProfile();
 const targets = deriveNutritionTargets(profile);

 return (
 <div className={ds.mobilePage}>
 <div className={ds.gradientHeader}>
 <span className={ds.kicker}>PERSONALISED TO YOU</span>
 <h1 className={`mb-1.5 ${ds.pageTitle}`}>Nutrition &amp; goals</h1>
 <p className={ds.pageSubtitle}>
 Diet preferences and daily targets that power your planner and macros
 </p>
 {hasCompleteTdeeProfile(profile) ? (
 <p className="mt-4 inline-flex rounded-full bg-[var(--accent-lime)] px-3.5 py-2 font-display text-xs font-bold text-[var(--on-lime)]">
 Current target: {targets.kcal} kcal · {targets.protein}g protein / day
 </p>
 ) : null}
 </div>

 <div className={`${ds.mobileGutter} space-y-4 ${ds.pageContent}`}>
 <div className={`${ds.card} overflow-hidden`}>
 {GOALS_ITEMS.map((item, i) => (
 <div key={item.href}>
 <Link
 href={item.href}
 className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-[var(--surface-muted)]"
 >
 <RowIcon Icon={item.icon} />
 <span className="min-w-0 flex-1">
 <span className="flex items-center gap-2">
 <span className="text-sm font-semibold text-[var(--text-primary)]">{item.label}</span>
 </span>
 <span className="mt-0.5 block text-xs text-[var(--text-muted)]">{item.desc}</span>
 </span>
 <Chevron />
 </Link>
 {i < GOALS_ITEMS.length - 1 ? (
 <div className="ml-[68px] h-px bg-[var(--border-subtle)]" />
 ) : null}
 </div>
 ))}
 </div>

 <Link
 href="/settings"
 className={`${ds.card} flex items-center gap-3 px-4 py-3.5 text-sm transition-colors hover:bg-[var(--surface-muted)] `}
 >
 <RowIcon Icon={Settings} />
 <span className="flex-1 font-semibold text-[var(--text-primary)]">Account &amp; app settings</span>
 <Chevron />
 </Link>
 </div>
 </div>
 );
}

function Chevron() {
 return (
 <svg className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
 </svg>
 );
}
