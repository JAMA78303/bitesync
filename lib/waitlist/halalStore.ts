/**
 * Halal waitlist writes: sign-ups and page visits to Supabase
 * (sql/2026-10-28_halal_waitlist.sql). Server only.
 *
 * Plain PostgREST inserts with the service role, like recordCrawlerVisit:
 * visitors aren't signed in, and RLS has no policies.
 */
import type { HalalSignup } from "@/lib/waitlist/halal";

async function insert(table: string, row: Record<string, unknown>, ignoreDuplicates = false): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return false;
  try {
    const res = await fetch(`${url}/rest/v1/${table}${ignoreDuplicates ? "?on_conflict=email" : ""}`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: ignoreDuplicates ? "return=minimal,resolution=ignore-duplicates" : "return=minimal",
      },
      body: JSON.stringify(row),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) console.warn(`[halal-waitlist] ${table} insert failed:`, res.status);
    return res.ok;
  } catch (err) {
    console.warn(`[halal-waitlist] ${table} insert failed:`, err instanceof Error ? err.message : err);
    return false;
  }
}

/** Saves a sign-up. Signing up twice is a no-op, not an error. */
export function saveHalalSignup(signup: HalalSignup, country: string | null): Promise<boolean> {
  return insert("halal_waitlist", { ...signup, country }, true);
}

/**
 * Counts a page view. Production only: preview deploys share the database and
 * would skew the sign-up rate. Never throws.
 */
export async function recordHalalVisit(ref: string | null, country: string | null): Promise<void> {
  if (process.env.VERCEL_ENV !== "production") return;
  await insert("halal_waitlist_visits", { ref, country });
}
