import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { createClient } from "@/lib/supabase/server";

type ParsedIngredient = {
  rawText: string;
  name: string;
  quantity?: number;
  unit?: string;
};

function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

function normalizeSourceUrl(value: string): string {
  const u = new URL(value);
  u.hash = "";
  if (u.pathname !== "/") {
    u.pathname = u.pathname.replace(/\/+$/, "");
  }
  return u.toString();
}

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; BiteSync/1.0; +https://bitesync.io)",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(8000),
  });
  if (res.status === 403 || res.status === 429) {
    throw new Error("blocked");
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.text();
}

function parseFractionPart(token: string): number {
  const unicodeFractions: Record<string, number> = {
    "½": 0.5,
    "¼": 0.25,
    "¾": 0.75,
    "⅓": 1 / 3,
    "⅔": 2 / 3,
    "⅛": 0.125,
  };
  if (unicodeFractions[token] != null) return unicodeFractions[token]!;
  if (/^\d+\/\d+$/.test(token)) {
    const [a, b] = token.split("/");
    const den = Number(b);
    if (!den) return 0;
    return Number(a) / den;
  }
  const n = Number(token);
  return Number.isFinite(n) ? n : 0;
}

function parseQuantity(token: string): number | undefined {
  const clean = token.trim();
  if (!clean) return undefined;
  const rangeMatch = clean.match(/^(.+?)\s*[-–]\s*(.+)$/);
  if (rangeMatch) {
    const low = parseQuantity(rangeMatch[1] ?? "");
    if (low != null) return low;
  }
  const parts = clean.split(/\s+/);
  const total = parts.reduce((s, p) => s + parseFractionPart(p), 0);
  return Number.isFinite(total) && total > 0 ? total : undefined;
}

function parseIngredientString(raw: string): ParsedIngredient {
  const cleaned = raw
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^[•\-*]\s*/, "")
    .trim();
  const qtyMatch = cleaned.match(
    /^((?:\d+(?:\.\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+|[½¼¾⅓⅔⅛])(?:\s*[-–]\s*(?:\d+(?:\.\d+)?|\d+\/\d+|[½¼¾⅓⅔⅛]))?)/,
  );
  const quantity = qtyMatch?.[1] ? parseQuantity(qtyMatch[1]) : undefined;
  const restAfterQty = qtyMatch ? cleaned.slice(qtyMatch[0].length).trim() : cleaned;
  const unitMatch = restAfterQty.match(
    /^(tbsp|tsp|kg|g|ml|l|oz|lb|cups|cup|handful|pinch|slices|slice|cloves|clove|pieces|piece|large|medium|small)\b/i,
  );
  const unitRaw = unitMatch?.[1]?.toLowerCase();
  const unit =
    unitRaw === "cups" ? "cup" : unitRaw === "cloves" ? "clove" : unitRaw === "pieces" ? "piece" : unitRaw;
  let name = unitMatch ? restAfterQty.slice(unitMatch[0].length).trim() : restAfterQty;
  name = name
    .replace(/\s*\([^)]*\)\s*$/g, "")
    .replace(/\s*,\s*(to serve|for serving|optional|plus extra.*)$/i, "")
    .trim();
  if (!name) name = cleaned;
  return { rawText: cleaned, name, quantity, unit };
}

function parseRecipeYield(node: Record<string, unknown>): number {
  const raw = node.recipeYield;
  if (raw == null) return 1;
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
    return Math.min(48, Math.max(1, Math.round(raw)));
  }
  const s = String(raw).trim();
  const m = s.match(/(\d+)/);
  if (m) {
    const n = parseInt(m[1], 10);
    if (Number.isFinite(n) && n > 0) return Math.min(48, n);
  }
  return 1;
}

function looksLikeRecipeNode(node: unknown): node is Record<string, unknown> {
  if (!node || typeof node !== "object") return false;
  const t = (node as Record<string, unknown>)["@type"];
  if (typeof t === "string") return t.toLowerCase() === "recipe";
  if (Array.isArray(t)) return t.some((x) => String(x).toLowerCase() === "recipe");
  return false;
}

