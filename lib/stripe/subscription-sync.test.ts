import type Stripe from "stripe";
import { firstChargeAfterTrialUnpaid, stripeSubscriptionStatusToDbProfileStatus } from "@/lib/stripe/subscription-sync";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const trialEnd = 1_800_000_000;
function sub(status: Stripe.Subscription.Status, periodStart: number, trial: number | null = trialEnd) {
  return {
    status,
    trial_end: trial,
    items: { data: [{ current_period_start: periodStart }] },
  } as unknown as Stripe.Subscription;
}

// The first charge after a trial failing gets no grace.
assert(firstChargeAfterTrialUnpaid(sub("past_due", trialEnd)), "first period after the trial");
assert(stripeSubscriptionStatusToDbProfileStatus(sub("past_due", trialEnd)) === "free", "never paid: no Pro");

// A later renewal failing keeps the grace a paying customer had before.
const month = 31 * 86400;
assert(!firstChargeAfterTrialUnpaid(sub("past_due", trialEnd + month)), "a later period has been paid for");
assert(stripeSubscriptionStatusToDbProfileStatus(sub("past_due", trialEnd + month)) === "past_due", "paid before: grace");
assert(stripeSubscriptionStatusToDbProfileStatus(sub("past_due", 1_700_000_000, null)) === "past_due", "no trial: grace");

// Everything else as before, except unpaid (retries used up) no longer unlocks Pro.
assert(stripeSubscriptionStatusToDbProfileStatus(sub("active", trialEnd)) === "pro", "active is pro");
assert(stripeSubscriptionStatusToDbProfileStatus(sub("trialing", trialEnd - 100)) === "pro", "trialing is pro");
assert(stripeSubscriptionStatusToDbProfileStatus(sub("unpaid", trialEnd + month)) === "free", "unpaid is free");
assert(stripeSubscriptionStatusToDbProfileStatus(sub("canceled", trialEnd + month)) === "free", "canceled is free");
assert(!firstChargeAfterTrialUnpaid({ trial_end: trialEnd, items: { data: [] } } as unknown as Stripe.Subscription), "no items: not flagged");

console.log("subscription-sync tests passed");
