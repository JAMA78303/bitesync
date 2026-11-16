/**
 * The 33 CoFID foods with no energy must never count as 0 kcal, and each fill
 * must fit the food's own composition.
 */
import {
  COFID_CARBOHYDRATE_FILLS,
  COFID_ENERGY_GAPS,
  fillCofidEnergyGap,
} from "@/lib/nutrition/cofidEnergyGaps";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
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

/**
 * Every cofid_foods row with kcal null, as imported from CoFID 2021: code,
 * name, water, protein, fat, fibre, salt (g per 100 g). Carbohydrate is null
 * on all of them.
 */
const NO_ENERGY_ROWS: [string, string, number, number, number, number | null, number][] = [
  ["13-801", "Allspice, ground", 8.5, 6.1, 8.7, null, 0],
  ["13-802", "Anise seeds", 9.5, 17.6, 15.9, null, 0],
  ["13-803", "Asafoetida", 16.0, 4, 1.1, null, 0],
  ["13-808", "Caraway seeds", 9.9, 19.8, 14.6, null, 0],
  ["13-809", "Cardamom, ground", 8.3, 10.8, 6.7, null, 0],
  ["13-810", "Celery seeds", 6.0, 18.1, 25.3, null, 0],
  ["13-873", "Chilli powder", 10.8, 13.5, 14.3, 34.8, 0],
  ["13-813", "Chinese 5 spice", 9.1, 9.5, 8.7, null, 0],
  ["13-874", "Cinnamon, ground", 10.6, 4, 1.2, 53.1, 0],
  ["13-816", "Cloves, dried", 6.9, 6, 20.1, null, 0],
  ["13-875", "Coriander seeds", 8.9, 12.4, 17.8, 41.9, 0],
  ["13-889", "Cumin seeds", 8.1, 17.8, 22.3, 10.5, 0],
  ["13-826", "Dill seeds", 7.7, 16, 14.5, null, 0],
  ["13-827", "Fennel seeds", 8.8, 15.8, 14.9, null, 0],
  ["13-828", "Fenugreek seeds", 9.5, 23.8, 7.4, null, 0],
  ["14-337", "Lemon peel", 81.6, 1.5, 0.3, 10.6, 0],
  ["13-833", "Liquorice powder", 9.2, 6.3, 1.7, null, 0],
  ["13-834", "Mace, ground", 8.2, 6.7, 32.4, null, 0],
  ["13-886", "Mixed curry spices", 10.1, 13.2, 13.3, null, 0],
  ["13-839", "Mustard seeds", 6.9, 24.9, 28.8, null, 0],
  ["13-877", "Nutmeg, ground", 6.2, 5.8, 36.3, 20.8, 0],
  ["13-878", "Oregano, dried, ground", 9.9, 9, 4.3, 42.5, 0],
  ["13-891", "Oregano, fresh", 81.8, 1.8, 0.9, 8.6, 0],
  ["13-879", "Paprika", 11.2, 14.1, 12.9, 34.9, 0],
  ["13-880", "Pepper, black", 12.5, 10.4, 3.3, 25.3, 0],
  ["13-881", "Pepper, white", 11.4, 10.4, 2.1, 26.2, 0],
  ["13-849", "Poppy seeds", 6.0, 20.6, 47.1, null, 0],
  ["18-499", "Pork, spare ribs, Chinese barbecue, takeaway", 49.8, 22.1, 18.7, null, 1.2],
  ["17-515", "Stock cubes, beef", 6.1, 16.8, 9.2, 0, 36.4],
  ["17-726", "Stock cubes, chicken", 5.8, 15.4, 15.4, 0.6, 40.75],
  ["17-774", "Stock cubes, chicken, made up with water", 96.7, 0.5, 0.5, 0, 1.45],
  ["17-727", "Stock cubes, vegetable", 5.7, 13.5, 17.3, 1.8, 42.0],
  ["13-861", "Turmeric, ground", 9.9, 6.7, 7, null, 0],
];

