import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Service-role client for one-off scripts (bypasses RLS). */
export function createServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for service client.",
    );
  }
  return createClient(url, key);
}
