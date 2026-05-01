import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = new Stripe(stripeSecretKey ?? "sk_test_placeholder", {
  apiVersion: "2026-04-22.dahlia",
  typescript: true,
});

export function getStripeServer() {
  if (!stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return stripe;
}
