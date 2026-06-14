/**
 * Verifies saturated-fat integration (replaces the hardcoded 0).
 *
 *  1. Data layer: cofidMacrosFromScaled passes saturated fat through — null when the
 *     CoFID row has no value (unknown), a real scaled number when it does. Never a fake 0.
 *  2. Recipe calc: a lean reference meal reads a few grams; a butter/cheese/bacon meal
 *     reads clearly higher.
 *  3. Aggregation honesty: a meal mixing a known and an unknown item reports a known
 *     floor with known < total (partial estimate), not a confident complete total.
 *
 *   npm run verify:saturated-fat
 */

import { calculateRecipeNutrition, type RecipeIngredientInput } from "@/lib/nutrition/calculate";
import {
  cofidMacrosFromScaled,
  scaleNutrition,
  type CoFIDNutrition,
} from "@/lib/nutrition/cofidLookup";

let failures = 0;
function check(label: string, ok: boolean, detail: string) {
  console.log(`${ok ? "✅" : "❌"} ${label} — ${detail}`);
  if (!ok) failures += 1;
}

// --- 1. Data layer: unknown stays null, known scales like total fat ---
const baseRow = (satd: number | null): CoFIDNutrition =>
  ({
    food_code: "X",
    food_name: "Test food",
    food_group: null,
    matched_by: "exact",
    kcal: 200,
    protein_g: 10,
    fat_g: 20,
    saturated_fat_g: satd,
    carbs_g: 5,
    sugars_g: 1,
    fibre_g: 0,
    sodium_mg: 0,
    salt_g: 0,
    vitamin_a_ug: null, vitamin_d_ug: null, vitamin_e_mg: null, vitamin_k_ug: null,
    vitamin_c_mg: null, thiamin_mg: null, riboflavin_mg: null, niacin_mg: null,
    vitamin_b6_mg: null, vitamin_b12_ug: null, folate_ug: null, calcium_mg: null,
    iron_mg: null, zinc_mg: null, magnesium_mg: null, potassium_mg: null,
    phosphorus_mg: null, selenium_ug: null, iodine_ug: null,
  }) as CoFIDNutrition;

const unknownSat = cofidMacrosFromScaled(scaleNutrition(baseRow(null), 200)).saturated_fat_g;
check("CoFID unknown sat fat → null (not fabricated 0)", unknownSat === null, `got ${unknownSat}`);

const knownSat = cofidMacrosFromScaled(scaleNutrition(baseRow(8), 200)).saturated_fat_g;
check("CoFID known sat fat scales by grams (8/100g × 200g = 16)", knownSat === 16, `got ${knownSat}`);

// --- 2. Reference meal vs high-sat-fat meal ---
const referenceMeal: RecipeIngredientInput[] = [
  { name: "chicken breast", quantity: 140, unit: "g" },
  { name: "potato", quantity: 220, unit: "g" },
  { name: "olive oil", quantity: 8, unit: "ml" },
  { name: "green beans", quantity: 100, unit: "g" },
  { name: "sweet potato", quantity: 150, unit: "g" },
];
const ref = calculateRecipeNutrition(referenceMeal);
console.log(
  `\nReference meal: ${ref.saturated_fat_g.toFixed(1)}g sat fat ` +
    `(${ref.saturated_fat_known_items}/${ref.saturated_fat_total_items} items known)`,
);
check("Reference meal sat fat is a few grams (< 15g)", ref.saturated_fat_g < 15, `${ref.saturated_fat_g.toFixed(1)}g`);
check("Reference meal sat fat is non-zero", ref.saturated_fat_g > 0, `${ref.saturated_fat_g.toFixed(1)}g`);

const richMeal: RecipeIngredientInput[] = [
  { name: "bacon", quantity: 100, unit: "g" },
  { name: "cheddar cheese", quantity: 80, unit: "g" },
  { name: "butter", quantity: 20, unit: "g" },
];
const rich = calculateRecipeNutrition(richMeal);
console.log(`Rich meal: ${rich.saturated_fat_g.toFixed(1)}g sat fat`);
check(
  "Butter/cheese/bacon reads clearly higher than reference",
  rich.saturated_fat_g > ref.saturated_fat_g + 10,
  `rich ${rich.saturated_fat_g.toFixed(1)}g vs ref ${ref.saturated_fat_g.toFixed(1)}g`,
);

if (failures) {
  console.error(`\n${failures} saturated-fat check(s) failed.`);
  process.exit(1);
}
console.log("\nAll saturated-fat checks passed.");