// Every no-energy row is in exactly one table, and every table entry is one of them.
const filledKcal = new Map<string, number>();
for (const [code, name, water, protein, fat, fibre, salt] of NO_ENERGY_ROWS) {
  const inUsda = code in COFID_ENERGY_GAPS;
  const inFills = code in COFID_CARBOHYDRATE_FILLS;
  assert(inUsda !== inFills, `${name} (${code}) must be in exactly one table`);
  const out = fillCofidEnergyGap(row(code, protein, fat, fibre));
  assert(out.kcal != null && out.kcal > 0, `${name} has energy`);
  assert(out.carbs_g != null && out.carbs_g >= 0, `${name} has carbohydrate`);
  if (inUsda) assertEqual(out.kcal, COFID_ENERGY_GAPS[code].kcal, `${name}: USDA's energy (protein and fat still match)`);
  const total = water + protein + fat + (out.carbs_g ?? 0) + (out.fibre_g ?? 0) + salt;
  assert(total <= 100.05, `${name}: composition ${total.toFixed(1)} g exceeds 100 g`);
  filledKcal.set(code, out.kcal);
}
for (const code of [...Object.keys(COFID_ENERGY_GAPS), ...Object.keys(COFID_CARBOHYDRATE_FILLS)]) {
  assert(NO_ENERGY_ROWS.some(([c]) => c === code), `${code} is not a CoFID row without energy`);
}

for (const [code, gap] of Object.entries(COFID_ENERGY_GAPS)) {
  assert(/^\d{2}-\d{3,4}$/.test(code), `${code}: CoFID food code`);
  assert(gap.fdcId > 100000, `${code}: FDC id`);
  assert(gap.kcal > 0 && gap.kcal < 900, `${code}: kcal ${gap.kcal}`);
  assert(gap.carbs_g >= 0 && gap.carbs_g + gap.fibre_g + gap.protein_g + gap.fat_g <= 100, `${code}: macros over 100 g`);
}

// Spot checks, kcal per 100 g.
assertEqual(filledKcal.get("13-874"), 247, "ground cinnamon (USDA)");
assertEqual(filledKcal.get("13-880"), 251, "black pepper (USDA)");
assertEqual(filledKcal.get("13-861"), 313, "turmeric (USDA carbohydrate, UK factors)");
assertEqual(filledKcal.get("17-726"), 289, "chicken stock cube (by difference)");
assertEqual(filledKcal.get("17-774"), 10, "chicken stock made up");

// CoFID 13-874 "Cinnamon, ground" as stored keeps its own fibre.
const cinnamon = fillCofidEnergyGap(row("13-874", 4, 1.2, 53.1));
assert(cinnamon.carbs_g === 27.5 && cinnamon.fibre_g === 53.1, "cinnamon: USDA carbohydrate, CoFID fibre");

// 13-801 "Allspice, ground" has no fibre either.
const allspice = fillCofidEnergyGap(row("13-801", 6.1, 8.7, null));
assert(allspice.kcal === 263 && allspice.fibre_g === 21.6, "allspice filled");

// A row that already states energy is never touched.
const stated = row("13-880", 10.4, 3.3, 25.3, 240);
assert(fillCofidEnergyGap(stated) === stated, "stated energy kept");

// A CoFID row whose figures no longer match USDA's is a different source: USDA's
// energy and carbohydrate aren't used, but its own macros still count.
const changed = fillCofidEnergyGap(row("13-880", 12, 3.3, 25.3));
assertEqual(changed.kcal, 128,"changed protein: energy from its own macros");
assertEqual(changed.carbs_g, null, "changed protein: no borrowed carbohydrate");

// A future row with no energy and no fill still isn't 0 kcal.
const future = fillCofidEnergyGap(row("99-999", 10, 5, null));
assertEqual(future.kcal, 85, "unknown row: energy from protein and fat");

// Nothing known stays unknown rather than 0.
const empty = fillCofidEnergyGap(row("99-998", null, null, null));
assertEqual(empty.kcal, null, "row with no macros stays unknown");

console.log(
  `cofidEnergyGaps.test.ts: ${NO_ENERGY_ROWS.length} no-energy rows filled ` +
    `(${Object.keys(COFID_ENERGY_GAPS).length} from USDA, ${Object.keys(COFID_CARBOHYDRATE_FILLS).length} by carbohydrate)`,
);
