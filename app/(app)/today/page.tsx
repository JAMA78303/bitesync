import { redirect } from "next/navigation";
import { TrialStatusCard } from "@/components/billing/TrialStatusCard";
import { TodayDashboard } from "@/components/today/TodayDashboard";
import { UpcomingWeekCard } from "@/components/habit/UpcomingWeekCard";
import { WeeklyHabitCard } from "@/components/habit/WeeklyHabitCard";
import { WeekStatsCard } from "@/components/today/WeekStatsCard";
import { initialDietaryPreferencesFromProfile } from "@/lib/dietary/constraints";
import { getTodaysMeals, sumTodayTotals } from "@/lib/planner/today";
import { upcomingWeekStatus } from "@/lib/planner/upcoming-weeks";
import { computeWeeklyMacrosFromEntries, type DayMacros } from "@/lib/planner/weekly-macros";
import { getMealPlanEntries } from "@/lib/supabase/meal-plans";
import { getProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import { getAccess } from "@/lib/subscription";
import { isNativeAppRequest } from "@/lib/native/server";
import { summariseWeek } from "@/lib/today/week-stats";
import { getMonday, toLocalISO } from "@/lib/utils/dates";
import { deriveNutritionTargets } from "@/lib/utils/nutrition-targets";

export const dynamic ="force-dynamic";

type Props = {
 /** `plan=upcoming` comes from the Sunday reminder: plan the week on arrival. */
 searchParams: Promise<{ plan?: string }>;
};

export default async function TodayPage({ searchParams }: Props) {
 const supabase = await createClient();
 const {
 data: { user },
 } = await supabase.auth.getUser();
 if (!user) redirect("/login");

 // This week's days, the same figures the Nutrition page shows for it.
 const weekStart = getMonday(new Date());
 const thisWeekDays = async (): Promise<DayMacros[]> => {
  const { data: plan } = await supabase
   .from("meal_plans")
   .select("id")
   .eq("user_id", user.id)
   .eq("week_start_date", toLocalISO(weekStart))
   .maybeSingle();
  const { data: entries } = plan ? await getMealPlanEntries(plan.id) : { data: [] };
  return computeWeeklyMacrosFromEntries(entries ?? [], weekStart).days;
 };

 const [meals, profile, upcoming, weekDays, params, access, native] = await Promise.all([
  getTodaysMeals(user.id).catch((error) => {
   console.error("[today] getTodaysMeals failed", error);
   return [];
  }),
  getProfile().catch((error) => {
   console.error("[today] getProfile failed", error);
   return null;
  }),
  upcomingWeekStatus(supabase, user.id, new Date()).catch((error) => {
   console.error("[today] upcomingWeekStatus failed", error);
   return null;
  }),
  thisWeekDays().catch((error) => {
   console.error("[today] thisWeekDays failed", error);
   return null;
  }),
  searchParams,
  getAccess(),
  isNativeAppRequest(),
 ]);
 const targets = deriveNutritionTargets(profile);
 const totals = sumTodayTotals(meals);
 const dietaryPreferences = initialDietaryPreferencesFromProfile(profile);
 // A trial that has ended can't plan (lib/billing/access.ts), so no one-tap
 // week, no auto-plan from the Sunday reminder link, and no offer of a
 // reminder to plan: the trial card says why instead.
 const canPlan = access?.canPlan !== false;

 return (
 <TodayDashboard
 meals={meals}
 totals={totals}
 targets={targets}
 dietaryPreferences={dietaryPreferences}
 extras={
 <>
 {access ? <TrialStatusCard access={access} native={native} /> : null}
 {upcoming?.isEmpty && canPlan ? (
 <UpcomingWeekCard
 weekStart={upcoming.weekStart}
 isNextWeek={upcoming.isNextWeek}
 autoStart={params.plan === "upcoming"}
 />
 ) : null}
 {weekDays ? <WeekStatsCard stats={summariseWeek(weekDays, targets)} /> : null}
 {canPlan ? <WeeklyHabitCard placement="today" /> : null}
 </>
 }
 />
 );
}
