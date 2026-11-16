/**
 * CoFID 2021 gives no energy for 33 foods: 26 spices and seeds, the stock
 * cubes, lemon peel and one takeaway dish. Their carbohydrate is "N" (present
 * but not measured), and CoFID doesn't state energy without it. A blank sums
 * as 0, so a teaspoon of cinnamon or a stock cube was costed at 0 kcal.
 *
 * Two tables fill them, and every one of the 33 is in exactly one:
 *
 * COFID_ENERGY_GAPS (18 rows): CoFID's protein and fat are USDA SR Legacy's for
 * the same food, to the decimal, so CoFID took its figures from USDA. The
 * missing energy and carbohydrate (and fibre, where CoFID left that blank too)
 * come from the same USDA entry. Carbohydrate is USDA's "by difference" figure
 * minus its fibre: the available carbohydrate CoFID reports elsewhere.
 *
 * COFID_CARBOHYDRATE_FILLS (15 rows): rows whose protein or fat differ from
 * USDA's (turmeric, cloves, mustard, poppy and fenugreek seeds, mixed curry
 * spices) or that USDA doesn't have. Only the missing carbohydrate (and fibre)
 * is filled, from the source given on each row; energy is then worked out over
 * CoFID's own protein and fat with the UK label factors (UK_LABEL_KCAL_PER_G):
 * - Spices: USDA's carbohydrate for the same spice.
 * - Stock cubes and the takeaway ribs: by difference from CoFID's own water,
 *   protein, fat, fibre and salt. These are UK products; US bouillon is a
 *   different recipe.
 * - Asafoetida, Chinese 5 spice and liquorice powder: a UK label or database
 *   figure, checked to fit within CoFID's water and macros.
 *
 * Any other row CoFID leaves without energy (a future release, or a row whose
 * figures no longer match USDA's) gets energy from the macros it has: an
 * underestimate, but never 0 for a food with protein, fat or fibre.
 *
 * Every filled row's water + protein + fat + carbohydrate + fibre + salt stays
 * within 100 g (cofidEnergyGaps.test.ts checks it).
 *
 * Sources: USDA FoodData Central, SR Legacy (fetched 16 Nov 2026); labels as
 * named on each row.
 */

/** UK label energy factors, kcal per g. */
export const UK_LABEL_KCAL_PER_G = { protein: 4, carbs: 4, fat: 9, fibre: 2 } as const;

export type CofidEnergyGap = {
  usda: string;
  fdcId: number;
  /** USDA protein and fat, to check the CoFID row still matches before filling. */
  protein_g: number;
  fat_g: number;
  kcal: number;
  carbs_g: number;
  fibre_g: number;
};

