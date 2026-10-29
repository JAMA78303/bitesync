import {
  checkoutTrialEnd,
  FREE_RECIPE_LIMIT,
  resolveAccess,
  TRIAL_LAUNCH,
  type AccessInput,
} from "@/lib/billing/access";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const DAY = 24 * 60 * 60 * 1000;
const launch = Date.parse(TRIAL_LAUNCH);
const iso = (ms: number) => new Date(ms).toISOString();

function access(over: Partial<AccessInput>) {
  return resolveAccess({
    subscriptionStatus: null,
    createdAt: iso(launch + DAY),
    emailConfirmedAt: iso(launch + DAY),
    appMetadata: {},
    now: new Date(launch + 2 * DAY),
    ...over,
  });
}

assert(Number.isFinite(launch), "TRIAL_LAUNCH is a valid date");

// Paying always wins, whatever the account's age.
for (const status of ["pro", " PRO ", "past_due", "active", "trialing"]) {
  const a = access({ subscriptionStatus: status, createdAt: iso(launch + DAY), now: new Date(launch + 30 * DAY) });
  assert(a.plan === "pro" && a.hasPro && a.canPlan && a.recipeLimit === null && !a.comped, `${status} is pro`);
}
const comp = access({ appMetadata: { comp_pro: true }, now: new Date(launch + 30 * DAY) });
assert(comp.plan === "pro" && comp.comped && comp.hasPro, "comp_pro in app_metadata is pro");
assert(access({ appMetadata: { comp_pro: "true" } }).plan === "trial", "only boolean true comps");

// New accounts: 7 days of Pro from email confirmation.
const day1 = access({ now: new Date(launch + DAY + 1000) });
assert(day1.plan === "trial" && day1.hasPro && day1.canPlan && day1.recipeLimit === null, "a new account is on trial");
assert(day1.trialDaysLeft === 7, "7 days left right after confirming");
assert(day1.trialThen === "expired", "a new account's trial ends in expired");
const lastMs = access({ now: new Date(launch + DAY + 7 * DAY - 1) });
assert(lastMs.plan === "trial" && lastMs.trialDaysLeft === 1, "1 day left in the final day");
const ended = access({ now: new Date(launch + DAY + 7 * DAY) });
assert(ended.plan === "expired" && !ended.hasPro && !ended.canPlan && !ended.canAddRecipes, "expired exactly at 7 days");
assert(ended.recipeLimit === 0 && ended.trialEndsAt === iso(launch + 8 * DAY), "expired keeps the trial end date");

// Late confirmation doesn't eat trial days; unconfirmed falls back to sign-up time.
const late = access({ createdAt: iso(launch + DAY), emailConfirmedAt: iso(launch + 4 * DAY), now: new Date(launch + 9 * DAY) });
assert(late.plan === "trial" && late.trialDaysLeft === 2, "the clock starts at confirmation");
const unconfirmed = access({ emailConfirmedAt: null, now: new Date(launch + 9 * DAY) });
assert(unconfirmed.plan === "expired", "unconfirmed runs from sign-up");

// A confirmation time in the future (clock skew) counts as now.
const skew = access({ emailConfirmedAt: iso(launch + 5 * DAY), now: new Date(launch + 2 * DAY) });
assert(skew.plan === "trial" && skew.trialDaysLeft === 7, "future start is capped at now");

// The launch boundary: at TRIAL_LAUNCH is new, 1 ms before is legacy.
assert(access({ createdAt: iso(launch), emailConfirmedAt: iso(launch) }).plan === "trial", "at launch is a trial");
const legacy = access({ createdAt: iso(launch - 1), emailConfirmedAt: iso(launch - 1), now: new Date(launch + 60 * DAY) });
assert(legacy.plan === "free" && legacy.canPlan && legacy.recipeLimit === FREE_RECIPE_LIMIT, "before launch keeps the free plan");
assert(legacy.canStartTrial && !legacy.hasPro, "legacy accounts can start one trial");

// Legacy opt-in trial: 7 days of Pro, then back to the free plan (not expired).
const optInStart = launch + 10 * DAY;
const optIn = access({ createdAt: iso(launch - DAY), appMetadata: { trial_started_at: iso(optInStart) }, now: new Date(optInStart + DAY) });
assert(optIn.plan === "trial" && optIn.hasPro && optIn.trialDaysLeft === 6 && !optIn.canStartTrial, "legacy opt-in trial is Pro");
assert(optIn.trialThen === "free", "an opt-in trial ends back on the free plan");
const optInDone = access({ createdAt: iso(launch - DAY), appMetadata: { trial_started_at: iso(optInStart) }, now: new Date(optInStart + 8 * DAY) });
assert(optInDone.plan === "free" && optInDone.canPlan && !optInDone.canStartTrial, "after the opt-in trial: free plan, no second trial");

// A cancelled subscription: new accounts are expired, legacy ones free.
assert(access({ subscriptionStatus: "free", now: new Date(launch + 30 * DAY) }).plan === "expired", "cancelled new account is expired");
assert(access({ subscriptionStatus: "canceled", createdAt: iso(launch - DAY), now: new Date(launch + 30 * DAY) }).plan === "free", "cancelled legacy account is free");

// Bad data never locks anyone out.
assert(access({ createdAt: null }).plan === "free", "missing created_at is free");
assert(access({ createdAt: "not a date" }).plan === "free", "unreadable created_at is free");
assert(access({ appMetadata: null }).plan === "trial", "missing app_metadata is fine");

// Upgrading mid-trial bills from the trial end, unless under 48 hours are left.
const now = new Date(launch + DAY + 2 * DAY);
const midTrial = access({ now });
assert(checkoutTrialEnd(midTrial, now) === Math.floor(Date.parse(midTrial.trialEndsAt!) / 1000), "bill at the trial end");
const nearEnd = new Date(launch + DAY + 6 * DAY);
assert(checkoutTrialEnd(access({ now: nearEnd }), nearEnd) === null, "under 48h left charges now");
assert(checkoutTrialEnd(legacy, now) === null, "no trial, charge now");

console.log("access tests passed");
