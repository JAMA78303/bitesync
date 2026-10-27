"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/profile";
import { getUserTier } from "@/lib/subscription";
import { goalsFromProfile } from "@/lib/onboarding/starterLibrary";
import { resolveUserToday } from "@/lib/onboarding/firstWeeks";
import { planUpcomingWeeks } from "@/lib/planner/upcoming-weeks";

/**
 * "Plan next week in one tap", from the Sunday reminder and the Today card.
 * Only fills a week that is still empty, so a second tap (or a refresh of the
 * reminder link) never replaces meals the user has already planned or edited.
 * `localDate` is the user's own date (YYYY-MM-DD) from their browser.
 */
export async function planUpcomingWeek(localDate?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

  const [profile, tier] = await Promise.all([getProfile(), getUserTier()]);
  const planned = await planUpcomingWeeks({
    supabase,
    goals: goalsFromProfile(profile),
    today: resolveUserToday(localDate),
    useAiForMainWeek: tier === "pro",
    onlyIfEmpty: true,
  });
  if ("error" in planned) return { error: planned.error };

  revalidatePath("/today");
  revalidatePath("/planner");
  revalidatePath("/grocery");
  return { success: true as const, weekStart: planned.mainWeekStart };
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Which of these weeks (Mondays, YYYY-MM-DD) already have meals. The iPhone app
 * asks before scheduling its Sunday reminders, so a planned week gets none,
 * the same rule as the web push (app/api/cron/push-reminders).
 */
export async function getPlannedWeekStarts(weekStarts: string[]) {
  const weeks = weekStarts.filter((w) => ISO_DATE.test(w)).slice(0, 8);
  if (!weeks.length) return { success: true as const, planned: [] as string[] };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

  const { data: plans, error } = await supabase
    .from("meal_plans")
    .select("id, week_start_date")
    .eq("user_id", user.id)
    .in("week_start_date", weeks);
  if (error) return { error: error.message };
  if (!plans?.length) return { success: true as const, planned: [] as string[] };

  const { data: entries, error: entriesError } = await supabase
    .from("meal_plan_entries")
    .select("meal_plan_id")
    .in(
      "meal_plan_id",
      plans.map((p) => p.id as string),
    )
    .limit(1000);
  if (entriesError) return { error: entriesError.message };

  const withMeals = new Set((entries ?? []).map((e) => e.meal_plan_id as string));
  const planned = plans.filter((p) => withMeals.has(p.id as string)).map((p) => p.week_start_date as string);
  return { success: true as const, planned: [...new Set(planned)] };
}
