import { createClient } from "@/lib/supabase/server";
import { basketCertaintyScore, estimateRange, itemConfidenceScore } from "@/lib/pricing/scoring";
import type { BasketIngredient, StoreItemEstimate, StoreTotal } from "@/lib/pricing/types";
import { matchIngredientToCanonical } from "@/lib/pricing/match";

function rounded(v: number): number {
  return Math.round(v * 100) / 100;
}

export async function estimateStoreItems(
  ingredients: BasketIngredient[],
  stores: string[] = ["tesco", "asda", "aldi"],
): Promise<StoreItemEstimate[]> {
  const supabase = await createClient();
  const out: StoreItemEstimate[] = [];

  for (const ingredient of ingredients) {
    const match = await matchIngredientToCanonical(ingredient.name);
    if (!match.canonicalItemId) continue;

    const { data: products } = await supabase
      .from("store_products")
      .select(
        "store, unit_price_gbp, confidence, price_volatility, last_seen_at, canonical_item_id",
      )
      .eq("canonical_item_id", match.canonicalItemId)
      .in("store", stores);

    for (const p of products ?? []) {
      const conf = itemConfidenceScore({
        baseConfidence: Number(p.confidence ?? match.confidence ?? 0.6),
        lastSeenAt: String(p.last_seen_at),
        volatility: (p.price_volatility as "low" | "medium" | "high") ?? "medium",
      });
      out.push({
        ingredientName: ingredient.name,
        canonicalItemId: p.canonical_item_id,
        store: p.store,
        estimatedCost: rounded(Number(p.unit_price_gbp) * Math.max(ingredient.quantity, 0)),
        confidence: conf,
        freshnessDays: 0,
        priceVolatility: (p.price_volatility as "low" | "medium" | "high") ?? "medium",
      });
    }
  }

  return out;
}

export function summarizeStoreTotals(items: StoreItemEstimate[]): StoreTotal[] {
  const byStore = new Map<string, StoreItemEstimate[]>();
  for (const i of items) {
    byStore.set(i.store, [...(byStore.get(i.store) ?? []), i]);
  }

  return Array.from(byStore.entries()).map(([store, rows]) => {
    const total = rows.reduce((s, r) => s + r.estimatedCost, 0);
    const certainty = basketCertaintyScore(
      rows.map((r) => ({ confidence: r.confidence, estimatedCost: r.estimatedCost })),
    );
    const weightedConfidence =
      rows.reduce((s, r) => s + r.confidence * r.estimatedCost, 0) / Math.max(total, 1);
    return {
      store,
      total: rounded(total),
      weightedConfidence: Math.round(weightedConfidence * 10000) / 100,
      freshnessDays: 0,
      certainty,
      estimateRange: estimateRange(total, certainty),
    };
  });
}
