import { createClient } from "@/lib/supabase/server";
import { PriceEditor } from "@/components/admin/PriceEditor";

export default async function AdminPricesPage() {
  const supabase = await createClient();

  const { data: canonicalItems } = await supabase
    .from("canonical_items")
    .select("id,name,category,default_unit")
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  const { data: storeProducts } = await supabase
    .from("store_products")
    .select(
      "id,store,product_name,canonical_item_id,price_gbp,unit_price_gbp,size_value,size_unit,min_purchase_size,min_purchase_unit,min_purchase_price,price_volatility,last_seen_at",
    )
    .order("store", { ascending: true });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Price Management</h1>
        <p className="mt-1 text-sm text-slate-500">
          Update store prices monthly. Changes go live immediately for all users.
        </p>
      </div>

      <PriceEditor
        canonicalItems={(canonicalItems ?? []) as Array<{
          id: string;
          name: string;
          category: string;
          default_unit: string;
        }>}
        storeProducts={(storeProducts ?? []) as Array<{
          id: string;
          store: string;
          product_name: string;
          canonical_item_id: string;
          price_gbp: number;
          unit_price_gbp: number;
          size_value: number;
          size_unit: string;
          min_purchase_size: number | null;
          min_purchase_unit: string | null;
          min_purchase_price: number | null;
          price_volatility: "low" | "medium" | "high" | null;
          last_seen_at: string | null;
        }>}
      />
    </div>
  );
}
