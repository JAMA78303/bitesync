import { Buffer } from "node:buffer";
import postgres from "postgres";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Decode JWT payload without verifying the signature (same pattern as Supabase dashboard keys). */
function jwtPayload(key: string): { role?: unknown; ref?: unknown } | null {
  try {
    const parts = key.trim().split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as {
      role?: unknown;
      ref?: unknown;
    };
  } catch {
    return null;
  }
}

function jwtRoleFromSupabaseKey(key: string): string | null {
  const p = jwtPayload(key);
  return typeof p?.role === "string" ? p.role : null;
}

/** e.g. https://abcdxyz.supabase.co → abcdxyz */
function projectRefFromSupabaseUrl(url: string): string | null {
  try {
    const host = new URL(url.trim()).hostname.toLowerCase();
    const m = host.match(/^([a-z0-9]{20})\.supabase\.co$/);
    return m?.[1] ?? null;
  } catch {
    return null;
  }
}

function projectRefFromSupabaseKey(key: string): string | null {
  const p = jwtPayload(key);
  return typeof p?.ref === "string" ? p.ref : null;
}

/** Validates env and returns normalized URL + key. Throws if invalid (legacy JWT checks skipped for sb_secret_*). */
export function getValidatedSupabaseServiceContext(): { url: string; key: string } {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!rawUrl?.trim() || !rawKey?.trim()) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (name must start with SUP — not UPABASE_)",
    );
  }

  const url = rawUrl.trim().replace(/\/$/, "");
  const key = rawKey.trim();

  if (!key.startsWith("sb_secret_")) {
    const role = jwtRoleFromSupabaseKey(key);
    if (role === "anon") {
      throw new Error(
        "SUPABASE_SERVICE_ROLE_KEY is the anon/public key. In Supabase Dashboard → Settings → API, copy the service_role secret (long JWT), not the anon key, into Vercel.",
      );
    }
    if (role != null && role !== "service_role") {
      throw new Error(
        `SUPABASE_SERVICE_ROLE_KEY has role "${role}" but must be service_role. Copy the service_role secret from Supabase → Settings → API into Vercel.`,
      );
    }

    const urlRef = projectRefFromSupabaseUrl(url);
    const keyRef = projectRefFromSupabaseKey(key);
    if (urlRef && keyRef && urlRef !== keyRef) {
      throw new Error(
        `NEXT_PUBLIC_SUPABASE_URL project (${urlRef}) does not match SUPABASE_SERVICE_ROLE_KEY project (${keyRef}). Paste both from the same Supabase project: Settings → API.`,
      );
    }
  }

  return { url, key };
}

export function createSupabaseAdmin(): SupabaseClient {
  const { url, key } = getValidatedSupabaseServiceContext();

  return createClient(url, key, {
    accessToken: async () => key,
  });
}

/**
 * Options for the client that manages login accounts. createSupabaseAdmin's
 * `accessToken` option makes supabase-js throw on any `auth.*` access, so
 * `auth.admin.deleteUser` there could never run (accounts were left behind).
 */
export const AUTH_ADMIN_CLIENT_OPTIONS = {
  auth: { autoRefreshToken: false, persistSession: false },
} as const;

/** Service-role client for `auth.admin` calls (deleting a login, setting app_metadata). */
export function createSupabaseAuthAdmin(): SupabaseClient {
  const { url, key } = getValidatedSupabaseServiceContext();
  return createClient(url, key, AUTH_ADMIN_CLIENT_OPTIONS);
}

function restAuthHeaders(key: string): Record<string, string> {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: "application/json",
  };
}

async function readPostgrestError(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const j = JSON.parse(text) as {
      message?: string;
      error?: string;
      details?: string;
      hint?: string;
      code?: string;
    };
    const parts: string[] = [];
    if (typeof j.message === "string") parts.push(j.message);
    if (typeof j.details === "string") parts.push(`Details: ${j.details}`);
    if (typeof j.hint === "string") parts.push(`Hint: ${j.hint}`);
    if (typeof j.code === "string") parts.push(`Code: ${j.code}`);
    if (parts.length > 0) return parts.join(" — ");
    if (typeof j.error === "string") return j.error;
  } catch {
    /* ignore */
  }
  return text.trim() || `HTTP ${res.status}`;
}

const PROFILE_UPSERT_COLUMNS = new Set([
  "subscription_status",
  "stripe_customer_id",
  "stripe_subscription_id",
]);

function sanitizeProfileFields(fields: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (PROFILE_UPSERT_COLUMNS.has(k)) out[k] = v;
  }
  return out;
}

