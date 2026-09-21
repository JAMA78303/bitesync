/**
 * Staple weight-basis verification: grains dry, pulses tinned.
 *
 * A bare grain or pasta name means the packet — dry weight, costed on the raw
 * row. A bare pulse name means the drained tin — cooked weight, costed on the
 * canned / boiled row. A query that names its own form gets it.
 *
 *   npm run verify:raw-grain-class
 */
import { calculateRecipeNutrition } from "@/lib/nutrition/calculate";
import { lookupNutrition } from "@/lib/nutrition/lookup";
import {
  isDryGrainQuery,
  isRawDryStapleForm,
  isStaplePulseQuery,
  pickBestCofidCandidate,
  type CofidCandidate,
} from "@/lib/nutrition/cofidMatch";

let failures = 0;
function check(label: string, ok: boolean, detail: string) {
  console.log(`${ok ? "✅" : "❌"} ${label} — ${detail}`);
  if (!ok) failures += 1;
}

const c = (food_name: string): CofidCandidate => ({ food_code: food_name, food_name, food_group: "X", matchKind: "partial" });

// --- Matcher: grains → raw, pulses → cooked, explicit form → that form ---
const classCases: { query: string; candidates: CofidCandidate[]; want: string; forbid: string[] }[] = [
  { query: "quinoa", candidates: [c("Quinoa, raw")], want: "quinoa", forbid: [] },
  { query: "couscous", candidates: [c("Couscous, plain, raw"), c("Couscous, plain, cooked")], want: "raw", forbid: ["cooked"] },
  { query: "rice", candidates: [c("Rice, white, long grain, boiled in unsalted water"), c("Rice, white, basmati, raw")], want: "raw", forbid: ["boiled"] },
  { query: "pasta", candidates: [c("Pasta, white, dried, raw"), c("Pasta, white, fresh, boiled in unsalted water")], want: "dried, raw", forbid: ["boiled"] },
  { query: "oats", candidates: [c("Porridge oats, unfortified, raw"), c("Porridge, made with water")], want: "oats", forbid: ["porridge, made"] },
  { query: "cooked rice", candidates: [c("Rice, white, long grain, boiled in unsalted water"), c("Rice, white, basmati, raw")], want: "boiled", forbid: ["raw"] },
  { query: "lentils", candidates: [c("Lentils, green and brown, whole, dried, raw"), c("Lentils, green and brown, whole, dried, boiled in unsalted water")], want: "boiled", forbid: ["dried, raw"] },
  { query: "chickpeas", candidates: [c("Chick peas, whole, dried, raw"), c("Chick peas, canned, re-heated, drained")], want: "canned", forbid: ["dried, raw"] },
  { query: "dried lentils", candidates: [c("Lentils, red, split, dried, raw"), c("Lentils, red, split, dried, boiled in unsalted water")], want: "dried, raw", forbid: ["boiled"] },
];
for (const { query, candidates, want, forbid } of classCases) {
  const best = pickBestCofidCandidate(query, candidates);
  const name = best?.food_name.toLowerCase() ?? "";
  const ok = name.includes(want) && !forbid.some((f) => name.includes(f));
  check(`matcher "${query}" → ${want}`, ok, best?.food_name ?? "no match");
}

check("quinoa is a dry-grain query", isDryGrainQuery("quinoa") && !isStaplePulseQuery("quinoa"), "ok");
check("lentils is a pulse query", isStaplePulseQuery("lentils") && !isDryGrainQuery("lentils"), "ok");
check("rice cake is not a grain portion", !isDryGrainQuery("rice cake"), "ok");
check("CoFID 'Quinoa, raw' detected as raw staple form", isRawDryStapleForm("Quinoa, raw"), "ok");

// --- Local DB: grains carry dry density, pulses cooked ---
const quinoaLocal = lookupNutrition("quinoa");
check(
  "local quinoa is dry density (>300 kcal, >50 g carb / 100 g)",
  (quinoaLocal?.per_100g.carbs_g ?? 0) > 50 && (quinoaLocal?.per_100g.calories ?? 0) > 300,
  quinoaLocal ? `${quinoaLocal.per_100g.calories} kcal, ${quinoaLocal.per_100g.carbs_g}g carb /100g` : "missing",
);
const riceLocal = lookupNutrition("rice");
check("local rice is dry density", (riceLocal?.per_100g.calories ?? 0) > 340, riceLocal ? `${riceLocal.per_100g.calories} kcal` : "missing");
const lentilLocal = lookupNutrition("lentils");
check("local lentils are cooked density", (lentilLocal?.per_100g.calories ?? 0) < 160, lentilLocal ? `${lentilLocal.per_100g.calories} kcal` : "missing");

// --- Spec meal: 70 g dry quinoa (≈ the 200 g cooked the old spec used) ---
const specMeal = calculateRecipeNutrition([
  { name: "chicken breast", quantity: 140, unit: "g" },
  { name: "mushrooms", quantity: 100, unit: "g" },
  { name: "avocado", quantity: 80, unit: "g" },
  { name: "courgette", quantity: 150, unit: "g" },
  { name: "quinoa", quantity: 70, unit: "g" },
]);
console.log(
  `\nSpec meal: ${Math.round(specMeal.calories)} kcal, ${Math.round(specMeal.carbs_g)}g carbs, ${Math.round(specMeal.protein_g)}g protein`,
);
// Chicken is raw now (120 kcal/100 g) and quinoa dry; the same plate lands ~560 kcal.
check("Spec meal kcal ≈560 (±15%)", specMeal.calories >= 476 && specMeal.calories <= 644, `${Math.round(specMeal.calories)} kcal`);
check("Spec meal carbs ≈46 g (±25%)", specMeal.carbs_g >= 34 && specMeal.carbs_g <= 58, `${Math.round(specMeal.carbs_g)}g`);

if (failures) {
  console.error(`\n${failures} staple weight-basis check(s) failed.`);
  process.exit(1);
}
console.log("\nAll staple weight-basis checks passed.");
