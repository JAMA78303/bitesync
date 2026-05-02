import { createClient } from "@/lib/supabase/server";
import { basketCertaintyScore, estimateRange, itemConfidenceScore } from "@/lib/pricing/scoring";
import type { BasketIngredient, StoreItemEstimate, StoreTotal } from "@/lib/pricing/types";
import { matchIngredientNameToCatalog, type CanonicalAliasRow, type CanonicalCatalogRow } from "@/lib/pricing/match";

function rounded(v: number): number {
  return Math.round(v * 100) / 100;
}

function normalizeUnit(u: string): string {
  return u.trim().toLowerCase();
}

/** Per store line: whole-pack cost when min purchase metadata matches ingredient unit. */
export function computeIngredientStoreLineCost(
  ingredient: BasketIngredient,
  unitPriceGbp: number,
  minPurchaseSize: number | null | undefined,
  minPurchaseUnit: string | null | undefined,
  minPurchasePrice: number | null | undefined,
): { cost: number; displayNote: string } {
  const qty = Math.max(0, ingredient.quantity);
  const ingUnit = normalizeUnit(ingredient.unit);
  const minSz =
    minPurchaseSize != null && Number.isFinite(Number(minPurchaseSize)) ? Number(minPurchaseSize) : null;
  const minPrice =
    minPurchasePrice != null && Number.isFinite(Number(minPurchasePrice)) ? Number(minPurchasePrice) : null;
  const minUnit = minPurchaseUnit?.trim() ? normalizeUnit(minPurchaseUnit) : null;

  if (minSz != null && minSz > 0 && minPrice != null && minPrice > 0 && minUnit && ingUnit === minUnit) {
    const packsNeeded = Math.max(1, Math.ceil(qty / minSz));
    const cost = rounded(packsNeeded * minPrice);
    const displayNote =
      packsNeeded > 1 ? `${packsNeeded} packs needed` : "1 pack covers your recipe";
    return { cost, displayNote };
  }

  return { cost: rounded(Number(unitPriceGbp) * qty), displayNote: "" };
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
        "store, unit_price_gbp, price_gbp, confidence, price_volatility, last_seen_at, canonical_item_id, min_purchase_size, min_purchase_unit, min_purchase_price",
      )
      .eq("canonical_item_id", match.canonicalItemId)
      .in("store", stores);

    for (const p of products ?? []) {
      const conf = itemConfidenceScore({
        baseConfidence: Number(p.confidence ?? match.confidence ?? 0.6),
        lastSeenAt: String(p.last_seen_at),
        volatility: (p.price_volatility as "low" | "medium" | "high") ?? "medium",
      });
      const unitPrice = Number(p.unit_price_gbp);
      const shelfPrice = p.price_gbp != null ? Number(p.price_gbp) : null;
      const minPriceRaw = p.min_purchase_price != null ? Number(p.min_purchase_price) : null;
      const minPrice =
        minPriceRaw != null && Number.isFinite(minPriceRaw) && minPriceRaw > 0
          ? minPriceRaw
          : shelfPrice != null && Number.isFinite(shelfPrice) && shelfPrice > 0
            ? shelfPrice
            : null;
      const { cost, displayNote } = computeIngredientStoreLineCost(
        ingredient,
        unitPrice,
        p.min_purchase_size != null ? Number(p.min_purchase_size) : null,
        p.min_purchase_unit != null ? String(p.min_purchase_unit) : null,
        minPrice,
      );
      out.push({
        ingredientName: ingredient.name,
        canonicalItemId: p.canonical_item_id,
        store: p.store,
        estimatedCost: cost,
        confidence: conf,
        freshnessDays: 0,
        priceVolatility: (p.price_volatility as "low" | "medium" | "high") ?? "medium",
        displayNote: displayNote || undefined,
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