/** Bypass PostgREST entirely — connects as Postgres (transaction pooler URI). */
async function upsertProfileViaPooler(
  connectionString: string,
  userId: string,
  fields: Record<string, string>,
): Promise<{ error: { message: string } | null }> {
  const safe = sanitizeProfileFields(fields);
  const keys = Object.keys(safe);
  if (keys.length === 0) return { error: null };

  const sql = postgres(connectionString, { max: 1, ssl: "require" });
  try {
    const columns = ["id", ...keys];
    const colList = columns.join(", ");
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
    const updates = keys.map((k) => `${k} = EXCLUDED.${k}`).join(", ");
    const values: string[] = [userId, ...keys.map((k) => safe[k])];
    const query = `
      INSERT INTO public.profiles (${colList})
      VALUES (${placeholders})
      ON CONFLICT (id) DO UPDATE SET ${updates}
    `;
    await sql.unsafe(query, values);
    return { error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[supabase admin] pooler upsert failed:", msg);
    return { error: { message: msg } };
  } finally {
    await sql.end({ timeout: 5 });
  }
}

async function selectStripeCustomerViaPooler(
  connectionString: string,
  userId: string,
): Promise<{ stripe_customer_id: string | null } | { error: string }> {
  const sql = postgres(connectionString, { max: 1, ssl: "require" });
  try {
    const rows = await sql<{ stripe_customer_id: string | null }[]>`
      SELECT stripe_customer_id FROM public.profiles WHERE id = ${userId}::uuid LIMIT 1
    `;
    const row = rows[0];
    return { stripe_customer_id: row?.stripe_customer_id ?? null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: msg };
  } finally {
    await sql.end({ timeout: 5 });
  }
}

/** Hint when PostgREST returns permission denied (wrong/missing service role on server). */
export function hintSupabasePermissionDenied(message: string): string {
  const lower = message.toLowerCase();
  if (
    !lower.includes("permission denied") &&
    !lower.includes("42501") &&
    !lower.includes("insufficient_privilege")
  ) {
    return message;
  }
  return `${message} — Fix: (1) In Supabase → Settings → API open **Legacy anon, service_role API keys** and paste the **service_role** JWT (starts with eyJ) into Vercel as SUPABASE_SERVICE_ROLE_KEY — new sb_secret_ keys sometimes mis-auth via REST. (2) Or set SUPABASE_DB_POOLER_URL (Transaction pooler URI from Database → Connection string) to bypass REST. Redeploy after env changes.`;
}

/**
 * Read `stripe_customer_id` via PostgREST fetch (no supabase-js REST auth chain).
 * Used by Stripe sync so RLS / session JWT never applies.
 */
export async function fetchProfileStripeCustomerId(
  userId: string,
): Promise<{ stripe_customer_id: string | null } | { error: string }> {
  const pooler = process.env.SUPABASE_DB_POOLER_URL?.trim();
  if (pooler) {
    return selectStripeCustomerViaPooler(pooler, userId);
  }

  try {
    const { url, key } = getValidatedSupabaseServiceContext();
    const res = await fetch(
      `${url}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=stripe_customer_id`,
      { headers: restAuthHeaders(key), cache: "no-store" },
    );
    if (!res.ok) {
      return { error: hintSupabasePermissionDenied(await readPostgrestError(res)) };
    }
    const rows = (await res.json()) as { stripe_customer_id: string | null }[];
    const row = rows[0];
    return { stripe_customer_id: row?.stripe_customer_id ?? null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Request failed";
    return { error: hintSupabasePermissionDenied(msg) };
  }
}

/**
 * Updates or inserts `profiles` via PostgREST `fetch` only (service role headers).
 * Avoids supabase-js using the logged-in user's JWT for REST in Server Actions.
 */
export async function updateOrInsertProfile(
  userId: string,
  fields: Record<string, string>,
): Promise<{ error: { message: string } | null }> {
  const pooler = process.env.SUPABASE_DB_POOLER_URL?.trim();
  if (pooler) {
    return upsertProfileViaPooler(pooler, userId, fields);
  }

  let url: string;
  let key: string;
  try {
    ({ url, key } = getValidatedSupabaseServiceContext());
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid Supabase configuration.";
    return { error: { message: msg } };
  }

  const headers: Record<string, string> = {
    ...restAuthHeaders(key),
    "Content-Type": "application/json",
  };

  const patchRes = await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, {
    method: "PATCH",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify(fields),
  });

  if (!patchRes.ok) {
    return {
      error: { message: hintSupabasePermissionDenied(await readPostgrestError(patchRes)) },
    };
  }

  const getRes = await fetch(
    `${url}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=id`,
    { headers, cache: "no-store" },
  );
  if (!getRes.ok) {
    return {
      error: { message: hintSupabasePermissionDenied(await readPostgrestError(getRes)) },
    };
  }
  const existing = (await getRes.json()) as { id: string }[];
  if (existing.length > 0) {
    return { error: null };
  }

  const postRes = await fetch(`${url}/rest/v1/profiles`, {
    method: "POST",
    headers: {
      ...headers,
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({ id: userId, ...fields }),
  });

  if (!postRes.ok) {
    const msg = await readPostgrestError(postRes);
    console.error("[supabase admin] profiles POST upsert:", msg);
    return {
      error: { message: hintSupabasePermissionDenied(msg) },
    };
  }

  return { error: null };
}
