import { recipeMatchesDietaryPreferences } from "@/lib/matching/diet-filter";
import {
  matchRecipeIngredients,
  type AvailableIngredient,
  type RecipeIngredientLine,
} from "@/lib/matching/ingredient-overlap";
import type { MealType, RecipeDietFlags } from "@/types";

export type RecipeMatchCandidate = RecipeDietFlags & {
  id: string;
  name: string;
  ingredients: RecipeIngredientLine[];
};

export type RankedRecipeMatch = {
  recipeId: string;
  recipeName: string;
  matchedCount: number;
  totalIngredients: number;
  overlapLabel: string;
  matchedIngredients: string[];
  missingIngredients: string[];
  score: number;
};

export type SuggestMealsResult = {
  matches: RankedRecipeMatch[];
  availableCount: number;
  fallbackRecipes: RankedRecipeMatch[];
  usedFallback: boolean;
};

export type SuggestMealsOptions = {
  dietaryPreferences?: string[];
  mealType?: MealType;
  limit?: number;
  minOverlap?: number;
};

function overlapLabel(matched: number, total: number, availableCount: number): string {
  return `Uses ${matched} of ${total} ingredients (${availableCount} on hand)`;
}

function rankRecipe(
  available: AvailableIngredient[],
  recipe: RecipeMatchCandidate,
  availableCount: number,
): RankedRecipeMatch {
  const { matched, missing, matchedCount, totalCount } = matchRecipeIngredients(
    available,
    recipe.ingredients,
  );

  const overlapRatio = totalCount > 0 ? matchedCount / totalCount : 0;
  const score = overlapRatio * 100 + matchedCount * 5;

  return {
    recipeId: recipe.id,
    recipeName: recipe.name,
    matchedCount,
    totalIngredients: totalCount,
    overlapLabel: overlapLabel(matchedCount, totalCount, availableCount),
    matchedIngredients: matched.map((m) => m.recipeIngredient),
    missingIngredients: missing,
    score,
  };
}

/**
 * Source-agnostic meal suggestions: rank saved recipes by ingredient overlap.
 * Used by pantry ("cook from what I have") and grocery leftovers (unchecked items).
 */
export function suggestMealsFromAvailableIngredients(
  available: AvailableIngredient[],
  recipes: RecipeMatchCandidate[],
  options: SuggestMealsOptions = {},
): SuggestMealsResult {
  const dietaryPreferences = options.dietaryPreferences ?? [];
  const limit = options.limit ?? 8;
  const minOverlap = options.minOverlap ?? 1;
  const availableCount = available.length;

  const eligible = recipes.filter((r) => recipeMatchesDietaryPreferences(r, dietaryPreferences));

  const ranked = eligible
    .map((recipe) => rankRecipe(available, recipe, availableCount))
    .filter((row) => row.matchedCount >= minOverlap && row.totalIngredients > 0)
    .sort((a, b) => {
      if (b.matchedCount !== a.matchedCount) return b.matchedCount - a.matchedCount;
      const aRatio = a.matchedCount / a.totalIngredients;
      const bRatio = b.matchedCount / b.totalIngredients;
      if (bRatio !== aRatio) return bRatio - aRatio;
      return b.score - a.score;
    });

  const matches = ranked.slice(0, limit);

  if (matches.length > 0) {
    return {
      matches,
      availableCount,
      fallbackRecipes: [],
      usedFallback: false,
    };
  }

  const fallbackRecipes = eligible
    .slice(0, limit)
    .map((recipe) => rankRecipe(available, recipe, availableCount))
    .sort((a, b) => a.recipeName.localeCompare(b.recipeName));

  return {
    matches: [],
    availableCount,
    fallbackRecipes,
    usedFallback: true,
  };
}

/** Convert grocery or pantry rows to available-ingredient input. */
export function namesToAvailableIngredients(names: string[]): AvailableIngredient[] {
  const seen = new Set<string>();
  const items: AvailableIngredient[] = [];
  for (const raw of names) {
    const name = raw.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({ name });
  }
  return items;
}
