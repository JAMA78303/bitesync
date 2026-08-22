import { parseIngredientLine } from "@/lib/recipes/parseIngredient";
import { scoreCofidMatch } from "@/lib/nutrition/cofidMatch";

/** Minimum score for an available item to cover a recipe ingredient line. */
export const INGREDIENT_MATCH_THRESHOLD = 48;

export type AvailableIngredient = {
  name: string;
  quantity?: number | null;
  unit?: string | null;
  runningLow?: boolean;
};

export type RecipeIngredientLine = {
  name: string;
};

export type IngredientOverlapDetail = {
  recipeIngredient: string;
  matchedBy: string | null;
  score: number;
};

/** Parse free-text pantry input ("chicken, rice, eggs") into ingredient names. */
export function parseBulkIngredientInput(raw: string): AvailableIngredient[] {
  const parts = raw
    .split(/[,;\n]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const items: AvailableIngredient[] = [];

  for (const part of parts) {
    const parsed = parseIngredientLine(part);
    if (!parsed) continue;
    const name = parsed.name.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({
      name,
      quantity: parsed.quantity,
      unit: parsed.unit,
    });
  }

  return items;
}

/** Score how well an available ingredient covers a recipe ingredient (higher = better). */
export function scoreIngredientOverlap(availableName: string, recipeIngredientName: string): number {
  return scoreCofidMatch(availableName, recipeIngredientName, "partial");
}

export function ingredientNamesMatch(availableName: string, recipeIngredientName: string): boolean {
  return scoreIngredientOverlap(availableName, recipeIngredientName) >= INGREDIENT_MATCH_THRESHOLD;
}

/** Prep/size words that describe the same food rather than a different one. */
const PANTRY_NOISE_WORDS = new Set([
  "fresh",
  "whole",
  "raw",
  "large",
  "small",
  "medium",
  "chopped",
  "sliced",
  "diced",
  "grated",
  "minced",
  "of",
  // Form/unit words that describe how a food is sold, not which food it is:
  // "garlic cloves" is garlic, "rosemary sprigs" is rosemary.
  "clove",
  "cloves",
  "bulb",
  "head",
  "sprig",
  "sprigs",
  "stick",
  "sticks",
  "leaf",
  "leaves",
  "fillet",
  "fillets",
]);

function pantryTokens(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !PANTRY_NOISE_WORDS.has(t))
    // Crude singularisation so "eggs" covers "egg" and "tomatoes" covers "tomato".
    .map((t) => (t.endsWith("oes") ? t.slice(0, -2) : t.endsWith("s") && !t.endsWith("ss") ? t.slice(0, -1) : t))
    .sort();
}

/**
 * Does owning `pantryName` mean you do NOT need to buy `ingredientName`?
 *
 * Deliberately stricter than `ingredientNamesMatch`. That one scores via the CoFID
 * matcher, which is built to map a name onto a food-database row and is therefore
 * fuzzy on purpose — "chicken" should find "Chicken, whole, raw". Reused here it
 * silently deleted real shopping items: pantry "pepper" covered "red pepper",
 * "butter" covered "peanut butter", "milk" covered "almond milk".
 *
 * A missing ingredient discovered at the shop is far more costly than buying
 * something you already had, so this requires the significant words to match
 * exactly. Modifier-prefixed foods ("red pepper" vs "pepper") are different foods.
 */
export function pantryCoversIngredient(pantryName: string, ingredientName: string): boolean {
  const have = pantryTokens(pantryName);
  const need = pantryTokens(ingredientName);
  if (!have.length || !need.length) return false;
  if (have.length !== need.length) return false;
  return have.every((token, i) => token === need[i]);
}

/** Match each recipe ingredient to the best available item, if any. */
export function matchRecipeIngredients(
  available: AvailableIngredient[],
  recipeIngredients: RecipeIngredientLine[],
): {
  matched: IngredientOverlapDetail[];
  missing: string[];
  matchedCount: number;
  totalCount: number;
} {
  const matched: IngredientOverlapDetail[] = [];
  const missing: string[] = [];

  for (const line of recipeIngredients) {
    const recipeName = line.name.trim();
    if (!recipeName) continue;

    let bestAvailable: string | null = null;
    let bestScore = -Infinity;

    for (const item of available) {
      const score = scoreIngredientOverlap(item.name, recipeName);
      if (score > bestScore) {
        bestScore = score;
        bestAvailable = item.name;
      }
    }

    if (bestAvailable && bestScore >= INGREDIENT_MATCH_THRESHOLD) {
      matched.push({
        recipeIngredient: recipeName,
        matchedBy: bestAvailable,
        score: bestScore,
      });
    } else {
      missing.push(recipeName);
    }
  }

  const totalCount = matched.length + missing.length;
  return {
    matched,
    missing,
    matchedCount: matched.length,
    totalCount,
  };
}
