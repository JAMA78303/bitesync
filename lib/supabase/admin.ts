import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function createSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key);
}

/**
 * `.update()` succeeds even when zero rows match (no profile row yet).
 * Upsert creates `profiles` for `auth.users.id` when missing.
 */
export async function updateOrInsertProfile(
  supabase: SupabaseClient,
  userId: string,
  fields: Record<string, string>,
): Promise<{ error: { message: string } | null }> {
  const { data: updatedRows, error: updateError } = await supabase
    .from("profiles")
    .update(fields)
    .eq("id", userId)
    .select("id");

  if (updateError) {
    return { error: { message: updateError.message } };
  }

  if (updatedRows && updatedRows.length > 0) {
    return { error: null };
  }

  const { error: upsertError } = await supabase
    .from("profiles")
    .upsert({ id: userId, ...fields }, { onConflict: "id" });

  if (upsertError) {
    console.error("[supabase admin] profiles upsert (no row to update):", upsertError);
    return { error: { message: upsertError.message } };
  }

  return { error: null };
}
