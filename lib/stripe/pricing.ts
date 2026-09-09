/**
 * Single source for the subscription prices shown in the UI.
 *
 * These literals were duplicated across the landing page, the billing screen
 * and the paywall modal — nine of them — so changing a price meant finding
 * every one and missing at least one.
 *
 * They are also what actually blocks selling outside the UK. Checkout does not:
 * `line_items` passes a Stripe Price ID, and Stripe can present a local
 * currency against that same ID (Adaptive Pricing, or `currency_options` on
 * the Price) with no change here. The failure would be quieter than a broken
 * checkout — a German visitor reads "£6.99", decides the product isn't for
 * them, and never reaches the page that would have shown euros.
 *
 * Centralising them is the prerequisite for making them reflect the viewer's
 * currency rather than the founder's.
 */

/** Numeric forms for structured data, which needs a bare amount plus a code. */
export const PRO_MONTHLY_AMOUNT = 6.99;
export const PRO_ANNUAL_AMOUNT = 59;
export const PRICE_CURRENCY = "GBP";

export const PRO_MONTHLY_PRICE = "£6.99";
export const PRO_ANNUAL_PRICE = "£59";
/** Annual price divided across 12 months, for the "works out to" comparison. */
export const PRO_ANNUAL_MONTHLY_EQUIVALENT = "£4.92";
export const FREE_PRICE = "£0";
