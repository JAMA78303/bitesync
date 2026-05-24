"use server";

import { revalidatePath } from "next/cache";
import { invalidateCofidOverrideCache } from "@/lib/nutrition/cofidLookup";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

function getAdminIds(): string[] {
  return (process.env.ADMIN_USER_ID ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

async function isAdminUser(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  return getAdminIds().includes(user.id);
}

export async function addCofidOverride(payload: {
  ingredient_name: string;
  food_code: string;
  note?: string;
}): Promise<{ error?: string }> {
  if (!(await isAdminUser())) return { error: "Unauthorized" };

  const ingredient_name = payload.ingredient_name.trim().toLowerCase();
  const food_code = payload.food_code.trim();
  if (!ingredient_name) return { error: "Ingredient name is required." };
  if (!food_code) return { error: "Food code is required." };

  const admin = createSupabaseAdmin();
  const { error } = await admin.from("cofid_overrides").upsert(
    {
      ingredient_name,
      food_code,
      note: payload.note?.trim() || null,
    },
    { onConflict: "ingredient_name" },
  );

  if (error) return { error: error.message };

  invalidateCofidOverrideCache();
  revalidatePath("/admin/nutrition");
  return {};
}

export async function removeCofidOverride(id: number): Promise<{ error?: string }> {
  if (!(await isAdminUser())) return { error: "Unauthorized" };

  const admin = createSupabaseAdmin();
  const { error } = await admin.from("cofid_overrides").delete().eq("id", id);
  if (error) return { error: error.message };

  invalidateCofidOverrideCache();
  revalidatePath("/admin/nutrition");
  return {};
}
