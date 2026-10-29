/**
 * What each account may do. Pure, so the rules are unit-tested without a
 * database (lib/billing/access.test.ts); lib/subscription.ts feeds it the
 * signed-in user.
 *
 * Since TRIAL_LAUNCH, new accounts get TRIAL_DAYS of full Pro with no card.
 * When the trial ends without paying, they can still see their recipes and
 * plans and finish the week (tick meals, tick and edit the grocery list, edit
 * recipes), but planning new weeks, placing meals, making grocery lists and
 * adding recipes need Pro. Accounts created before TRIAL_LAUNCH keep the free
 * plan they signed up for, and can start one 7-day Pro trial of their own,
 * after which they return to the free plan.
 *
 * No database column holds any of this: the trial runs from the auth user's
 * sign-up (confirmation) time, and the per-user overrides live in auth
 * app_metadata, which only the service role can write.
 */

export const TRIAL_DAYS = 7;

/**
 * When the trial replaced the free plan for new sign-ups. This is evaluated
 * live for every account on every request, so never move it: earlier would
 * take away the free plan people signed up for, later would give a free plan
 * to people who signed up for a trial. Set to the production deploy of the
 * trial PR.
 */
export const TRIAL_LAUNCH = "2026-10-29T00:00:00.000Z";

/** Claude week plans per trial; after that the standard planner still works. */
export const TRIAL_AI_PLAN_CAP = 5;
/** Recipes with an AI-written method per trial; after that recipes are composed from templates. */
export const TRIAL_AI_RECIPE_CAP = 20;
/** The free plan's recipe allowance (legacy accounts). */
export const FREE_RECIPE_LIMIT = 10;

/** Server errors once a trial has ended. No price, so they're fine inside the iPhone app too. */
export const TRIAL_ENDED_PLANNING = `Your ${TRIAL_DAYS}-day Pro trial has ended. Upgrade to BiteSync Pro to keep planning.`;
export const TRIAL_ENDED_RECIPES = `Your ${TRIAL_DAYS}-day Pro trial has ended. Upgrade to BiteSync Pro to keep adding recipes.`;

const DAY_MS = 24 * 60 * 60 * 1000;
const TRIAL_MS = TRIAL_DAYS * DAY_MS;

/**
 * - pro: paying (or comped through app_metadata).
 * - trial: within 7 days of Pro, either a new account or a legacy account's opt-in trial.
 * - free: an account from before TRIAL_LAUNCH, on the free plan it signed up for.
 * - expired: a new account whose trial ended without paying.
 */
export type Plan = "pro" | "trial" | "free" | "expired";

export type Access = {
  plan: Plan;
  /** Pro features: AI plans, micronutrients, unlimited recipes. Pro and trial. */
  hasPro: boolean;
  /** Plan weeks, place meals, make grocery lists. Everyone except expired. */
  canPlan: boolean;
  /** Add recipes at all (subject to recipeLimit). Everyone except expired. */
  canAddRecipes: boolean;
  /** Active recipes allowed; null means unlimited. */
  recipeLimit: number | null;
  /** Comped through app_metadata rather than paying (no Stripe to manage). */
  comped: boolean;
  /** When the current or last trial started and ends (ISO); null if there was none. */
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  /** Whole days left, 1–7, while on trial. */
  trialDaysLeft: number | null;
  /**
   * What the trial turns into without paying: "expired" for new accounts
   * (planning stops), "free" for an older account's opt-in trial. Null off trial.
   */
  trialThen: "free" | "expired" | null;
  /** A legacy free account that hasn't used its one-time trial. */
  canStartTrial: boolean;
};

export type AccessInput = {
  subscriptionStatus: string | null | undefined;
  /** auth.users.created_at */
  createdAt: string | null | undefined;
  /** auth.users.email_confirmed_at */
  emailConfirmedAt: string | null | undefined;
  /** auth.users.raw_app_meta_data; service-role writable only. */
  appMetadata: Record<string, unknown> | null | undefined;
  now: Date;
};