function parseRecipe(html: string, sourceUrl: string) {
  const $ = cheerio.load(html);
  const sourceDomain = new URL(sourceUrl).hostname.replace(/^www\./, "");

  let name = "";
  let rawIngredients: string[] = [];
  let detectedServings = 1;

  const scripts = $('script[type="application/ld+json"]').toArray();
  for (const el of scripts) {
    const raw = $(el).html() || "";
    if (!raw.trim()) continue;
    try {
      const json = JSON.parse(raw);
      const roots = Array.isArray(json) ? json : [json];
      for (const root of roots) {
        const nodes: unknown[] = [];
        nodes.push(root);
        if (root && typeof root === "object" && Array.isArray((root as { "@graph"?: unknown[] })["@graph"])) {
          nodes.push(...((root as { "@graph": unknown[] })["@graph"] ?? []));
        }
        const recipeNode = nodes.find((n) => looksLikeRecipeNode(n)) as
          | { name?: string; recipeIngredient?: unknown[] }
          | undefined;
        if (recipeNode) {
          name = String(recipeNode.name ?? "").trim();
          rawIngredients = (recipeNode.recipeIngredient ?? []).map((v) => String(v).trim()).filter(Boolean);
          detectedServings = parseRecipeYield(recipeNode as Record<string, unknown>);
          break;
        }
      }
    } catch {
      // ignore malformed JSON-LD blocks
    }
    if (rawIngredients.length > 0) break;
  }

  if (!rawIngredients.length) {
    const candidateLists: string[][] = [];
    const selectors = [
      '[itemprop="recipeIngredient"]',
      ".ingredients li",
      ".recipe-ingredients li",
      "[data-testid*='ingredient'] li",
      "li[class*='ingredient']",
    ];
    for (const sel of selectors) {
      const collected = $(sel)
        .toArray()
        .map((el) => $(el).text().replace(/\s+/g, " ").trim())
        .filter((t) => t.length > 2 && t.length < 200)
        .filter((t) => !/^(ingredients?|method|instructions?)$/i.test(t));
      if (collected.length) candidateLists.push(collected);
    }
    if (candidateLists.length) {
      rawIngredients = candidateLists
        .sort((a, b) => b.length - a.length)[0]
        ?.filter((line, idx, arr) => arr.indexOf(line) === idx) ?? [];
    }
  }

  if (!name) {
    name = $("h1").first().text().trim() || $("title").text().trim() || "Imported Recipe";
  }

  const ingredients = rawIngredients
    .map(parseIngredientString)
    .filter((i) => i.name.length > 0)
    .filter((i) => !/^(ingredients?|method|instructions?)$/i.test(i.name));
  if (!ingredients.length) {
    throw new Error("no_ingredients");
  }

  return { name, ingredients, sourceUrl, sourceDomain, detectedServings };
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const rawUrl = String(body?.url ?? "").trim();
  if (!rawUrl || !isValidUrl(rawUrl)) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }
  const sourceUrl = normalizeSourceUrl(rawUrl);

  const { data: existing } = await supabase
    .from("recipes")
    .select("id,name")
    .eq("user_id", user.id)
    .eq("source_url", sourceUrl)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: `You've already imported this recipe: ${existing.name}` },
      { status: 409 },
    );
  }

  try {
    const html = await fetchPage(sourceUrl);
    const parsed = parseRecipe(html, sourceUrl);
    return NextResponse.json(parsed);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "blocked") {
      return NextResponse.json(
        { error: "This site does not allow imports. Try copying ingredients manually." },
        { status: 422 },
      );
    }
    if (msg === "no_ingredients") {
      return NextResponse.json({ error: "Could not find ingredients on this page." }, { status: 422 });
    }
    if (msg.includes("aborted")) {
      return NextResponse.json({ error: "That page took too long to load." }, { status: 408 });
    }
    return NextResponse.json({ error: "Could not import recipe from that URL." }, { status: 422 });
  }
}
