/**
 * Coverage check for the micronutrient database.
 *
 * The weekly micro analysis silently drops any recipe ingredient that
 * `lookupMicros` can't resolve, so coverage gaps directly understate vitamin
 * and mineral intake. This asserts the template catalog (the foods generated
 * recipes actually use) is 100% covered, and reports overall coverage of the
 * broader nutrition DB so regressions are visible.
 *
 *   npm run verify:micro-coverage
 */

import { INGREDIENT_CATALOG } from "@/lib/recipes/ingredientRoles";
import { lookupMicros } from "@/lib/nutrition/micros";
import { NUTRITION_DB } from "@/lib/nutrition/nutrition-db";

let failures = 0;

const catalogMissing = INGREDIENT_CATALOG.filter((d) => !lookupMicros(d.name)).map((d) => d.name);
console.log(`Template catalog: ${INGREDIENT_CATALOG.length} foods`);
if (catalogMissing.length) {
  failures += 1;
  console.log(`  ❌ ${catalogMissing.length} missing micros: ${catalogMissing.join(", ")}`);
} else {
  console.log("  ✅ all catalog foods have micros");
}

const dbNames = (NUTRITION_DB as { name: string }[]).map((e) => e.name);
const dbMissing = dbNames.filter((n) => !lookupMicros(n));
const covered = dbNames.length - dbMissing.length;
const pct = Math.round((covered / dbNames.length) * 100);
console.log(`\nFull nutrition DB: ${covered}/${dbNames.length} foods covered (${pct}%)`);

// Whole foods carry meaningful micros; processed/branded items are long-tail and low signal.
// We don't require 100% here, but guard against the coverage % collapsing.
const MIN_DB_COVERAGE_PCT = 35;
if (pct < MIN_DB_COVERAGE_PCT) {
  failures += 1;
  console.log(`  ❌ coverage ${pct}% below floor of ${MIN_DB_COVERAGE_PCT}%`);
} else {
  console.log(`  ✅ coverage ${pct}% ≥ floor of ${MIN_DB_COVERAGE_PCT}%`);
}

if (failures) {
  console.error(`\n${failures} micro-coverage check(s) failed.`);
  process.exit(1);
}
console.log("\nAll micro-coverage checks passed.");
