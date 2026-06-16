/**
 * Tiered relaxation for weekly planner recipe pools.
 * Prefer variety (max 2×/week, no same-day repeat) but always fill slots when possible.
 */

export type RecipePoolEntry = { id: string };

export type RecipeAvailabilityTier =
  | "strict"
  | "allow_same_day"
  | "allow_third_use"
  | "any_recipe";

const TIER_ORDER: RecipeAvailabilityTier[] = [
  "strict",
  "allow_same_day",
  "allow_third_use",
  "any_recipe",
];

export function recipeAvailabilityTiers(): RecipeAvailabilityTier[] {
  return [...TIER_ORDER];
}

/** Filter pool by usage caps — callers pass progressively looser tiers. */
export function filterPoolByUsageTier<T extends RecipePoolEntry>(
  pool: T[],
  usedCount: Map<string, number>,
  usedOnDay: Set<string>,
  tier: RecipeAvailabilityTier,
): T[] {
  switch (tier) {
    case "strict":
      return pool.filter((r) => (usedCount.get(r.id) ?? 0) < 2 && !usedOnDay.has(r.id));
    case "allow_same_day":
      return pool.filter((r) => (usedCount.get(r.id) ?? 0) < 2);
    case "allow_third_use":
      return pool.filter((r) => (usedCount.get(r.id) ?? 0) < 3);
    case "any_recipe":
      return [...pool];
    default:
      return pool.filter((r) => (usedCount.get(r.id) ?? 0) < 2 && !usedOnDay.has(r.id));
  }
}
