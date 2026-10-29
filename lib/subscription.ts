import { cache } from "react";
import { unstable_noStore as noStore } from "next/cache";
import { createSupabaseAuthAdmin } from "@/lib/supabase/admin";
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
    .select("subscription_status, stripe_subscription_id")
    .eq("id", user.id)
    .maybeSingle();

  return resolveAccess({
    subscriptionStatus: data?.subscription_status,
    createdAt: user.created_at,
    emailConfirmedAt: user.email_confirmed_at,
    appMetadata: user.app_metadata,
    hadSubscription: Boolean(data?.stripe_subscription_id),
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

type AiUse = "plans" | "recipes";
const AI_CAP: Record<AiUse, number> = { plans: TRIAL_AI_PLAN_CAP, recipes: TRIAL_AI_RECIPE_CAP };
// Counted in auth app_metadata, which only the service role can write: the
// browser can't reset it, and deleting recipes or plans doesn't give uses back.
const AI_USED_KEY: Record<AiUse, string> = { plans: "trial_ai_plans", recipes: "trial_ai_recipes" };

function aiUsed(meta: Record<string, unknown> | undefined, use: AiUse): number {
  const n = meta?.[AI_USED_KEY[use]];
  return typeof n === "number" && Number.isFinite(n) ? n : 0;
}

function aiCapped(access: Access): boolean {
  return access.aiCapUntil !== null && Date.parse(access.aiCapUntil) > Date.now();
}

async function aiAllowed(use: AiUse): Promise<boolean> {
  const [access, user] = await Promise.all([getAccess(), getSignedInUser()]);
  if (!access?.hasPro || !user) return false;
  return !aiCapped(access) || aiUsed(user.app_metadata, use) < AI_CAP[use];
}

/**
 * Takes one AI use before Claude is called; false when a trial's allowance is
 * spent (the caller then uses the standard planner or recipe templates).
 * Unlimited outside a trial. Two requests at the same moment can both take
 * the last use, which overshoots the cap by at most a call or two.
 */
async function takeAiUse(use: AiUse): Promise<boolean> {
  const [access, user] = await Promise.all([getAccess(), getSignedInUser()]);
  if (!access?.hasPro || !user) return false;
  if (!aiCapped(access)) return true;
  const admin = createSupabaseAuthAdmin();
  const { data, error } = await admin.auth.admin.getUserById(user.id);
  if (error || !data.user) return false;
  const meta = data.user.app_metadata ?? {};
  const used = aiUsed(meta, use);
  if (used >= AI_CAP[use]) return false;
  const { error: writeError } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: { ...meta, [AI_USED_KEY[use]]: used + 1 },
  });
  // If the count can't be recorded, don't spend uncounted AI.
  return !writeError;
}

/** Whether Claude may plan a week: Pro features, and on a trial, uses left of TRIAL_AI_PLAN_CAP. Doesn't use one. */
export function canUseAiWeekPlan(): Promise<boolean> {
  return aiAllowed("plans");
}

/** Uses one of a trial's AI week plans, just before calling Claude. */
export function takeAiWeekPlan(): Promise<boolean> {
  return takeAiUse("plans");
}

/** Whether new recipes may get an AI-written method: Pro features, and on a trial, uses left of TRIAL_AI_RECIPE_CAP. Doesn't use one. */
export function canUseAiRecipes(): Promise<boolean> {
  return aiAllowed("recipes");
}

/** Uses one of a trial's AI recipes, just before writing a recipe with Claude. */
export function takeAiRecipe(): Promise<boolean> {
  return takeAiUse("recipes");
}
