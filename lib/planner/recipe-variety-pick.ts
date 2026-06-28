import type { RecipePoolEntry } from "@/lib/planner/recipe-pool-availability";

/**
 * Pick among candidates by preferring lowest weekly use, then macro/slot score.
 * Spreads across the pool before repeating — exhausts distinct recipes first.
 */
export function pickLeastUsedByScore<T extends RecipePoolEntry>(
  candidates: T[],
  usedCount: Map<string, number>,
  scoreFn: (item: T) => number,
  tieSeed = 0,
): T | null {
  if (!candidates.length) return null;

  let minUsage = Infinity;
  for (const c of candidates) {
    const u = usedCount.get(c.id) ?? 0;
    if (u < minUsage) minUsage = u;
  }

  const leastUsed = candidates.filter((c) => (usedCount.get(c.id) ?? 0) === minUsage);
  if (!leastUsed.length) return null;

  const scored = leastUsed
    .map((c, index) => ({ c, score: scoreFn(c), index }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.index - b.index;
    });

  const topScore = scored[0]?.score ?? 0;
  const topTier = scored.filter((s) => s.score >= topScore - 1e-6);
  const pickIdx = ((tieSeed % topTier.length) + topTier.length) % topTier.length;
  return topTier[pickIdx]?.c ?? scored[0]?.c ?? null;
}

/** Max times any recipe id appears in a pick list (for tests). */
export function maxRecipeUseCount(picks: string[]): number {
  const counts = new Map<string, number>();
  for (const id of picks) {
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return Math.max(0, ...counts.values());
}
