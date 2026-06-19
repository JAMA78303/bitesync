import { MEAL_TYPES, type MealPlanEntry, type PlannerGrid } from "@/types";

/** True when an entry can safely occupy a planner grid cell (slot_index 0). */
export function isValidPlannerGridEntry(entry: MealPlanEntry): boolean {
  const day = entry.day_of_week;
  if (!Number.isInteger(day) || day < 0 || day > 6) return false;
  if (!MEAL_TYPES.includes(entry.meal_type)) return false;
  return true;
}

/**
 * Build the 7×4 planner grid from entries (slot_index 0 only).
 * Invalid rows are logged and skipped — never throws.
 */
export function buildGridFromEntries(entries: MealPlanEntry[]): PlannerGrid {
  const grid: PlannerGrid = {};
  for (let d = 0; d <= 6; d++) {
    grid[d] = { breakfast: null, lunch: null, dinner: null, snack: null };
  }

  const sorted = [...entries].sort((a, b) => (a.slot_index ?? 0) - (b.slot_index ?? 0));
  for (const entry of sorted) {
    const slot = entry.slot_index ?? 0;
    if (slot !== 0) continue;

    if (!isValidPlannerGridEntry(entry)) {
      console.error("[buildGrid] bad entry", {
        id: entry.id,
        day_of_week: entry.day_of_week,
        meal_type: entry.meal_type,
        slot_index: entry.slot_index,
      });
      continue;
    }

    grid[entry.day_of_week][entry.meal_type] = entry;
  }

  return grid;
}

/** Entries for a day after removing one by id (pure helper for tests + totals). */
export function entriesAfterRemove(entries: MealPlanEntry[], removedId: string): MealPlanEntry[] {
  return entries.filter((e) => e.id !== removedId);
}
