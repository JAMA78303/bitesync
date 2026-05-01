import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { getStripeServer } from "@/lib/stripe/server";

export const runtime = "nodejs";

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
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        if (!userId) break;

        await supabase
          .from("profiles")
          .update({
            subscription_status: "pro",
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
          })
          .eq("id", userId);

        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = getInvoiceSubscriptionId(invoice);
        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(
          subscriptionId,
        );
        const userId = subscription.metadata?.supabase_user_id;
        if (!userId) break;

        await supabase
          .from("profiles")
          .update({ subscription_status: "pro" })
          .eq("id", userId);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = getInvoiceSubscriptionId(invoice);
        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(
          subscriptionId,
        );
        const userId = subscription.metadata?.supabase_user_id;
        if (!userId) break;

        await supabase
          .from("profiles")
          .update({ subscription_status: "past_due" })
          .eq("id", userId);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;

        if (userId) {
          await supabase
            .from("profiles")
            .update({ subscription_status: "free" })
            .eq("id", userId);
        } else {
          await supabase
            .from("profiles")
            .update({ subscription_status: "free" })
            .eq("stripe_subscription_id", subscription.id);
        }

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;
        if (!userId) break;

        const status = subscription.status === "active" ? "pro" : "free";
        await supabase
          .from("profiles")
          .update({ subscription_status: status })
          .eq("id", userId);
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
