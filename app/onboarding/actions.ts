"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import { canUseAiWeekPlan, getAccess } from "@/lib/subscription";
import { planningAccessError } from "@/lib/supabase/meal-plans";
import { toUserFacingError } from "@/lib/errors/userFacing";
import type { SupabaseClient } from "@supabase/supabase-js";
import { FIRST_RUN_STEP } from "@/lib/onboarding/first-run";
import { goalsFromProfile, seedStarterLibrary } from "@/lib/onboarding/starterLibrary";
import { resolveUserToday } from "@/lib/onboarding/firstWeeks";
import { planUpcomingWeeks } from "@/lib/planner/upcoming-weeks";
import type { GoalContext } from "@/app/(app)/planner/ai-actions";

async function requireUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" as const, supabase, userId: null as null };
  return { supabase, userId: user.id };
}

export async function advanceOnboardingStep(step: number) {
  const { supabase, userId, error } = await requireUserId();
  if (error || !userId) return { error: error ?? "Unauthorized" };

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ onboarding_step: step })
    .eq("id", userId);

  if (updateError) return { error: toUserFacingError(updateError, "profile", "updateProfile") };

  revalidatePath("/onboarding");
  revalidatePath("/today");
  return { success: true as const, step };
}

/**
 * Every skipper used to land on an empty planner, and none of them ever
 * planned a meal. Now skipping still gets them a starter library and their
 * first weeks planned from it, with the standard planner (no AI, a few
 * seconds). Best effort: a failure here is logged and the skip goes ahead.
 * Once a trial has ended there is neither (no new recipes, no planning), and
 * the skip still finishes setup so the account isn't held at onboarding.
 */
async function setUpStarterWeek(supabase: SupabaseClient, userId: string, localDate?: string) {
  try {
    const [profile, access] = await Promise.all([getProfile(), getAccess()]);
    if (!access?.canAddRecipes || !access.canPlan) return;
    await seedStarterLibrary(supabase, userId, { profile, isPro: access.hasPro });

    const planned = await planUpcomingWeeks({
      supabase,
      goals: goalsFromProfile(profile),
      today: resolveUserToday(localDate),
      useAiForMainWeek: false,
      onlyIfEmpty: true,
    });
    if ("error" in planned) console.warn("[skipFirstRun] starter week not planned:", planned.error);
  } catch (err) {
    console.warn("[skipFirstRun] starter setup failed:", err instanceof Error ? err.message : err);
  }
}

/** `localDate` is the user's own date (YYYY-MM-DD) from their browser. */
export async function skipFirstRun(currentStep: number, localDate?: string) {
  const { supabase, userId, error } = await requireUserId();
  if (error || !userId) return { error: error ?? "Unauthorized" };

  await setUpStarterWeek(supabase, userId, localDate);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      has_completed_onboarding: true,
      first_run_skipped: true,
      onboarding_step: Math.max(1, Math.min(currentStep, FIRST_RUN_STEP.WEEK)),
    })
    .eq("id", userId);

  if (updateError) return { error: toUserFacingError(updateError, "profile", "updateProfile") };

  revalidatePath("/onboarding");
  revalidatePath("/today");
  revalidatePath("/planner");
  return { success: true as const };
}

export async function completeFirstRun() {
  const { supabase, userId, error } = await requireUserId();
  if (error || !userId) return { error: error ?? "Unauthorized" };

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      has_completed_onboarding: true,
      first_run_completed: true,
      first_run_skipped: false,
      onboarding_step: FIRST_RUN_STEP.DONE,
    })
    .eq("id", userId);

  if (updateError) return { error: toUserFacingError(updateError, "profile", "updateProfile") };

  revalidatePath("/onboarding");
  revalidatePath("/today");
  revalidatePath("/planner");
  revalidatePath("/grocery");
  return { success: true as const };
}

/**
 * Targets are saved by now, so the starter library is sized to them and step 2
 * opens on recipes that are already there. It used to open on a generator that
 * took a minute or two, with "Skip for now" one tap away.
 */
export async function finishOnboardingStep1() {
  const result = await advanceOnboardingStep(FIRST_RUN_STEP.LIBRARY);
  if ("error" in result && result.error) return result;

  let starter = { seeded: 0, names: [] as string[] };
  const { supabase, userId } = await requireUserId();
  if (userId) {
    try {
      // The Pro set (16) on Pro and trial, 10 on free, none once a trial has ended.
      const [profile, access] = await Promise.all([getProfile(), getAccess()]);
      if (access?.canAddRecipes) {
        starter = await seedStarterLibrary(supabase, userId, { profile, isPro: access.hasPro });
      }
    } catch (err) {
      // Step 2's generator is still there as the fallback.
      console.warn("[finishOnboardingStep1] starter library failed:", err instanceof Error ? err.message : err);
    }
    if (starter.seeded) revalidatePath("/recipes");
  }
  return { success: true as const, starter };
}

export async function finishOnboardingStep2() {
  const result = await advanceOnboardingStep(FIRST_RUN_STEP.WEEK);
  if ("error" in result && result.error) return result;
  return { success: true as const };
}

/** `localDate` is the user's own date (YYYY-MM-DD) from their browser. */
export async function generateFirstRunWeekAndGrocery(input: { goals: GoalContext; localDate?: string }) {
  const { supabase, userId, error } = await requireUserId();
  if (error || !userId) return { error: error ?? "Unauthorized" };
  // A trial that ended can still finish setup (the wizard offers that), but
  // not plan. needsPro lets the wizard switch to that.
  const blocked = await planningAccessError();
  if (blocked) return { error: blocked, needsPro: true as const };
  // From the server, not the client. The AI planner re-checks it anyway, so a
  // spoofed flag never reached the LLM — it just failed the first run with
  // "Upgrade to Pro" instead of building a heuristic week.
  const useAi = await canUseAiWeekPlan();

  const planned = await planUpcomingWeeks({
    supabase,
    goals: input.goals,
    today: resolveUserToday(input.localDate),
    useAiForMainWeek: useAi,
    onlyIfEmpty: false,
  });
  if ("error" in planned) return { error: planned.error };

  const complete = await completeFirstRun();
  if ("error" in complete && complete.error) return complete;

  revalidatePath("/planner");
  revalidatePath("/grocery");
  redirect(
    `/grocery?week=${planned.mainWeekStart}&plan=${planned.mainPlanId}&welcome=1${useAi ? "&pro=1" : ""}`,
  );
}

export async function getOnboardingProfile() {
  return getProfile();
}
