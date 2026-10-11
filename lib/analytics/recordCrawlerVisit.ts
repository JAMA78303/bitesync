import type { Crawler } from "@/lib/analytics/aiCrawlers";

/**
 * Store one crawler visit — or one visitor arriving from an AI answer — in
 * ai_crawler_visits (sql/2026-10-03_ai_crawler_visits.sql, 2026-10-11_ai_referrals.sql).
 *
 * Called from proxy.ts inside event.waitUntil, so the page is never held up.
 * A plain PostgREST insert rather than the Supabase client keeps the proxy
 * bundle small. Production only: local dev and preview deploys share the same
 * database and would otherwise fill it with test visits. Never throws — a
 * lost row is better than a failed page.
 */
export async function recordCrawlerVisit(crawler: Crawler, path: string, userAgent: string | null): Promise<void> {
  if (process.env.VERCEL_ENV !== "production") return;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;

  try {
    const res = await fetch(`${url}/rest/v1/ai_crawler_visits`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        bot: crawler.bot,
        kind: crawler.kind,
        // Path only: a query string can carry tokens.
        path: path.slice(0, 300),
        // Bots' User-Agents are kept (they name the bot); for people
        // (referrals) none is stored.
        user_agent: userAgent ? userAgent.slice(0, 300) : null,
      }),
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) console.warn("[ai-crawler] insert failed:", res.status);
  } catch (err) {
    console.warn("[ai-crawler] insert failed:", err instanceof Error ? err.message : err);
  }
}
