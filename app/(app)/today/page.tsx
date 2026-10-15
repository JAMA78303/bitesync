import { redirect } from "next/navigation";
import { TodayDashboard } from "@/components/today/TodayDashboard";
import { UpcomingWeekCard } from "@/components/habit/UpcomingWeekCard";
import { WeeklyHabitCard } from "@/components/habit/WeeklyHabitCard";
import { initialDietaryPreferencesFromProfile } from "@/lib/dietary/constraints";
import { getTodaysMeals, sumTodayTotals } from "@/lib/planner/today";
import { upcomingWeekStatus } from "@/lib/planner/upcoming-weeks";
import { getProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
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

 const [meals, profile, upcoming, params] = await Promise.all([
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
  searchParams,
 ]);
 const targets = deriveNutritionTargets(profile);
 const totals = sumTodayTotals(meals);
 const dietaryPreferences = initialDietaryPreferencesFromProfile(profile);

 return (
 <TodayDashboard
 meals={meals}
 totals={totals}
 targets={targets}
 dietaryPreferences={dietaryPreferences}
 extras={
 <>
 {upcoming?.isEmpty ? (
 <UpcomingWeekCard
 weekStart={upcoming.weekStart}
 isNextWeek={upcoming.isNextWeek}
 autoStart={params.plan === "upcoming"}
 />
 ) : null}
 <WeeklyHabitCard placement="today" />
 </>
 }
 />
 );
}
