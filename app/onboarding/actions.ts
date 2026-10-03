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
import { firstRunWeeks, resolveUserToday } from "@/lib/onboarding/firstWeeks";
import { getOrCreateMealPlan } from "@/lib/supabase/meal-plans";
import {
  generateAIWeekPlan,
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

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

async function weekIsEmpty(supabase: SupabaseClient, mealPlanId: string): Promise<boolean> {
  const { count } = await supabase
    .from("meal_plan_entries")
    .select("id", { count: "exact", head: true })
    .eq("meal_plan_id", mealPlanId);
  return (count ?? 0) === 0;
}

async function planWeekWithGrocery(
  mealPlanId: string,
  goals: GoalContext,
  useAi: boolean,
  groceryDays: number[],
): Promise<{ error: string } | { success: true }> {
  const week = useAi
    ? await generateAIWeekPlan({ mealPlanId, goals })
    : await generateHeuristicWeekPlan({ mealPlanId, goals });
  if ("error" in week && week.error) return { error: week.error };
  const grocery = await generateGroceryList(mealPlanId, groceryDays, [...MEAL_TYPES]);
  if ("error" in grocery && grocery.error) return { error: grocery.error };
  return { success: true };
}

/**
 * A new user's first plan: the main week — this one Monday to Wednesday, next
 * one from Thursday (lib/onboarding/firstWeeks) — and, late in the week, the
 * days left in this one, so Today is not empty while they wait for Monday.
 * Only the main week can fail the call. The leftover days are best effort,
 * planned with the standard planner whatever the tier, and their grocery list
 * covers just those days.
 */
async function planFirstWeeks(opts: {
  supabase: SupabaseClient;
  goals: GoalContext;
  today: Date;
  useAiForMainWeek: boolean;
  onlyIfEmpty: boolean;
}): Promise<{ error: string } | { mainWeekStart: string; mainPlanId: string }> {
  const weeks = firstRunWeeks(opts.today);
  const main = await getOrCreateMealPlan(weeks.mainWeekStart);
  if (!main.data) return { error: main.error ?? "Could not load your planner." };

  if (!opts.onlyIfEmpty || (await weekIsEmpty(opts.supabase, main.data.id))) {
    const planned = await planWeekWithGrocery(main.data.id, opts.goals, opts.useAiForMainWeek, ALL_DAYS);
    if ("error" in planned) return planned;
  }

  if (weeks.nextWeekStart) {
    try {
      const current = (await getOrCreateMealPlan(weeks.thisWeekStart)).data;
      if (current && (await weekIsEmpty(opts.supabase, current.id))) {
        const rest = await planWeekWithGrocery(current.id, opts.goals, false, weeks.remainingDays);
        if ("error" in rest) console.warn("[firstRun] rest of this week not planned:", rest.error);
      }
    } catch (err) {
      console.warn("[firstRun] rest of this week failed:", err instanceof Error ? err.message : err);
    }
  }

  return { mainWeekStart: weeks.mainWeekStart, mainPlanId: main.data.id };
}

/**
 * Every skipper used to land on an empty planner, and none of them ever
 * planned a meal. Now skipping still gets them a starter library and their
 * first weeks planned from it, with the standard planner (no AI, a few
 * seconds). Best effort: a failure here is logged and the skip goes ahead.
 */
async function setUpStarterWeek(supabase: SupabaseClient, userId: string, localDate?: string) {
  try {
    const [profile, tier] = await Promise.all([getProfile(), getUserTier()]);
    await seedStarterLibrary(supabase, userId, { profile, isPro: tier === "pro" });

    const planned = await planFirstWeeks({
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

/** `localDate` is the user's own date (YYYY-MM-DD) from their browser. */
export async function generateFirstRunWeekAndGrocery(input: { goals: GoalContext; localDate?: string }) {
  const { supabase, userId, error } = await requireUserId();
  if (error || !userId) return { error: error ?? "Unauthorized" };
  // Tier from the server, not the client. The AI planner re-checks it anyway,
  // so a spoofed flag never reached the LLM — it just failed the first run
  // with "Upgrade to Pro" instead of building a heuristic week.
  const isPro = (await getUserTier()) === "pro";

  const planned = await planFirstWeeks({
    supabase,
    goals: input.goals,
    today: resolveUserToday(input.localDate),
    useAiForMainWeek: isPro,
    onlyIfEmpty: false,
  });
  if ("error" in planned) return { error: planned.error };

  const complete = await completeFirstRun();
  if ("error" in complete && complete.error) return complete;

  revalidatePath("/planner");
  revalidatePath("/grocery");
  redirect(
    `/grocery?week=${planned.mainWeekStart}&plan=${planned.mainPlanId}&welcome=1${isPro ? "&pro=1" : ""}`,
  );
}

export async function getOnboardingProfile() {
  return getProfile();
}
