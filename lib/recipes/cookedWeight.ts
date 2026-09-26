/**
 * Weight basis for staples in generated recipes — what a bare quantity means.
 *
 * Everything is costed as bought. For meat, fish, vegetables and grains that
 * is the obvious thing: "95 g rice" is 95 g from the packet, "140 g chicken"
 * is the raw weight on the scales. Pulses are the exception, because they are
 * bought in a tin: "240 g chickpeas" is the drained tin — cooked weight — and
 * the engine costs it on the canned / boiled row. That is the one basis a
 * cook might not expect, so it is the one that gets a label.
 *
 * Grains used to be the labelled exception instead ("315 g rice · cooked
 * weight"). The nutrition was right and the label made it honest, but every
 * recipe and every app's recipe builder says dry, so the engine now does too.
 */

/**
 * Cooked ÷ dry weight for grains: CoFID raw energy per 100 g ÷ boiled energy
 * per 100 g, which is the water gained. First match wins, so the specific
 * rows (brown rice, wholewheat pasta) come before the general ones.
 *
 *   white basmati rice   351 / 117 = 3.0    brown basmati   355 / 131 = 2.7
 *   white dried pasta    343 / 169 = 2.0    wholewheat      329 / 134 = 2.5
 *   couscous             364 / 178 = 2.0    quinoa (USDA, no CoFID cooked row) 2.6
 */
const GRAIN_DRY_FACTORS: Array<{ pattern: RegExp; factor: number }> = [
  { pattern: /\bbrown rice\b/i, factor: 2.7 },
  { pattern: /\b(white |basmati |wholegrain |long grain )?rice\b/i, factor: 3.0 },
  { pattern: /\bquinoa\b/i, factor: 2.6 },
  { pattern: /\b(wholewheat|wholemeal) (pasta|spaghetti|penne|fusilli)\b/i, factor: 2.5 },
  { pattern: /\bpasta\b/i, factor: 2.0 },
  { pattern: /\b(spaghetti|penne|fusilli|macaroni|linguine|tagliatelle)\b/i, factor: 2.0 },
  { pattern: /\bcouscous\b/i, factor: 2.0 },
  { pattern: /\bbulgur\b/i, factor: 2.5 },
];

const NOT_A_GRAIN_PORTION = /\b(cakes?|flour|noodles?|milk|vinegar|paper|pudding|cooked|boiled)\b/i;

/** How much a dry grain quantity becomes once cooked, to the nearest 5 g. */
export function cookedWeightFor(name: string, dryGrams: number): number | null {
  if (NOT_A_GRAIN_PORTION.test(name)) return null;
  const g = GRAIN_DRY_FACTORS.find((s) => s.pattern.test(name));
  if (!g || !Number.isFinite(dryGrams) || dryGrams <= 0) return null;
  return Math.max(5, Math.round((dryGrams * g.factor) / 5) * 5);
}

/** The inverse — used once, to convert recipes stored in cooked grams. */
export function dryWeightFor(name: string, cookedGrams: number): number | null {
  if (NOT_A_GRAIN_PORTION.test(name)) return null;
  const g = GRAIN_DRY_FACTORS.find((s) => s.pattern.test(name));
  if (!g || !Number.isFinite(cookedGrams) || cookedGrams <= 0) return null;
  return Math.max(5, Math.round(cookedGrams / g.factor / 5) * 5);
}

/** True for a grain the engine expresses as dry weight. */
export function isDryWeightGrain(name: string): boolean {
  return !NOT_A_GRAIN_PORTION.test(name) && GRAIN_DRY_FACTORS.some((s) => s.pattern.test(name));
}

/** Pulses: a gram quantity means the drained tin — cooked weight. */
export function isCookedWeightStaple(name: string): boolean {
  if (/\b(dry|dried|uncooked|raw|flour)\b/i.test(name)) return false;
  return /\b(lentils?|chickpeas?|chick peas?|kidney beans?|black beans?|cannellini|butter beans?|haricot|borlotti|pinto|edamame)\b/i.test(name);
}

/** Cooking oil is Claude's to add; this is the most it may add per serving. */
export const MAX_OIL_PER_SERVING = { g: 15, ml: 15, tbsp: 1, tsp: 3 } as const;

export function isCookingOil(name: string): boolean {
  return /\boil\b/i.test(name) && !/\bfish oil\b/i.test(name);
}
