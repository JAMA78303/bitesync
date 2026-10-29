import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createSupabaseAuthAdmin } from "@/lib/supabase/admin";
import { isProSubscriptionStatus, resolveAccess } from "@/lib/billing/access";
import { pushEnvReady, sendPushNotification } from "@/lib/push/send";
import { REMINDER_PAYLOADS, type ReminderKind } from "@/lib/push/reminderPayloads";
import { addDays, getMonday, toLocalISO } from "@/lib/utils/dates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

/**
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. Without a configured
 * secret the endpoint stays closed rather than becoming a public send trigger.
 */
function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/** Users whose upcoming week already has meals — they don't need nagging. */
async function usersWithPlannedNextWeek(
  supabase: ReturnType<typeof createServiceClient>,
  userIds: string[],
): Promise<Set<string>> {
  if (!userIds.length) return new Set();

  const nextMonday = toLocalISO(addDays(getMonday(new Date()), 7));
  const { data: plans } = await supabase
    .from("meal_plans")
    .select("id, user_id")
    .in("user_id", userIds)
    .eq("week_start_date", nextMonday);

  if (!plans?.length) return new Set();

  const planIds = plans.map((p) => p.id as string);
  const { data: entries } = await supabase
    .from("meal_plan_entries")
    .select("meal_plan_id")
    .in("meal_plan_id", planIds)
    .limit(1000);

  if (!entries?.length) return new Set();

  const plannedPlanIds = new Set(entries.map((e) => e.meal_plan_id as string));
  const userByPlan = new Map(plans.map((p) => [p.id as string, p.user_id as string]));
  const planned = new Set<string>();
  for (const planId of plannedPlanIds) {
    const userId = userByPlan.get(planId);
    if (userId) planned.add(userId);
  }
  return planned;
}

/**
 * Users who can't plan a week (lib/billing/access.ts): a new account whose
 * trial ended without paying. "Plan next week in one tap" would only lead them
 * to an upgrade prompt. Fails open: anyone whose plan can't be checked is left
 * out of the set and gets the reminder as before, because a missed reminder
 * costs more than one that ends at an upgrade prompt (the planner itself
 * enforces the rule).
 */
async function usersWhoCannotPlan(
  supabase: ReturnType<typeof createServiceClient>,
  userIds: string[],
): Promise<Set<string>> {
  const cannotPlan = new Set<string>();
  if (!userIds.length) return cannotPlan;

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, subscription_status")
    .in("id", userIds);
  if (error) {
    // Without the subscription status a paying user could look expired.
    console.error("[push-reminders] profiles query failed; not checking trials", error.message);
    return cannotPlan;
  }
  const statusById = new Map(
    (profiles ?? []).map((p) => [p.id as string, p.subscription_status as string | null]),
  );

  let admin: ReturnType<typeof createSupabaseAuthAdmin>;
  try {
    admin = createSupabaseAuthAdmin();
  } catch (err) {
    console.error("[push-reminders] auth admin unavailable; not checking trials", err);
    return cannotPlan;
  }

  const now = new Date();
  let unchecked = 0;
  await Promise.all(
    userIds.map(async (userId) => {
      const subscriptionStatus = statusById.get(userId);
      // Paying users can always plan; no need to look up their login.
      if (isProSubscriptionStatus(subscriptionStatus)) return;
      try {
        const { data, error: userError } = await admin.auth.admin.getUserById(userId);
        if (userError || !data.user) {
          unchecked += 1;
          return;
        }
        const access = resolveAccess({
          subscriptionStatus,
          createdAt: data.user.created_at,
          emailConfirmedAt: data.user.email_confirmed_at,
          appMetadata: data.user.app_metadata,
          now,
        });
        if (!access.canPlan) cannotPlan.add(userId);
      } catch {
        unchecked += 1;
      }
    }),
  );

  if (unchecked) {
    console.error(`[push-reminders] couldn't check the plan of ${unchecked} user(s); sending as before`);
  }
  return cannotPlan;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!pushEnvReady()) {
    return NextResponse.json({ error: "Push not configured" }, { status: 503 });
  }

  const url = new URL(request.url);
  const kind: ReminderKind = url.searchParams.get("kind") === "daily" ? "daily" : "weekly";
  const today = toLocalISO(new Date());
  const prefColumn = kind === "weekly" ? "weekly_plan_reminder" : "daily_log_reminder";
  const sentColumn = kind === "weekly" ? "last_weekly_sent_on" : "last_daily_sent_on";

  const supabase = createServiceClient();

  // `or` guards idempotency: a re-fired cron on the same day sends nothing.
  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth")
    .eq(prefColumn, true)
    .or(`${sentColumn}.is.null,${sentColumn}.neq.${today}`);

  if (error) {
    console.error("[push-reminders] query failed", error.message);
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }

  let targets = (subscriptions ?? []) as SubscriptionRow[];
  // Part of `skipped`: subscriptions left out because their trial has ended.
  let skippedExpired = 0;

  if (kind === "weekly" && targets.length) {
    const userIds = [...new Set(targets.map((t) => t.user_id))];
    const alreadyPlanned = await usersWithPlannedNextWeek(supabase, userIds);
    targets = targets.filter((t) => !alreadyPlanned.has(t.user_id));

    // The evening reminder still goes to everyone: viewing tomorrow's plan
    // doesn't need Pro, planning a new week does.
    const remaining = [...new Set(targets.map((t) => t.user_id))];
    const cannotPlan = await usersWhoCannotPlan(supabase, remaining);
    const before = targets.length;
    targets = targets.filter((t) => !cannotPlan.has(t.user_id));
    skippedExpired = before - targets.length;
  }

  let sent = 0;
  let removed = 0;
  let failed = 0;

  for (const target of targets) {
    const result = await sendPushNotification(target, REMINDER_PAYLOADS[kind]);

    if (result.ok) {
      sent += 1;
      await supabase
        .from("push_subscriptions")
        .update({ [sentColumn]: today })
        .eq("id", target.id);
      continue;
    }

    if (result.gone) {
      removed += 1;
      await supabase.from("push_subscriptions").delete().eq("id", target.id);
      continue;
    }

    failed += 1;
    console.error("[push-reminders] send failed", result.error);
  }

  const skipped = (subscriptions?.length ?? 0) - targets.length;
  console.log(
    `[push-reminders] ${kind}: sent ${sent}, skipped ${skipped} (${skippedExpired} trial ended), removed ${removed}, failed ${failed}`,
  );

  return NextResponse.json({ ok: true, kind, sent, skipped, skippedExpired, removed, failed });
}
