"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateGroceryList } from "@/lib/supabase/grocery";
import { getProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import { getUserTier } from "@/lib/subscription";
import { toUserFacingError } from "@/lib/errors/userFacing";
import type { SupabaseClient } from "@supabase/supabase-js";
import { FIRST_RUN_STEP } from "@/lib/onboarding/first-run";
import { goalsFromProfile, seedStarterLibrary } from "@/lib/onboarding/starterLibrary";
import { getMonday, toLocalISO } from "@/lib/utils/dates";
import { getOrCreateMealPlan } from "@/lib/supabase/meal-plans";
import {
  generateHeuristicWeekPlan,
  type GoalContext,
} from "@/app/(app)/planner/ai-actions";
import { MEAL_TYPES } from "@/types";

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
 * planned a meal. Now skipping still gets them a starter library and this
 * week planned from it, with the standard planner (no AI, a few seconds). Best
 * effort: a failure here is logged and the skip goes ahead regardless.
 */
async function setUpStarterWeek(supabase: SupabaseClient, userId: string) {
  try {
    const [profile, tier] = await Promise.all([getProfile(), getUserTier()]);
    await seedStarterLibrary(supabase, userId, { profile, isPro: tier === "pro" });

    const mealPlan = (await getOrCreateMealPlan(toLocalISO(getMonday(new Date())))).data;
    if (!mealPlan) return;
    const { count } = await supabase
      .from("meal_plan_entries")
      .select("id", { count: "exact", head: true })
      .eq("meal_plan_id", mealPlan.id);
    if ((count ?? 0) > 0) return;

    const week = await generateHeuristicWeekPlan({ mealPlanId: mealPlan.id, goals: goalsFromProfile(profile) });
    if ("error" in week && week.error) {
      console.warn("[skipFirstRun] starter week not planned:", week.error);
      return;
    }
    await generateGroceryList(mealPlan.id, [0, 1, 2, 3, 4, 5, 6], [...MEAL_TYPES]);
  } catch (err) {
    console.warn("[skipFirstRun] starter setup failed:", err instanceof Error ? err.message : err);
  }
}

export async function skipFirstRun(currentStep: number) {
  const { supabase, userId, error } = await requireUserId();
  if (error || !userId) return { error: error ?? "Unauthorized" };

  await setUpStarterWeek(supabase, userId);

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
      const [profile, tier] = await Promise.all([getProfile(), getUserTier()]);
      starter = await seedStarterLibrary(supabase, userId, { profile, isPro: tier === "pro" });
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

export async function generateFirstRunWeekAndGrocery(input: { goals: GoalContext }) {
  const { supabase, userId, error } = await requireUserId();
  if (error || !userId) return { error: error ?? "Unauthorized" };
  // Tier from the server, not the client. The AI planner re-checks it anyway,
  // so a spoofed flag never reached the LLM — it just failed the first run
  // with "Upgrade to Pro" instead of building a heuristic week.
  const isPro = (await getUserTier()) === "pro";

  const weekStart = getMonday(new Date());
  const weekStartISO = toLocalISO(weekStart);
  const mealPlanResult = await getOrCreateMealPlan(weekStartISO);
  const mealPlan = mealPlanResult.data;
  if (!mealPlan) {
    return { error: mealPlanResult.error ?? "Could not load your planner." };
  }

  if (isPro) {
    const { generateAIWeekPlan } = await import("@/app/(app)/planner/ai-actions");
    const weekResult = await generateAIWeekPlan({ mealPlanId: mealPlan.id, goals: input.goals });
    if ("error" in weekResult && weekResult.error) {
      return { error: weekResult.error };
    }
  } else {
    const weekResult = await generateHeuristicWeekPlan({ mealPlanId: mealPlan.id, goals: input.goals });
    if ("error" in weekResult && weekResult.error) {
      return { error: weekResult.error };
    }
  }

  const groceryResult = await generateGroceryList(mealPlan.id, [0, 1, 2, 3, 4, 5, 6], [...MEAL_TYPES]);
  if ("error" in groceryResult && groceryResult.error) {
    return { error: groceryResult.error };
  }

  const complete = await completeFirstRun();
  if ("error" in complete && complete.error) return complete;

  revalidatePath("/planner");
  revalidatePath("/grocery");
  redirect(
    `/grocery?week=${weekStartISO}&plan=${mealPlan.id}&welcome=1${isPro ? "&pro=1" : ""}`,
  );
}

export async function getOnboardingProfile() {
  return getProfile();
}
