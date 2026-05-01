import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { getStripeServer } from "@/lib/stripe/server";

export const runtime = "nodejs";

/** Browser GET shows nothing useful — return JSON so the URL is not a blank page. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "bitesync-stripe-webhook",
    detail:
      "This endpoint accepts POST requests from Stripe only. Configure Stripe Dashboard > Developers > Webhooks.",
  });
}

function normalizeStripeId(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof (value as { id: unknown }).id === "string"
  ) {
    return (value as { id: string }).id;
  }
  return null;
}

function subscriptionStatusToProfileStatus(
  status: Stripe.Subscription.Status,
): "pro" | "free" | "past_due" {
  if (status === "active" || status === "trialing") return "pro";
  if (status === "past_due" || status === "unpaid") return "past_due";
  return "free";
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const legacy = (invoice as unknown as { subscription?: string | null }).subscription;
  if (legacy) return legacy;

  const nested = (
    invoice as unknown as {
      parent?: { subscription_details?: { subscription?: string | null } | null } | null;
    }
  ).parent?.subscription_details?.subscription;

  return nested ?? null;
}

export async function POST(request: Request) {
  const stripe = getStripeServer();
  const body = await request.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const sessionThin = event.data.object as Stripe.Checkout.Session;
        // Completed payloads often omit expanded IDs — retrieve full session.
        const session = await stripe.checkout.sessions.retrieve(sessionThin.id, {
          expand: ["subscription", "customer"],
        });

        let userId = session.metadata?.supabase_user_id ?? null;
        const customerId = normalizeStripeId(session.customer);
        let subscriptionId = normalizeStripeId(session.subscription);

        if (!userId && subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          userId = sub.metadata?.supabase_user_id ?? null;
        }

        if (!userId) {
          console.error(
            "[stripe webhook] checkout.session.completed: missing supabase_user_id",
            session.id,
          );
          break;
        }

        const updatePayload: Record<string, string> = {
          subscription_status: "pro",
        };
        if (customerId) updatePayload.stripe_customer_id = customerId;
        if (subscriptionId) updatePayload.stripe_subscription_id = subscriptionId;

        const { error } = await supabase
          .from("profiles")
          .update(updatePayload)
          .eq("id", userId);

        if (error) {
          console.error("[stripe webhook] profiles update failed:", error);
          return NextResponse.json(
            { error: error.message },
            { status: 500 },
          );
        }

        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = getInvoiceSubscriptionId(invoice);
        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(
          subscriptionId,
        );
        let userId = subscription.metadata?.supabase_user_id ?? null;
        if (!userId) {
          const { data: row } = await supabase
            .from("profiles")
            .select("id")
            .eq("stripe_subscription_id", subscription.id)
            .maybeSingle();
          userId = row?.id ?? null;
        }
        if (!userId) break;

        const { error } = await supabase
          .from("profiles")
          .update({ subscription_status: "pro" })
          .eq("id", userId);

        if (error) {
          console.error("[stripe webhook] invoice.payment_succeeded:", error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = getInvoiceSubscriptionId(invoice);
        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(
          subscriptionId,
        );
        let userId = subscription.metadata?.supabase_user_id ?? null;
        if (!userId) {
          const { data: row } = await supabase
            .from("profiles")
            .select("id")
            .eq("stripe_subscription_id", subscription.id)
            .maybeSingle();
          userId = row?.id ?? null;
        }
        if (!userId) break;

        const { error } = await supabase
          .from("profiles")
          .update({ subscription_status: "past_due" })
          .eq("id", userId);

        if (error) {
          console.error("[stripe webhook] invoice.payment_failed:", error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        let userId = subscription.metadata?.supabase_user_id ?? null;

        if (!userId) {
          const { data: row } = await supabase
            .from("profiles")
            .select("id")
            .eq("stripe_subscription_id", subscription.id)
            .maybeSingle();
          userId = row?.id ?? null;
        }

        const query = userId
          ? supabase.from("profiles").update({ subscription_status: "free" }).eq("id", userId)
          : supabase
              .from("profiles")
              .update({ subscription_status: "free" })
              .eq("stripe_subscription_id", subscription.id);

        const { error } = await query;
        if (error) {
          console.error("[stripe webhook] customer.subscription.deleted:", error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        let userId = subscription.metadata?.supabase_user_id ?? null;
        if (!userId) {
          const { data: row } = await supabase
            .from("profiles")
            .select("id")
            .eq("stripe_subscription_id", subscription.id)
            .maybeSingle();
          userId = row?.id ?? null;
        }
        if (!userId) break;

        const profileStatus = subscriptionStatusToProfileStatus(subscription.status);
        const patch: Record<string, string> = {
          subscription_status: profileStatus,
        };
        patch.stripe_subscription_id = subscription.id;
        const cid = normalizeStripeId(subscription.customer);
        if (cid) patch.stripe_customer_id = cid;

        const { error } = await supabase
          .from("profiles")
          .update(patch)
          .eq("id", userId);

        if (error) {
          console.error("[stripe webhook] subscription.updated profiles update:", error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
