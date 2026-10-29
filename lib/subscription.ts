import { cache } from "react";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  isProSubscriptionStatus,
  resolveAccess,
  TRIAL_AI_PLAN_CAP,
  TRIAL_AI_RECIPE_CAP,
  type Access,
} from "@/lib/billing/access";

export { isProSubscriptionStatus };
export type { Access, Plan } from "@/lib/billing/access";

/** The signed-in auth user, fetched once per request. */
const getSignedInUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * What the signed-in user may do (lib/billing/access.ts has the rules), or
 * null when nobody is signed in. Cached per request: layouts, pages and
 * server actions all ask, and each ask used to cost an auth round trip.
 */
export const getAccess = cache(async (): Promise<Access | null> => {
  noStore();
  const user = await getSignedInUser();
  if (!user) return null;
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", user.id)
    .maybeSingle();

  return resolveAccess({
    subscriptionStatus: data?.subscription_status,
    createdAt: user.created_at,
    emailConfirmedAt: user.email_confirmed_at,
    appMetadata: user.app_metadata,
    now: new Date(),
  });
});

/** Active (non-archived) recipes. */
export async function getRecipeCount(): Promise<number> {
  const user = await getSignedInUser();
  if (!user) return 0;
  const supabase = await createClient();

  const { count } = await supabase
    .from("recipes")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("archived_at", null);

  return count ?? 0;
}

/** Whether one more recipe fits: unlimited on Pro and trial, 10 on the free plan, none once a trial has ended. */
export async function canCreateRecipe(): Promise<boolean> {
  const access = await getAccess();
  if (!access?.canAddRecipes) return false;
  if (access.recipeLimit === null) return true;
  return (await getRecipeCount()) < access.recipeLimit;
}

/**
 * Whether this run may use Claude: Pro features, and on a trial only the
 * first TRIAL_AI_PLAN_CAP Claude week plans (plan_runs records each one).
 * After that the standard planner still plans the week.
 */
export async function canUseAiWeekPlan(): Promise<boolean> {
  const [access, user] = await Promise.all([getAccess(), getSignedInUser()]);
  if (!access?.hasPro || !user) return false;
  if (access.plan !== "trial" || !access.trialStartedAt) return true;
  const supabase = await createClient();
  const { count } = await supabase
    .from("plan_runs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("outcome", "claude")
    .gte("created_at", access.trialStartedAt);
  return (count ?? 0) < TRIAL_AI_PLAN_CAP;
}

/**
 * Whether new recipes may get an AI-written method: Pro features, and on a
 * trial only while fewer than TRIAL_AI_RECIPE_CAP recipes were added since it
 * started. After that recipes are composed from templates, same nutrition.
 */
export async function canUseAiRecipes(): Promise<boolean> {
  const [access, user] = await Promise.all([getAccess(), getSignedInUser()]);
  if (!access?.hasPro || !user) return false;
  if (access.plan !== "trial" || !access.trialStartedAt) return true;
  const supabase = await createClient();
  const { count } = await supabase
    .from("recipes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", access.trialStartedAt);
  return (count ?? 0) < TRIAL_AI_RECIPE_CAP;
}
