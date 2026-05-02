import type { NutritionLookupEntry } from "@/types";

const TO_GRAMS: Record<string, number> = {
  g: 1,
  kg: 1000,
  oz: 28.35,
  lb: 453.59,
  mg: 0.001,
  ml: 1,
  l: 1000,
  cl: 10,
  tsp: 5,
  tbsp: 15,
  cup: 240,
  "fl oz": 29.57,
  piece: 100,
  item: 100,
  slice: 30,
  clove: 5,
  rasher: 25,
  handful: 40,
  sprig: 5,
  stalk: 30,
  head: 500,
  bunch: 100,
  can: 400,
  tin: 400,
  jar: 350,
  sachet: 10,
  fillet: 150,
  breast: 175,
  thigh: 120,
  drumstick: 100,
};

export function toGrams(quantity: number, unit: string): number | null {
  const multiplier = TO_GRAMS[unit.toLowerCase().trim()];
  if (multiplier == null || Number.isNaN(quantity) || quantity <= 0) {
    return null;
  }
  return quantity * multiplier;
}

/** Converts quantity + unit to grams using ingredient-specific typical weights when available (e.g. 1 piece apple). */
export function ingredientGrams(
  quantity: number,
  unit: string,
  nutritionEntry: NutritionLookupEntry | null,
): number | null {
  if (Number.isNaN(quantity) || quantity <= 0) return null;
  const u = unit.toLowerCase().trim();

  if (u === "piece" || u === "item") {
    const perPiece = nutritionEntry?.typical_piece_g;
    if (perPiece != null && perPiece > 0) {
      return quantity * perPiece;
    }
    const fallback = TO_GRAMS.piece;
    return quantity * fallback;
  }

  if (u === "slice") {
    const perSlice = nutritionEntry?.typical_slice_g;
    if (perSlice != null && perSlice > 0) {
      return quantity * perSlice;
    }
    const fallback = TO_GRAMS.slice ?? 30;
    return quantity * fallback;
  }

  return toGrams(quantity, unit);
}

export function getSupportedUnits(): string[] {
  return Object.keys(TO_GRAMS);
}
