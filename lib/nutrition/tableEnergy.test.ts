/**
 * Every row of the local nutrition table must state an energy its macros can
 * account for (4/4/9/2 kcal per g of protein, carbohydrate, fat and fibre),
 * within ENERGY_TOLERANCE. Template-generated rows mostly fail this; sourced
 * rows pass.
 *
 * UNSOURCED is a ratchet: it lists rows that still fail because nobody has
 * found a source for them yet. It may only shrink. When you correct one (from
 * CoFID or a UK label, with the source in a comment above the row), delete it
 * here; the test fails if a listed row starts passing, so the list can't go
 * stale. Never add a new row to it.
 *
 * No row may have more sugar than carbohydrate either; SUGAR_OVER_CARBS is
 * the same kind of shrink-only list for that.
 */
import type { NutritionLookupEntry } from "@/types";
import { NUTRITION_DB } from "@/lib/nutrition/nutrition-db";
import { NUTRITION_DB_UK_EXPANSION } from "@/lib/nutrition/nutrition-db-uk-expansion";
import { NUTRITION_DB_UK_EXPANSION_PART2 } from "@/lib/nutrition/nutrition-db-uk-expansion-part2";
import { atwaterKcal, energyCheck, energyReconciles, sugarExceedsCarbs } from "@/lib/nutrition/tableAudit";

/** Real foods with energy the four macros don't carry. */
const KNOWN_EXCEPTIONS: Record<string, string> = {
  "apple cider vinegar": "acetic acid, 3.6 kcal/g",
  "white wine vinegar": "acetic acid, 3.6 kcal/g",
  "malt vinegar": "acetic acid, 3.6 kcal/g",
  "rice vinegar": "acetic acid, 3.6 kcal/g",
  "white wine cooking": "alcohol, 7 kcal/g",
  "red wine cooking": "alcohol, 7 kcal/g",
  "cooking sake": "alcohol, 7 kcal/g",
  "brandy cooking": "alcohol, 7 kcal/g",
  "teriyaki sauce bottle": "alcohol from the wine in it, 7 kcal/g",
  "nori sheets sushi": "CoFID counts almost no energy from seaweed fibre",
  "wakame dried": "CoFID counts almost no energy from seaweed fibre",
  "kombu dried": "CoFID counts almost no energy from seaweed fibre",
};

/** Unsourced rows that fail today. Shrink only — see the header. */
const UNSOURCED = new Set<string>([
  "almond extract",
  "antipasti mix",
  "bagel everything",
  "baked beans chorizo",
  "berbere spice",
  "black bean dip",
  "boar sausages",
  "caramel bar",
  "chicken feet",
  "chinese cooking wine",
  "coronation chicken filler",
  "curd cheese",
  "curry paste green thai",
  "curry paste tikka",
  "dumpling mix",
  "edamame salted snack",
  "farro",
  "flavoured sparkling lemon",
  "fudge clotted cream",
  "ginger beer",
  "golden milk powder",
  "hearts palm tin",
  "instant custard",
  "jelly babies",
  "microwave jacket potato cheese",
  "milk chocolate brazil nuts",
  "mixed herbs",
  "nutritional yeast flakes",
  "onion bhaji",
  "plant cream",
  "salmon fishcake",
  "samosa",
  "scotch bun",
  "scotch egg",
  "snowball cake",
  "spinach quiche",
  "squirty cream dairy",
  "sumac powder",
  "trail mix nut",
  "trifle sponge",
  "wrap beetroot",
  "yoghurt drink mango",
  "yoghurt drink strawberry",
]);

/**
 * Template rows whose sugar exceeds their carbohydrate. The energy check can't
 * see these when the made-up macros happen to add up: "chicken kiev" was 58
 * kcal with 12 g sugar in 7.5 g carbohydrate and passed. Shrink only, like
 * UNSOURCED. Most of these are answered by a CoFID row today, so the local
 * figures rarely reach a recipe.
 */
