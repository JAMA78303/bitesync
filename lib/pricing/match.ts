import { createClient } from "@/lib/supabase/server";

export async function matchIngredientToCanonical(
  ingredientName: string,
): Promise<{ canonicalItemId: string | null; confidence: number; method: string }> {
  const supabase = await createClient();
  const normalized = ingredientName.trim().toLowerCase();

  const { data: direct } = await supabase
    .from("canonical_items")
    .select("id, name")
    .ilike("name", normalized)
    .limit(1);
  if (direct?.[0]?.id) {
    return { canonicalItemId: direct[0].id, confidence: 0.9, method: "exact" };
  }

  const { data: alias } = await supabase
    .from("canonical_aliases")
    .select("canonical_item_id, alias_text")
    .ilike("alias_text", normalized)
    .limit(1);
  if (alias?.[0]?.canonical_item_id) {
    return { canonicalItemId: alias[0].canonical_item_id, confidence: 0.8, method: "alias" };
  }

  return { canonicalItemId: null, confidence: 0.2, method: "none" };
}
