import { createClient } from "@/lib/supabase/server";

export type UserTier = "free" | "pro";

export async function getUserTier(): Promise<UserTier> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "free";

  const { data } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", user.id)
    .single();

  return data?.subscription_status === "pro" ? "pro" : "free";
}

export async function canCreateRecipe(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const tier = await getUserTier();
  if (tier === "pro") return true;

  const { count } = await supabase
    .from("recipes")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("archived_at", null);

  return (count ?? 0) < 10;
}

export async function getRecipeCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from("recipes")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("archived_at", null);

  return count ?? 0;
}