const SUGAR_OVER_CARBS = new Set<string>([
  "bagel everything",
  "baked beans chorizo",
  "berbere spice",
  "cheese cubes snack",
  "chicken tikka masala ready meal",
  "couscous cup lemon",
  "cracker cheese ham snack",
  "curd cheese",
  "duck spring roll",
  "fennel seeds whole",
  "nutritional yeast flakes",
  "popcorn salted",
  "primula cheese tube",
  "rice vinegar seasoned",
  "simnel cake",
  "snacking olives",
  "soy bean sprouts",
  "turkey escalopes",
  "turmeric latte powder",
  "yoghurt coated nuts",
]);

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function entry(name: string, kcal: number, p: number, c: number, f: number, fi = 0): NutritionLookupEntry {
  return {
    name,
    per_100g: {
      calories: kcal,
      protein_g: p,
      carbs_g: c,
      fat_g: f,
      fibre_g: fi,
      sugar_g: 0,
      sodium_mg: 0,
      saturated_fat_g: 0,
    },
  };
}

// The check itself.
assert(atwaterKcal(entry("x", 0, 10, 20, 5, 4)) === 173, "4/4/9/2 factors");
assert(energyReconciles(entry("CoFID cornflakes", 376, 7.1, 90.9, 0.8, 2.6)), "sourced row passes");
// USDA rows count fibre inside carbohydrate; cinnamon must not look 80% over.
assert(energyReconciles(entry("USDA cinnamon", 247, 4, 81, 1.2, 53)), "total-carbohydrate convention");
// Template rows from the 15 Nov 2026 audit.
assert(!energyReconciles(entry("old canned soup tomato", 62, 4, 12, 4.5, 3)), "62 kcal stated, macros give 98");
assert(!energyReconciles(entry("old canned tuna in oil", 55, 8, 11, 3.5, 2)), "55 kcal stated, macros give 112");
assert(!energyReconciles(entry("old cola", 31, 0, 13, 3.1, 1.2)), "31 kcal stated, macros give 82");

const seen = new Set<NutritionLookupEntry>();
const rows = [...NUTRITION_DB, ...NUTRITION_DB_UK_EXPANSION, ...NUTRITION_DB_UK_EXPANSION_PART2].filter((r) => {
  if (seen.has(r)) return false;
  seen.add(r);
  return true;
});
const names = new Set(rows.map((r) => r.name));

const failures: string[] = [];
const failingNames = new Set<string>();
for (const row of rows) {
  if (energyReconciles(row)) continue;
  failingNames.add(row.name);
  if (KNOWN_EXCEPTIONS[row.name] || UNSOURCED.has(row.name)) continue;
  const e = energyCheck(row);
  failures.push(`  ${row.name}: states ${e.stated} kcal, protein/carbs/fat/fibre give ${Math.round(e.expected)}`);
}
assert(
  failures.length === 0,
  `Rows whose energy doesn't reconcile with their macros:\n${failures.join("\n")}\n` +
    "Fix the values from CoFID or a UK label (source in a comment above the row).",
);

for (const name of UNSOURCED) {
  assert(names.has(name), `UNSOURCED lists "${name}", which is no longer in the table — delete it from the list.`);
  assert(
    failingNames.has(name),
    `"${name}" now reconciles — delete it from UNSOURCED so the list keeps shrinking.`,
  );
}
for (const name of Object.keys(KNOWN_EXCEPTIONS)) {
  assert(names.has(name), `KNOWN_EXCEPTIONS lists "${name}", which is no longer in the table.`);
}

const sugarRows = rows.filter(sugarExceedsCarbs);
const sugarFailures = sugarRows
  .filter((r) => !SUGAR_OVER_CARBS.has(r.name))
  .map((r) => `  ${r.name}: sugar ${r.per_100g.sugar_g} g, carbohydrate ${r.per_100g.carbs_g} g`);
assert(
  sugarFailures.length === 0,
  `Rows with more sugar than carbohydrate:\n${sugarFailures.join("\n")}\n` +
    "Fix the values from CoFID or a UK label (source in a comment above the row).",
);
const sugarNames = new Set(sugarRows.map((r) => r.name));
for (const name of SUGAR_OVER_CARBS) {
  assert(names.has(name), `SUGAR_OVER_CARBS lists "${name}", which is no longer in the table — delete it from the list.`);
  assert(sugarNames.has(name), `"${name}" no longer has more sugar than carbohydrate — delete it from SUGAR_OVER_CARBS.`);
}

console.log(
  `tableEnergy.test.ts: ${rows.length} rows checked; ${UNSOURCED.size} unsourced rows and ` +
    `${SUGAR_OVER_CARBS.size} sugar-over-carbohydrate rows still to fix`,
);
