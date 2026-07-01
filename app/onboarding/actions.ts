"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateGroceryList } from "@/lib/supabase/grocery";
import { getProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import { toUserFacingError } from "@/lib/errors/userFacing";
import { FIRST_RUN_STEP } from "@/lib/onboarding/first-run";
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

export async function skipFirstRun(currentStep: number) {
  const { supabase, userId, error } = await requireUserId();
  if (error || !userId) return { error: error ?? "Unauthorized" };

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

export async function finishOnboardingStep1() {
  const result = await advanceOnboardingStep(FIRST_RUN_STEP.LIBRARY);
  if ("error" in result && result.error) return result;
  return { success: true as const };
}

export async function finishOnboardingStep2() {
  const result = await advanceOnboardingStep(FIRST_RUN_STEP.WEEK);
  if ("error" in result && result.error) return result;
  return { success: true as const };
}

export async function generateFirstRunWeekAndGrocery(input: {
  isPro: boolean;
  goals: GoalContext;
}) {
  const { supabase, userId, error } = await requireUserId();
  if (error || !userId) return { error: error ?? "Unauthorized" };

  const weekStart = getMonday(new Date());
  const weekStartISO = toLocalISO(weekStart);
  const mealPlanResult = await getOrCreateMealPlan(weekStartISO);
  const mealPlan = mealPlanResult.data;
  if (!mealPlan) {
    return { error: mealPlanResult.error ?? "Could not load your planner." };
  }

  if (input.isPro) {
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
    `/grocery?week=${weekStartISO}&plan=${mealPlan.id}&welcome=1${input.isPro ? "&pro=1" : ""}`,
  );
}

export async function getOnboardingProfile() {
  return getProfile();
}
