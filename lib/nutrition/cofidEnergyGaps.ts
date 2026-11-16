/**
 * CoFID rows that give protein, fat and fibre but leave carbohydrate and energy
 * blank: 33 rows, mostly spices. A blank sums as 0, so a teaspoon of cinnamon
 * or black pepper was costed at 0 kcal.
 *
 * For the rows below, CoFID's protein and fat are USDA SR Legacy's for the same
 * spice, to the decimal, so CoFID took its figures from USDA. The missing
 * energy and carbohydrate (and fibre, where CoFID left that blank too) come
 * from the same USDA entry. Carbohydrate is USDA's "by difference" figure
 * minus its fibre: the available carbohydrate CoFID reports elsewhere.
 *
 * Left blank on purpose: rows whose protein or fat don't match USDA's current
 * figures (turmeric, cloves, mustard seeds, poppy seeds, fenugreek, mixed
 * curry spices), and rows USDA has no entry for (asafoetida, Chinese 5 spice,
 * liquorice powder, fresh oregano, stock cubes, takeaway spare ribs).
 *
 * Source: USDA FoodData Central, SR Legacy (fetched 16 Nov 2026).
 */
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

/**
 * Fill a CoFID row's blank energy and carbohydrate from COFID_ENERGY_GAPS.
 * Only when energy is blank and the row's protein and fat still match USDA's,
 * so a corrected CoFID import is never overwritten.
 */
export function fillCofidEnergyGap<T extends GapFillable>(row: T): T {
  if (row.kcal != null) return row;
  const gap = COFID_ENERGY_GAPS[row.food_code];
  if (!gap) return row;
  if (row.protein_g == null || Math.abs(row.protein_g - gap.protein_g) > SAME_SOURCE_TOLERANCE_G) return row;
  if (row.fat_g == null || Math.abs(row.fat_g - gap.fat_g) > SAME_SOURCE_TOLERANCE_G) return row;
  return {
    ...row,
    kcal: gap.kcal,
    carbs_g: row.carbs_g ?? gap.carbs_g,
    fibre_g: row.fibre_g ?? gap.fibre_g,
  };
}
