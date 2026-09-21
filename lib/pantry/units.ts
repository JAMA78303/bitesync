/**
 * Pantry amounts are stored in base units — g, ml, piece — so the grocery
 * list can subtract them from recipe lines, which are in the same units. The
 * subtraction compares units literally: "1 kg rice" in the pantry would never
 * reduce a "95 g rice" line, so kg and litres are converted on the way in.
 */

export const PANTRY_UNIT_OPTIONS = [
  { value: "g", label: "g" },
  { value: "kg", label: "kg" },
  { value: "ml", label: "ml" },
  { value: "l", label: "litres" },
  { value: "piece", label: "pieces" },
] as const;

export type PantryUnitInput = (typeof PANTRY_UNIT_OPTIONS)[number]["value"];

export function toBasePantryAmount(
  quantity: number,
  unit: string,
): { quantity: number; unit: "g" | "ml" | "piece" } | null {
  if (!Number.isFinite(quantity) || quantity <= 0) return null;
  const u = unit.toLowerCase().trim();
  if (u === "kg" || u === "kgs" || u === "kilo" || u === "kilogram" || u === "kilograms") {
    return { quantity: Math.round(quantity * 1000), unit: "g" };
  }
  if (u === "l" || u === "litre" || u === "litres" || u === "liter" || u === "liters") {
    return { quantity: Math.round(quantity * 1000), unit: "ml" };
  }
  if (u === "g" || u === "gram" || u === "grams") return { quantity, unit: "g" };
  if (u === "ml" || u === "millilitre" || u === "millilitres" || u === "milliliter" || u === "milliliters") {
    return { quantity, unit: "ml" };
  }
  if (["", "piece", "pieces", "each", "item", "items", "whole", "unit", "units", "x"].includes(u)) {
    return { quantity, unit: "piece" };
  }
  // Tins, packs, bunches: kept as typed — the grocery list only subtracts on an
  // exact unit match, so these subtract when a recipe line uses the same word.
  return { quantity, unit: u as "g" };
}

/** "500 g", "1.5 kg", "6 pieces" — kg/l when the number is round in them. */
export function formatPantryAmount(quantity: number, unit: string): string {
  if (unit === "g" && quantity >= 1000 && quantity % 50 === 0) return `${quantity / 1000} kg`;
  if (unit === "ml" && quantity >= 1000 && quantity % 50 === 0) return `${quantity / 1000} l`;
  if (unit === "piece") return `${quantity} ${quantity === 1 ? "piece" : "pieces"}`;
  return `${quantity} ${unit}`;
}
