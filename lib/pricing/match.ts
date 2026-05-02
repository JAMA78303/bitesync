import { createClient } from "@/lib/supabase/server";

export type CanonicalCatalogRow = { id: string; name: string };
export type CanonicalAliasRow = { canonical_item_id: string; alias_text: string };

export type CatalogMatch = {
  canonicalItemId: string | null;
  confidence: number;
  method: string;
};

const LEADING_DESCRIPTORS = new Set([
  "organic",
  "fresh",
  "diced",
  "chopped",
  "sliced",
  "grated",
  "raw",
  "cooked",
  "lean",
  "boneless",
  "skinless",
  "extra",
  "virgin",
  "light",
  "medium",
  "large",
  "small",
  "whole",
  "dried",
]);

function normalizeForCatalogMatch(raw: string): string {
  let s = raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9,/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const parts = s.split(/\s+/).filter(Boolean);
  while (parts.length && LEADING_DESCRIPTORS.has(parts[0])) {
    parts.shift();
  }
  return parts.join(" ").trim();
}

function tokenize(n: string): string[] {
  return n
    .split(/[,/]+/g)
    .flatMap((part) => part.split(/\s+/g))
    .map((t) => t.trim())
    .filter(Boolean);
}

function wordVariants(word: string): string[] {
  const w = word.toLowerCase();
  const out = new Set<string>([w]);
  if (w.length > 4 && w.endsWith("ies")) out.add(w.slice(0, -3) + "y");
  if (w.length > 3 && w.endsWith("es")) out.add(w.slice(0, -2));
  if (w.length > 2 && w.endsWith("s")) out.add(w.slice(0, -1));
  return [...out];
}

/**
 * Map a free-text recipe ingredient to a canonical item using the loaded catalog (no per-line DB round trips).
 * Order: exact name → exact alias → token/variant hits → substring (longest canonical wins).
 */
export function matchIngredientNameToCatalog(
  ingredientName: string,
  canonicalRows: CanonicalCatalogRow[],
  aliasRows: CanonicalAliasRow[],
): CatalogMatch {
  const n = normalizeForCatalogMatch(ingredientName);
  if (!n) return { canonicalItemId: null, confidence: 0.2, method: "none" };

  const canonByLower = new Map(canonicalRows.map((c) => [c.name.toLowerCase().trim(), c]));

  const exactCanon = canonByLower.get(n);
  if (exactCanon) return { canonicalItemId: exactCanon.id, confidence: 0.9, method: "exact" };

  const aliasExact = aliasRows.find((a) => a.alias_text.toLowerCase().trim() === n);
  if (aliasExact) return { canonicalItemId: aliasExact.canonical_item_id, confidence: 0.82, method: "alias" };

  const tokens = tokenize(n);
  const tokenSet = new Set<string>();
  for (const t of tokens) {
    for (const v of wordVariants(t)) {
      if (v.length >= 2) tokenSet.add(v);
    }
  }

  for (const c of canonicalRows) {
    const cn = c.name.toLowerCase();
    if (tokenSet.has(cn)) return { canonicalItemId: c.id, confidence: 0.78, method: "token" };
  }
  for (const a of aliasRows) {
    const at = a.alias_text.toLowerCase();
    if (tokenSet.has(at)) return { canonicalItemId: a.canonical_item_id, confidence: 0.74, method: "alias_token" };
  }

  const MIN_SUB = 4;
  const sortedCanon = [...canonicalRows].sort((a, b) => b.name.length - a.name.length);
  for (const c of sortedCanon) {
    const cn = c.name.toLowerCase();
    if (cn.length < MIN_SUB) continue;
    if (n.includes(cn)) return { canonicalItemId: c.id, confidence: 0.66, method: "contains_canonical" };
  }

  const sortedAlias = [...aliasRows].sort((a, b) => b.alias_text.length - a.alias_text.length);
  for (const a of sortedAlias) {
    const at = a.alias_text.toLowerCase();
    if (at.length < MIN_SUB) continue;
    if (n.includes(at)) return { canonicalItemId: a.canonical_item_id, confidence: 0.62, method: "contains_alias" };
  }

  for (const c of sortedCanon) {
    const cn = c.name.toLowerCase();
    if (n.length >= MIN_SUB && cn.includes(n)) return { canonicalItemId: c.id, confidence: 0.58, method: "canonical_contains_ingredient" };
  }

  return { canonicalItemId: null, confidence: 0.2, method: "none" };
}

/** Loads catalog from DB then matches (two queries). Prefer batching via matchIngredientNameToCatalog in hot loops. */
export async function matchIngredientToCanonical(
  ingredientName: string,
): Promise<{ canonicalItemId: string | null; confidence: number; method: string }> {
  const supabase = await createClient();
  const [{ data: canon }, { data: aliases }] = await Promise.all([
    supabase.from("canonical_items").select("id,name"),
    supabase.from("canonical_aliases").select("canonical_item_id,alias_text"),
  ]);
  return matchIngredientNameToCatalog(ingredientName, canon ?? [], aliases ?? []);
}
