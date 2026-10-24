"use server";

import { redirect } from "next/navigation";
import { createSupabaseAdmin, createSupabaseAuthAdmin } from "@/lib/supabase/admin";
import { getProfile } from "@/lib/supabase/profile";
import { getStripeServer } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function deleteAccount(confirmEmail: string): Promise<{ error?: string } | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: "You must be signed in to delete your account." };
  }

  if (confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()) {
    return { error: "Email does not match your account." };
  }

  const profile = await getProfile();
  const stripeCustomerId = profile?.stripe_customer_id?.trim();
  const stripeSubscriptionId = profile?.stripe_subscription_id?.trim();

  // Deleting the Stripe customer also cancels any subscription; their invoices
  // stay in Stripe for the accounts. Upgrade creates a customer before checkout,
  // so people who never paid have one too.
  if (stripeCustomerId || stripeSubscriptionId) {
    try {
      const stripe = getStripeServer();
      if (stripeCustomerId) await stripe.customers.del(stripeCustomerId);
      else if (stripeSubscriptionId) await stripe.subscriptions.cancel(stripeSubscriptionId);
    } catch (err) {
      console.error("[deleteAccount] Stripe cleanup failed:", err);
      // Continue — the customer may already be gone; still delete account data.
    }
  }

  const admin = createSupabaseAdmin();

  const { error: plansError } = await admin.from("meal_plans").delete().eq("user_id", user.id);
  if (plansError) {
    console.error("[deleteAccount] meal_plans delete:", plansError.message);
    return { error: "Could not delete your meal plans. Please try again or contact hello@bitesync.io." };
  }

  const { error: recipesError } = await admin.from("recipes").delete().eq("user_id", user.id);
  if (recipesError) {
    console.error("[deleteAccount] recipes delete:", recipesError.message);
    return { error: "Could not delete your recipes. Please try again or contact hello@bitesync.io." };
  }

  const { error: profileError } = await admin.from("profiles").delete().eq("id", user.id);
  if (profileError) {
    console.error("[deleteAccount] profiles delete:", profileError.message);
    return { error: "Could not delete your profile. Please try again or contact hello@bitesync.io." };
  }

  // Last step: the login itself. Every step above is safe to repeat, so if this
  // fails the person can press Delete again. Plan runs, pantry items and push
  // subscriptions cascade from the login.
  let authError: string | null = null;
  try {
    const { error } = await createSupabaseAuthAdmin().auth.admin.deleteUser(user.id);
    authError = error?.message ?? null;
  } catch (err) {
    authError = err instanceof Error ? err.message : String(err);
  }
  if (authError) {
    console.error("[deleteAccount] auth delete:", authError);
    return { error: "Could not delete your account. Please try again or contact hello@bitesync.io." };
  }

  await supabase.auth.signOut();
  redirect("/?deleted=1");
}
