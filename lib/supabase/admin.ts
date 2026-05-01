import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function createSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key);
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
  return `${message} — For server-side Stripe sync and webhooks, set SUPABASE_SERVICE_ROLE_KEY in Vercel to the service_role secret (Supabase Dashboard → Settings → API). Do not use the anon key.`;
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
