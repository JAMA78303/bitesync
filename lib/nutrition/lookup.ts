import type { NutritionLookupEntry } from "@/types";
import { NUTRITION_DB } from "@/lib/nutrition/nutrition-db";

function normalizeName(value: string): string {
  return value.toLowerCase().trim();
}

export function lookupNutrition(name: string): NutritionLookupEntry | null {
  const normalized = normalizeName(name);
  const exact = NUTRITION_DB.find((item) => normalizeName(item.name) === normalized);
  if (exact) return exact;

  // Fallback matching for user-entered variations (e.g. "alfredo sauce", "grated parmesan")
  const partial = NUTRITION_DB.find((item) => {
    const dbName = normalizeName(item.name);
    return normalized.includes(dbName) || dbName.includes(normalized);
  });
  const entry = partial;
  return entry ?? null;
}

export function getNutritionSeedSize(): number {
  return NUTRITION_DB.length;
}

export function getNutritionIngredientNames(): string[] {
  return NUTRITION_DB.map((entry) => entry.name).sort((a, b) => a.localeCompare(b));
}
