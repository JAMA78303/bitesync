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
