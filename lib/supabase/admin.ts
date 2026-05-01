import { Buffer } from "node:buffer";
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

export function createSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key?.trim()) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (name must start with SUP — not UPABASE_)",
    );
  }

  const trimmed = key.trim();

  const role = jwtRoleFromSupabaseKey(trimmed);
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
  const keyRef = projectRefFromSupabaseKey(trimmed);
  if (urlRef && keyRef && urlRef !== keyRef) {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL project (${urlRef}) does not match SUPABASE_SERVICE_ROLE_KEY project (${keyRef}). Paste both from the same Supabase project: Settings → API.`,
    );
  }

  return createClient(url, trimmed);
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
  return `${message} — Fix: Vercel → Project → Settings → Environment Variables → exact name SUPABASE_SERVICE_ROLE_KEY = service_role secret from Supabase → Settings → API (same project as NEXT_PUBLIC_SUPABASE_URL). Enable for Production and Preview if you test previews; redeploy. If the error persists, the URL and service_role key are often from two different Supabase projects — recopy both from one dashboard.`;
}

/**
 * `.update()` succeeds even when zero rows match (no profile row yet).
 * Upsert creates `profiles` for `auth.users.id` when missing.
 *
 * Avoids `.update().select()` RETURNING: some DB setups reject RETURNING for the PostgREST role.
 */
export async function updateOrInsertProfile(
  supabase: SupabaseClient,
  userId: string,
  fields: Record<string, string>,
): Promise<{ error: { message: string } | null }> {
  const { error: updateError } = await supabase
    .from("profiles")
    .update(fields)
    .eq("id", userId);

  if (updateError) {
    return { error: { message: hintSupabasePermissionDenied(updateError.message) } };
  }

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existing) {
    return { error: null };
  }

  const { error: upsertError } = await supabase
    .from("profiles")
    .upsert({ id: userId, ...fields }, { onConflict: "id" });

  if (upsertError) {
    console.error("[supabase admin] profiles upsert (no row to update):", upsertError);
    return { error: { message: hintSupabasePermissionDenied(upsertError.message) } };
  }

  return { error: null };
}
