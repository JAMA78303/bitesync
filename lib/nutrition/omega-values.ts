/**
 * Omega-3 (ALA + EPA/DHA) and omega-6 per 100g, as eaten.
 *
 * Curated rather than generated. Auto-matching every food to CoFID was tried and
 * rejected: it resolved "blue cheese" to a salad dressing, "english muffin" to a
 * chocolate muffin, and chicken thigh to *chicken skin* — 1.35g omega-3 against a
 * true ~0.1g. Roughly a quarter of the highest-value matches were wrong, which for
 * a nutrient users act on is worse than having no figure at all.
 *
 * `[CoFID]` values were read directly from the McCance & Widdowson 2021 dataset
 * (the "/100g food" columns, not "/100g fatty acids" — those differ ~15x).
 * `[USDA]` values come from USDA SR Legacy where CoFID has no measured row; they
 * are the same provenance the surrounding micronutrient tables already use.
 *
 * ABSENCE MEANS UNKNOWN, NOT ZERO. A food missing here contributes nothing and is
 * excluded from coverage, because scoring an unmeasured food as zero is what makes
 * it read as a deficiency it may not have.
 */

export type OmegaEntry = {
  omega_3_g: number;
  omega_6_g: number;
};

export const OMEGA_VALUES: Record<string, OmegaEntry> = {
  // --- Oily fish: the foods that actually move omega-3 intake ---
  mackerel: { omega_3_g: 4.83, omega_6_g: 0.53 }, // [CoFID] flesh only, grilled
  salmon: { omega_3_g: 3.93, omega_6_g: 0.94 }, // [CoFID] farmed, steamed
  "salmon fillet": { omega_3_g: 3.93, omega_6_g: 0.94 }, // [CoFID] farmed, steamed
  sardines: { omega_3_g: 2.5, omega_6_g: 0.23 }, // [CoFID] canned in brine, drained
  herring: { omega_3_g: 1.83, omega_6_g: 0.32 }, // [CoFID] flesh only, raw
  trout: { omega_3_g: 1.5, omega_6_g: 0.39 }, // [CoFID] rainbow, baked
  anchovies: { omega_3_g: 1.48, omega_6_g: 0.1 }, // [USDA] canned in oil, drained
  "sea bass": { omega_3_g: 1.23, omega_6_g: 0.85 }, // [CoFID] baked, flesh only

  // --- White fish and seafood: modest but not nil ---
  "tuna canned": { omega_3_g: 0.32, omega_6_g: 0.08 }, // [CoFID] canned in brine, drained
  shrimp: { omega_3_g: 0.31, omega_6_g: 0.02 }, // [USDA]
  mussels: { omega_3_g: 0.44, omega_6_g: 0.02 }, // [USDA]
  cod: { omega_3_g: 0.2, omega_6_g: 0.01 }, // [USDA]
  haddock: { omega_3_g: 0.14, omega_6_g: 0.01 }, // [USDA]
  tilapia: { omega_3_g: 0.13, omega_6_g: 0.25 }, // [USDA]

  // --- Seeds and nuts: the plant-source story (ALA) ---
  flaxseeds: { omega_3_g: 22.8, omega_6_g: 5.9 }, // [USDA] ground linseed
  "chia seeds": { omega_3_g: 17.8, omega_6_g: 5.8 }, // [USDA]
  walnuts: { omega_3_g: 7.47, omega_6_g: 39.29 }, // [CoFID] kernel only
  "pumpkin seeds": { omega_3_g: 0.12, omega_6_g: 20.7 }, // [USDA]
  "sesame seeds": { omega_3_g: 0.38, omega_6_g: 21.4 }, // [USDA]
  cashews: { omega_3_g: 0.06, omega_6_g: 7.8 }, // [USDA]
  almonds: { omega_3_g: 0.0, omega_6_g: 12.3 }, // [USDA] negligible ALA
  peanuts: { omega_3_g: 0.0, omega_6_g: 15.6 }, // [USDA]

  // --- Spreads and oils ---
  tahini: { omega_3_g: 0.4, omega_6_g: 21.0 }, // [USDA]
  "peanut butter": { omega_3_g: 0.05, omega_6_g: 12.0 }, // [USDA]
  "almond butter": { omega_3_g: 0.0, omega_6_g: 10.4 }, // [USDA]
  "vegetable oil": { omega_3_g: 9.6, omega_6_g: 19.7 }, // [CoFID] vegetable, average
  "olive oil": { omega_3_g: 0.7, omega_6_g: 7.5 }, // [CoFID]

  // --- Everyday foods: small values, but they decide whether a day totals up ---
  eggs: { omega_3_g: 0.13, omega_6_g: 1.31 }, // [CoFID] whole, raw
  "egg yolk": { omega_3_g: 0.33, omega_6_g: 3.5 }, // [USDA]
  avocado: { omega_3_g: 0.11, omega_6_g: 1.67 }, // [USDA]
  tofu: { omega_3_g: 0.58, omega_6_g: 4.8 }, // [USDA] firm
  tempeh: { omega_3_g: 0.19, omega_6_g: 3.1 }, // [USDA]
  edamame: { omega_3_g: 0.36, omega_6_g: 1.79 }, // [USDA]
  "soy milk": { omega_3_g: 0.2, omega_6_g: 1.0 }, // [USDA] unsweetened
  "chicken breast": { omega_3_g: 0.03, omega_6_g: 0.4 }, // [USDA] meat only
  "beef mince": { omega_3_g: 0.05, omega_6_g: 0.3 }, // [USDA] lean
  oats: { omega_3_g: 0.11, omega_6_g: 2.42 }, // [USDA]
  "wholemeal bread": { omega_3_g: 0.06, omega_6_g: 1.0 }, // [USDA]
  spinach: { omega_3_g: 0.14, omega_6_g: 0.03 }, // [USDA]
  kale: { omega_3_g: 0.18, omega_6_g: 0.14 }, // [USDA]
};

/**
 * Omega values for a food, or null when unmeasured.
 *
 * Null is meaningful: callers must exclude the food from coverage rather than
 * adding zero, otherwise an unknown reads as a deficiency.
 */
export function lookupOmega(name: string): OmegaEntry | null {
  return OMEGA_VALUES[name.toLowerCase().trim()] ?? null;
}

/** Foods with a curated omega value — used to report honest coverage. */
export function omegaFoodCount(): number {
  return Object.keys(OMEGA_VALUES).length;
}
