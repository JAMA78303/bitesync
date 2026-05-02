import { createClient } from "@/lib/supabase/server";
import { basketCertaintyScore, estimateRange, itemConfidenceScore } from "@/lib/pricing/scoring";
import type { BasketIngredient, StoreItemEstimate, StoreTotal } from "@/lib/pricing/types";
import { matchIngredientNameToCatalog, type CanonicalAliasRow, type CanonicalCatalogRow } from "@/lib/pricing/match";

function rounded(v: number): number {
  return Math.round(v * 100) / 100;
}

export type EstimateStoreItemsMeta = {
  /** Distinct ingredient lines that received at least one store price row. */
  pricedLineCount: number;
  /** Ingredient names (from your recipes) that did not price — no canonical match or no store_products row. */
  unmatchedSample: string[];
  /** Rows in canonical_items (0 with no error often means RLS blocked reads or wrong Supabase project). */
  catalogSize: number;
  /** Set when the catalogue query failed (permissions, network, etc.). */
  catalogLoadError: string | null;
};

export type EstimateStoreItemsResult = {
  estimates: StoreItemEstimate[];
  meta: EstimateStoreItemsMeta;
};

export async function estimateStoreItems(
  ingredients: BasketIngredient[],
  stores: string[] = ["tesco", "asda", "aldi"],
): Promise<EstimateStoreItemsResult> {
  const supabase = await createClient();
  const out: StoreItemEstimate[] = [];
  const pricedNames = new Set<string>();

  const [{ data: canonRows, error: canonErr }, { data: aliasRows, error: aliasErr }] = await Promise.all([
    supabase.from("canonical_items").select("id,name"),
    supabase.from("canonical_aliases").select("canonical_item_id,alias_text"),
  ]);

  const catalog: CanonicalCatalogRow[] = canonRows ?? [];
  const aliases: CanonicalAliasRow[] = aliasRows ?? [];

  if (canonErr || aliasErr) {
    const catalogLoadError = [canonErr?.message, aliasErr?.message].filter(Boolean).join(" · ") || "Unknown error";
    return {
      estimates: [],
      meta: {
        pricedLineCount: 0,
        unmatchedSample: ingredients.map((i) => i.name).filter((n, idx, a) => a.indexOf(n) === idx).slice(0, 12),
        catalogSize: 0,
        catalogLoadError,
      },
    };
  }

  for (const ingredient of ingredients) {
    const match = matchIngredientNameToCatalog(ingredient.name, catalog, aliases);
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
      pricedNames.add(ingredient.name);
    }
  }

  const unmatchedSample = ingredients
    .filter((ing) => !pricedNames.has(ing.name))
    .map((ing) => ing.name)
    .filter((name, i, arr) => arr.indexOf(name) === i)
    .slice(0, 12);

  return {
    estimates: out,
    meta: {
      pricedLineCount: pricedNames.size,
      unmatchedSample,
      catalogSize: catalog.length,
      catalogLoadError: null,
    },
  };
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
