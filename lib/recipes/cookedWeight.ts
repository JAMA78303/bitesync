/**
 * Which generated-recipe staples are expressed as COOKED weight.
 *
 * The template engine costs rice, pasta, quinoa, lentils and chickpeas at
 * their cooked per-100 g values (rice 130 kcal, pasta 158, quinoa 120 …), and
 * the CoFID matcher steers a bare "rice" to a boiled row for the same reason.
 * The numbers are right. The label was not: a recipe said "315 g rice" and
 * its method said "rinse, then cook in double the water" — dry-rice
 * instructions — so anyone following it would weigh 315 g dry and eat three
 * times the calories the app had counted.
 *
 * The ingredient name has to stay bare for matching ("cooked rice" sends the
 * matcher to a vegetable curry, "cooked quinoa" to raw quinoa). So the cooked
 * basis is stated everywhere the quantity reaches a person instead: the
 * template method, the LLM prompt, and the ingredient row on screen.
 */

type Staple = { pattern: RegExp; dryFactor: number };

/** Cooked ÷ dry weight, rounded to what a home cook will actually measure. */
const STAPLES: Staple[] = [
  { pattern: /\b(brown |white |basmati |wholegrain )?rice\b/i, dryFactor: 3 },
  { pattern: /\bquinoa\b/i, dryFactor: 3 },
  { pattern: /\b(wholewheat |wholemeal )?pasta\b/i, dryFactor: 2.25 },
  { pattern: /\blentils?\b/i, dryFactor: 2.5 },
  { pattern: /\bchickpeas?\b/i, dryFactor: 2.2 },
];

const EXCLUDE = /\b(cakes?|flour|noodles?|milk|vinegar|paper|dry|dried|uncooked|raw)\b/i;

function stapleFor(name: string): Staple | null {
  if (EXCLUDE.test(name)) return null;
  return STAPLES.find((s) => s.pattern.test(name)) ?? null;
}

/** True when a gram quantity of this ingredient means cooked weight. */
export function isCookedWeightStaple(name: string): boolean {
  return stapleFor(name) !== null;
}

/** Dry grams to cook to end up with `cookedGrams`, to the nearest 5 g. */
export function dryWeightFor(name: string, cookedGrams: number): number | null {
  const s = stapleFor(name);
  if (!s || !Number.isFinite(cookedGrams) || cookedGrams <= 0) return null;
  return Math.max(5, Math.round(cookedGrams / s.dryFactor / 5) * 5);
}

/** Cooking oil is Claude's to add; this is the most it may add per serving. */
export const MAX_OIL_PER_SERVING = { g: 15, ml: 15, tbsp: 1, tsp: 3 } as const;

export function isCookingOil(name: string): boolean {
  return /\boil\b/i.test(name) && !/\bfish oil\b/i.test(name);
}
