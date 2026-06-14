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
