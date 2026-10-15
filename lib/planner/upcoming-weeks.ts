import type { SupabaseClient } from "@supabase/supabase-js";
import { generateGroceryList } from "@/lib/supabase/grocery";
import { getOrCreateMealPlan } from "@/lib/supabase/meal-plans";
import { firstRunWeeks } from "@/lib/onboarding/firstWeeks";
import {
  generateAIWeekPlan,
  generateHeuristicWeekPlan,
  type GoalContext,
} from "@/app/(app)/planner/ai-actions";
import { MEAL_TYPES } from "@/types";

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export async function weekIsEmpty(supabase: SupabaseClient, mealPlanId: string): Promise<boolean> {
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
 * The week a plan is for, and the days left in this one: this week Monday to
 * Wednesday, next week from Thursday (lib/onboarding/firstWeeks). Late in the
 * week the days left in this one are planned too, so Today is not empty while
 * the user waits for Monday. Only the main week can fail the call. The leftover
 * days are best effort, planned with the standard planner whatever the tier,
 * and their grocery list covers just those days.
 *
 * Used for a new user's first plan and for "plan next week in one tap" (the
 * Sunday reminder and the Today card), so both pick the same week.
 */
export async function planUpcomingWeeks(opts: {
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
        if ("error" in rest) console.warn("[upcomingWeeks] rest of this week not planned:", rest.error);
      }
    } catch (err) {
      console.warn("[upcomingWeeks] rest of this week failed:", err instanceof Error ? err.message : err);
    }
  }

  return { mainWeekStart: weeks.mainWeekStart, mainPlanId: main.data.id };
}

export type UpcomingWeekStatus = {
  /** Monday of the week a one-tap plan would fill. */
  weekStart: string;
  /** True from Thursday, when that week is next week rather than this one. */
  isNextWeek: boolean;
  isEmpty: boolean;
};

/** Read-only: unlike getOrCreateMealPlan, this never creates a plan row. */
export async function upcomingWeekStatus(
  supabase: SupabaseClient,
  userId: string,
  today: Date,
): Promise<UpcomingWeekStatus> {
  const weeks = firstRunWeeks(today);
  const status = { weekStart: weeks.mainWeekStart, isNextWeek: weeks.nextWeekStart !== null };
  const { data: plan } = await supabase
    .from("meal_plans")
    .select("id")
    .eq("user_id", userId)
    .eq("week_start_date", weeks.mainWeekStart)
    .maybeSingle();
  if (!plan) return { ...status, isEmpty: true };
  return { ...status, isEmpty: await weekIsEmpty(supabase, plan.id as string) };
}
