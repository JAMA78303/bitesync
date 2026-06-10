import Link from "next/link";
import { isProSubscriptionStatus } from "@/lib/subscription";
import { getProfile } from "@/lib/supabase/profile";
import { deriveNutritionTargets, hasCompleteTdeeProfile } from "@/lib/utils/nutrition-targets";
import { ds } from "@/lib/ui/classes";

export const dynamic ="force-dynamic";

const GOALS_ITEMS = [
 {
 icon:"🌿",
 label:"Dietary preferences",
 desc:"Vegetarian, vegan, gluten-free — used for AI meal plans",
 href:"/goals/dietary",
 },
 {
 icon:"🎯",
 label:"Calorie & macro targets",
 desc:"Body stats, activity, and daily goals from TDEE",
 href:"/goals/targets",
 pro: true,
 },
] as const;

export default async function GoalsPage() {
 const profile = await getProfile();
 const isPro = isProSubscriptionStatus(profile?.subscription_status);
 const targets = deriveNutritionTargets(profile);

 return (
 <div className={ds.mobilePage}>
 <div className={ds.gradientHeader}>
 <h1 className={ds.pageTitle}>Nutrition &amp; goals</h1>
 <p className={`mt-0.5 ${ds.pageSubtitle}`}>
 Diet preferences and daily targets that power your planner and macros
 </p>
 {hasCompleteTdeeProfile(profile) ? (
 <p className={`mt-3 rounded-xl ${ds.headerStatCard} text-xs text-[var(--text-on-header)]`}>
 Current target: {targets.kcal} kcal · {targets.protein}g protein / day
 </p>
 ) : null}
 </div>

 <div className={`${ds.mobileGutter} -mt-6 space-y-4 ${ds.pageContent}`}>
 <div className={`${ds.card} overflow-hidden`}>
 {GOALS_ITEMS.map((item, i) => (
 <div key={item.href}>
 <Link
 href={item.href}
 className="flex items-start gap-3 px-4 py-4 transition-colors hover:bg-[var(--surface-muted)]"
 >
 <span className="w-7 text-center text-lg">{item.icon}</span>
 <span className="min-w-0 flex-1">
 <span className="flex items-center gap-2">
 <span className="text-sm font-medium text-[var(--text-secondary)]">{item.label}</span>
 {"pro" in item && item.pro && !isPro ? (
 <span className="rounded-full bg-amber-100 px-2 py-0.5 text-2xs font-semibold text-amber-700">
 Pro
 </span>
 ) : null}
 </span>
 <span className="mt-0.5 block text-xs text-[var(--text-muted)]">{item.desc}</span>
 </span>
 <Chevron />
 </Link>
 {i < GOALS_ITEMS.length - 1 ? (
 <div className="ml-14 h-px bg-[var(--surface-muted)]" />
 ) : null}
 </div>
 ))}
 </div>

 <Link
 href="/settings"
 className={`${ds.card} flex items-center justify-between px-4 py-3.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-muted)] `}
 >
 <span>Account &amp; app settings</span>
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