/** A Stripe-backed subscription that grants Pro (past_due keeps access until Stripe downgrades). */
export function isProSubscriptionStatus(status: string | null | undefined): boolean {
  if (status == null || typeof status !== "string") return false;
  const s = status.trim().toLowerCase();
  // App stores `pro` / `past_due`; tolerate Stripe-native strings if DB was mis-written.
  return s === "pro" || s === "past_due" || s === "active" || s === "trialing";
}

function time(iso: unknown): number {
  return typeof iso === "string" ? Date.parse(iso) : NaN;
}

function trial(start: number, now: number): Pick<Access, "trialStartedAt" | "trialEndsAt" | "trialDaysLeft"> & { active: boolean } {
  // A start in the future (clock skew) counts as starting now.
  const from = Math.min(start, now);
  const end = from + TRIAL_MS;
  const active = now < end;
  return {
    active,
    trialStartedAt: new Date(from).toISOString(),
    trialEndsAt: new Date(end).toISOString(),
    trialDaysLeft: active ? Math.min(TRIAL_DAYS, Math.ceil((end - now) / DAY_MS)) : null,
  };
}

const PRO = { hasPro: true, canPlan: true, canAddRecipes: true, recipeLimit: null } as const;
const FREE = { hasPro: false, canPlan: true, canAddRecipes: true, recipeLimit: FREE_RECIPE_LIMIT } as const;
const EXPIRED = { hasPro: false, canPlan: false, canAddRecipes: false, recipeLimit: 0 } as const;
const NO_TRIAL = { trialStartedAt: null, trialEndsAt: null, trialDaysLeft: null, trialThen: null } as const;

export function resolveAccess(input: AccessInput): Access {
  const now = input.now.getTime();
  const meta = input.appMetadata ?? {};
  const paying = isProSubscriptionStatus(input.subscriptionStatus);
  const comped = !paying && meta.comp_pro === true;
  if (paying || comped) {
    return { plan: "pro", ...PRO, comped, ...NO_TRIAL, canStartTrial: false };
  }

  const launch = time(TRIAL_LAUNCH);
  const created = time(input.createdAt);
  // Anything unreadable falls back to the free plan everyone had before the
  // trial, never to expired: a bad date must not lock anyone out.
  const legacy = !Number.isFinite(launch) || !Number.isFinite(created) || created < launch;

  if (legacy) {
    const optIn = time(meta.trial_started_at);
    if (Number.isFinite(optIn)) {
      const t = trial(optIn, now);
      const { active, ...dates } = t;
      if (active) return { plan: "trial", ...PRO, comped: false, ...dates, trialThen: "free", canStartTrial: false };
      return { plan: "free", ...FREE, comped: false, ...dates, trialThen: null, canStartTrial: false };
    }
    return { plan: "free", ...FREE, comped: false, ...NO_TRIAL, canStartTrial: true };
  }

  // New accounts: the clock starts when the email is confirmed (the app can't
  // be used before), so slow confirmers don't lose days.
  const confirmed = time(input.emailConfirmedAt);
  const { active, ...dates } = trial(Number.isFinite(confirmed) ? confirmed : created, now);
  if (active) return { plan: "trial", ...PRO, comped: false, ...dates, trialThen: "expired", canStartTrial: false };
  return { plan: "expired", ...EXPIRED, comped: false, ...dates, trialThen: null, canStartTrial: false };
}

/**
 * When a checkout started during a trial should first charge: at the end of
 * the trial, so upgrading early doesn't cost the remaining days. Stripe needs
 * a trial end at least 48 hours ahead, so with less left it charges now (null).
 */
export function checkoutTrialEnd(access: Access, now: Date): number | null {
  if (access.plan !== "trial" || !access.trialEndsAt) return null;
  const end = Date.parse(access.trialEndsAt);
  if (!Number.isFinite(end) || end - now.getTime() < 48 * 60 * 60 * 1000 + 60 * 1000) return null;
  return Math.floor(end / 1000);
}
