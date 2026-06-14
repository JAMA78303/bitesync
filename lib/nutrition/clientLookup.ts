import type { CoFIDMatchKind } from "@/lib/nutrition/cofidLookup";
import type { NutritionLookupSource } from "@/lib/nutrition/lookupAsync";

export interface ClientNutritionResult {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  sugar_g: number;
  sodium_mg: number;
  /** null = no saturated-fat data for this food (unknown). */
  saturated_fat_g: number | null;
  source: NutritionLookupSource;
  estimated: boolean;
  cofid_food_name?: string;
  cofid_matched_by?: CoFIDMatchKind;
}

export async function lookupNutritionClient(
  name: string,
  quantity: number,
  unit: string,
): Promise<ClientNutritionResult | null> {
  try {
    const res = await fetch("/api/nutrition/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, quantity, unit }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { nutrition?: ClientNutritionResult | null };
    return data.nutrition ?? null;
  } catch {
    return null;
  }
}
