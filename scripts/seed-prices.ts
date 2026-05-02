/**
 * Optional seed script using the Supabase service role.
 * Prefer the SQL migrations in /sql for production (idempotent, versioned).
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed-prices.ts
 *
 * Requires: npm install -D tsx (or run via ts-node).
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(url, key);

/** Minimum purchasable pack per canonical_items.name (matches sql/2026-05-17_store_products_min_purchase.sql + catalogue expansions). */
const PACK_BY_CANONICAL: Record<string, { min_size: number; min_unit: string }> = {
  "chicken breast": { min_size: 500, min_unit: "g" },
  salmon: { min_size: 300, min_unit: "g" },
  egg: { min_size: 6, min_unit: "piece" },
  "greek yoghurt": { min_size: 500, min_unit: "g" },
  "greek yogurt": { min_size: 500, min_unit: "g" },
  "white rice": { min_size: 1000, min_unit: "g" },
  pasta: { min_size: 500, min_unit: "g" },
  oats: { min_size: 1000, min_unit: "g" },
  broccoli: { min_size: 400, min_unit: "g" },
  spinach: { min_size: 200, min_unit: "g" },
  tomatoes: { min_size: 500, min_unit: "g" },
  onion: { min_size: 1000, min_unit: "g" },
  banana: { min_size: 5, min_unit: "piece" },
  apple: { min_size: 6, min_unit: "piece" },
  "olive oil": { min_size: 500, min_unit: "ml" },
  "cheddar cheese": { min_size: 400, min_unit: "g" },
  "turkey breast": { min_size: 500, min_unit: "g" },
  "beef mince": { min_size: 500, min_unit: "g" },
  tuna: { min_size: 145, min_unit: "g" },
  shrimp: { min_size: 200, min_unit: "g" },
  "sweet potato": { min_size: 1000, min_unit: "g" },
  "bell pepper": { min_size: 450, min_unit: "g" },
  carrot: { min_size: 1000, min_unit: "g" },
  "green beans": { min_size: 220, min_unit: "g" },
  asparagus: { min_size: 250, min_unit: "g" },
  peas: { min_size: 900, min_unit: "g" },
  cucumber: { min_size: 300, min_unit: "g" },
  avocado: { min_size: 1, min_unit: "piece" },
  potato: { min_size: 2000, min_unit: "g" },
  garlic: { min_size: 3, min_unit: "piece" },
  mushroom: { min_size: 400, min_unit: "g" },
  "cottage cheese": { min_size: 300, min_unit: "g" },
  mozzarella: { min_size: 125, min_unit: "g" },
  "cream cheese": { min_size: 200, min_unit: "g" },
  almonds: { min_size: 200, min_unit: "g" },
  "peanut butter": { min_size: 340, min_unit: "g" },
  "chia seeds": { min_size: 200, min_unit: "g" },
  blueberries: { min_size: 150, min_unit: "g" },
  strawberries: { min_size: 400, min_unit: "g" },
  bread: { min_size: 20, min_unit: "slice" },
  wrap: { min_size: 8, min_unit: "piece" },
  "kidney beans": { min_size: 400, min_unit: "g" },
  "black beans": { min_size: 400, min_unit: "g" },
  "tomato puree": { min_size: 200, min_unit: "g" },
  "soy sauce": { min_size: 150, min_unit: "ml" },
  honey: { min_size: 340, min_unit: "g" },
  "coconut milk": { min_size: 400, min_unit: "ml" },
};

const CANONICAL_ITEMS: Array<{
  name: string;
  category: string;
  default_unit: string;
  is_vegan: boolean;
  is_vegetarian: boolean;
  is_gluten_free: boolean;
  is_dairy_free: boolean;
}> = [
  {
    name: "chicken breast",
    category: "meat",
    default_unit: "g",
    is_vegan: false,
    is_vegetarian: false,
    is_gluten_free: true,
    is_dairy_free: true,
  },
  {
    name: "white rice",
    category: "carb",
    default_unit: "g",
    is_vegan: true,
    is_vegetarian: true,
    is_gluten_free: true,
    is_dairy_free: true,
  },
  {
    name: "broccoli",
    category: "veg",
    default_unit: "g",
    is_vegan: true,
    is_vegetarian: true,
    is_gluten_free: true,
    is_dairy_free: true,
  },
];

async function applyPackMetadataToStoreProducts() {
  const { data: canon, error: cErr } = await supabase.from("canonical_items").select("id,name");
  if (cErr) {
    console.error("canonical_items", cErr.message);
    return;
  }
  for (const row of canon ?? []) {
    const meta = PACK_BY_CANONICAL[row.name];
    if (!meta) continue;

    const { data: products, error: pErr } = await supabase
      .from("store_products")
      .select("id,price_gbp")
      .eq("canonical_item_id", row.id);
    if (pErr) {
      console.error("store_products select", row.name, pErr.message);
      continue;
    }
    for (const p of products ?? []) {
      const price = p.price_gbp != null ? Number(p.price_gbp) : null;
      const { error: uErr } = await supabase
        .from("store_products")
        .update({
          min_purchase_size: meta.min_size,
          min_purchase_unit: meta.min_unit,
          min_purchase_price: price != null && Number.isFinite(price) ? price : null,
        })
        .eq("id", p.id);
      if (uErr) console.error("update pack", row.name, p.id, uErr.message);
    }
    console.log("pack meta:", row.name);
  }
}

async function main() {
  for (const item of CANONICAL_ITEMS) {
    const { error } = await supabase.from("canonical_items").upsert(
      {
        ...item,
        common_allergens: [],
      },
      { onConflict: "name" },
    );
    if (error) console.error(item.name, error.message);
    else console.log("canonical:", item.name);
  }

  await applyPackMetadataToStoreProducts();

  const { count } = await supabase.from("store_products").select("*", { count: "exact", head: true });
  console.log("store_products rows (approx):", count ?? "n/a");
}

main().catch(console.error);
