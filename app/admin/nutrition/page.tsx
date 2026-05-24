import Link from "next/link";
import { CoFIDOverridesEditor, type CofidOverrideRow } from "@/components/admin/CoFIDOverridesEditor";
import { createClient } from "@/lib/supabase/server";

export default async function AdminNutritionPage() {
  const supabase = await createClient();

  const { data: overrides } = await supabase
    .from("cofid_overrides")
    .select("id, ingredient_name, food_code, note")
    .order("ingredient_name", { ascending: true });

  const codes = [...new Set((overrides ?? []).map((o) => o.food_code))];
  const { data: foods } = codes.length
    ? await supabase.from("cofid_foods").select("food_code, food_name").in("food_code", codes)
    : { data: [] };

  const nameByCode = new Map((foods ?? []).map((f) => [f.food_code, f.food_name]));

  const rows: CofidOverrideRow[] = (overrides ?? []).map((o) => ({
    id: o.id,
    ingredient_name: o.ingredient_name,
    food_code: o.food_code,
    note: o.note,
    cofid_food_name: nameByCode.get(o.food_code) ?? null,
  }));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">CoFID ingredient overrides</h1>
          <p className="mt-1 text-sm text-slate-500">
            Pin recipe ingredient names to specific CoFID food codes. Checked before fuzzy matching.
          </p>
        </div>
        <Link href="/admin/prices" className="text-sm text-[#3a5a40] hover:underline">
          ← Price management
        </Link>
      </div>

      <CoFIDOverridesEditor overrides={rows} />
    </div>
  );
}
