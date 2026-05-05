"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

export async function updateStorePrice(
  productId: string,
  data: {
    price_gbp: number;
    size_value: number;
    size_unit: string;
    min_purchase_size: number | null;
    min_purchase_unit: string | null;
    min_purchase_price: number | null;
    price_volatility: "low" | "medium" | "high";
  },
) {
  if (!(await isAdminUser())) return { error: "Unauthorized" };
  if (!Number.isFinite(data.price_gbp) || data.price_gbp < 0) return { error: "Invalid price." };
  if (!Number.isFinite(data.size_value) || data.size_value <= 0) return { error: "Invalid size value." };

  const supabase = await createClient();
  const unit_price_gbp = data.price_gbp / data.size_value;

  const { error } = await supabase
    .from("store_products")
    .update({
      price_gbp: data.price_gbp,
      unit_price_gbp,
      size_value: data.size_value,
      size_unit: data.size_unit.trim(),
      min_purchase_size: data.min_purchase_size,
      min_purchase_unit: data.min_purchase_unit,
      min_purchase_price: data.min_purchase_price ?? data.price_gbp,
      price_volatility: data.price_volatility,
      last_seen_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (error) return { error: error.message };

  revalidatePath("/admin/prices");
  revalidatePath("/planner");
  revalidatePath("/grocery");
  return { success: true as const };
}

export async function addCanonicalItem(data: {
  name: string;
  category: string;
  default_unit: string;
  is_vegan: boolean;
  is_vegetarian: boolean;
  is_gluten_free: boolean;
  is_dairy_free: boolean;
}) {
  if (!(await isAdminUser())) return { error: "Unauthorized" };
  if (!data.name.trim()) return { error: "Name is required." };
  if (!data.default_unit.trim()) return { error: "Default unit is required." };

  const supabase = await createClient();
  const normalized = {
    ...data,
    name: data.name.toLowerCase().trim(),
    category: data.category.toLowerCase().trim(),
    default_unit: data.default_unit.toLowerCase().trim(),
  };

  const { data: item, error } = await supabase
    .from("canonical_items")
    .insert(normalized)
    .select("id,name,category,default_unit")
    .single();
  if (error) return { error: error.message };

  const stores = ["tesco", "asda", "aldi"] as const;
  const nowIso = new Date().toISOString();
  const rows = stores.map((store) => ({
    store,
    product_name: `${store} ${normalized.name}`,
    canonical_item_id: item.id,
    price_gbp: 0,
    unit_price_gbp: 0,
    size_value: 100,
    size_unit: normalized.default_unit,
    price_volatility: "medium" as const,
    last_seen_at: nowIso,
  }));

  const { error: storeError } = await supabase.from("store_products").insert(rows);
  if (storeError) return { error: storeError.message };

  revalidatePath("/admin/prices");
  return { success: true as const, item };
}
