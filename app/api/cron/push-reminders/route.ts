import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { pushEnvReady, sendPushNotification, type PushPayload } from "@/lib/push/send";
import { addDays, getMonday, toLocalISO } from "@/lib/utils/dates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ReminderKind = "weekly" | "daily";

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

const PAYLOADS: Record<ReminderKind, PushPayload> = {
  weekly: {
    title: "Plan your week",
    body: "Your next week is still empty — build it in a couple of minutes and get your grocery list.",
    url: "/planner",
    tag: "bitesync-weekly",
  },
  daily: {
    title: "How did today go?",
    body: "Log what you ate to keep your calorie and protein tracking accurate.",
    url: "/today",
    tag: "bitesync-daily",
  },
};

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

  if (kind === "weekly" && targets.length) {
    const userIds = [...new Set(targets.map((t) => t.user_id))];
    const alreadyPlanned = await usersWithPlannedNextWeek(supabase, userIds);
    targets = targets.filter((t) => !alreadyPlanned.has(t.user_id));
  }

  let sent = 0;
  let removed = 0;
  let failed = 0;

  for (const target of targets) {
    const result = await sendPushNotification(target, PAYLOADS[kind]);

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
  console.log(`[push-reminders] ${kind}: sent ${sent}, skipped ${skipped}, removed ${removed}, failed ${failed}`);

  return NextResponse.json({ ok: true, kind, sent, skipped, removed, failed });
}
