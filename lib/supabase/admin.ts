import { Buffer } from "node:buffer";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Decode `role` from a Supabase JWT (anon vs service_role) without verifying the signature. */
function jwtRoleFromSupabaseKey(key: string): string | null {
  try {
    const parts = key.trim().split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8"),
    ) as { role?: unknown };
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

export function createSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key?.trim()) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (name must start with SUP — not UPABASE_)",
    );
  }

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

  return createClient(url, key.trim());
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
  return `${message} — In Vercel, add env var exactly SUPABASE_SERVICE_ROLE_KEY (service_role JWT from Supabase → Settings → API). Not the anon key; name must be SUPABASE_ not UPABASE_. Redeploy after saving.`;
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
