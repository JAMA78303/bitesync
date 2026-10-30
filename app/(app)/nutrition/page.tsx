import Link from "next/link";
import { redirect } from "next/navigation";
import { NutritionDashboard } from "@/components/nutrition/NutritionDashboard";
import { computeWeeklyMacrosFromEntries } from "@/lib/planner/weekly-macros";
import { getAccess } from "@/lib/subscription";
import { isNativeAppRequest } from "@/lib/native/server";
import { getMealPlanForWeek, getMealPlanEntries } from "@/lib/supabase/meal-plans";
import { getWeeklyMicroAnalysis } from "@/lib/supabase/nutrition";
import { getProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import { deriveNutritionTargets } from "@/lib/utils/nutrition-targets";
import { formatDayMonthOrdinal, getMonday, toLocalISO } from "@/lib/utils/dates";

export const dynamic = "force-dynamic";

export default async function NutritionPage({
 searchParams,
}: {
 searchParams: Promise<{ week?: string }>;
}) {
 const params = await searchParams;
 const supabase = await createClient();
 const {
 data: { user },
 } = await supabase.auth.getUser();
 if (!user) redirect("/login");

 const weekStart = params.week ? getMonday(new Date(`${params.week}T00:00:00`)) : getMonday(new Date());
 const weekStartISO = toLocalISO(weekStart);
 const prevWeekISO = toLocalISO(new Date(weekStart.getTime() - 7 * 86400000));
 const nextWeekISO = toLocalISO(new Date(weekStart.getTime() + 7 * 86400000));

 const [profile, mealPlan, access, native] = await Promise.all([
 getProfile(),
 getMealPlanForWeek(weekStartISO),
 getAccess(),
 isNativeAppRequest(),
 ]);
 // Micronutrients are Pro (and trial); everyone sees their macros.
 const hasPro = access?.hasPro ?? false;

 const targets = deriveNutritionTargets(profile);
 let microAnalysis: Awaited<ReturnType<typeof getWeeklyMicroAnalysis>> = null;
 let entries: Awaited<ReturnType<typeof getMealPlanEntries>>["data"] = [];

 if (mealPlan) {
 const { data } = await getMealPlanEntries(mealPlan.id);
 entries = data ?? [];
 if (hasPro) {
 try {
 microAnalysis = await getWeeklyMicroAnalysis(
 mealPlan.id,
 weekStartISO,
 (profile?.sex as"male" |"female") ??"male",
 );
 } catch (err) {
 console.error("Micro analysis failed:", err);
 }
 }
 }

 const { days, weekAvg } = computeWeeklyMacrosFromEntries(entries ?? [], weekStart);

 const weekEnd = new Date(weekStart.getTime() + 6 * 86400000);
 const rangeLabel = `${formatDayMonthOrdinal(weekStart)} – ${formatDayMonthOrdinal(weekEnd)}`;

 const weekNav = (
 <div className="flex items-center justify-between rounded-xl bg-[var(--header-stat-bg)] px-2 py-1.5 backdrop-blur-sm">
 <Link
 href={`/nutrition?week=${prevWeekISO}`}
 className="px-2 py-1 text-sm text-[var(--text-on-header-muted)] hover:text-[var(--text-on-header)]"
 >
 ‹
 </Link>
 <span className="text-xs font-medium text-[var(--text-on-header)]">{rangeLabel}</span>
 <Link
 href={`/nutrition?week=${nextWeekISO}`}
 className="px-2 py-1 text-sm text-[var(--text-on-header-muted)] hover:text-[var(--text-on-header)]"
 >
 ›
 </Link>
 </div>
 );

 return (
 <NutritionDashboard
 weekAvg={weekAvg}
 days={days}
 targets={targets}
 hasPro={hasPro}
 trialEnded={access?.plan === "expired"}
 native={native}
 microAnalysis={microAnalysis}
 weekNav={weekNav}
 />
 );
}