export const COFID_ENERGY_GAPS: Record<string, CofidEnergyGap> = {
  "13-801": { usda: "Spices, allspice, ground", fdcId: 171315, protein_g: 6.09, fat_g: 8.69, kcal: 263, carbs_g: 50.5, fibre_g: 21.6 },
  "13-802": { usda: "Spices, anise seed", fdcId: 171316, protein_g: 17.6, fat_g: 15.9, kcal: 337, carbs_g: 35.4, fibre_g: 14.6 },
  "13-808": { usda: "Spices, caraway seed", fdcId: 170918, protein_g: 19.8, fat_g: 14.6, kcal: 333, carbs_g: 11.9, fibre_g: 38 },
  "13-809": { usda: "Spices, cardamom", fdcId: 170919, protein_g: 10.8, fat_g: 6.7, kcal: 311, carbs_g: 40.5, fibre_g: 28 },
  "13-810": { usda: "Spices, celery seed", fdcId: 170920, protein_g: 18.1, fat_g: 25.3, kcal: 392, carbs_g: 29.6, fibre_g: 11.8 },
  "13-826": { usda: "Spices, dill seed", fdcId: 170925, protein_g: 16, fat_g: 14.5, kcal: 305, carbs_g: 34.1, fibre_g: 21.1 },
  "13-827": { usda: "Spices, fennel seed", fdcId: 171323, protein_g: 15.8, fat_g: 14.9, kcal: 345, carbs_g: 12.5, fibre_g: 39.8 },
  "13-834": { usda: "Spices, mace, ground", fdcId: 170927, protein_g: 6.71, fat_g: 32.4, kcal: 475, carbs_g: 30.3, fibre_g: 20.2 },
  "13-873": { usda: "Spices, chili powder", fdcId: 171319, protein_g: 13.5, fat_g: 14.3, kcal: 282, carbs_g: 14.9, fibre_g: 34.8 },
  "13-874": { usda: "Spices, cinnamon, ground", fdcId: 171320, protein_g: 3.99, fat_g: 1.24, kcal: 247, carbs_g: 27.5, fibre_g: 53.1 },
  "13-875": { usda: "Spices, coriander seed", fdcId: 170922, protein_g: 12.4, fat_g: 17.8, kcal: 298, carbs_g: 13.1, fibre_g: 41.9 },
  "13-877": { usda: "Spices, nutmeg, ground", fdcId: 171326, protein_g: 5.84, fat_g: 36.3, kcal: 525, carbs_g: 28.5, fibre_g: 20.8 },
  "13-878": { usda: "Spices, oregano, dried", fdcId: 171328, protein_g: 9, fat_g: 4.28, kcal: 265, carbs_g: 26.4, fibre_g: 42.5 },
  "13-879": { usda: "Spices, paprika", fdcId: 171329, protein_g: 14.1, fat_g: 12.9, kcal: 282, carbs_g: 19.1, fibre_g: 34.9 },
  "13-880": { usda: "Spices, pepper, black", fdcId: 170931, protein_g: 10.4, fat_g: 3.26, kcal: 251, carbs_g: 38.7, fibre_g: 25.3 },
  "13-881": { usda: "Spices, pepper, white", fdcId: 170933, protein_g: 10.4, fat_g: 2.12, kcal: 296, carbs_g: 42.4, fibre_g: 26.2 },
  "13-889": { usda: "Spices, cumin seed", fdcId: 170923, protein_g: 17.8, fat_g: 22.3, kcal: 375, carbs_g: 33.7, fibre_g: 10.5 },
  "14-337": { usda: "Lemon peel, raw", fdcId: 167749, protein_g: 1.5, fat_g: 0.3, kcal: 47, carbs_g: 5.4, fibre_g: 10.6 },
};

export type CofidCarbohydrateFill = {
  /** Available carbohydrate, g per 100 g (excludes fibre). */
  carbs_g: number;
  /** Fibre, g per 100 g; only where CoFID has none. */
  fibre_g?: number;
  source: string;
};

