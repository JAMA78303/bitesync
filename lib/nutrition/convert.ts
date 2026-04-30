const TO_GRAMS: Record<string, number> = {
  g: 1,
  kg: 1000,
  oz: 28.35,
  lb: 453.59,
  ml: 1,
  l: 1000,
  tsp: 5,
  tbsp: 15,
  cup: 240,
  "fl oz": 29.57,
  piece: 100,
  slice: 30,
  clove: 5,
  rasher: 25,
  handful: 40,
};

export function toGrams(quantity: number, unit: string): number | null {
  const multiplier = TO_GRAMS[unit.toLowerCase().trim()];
  if (!multiplier || Number.isNaN(quantity) || quantity <= 0) {
    return null;
  }
  return quantity * multiplier;
}

export function getSupportedUnits(): string[] {
  return Object.keys(TO_GRAMS);
}
