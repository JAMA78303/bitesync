import type { AppEventName, AppEventProps } from "@/lib/analytics/appEvents";

/**
 * Store one product event in app_events (sql/2026-11-16_app_events.sql).
 *
 * Server-side only: called by /api/events for events from the browser, and
 * directly by server code (purchase webhooks, photo logging). A plain
 * PostgREST insert with the service key, like recordCrawlerVisit.
 *
 * Production only: local dev and preview deploys share the same database and
 * would otherwise fill it with test events. Never throws — a lost event is
 * better than a failed request.
 */
export async function recordAppEvent(event: {
  name: AppEventName;
  props?: AppEventProps;
  userId: string | null;
  platform: "web" | "ios" | null;
}): Promise<void> {
  if (process.env.VERCEL_ENV !== "production") return;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;

  try {
    const res = await fetch(`${url}/rest/v1/app_events`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        name: event.name,
        props: event.props ?? {},
        user_id: event.userId,
        platform: event.platform,
      }),
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) console.warn("[app-events] insert failed:", res.status);
  } catch (err) {
    console.warn("[app-events] insert failed:", err instanceof Error ? err.message : err);
  }
}