/** Keyed by CoFID food code. The comment gives the resulting energy per 100 g. */
export const COFID_CARBOHYDRATE_FILLS: Readonly<Record<string, CofidCarbohydrateFill>> = {
  // Asafoetida → 286 kcal
  "13-803": { carbs_g: 65.1, source: "Sainsbury's Asafoetida label (65.1 g carbohydrate per 100 g)" },
  // Chinese 5 spice → 332 kcal
  "13-813": { carbs_g: 54.0, source: "Schwartz Chinese 5 Spice label (54 g carbohydrate per 100 g)" },
  // Cloves, dried → 399 kcal
  "13-816": { carbs_g: 31.6, fibre_g: 33.9, source: "USDA SR Legacy 171321 \"Spices, cloves, ground\": 65.5 g carbohydrate by difference less 33.9 g fibre" },
  // Fenugreek seeds → 346 kcal
  "13-828": { carbs_g: 33.8, fibre_g: 24.6, source: "USDA SR Legacy 171324 \"Spices, fenugreek seed\": 58.4 g carbohydrate by difference less 24.6 g fibre" },
  // Liquorice powder → 342 kcal
  "13-833": { carbs_g: 75.3, source: "CalorieKing UK \"Liquorice powder\" (75.3 g carbohydrate per 100 g; same protein and fat as CoFID)" },
  // Mixed curry spices → 289 kcal
  "13-886": { carbs_g: 2.6, fibre_g: 53.2, source: "USDA SR Legacy 170924 \"Spices, curry powder\": 55.8 g carbohydrate by difference less 53.2 g fibre" },
  // Mustard seeds → 447 kcal
  "13-839": { carbs_g: 15.9, fibre_g: 12.2, source: "USDA SR Legacy 170929 \"Spices, mustard seed, ground\": 28.1 g carbohydrate by difference less 12.2 g fibre" },
  // Oregano, fresh → 54 kcal
  "13-891": { carbs_g: 5.3, source: "Dried oregano's USDA figure (26.4 g) scaled by CoFID's fresh/dried fibre ratio (8.6/42.5)" },
  // Poppy seeds → 572 kcal
  "13-849": { carbs_g: 6.8, fibre_g: 19.5, source: "USDA SR Legacy 171330 \"Spices, poppy seed\": 28.1 g carbohydrate by difference less 19.5 g fibre (8.6 g), capped at 6.8 g so the row stays within 100 g (CoFID's fat is higher than USDA's)" },
  // Pork, spare ribs, Chinese barbecue, takeaway → 290 kcal
  "18-499": { carbs_g: 8.2, source: "By difference from CoFID: 100 − water 49.8 − protein 22.1 − fat 18.7 − salt 1.2" },
  // Stock cubes, beef → 276 kcal
  "17-515": { carbs_g: 31.5, source: "By difference from CoFID: 100 − water 6.1 − protein 16.8 − fat 9.2 − fibre 0 − salt 36.4" },
  // Stock cubes, chicken → 289 kcal
  "17-726": { carbs_g: 22.0, source: "By difference from CoFID: 100 − water 5.8 − protein 15.4 − fat 15.4 − fibre 0.6 − salt 40.75" },
  // Stock cubes, chicken, made up with water → 10 kcal
  "17-774": { carbs_g: 0.8, source: "By difference from CoFID: 100 − water 96.7 − protein 0.5 − fat 0.5 − fibre 0 − salt 1.45 = 0.85, rounded down (the chicken cube diluted as CoFID's protein implies gives 0.77)" },
  // Stock cubes, vegetable → 292 kcal
  "17-727": { carbs_g: 19.7, source: "By difference from CoFID: 100 − water 5.7 − protein 13.5 − fat 17.3 − fibre 1.8 − salt 42.0" },
  // Turmeric, ground → 313 kcal
  "13-861": { carbs_g: 44.4, fibre_g: 22.7, source: "USDA SR Legacy 172231 \"Spices, turmeric, ground\": 67.1 g carbohydrate by difference less 22.7 g fibre" },
};

type GapFillable = {
  food_code: string;
  kcal: number | null;
  protein_g: number | null;
  fat_g: number | null;
  carbs_g: number | null;
  fibre_g: number | null;
};

/** CoFID rounds to one decimal place; anything further apart is a different source. */
const SAME_SOURCE_TOLERANCE_G = 0.15;

function sameSourceAsUsda(row: GapFillable, gap: CofidEnergyGap): boolean {
  return (
    row.protein_g != null &&
    Math.abs(row.protein_g - gap.protein_g) <= SAME_SOURCE_TOLERANCE_G &&
    row.fat_g != null &&
    Math.abs(row.fat_g - gap.fat_g) <= SAME_SOURCE_TOLERANCE_G
  );
}

/**
 * Fill a CoFID row's blank energy. A row that states energy is returned
 * unchanged, so a corrected CoFID import is never overwritten. USDA's energy
 * is used only while the row's protein and fat still match USDA's; otherwise
 * energy comes from the row's own macros plus any carbohydrate filled above.
 * Only a row with no macros at all stays without energy.
 */
export function fillCofidEnergyGap<T extends GapFillable>(row: T): T {
  if (row.kcal != null) return row;
  const gap = COFID_ENERGY_GAPS[row.food_code];
  if (gap && sameSourceAsUsda(row, gap)) {
    return {
      ...row,
      kcal: gap.kcal,
      carbs_g: row.carbs_g ?? gap.carbs_g,
      fibre_g: row.fibre_g ?? gap.fibre_g,
    };
  }
  const fill = COFID_CARBOHYDRATE_FILLS[row.food_code];
  const carbs = row.carbs_g ?? fill?.carbs_g ?? null;
  const fibre = row.fibre_g ?? fill?.fibre_g ?? null;
  const k = UK_LABEL_KCAL_PER_G;
  const kcal =
    k.protein * (row.protein_g ?? 0) +
    k.carbs * (carbs ?? 0) +
    k.fat * (row.fat_g ?? 0) +
    k.fibre * (fibre ?? 0);
  if (kcal <= 0) return row;
  return { ...row, kcal: Math.round(kcal), carbs_g: carbs, fibre_g: fibre };
}
