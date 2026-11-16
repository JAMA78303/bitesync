import { COFID_ENERGY_GAPS, fillCofidEnergyGap } from "@/lib/nutrition/cofidEnergyGaps";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

type Row = Parameters<typeof fillCofidEnergyGap>[0];
const row = (food_code: string, protein_g: number | null, fat_g: number | null, fibre_g: number | null, kcal: number | null = null): Row => ({
  food_code,
  kcal,
  protein_g,
  fat_g,
  carbs_g: null,
  fibre_g,
});

// CoFID 13-874 "Cinnamon, ground" as stored: no energy, no carbohydrate.
const cinnamon = fillCofidEnergyGap(row("13-874", 4, 1.2, 53.1));
assert(cinnamon.kcal === 247, `cinnamon kcal ${cinnamon.kcal}`);
assert(cinnamon.carbs_g === 27.5, `cinnamon carbs ${cinnamon.carbs_g}`);
assert(cinnamon.fibre_g === 53.1, "cinnamon keeps CoFID's fibre");

// 13-801 "Allspice, ground" has no fibre either.
const allspice = fillCofidEnergyGap(row("13-801", 6.1, 8.7, null));
assert(allspice.kcal === 263 && allspice.fibre_g === 21.6, "allspice filled");

// A row that already states energy is never touched.
const stated = row("13-880", 10.4, 3.3, 25.3, 240);
assert(fillCofidEnergyGap(stated) === stated, "stated energy kept");

// A CoFID row whose figures no longer match USDA's is a different source: leave it.
const changed = row("13-880", 12, 3.3, 25.3);
assert(fillCofidEnergyGap(changed).kcal == null, "changed protein: not filled");
const noFat = row("13-880", 10.4, null, 25.3);
assert(fillCofidEnergyGap(noFat).kcal == null, "missing fat: not filled");

// Rows not in the table (turmeric's figures differ from USDA's) stay blank.
assert(fillCofidEnergyGap(row("13-861", 6.7, 7, null)).kcal == null, "turmeric left blank");

for (const [code, gap] of Object.entries(COFID_ENERGY_GAPS)) {
  assert(/^\d{2}-\d{3,4}$/.test(code), `${code}: CoFID food code`);
  assert(gap.fdcId > 100000, `${code}: FDC id`);
  assert(gap.kcal > 0 && gap.kcal < 900, `${code}: kcal ${gap.kcal}`);
  assert(gap.carbs_g >= 0 && gap.carbs_g + gap.fibre_g + gap.protein_g + gap.fat_g <= 100, `${code}: macros over 100 g`);
}

console.log(`cofidEnergyGaps.test.ts: ${Object.keys(COFID_ENERGY_GAPS).length} CoFID rows filled from USDA`);
