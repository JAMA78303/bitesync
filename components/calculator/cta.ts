import { TRIAL_DAYS } from "@/lib/billing/access";

/**
 * The calculator's sign-up button. The page's FAQ quotes it word for word
 * ("If you tap …"), so both read this one string. Kept out of
 * MacroCalculator.tsx because a server component can't read a plain value
 * exported from a "use client" file.
 */
export const PLAN_MY_WEEK_CTA = `Plan my week — ${TRIAL_DAYS} days free`;
