import * as cheerio from "cheerio";
import { parseIngredientLine, type ParsedIngredient } from "@/lib/recipes/parseIngredient";

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

function parseInstructions(raw: unknown): string[] {
  if (!raw) return [];
  const items = Array.isArray(raw) ? raw : [raw];
  const steps: string[] = [];
  for (const item of items) {
    if (typeof item === "string") {
      steps.push(item.trim());
      continue;
    }
    if (item && typeof item === "object") {
      const text = (item as { text?: string; name?: string }).text ?? (item as { name?: string }).name;
      if (typeof text === "string" && text.trim()) steps.push(text.trim());
    }
  }
  return steps.filter(Boolean);
}

export type ExtractedRecipe = {
  name: string;
  ingredients: ParsedIngredient[];
  steps: string[];
  detectedServings: number;
};

export function extractRecipeFromHtml(html: string, fallbackName = "Imported Recipe"): ExtractedRecipe {
  const $ = cheerio.load(html);

  let name = "";
  let rawIngredients: string[] = [];
  let steps: string[] = [];
  let detectedServings = 1;

  const scripts = $('script[type="application/ld+json"]').toArray();
  for (const el of scripts) {
    const raw = $(el).html() || "";
    if (!raw.trim()) continue;
    try {
      const json = JSON.parse(raw);
      const roots = Array.isArray(json) ? json : [json];
      for (const root of roots) {
        const nodes: unknown[] = [root];
        if (root && typeof root === "object" && Array.isArray((root as { "@graph"?: unknown[] })["@graph"])) {
          nodes.push(...((root as { "@graph": unknown[] })["@graph"] ?? []));
        }
        const recipeNode = nodes.find((n) => looksLikeRecipeNode(n)) as
          | {
              name?: string;
              recipeIngredient?: unknown[];
              recipeInstructions?: unknown;
            }
          | undefined;
        if (recipeNode) {
          name = String(recipeNode.name ?? "").trim();
          rawIngredients = (recipeNode.recipeIngredient ?? []).map((v) => String(v).trim()).filter(Boolean);
          steps = parseInstructions(recipeNode.recipeInstructions);
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
      rawIngredients =
        candidateLists.sort((a, b) => b.length - a.length)[0]?.filter((line, idx, arr) => arr.indexOf(line) === idx) ??
        [];
    }
  }

  if (!name) {
    name = $("h1").first().text().trim() || $("title").text().trim() || fallbackName;
  }

  const ingredients = rawIngredients
    .map(parseIngredientLine)
    .filter((i) => i.name.length > 0)
    .filter((i) => !/^(ingredients?|method|instructions?)$/i.test(i.name));

  return { name, ingredients, steps, detectedServings };
}
