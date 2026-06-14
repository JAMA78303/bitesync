/**
 * Raw-vs-cooked staple grain/pulse class verification.
 *
 *   npm run verify:raw-grain-class
 */

import { calculateRecipeNutrition } from "@/lib/nutrition/calculate";
import { lookupNutrition } from "@/lib/nutrition/lookup";
import {
  isRawDryStapleForm,
  isStapleGrainPulseQuery,
  pickBestCofidCandidate,
  type CofidCandidate,
} from "@/lib/nutrition/cofidMatch";

let failures = 0;
function check(label: string, ok: boolean, detail: string) {
  console.log(`${ok ? "✅" : "❌"} ${label} — ${detail}`);
  if (!ok) failures += 1;
}

// --- Matcher class: cooked beats raw when both exist ---
const classCases: { query: string; candidates: CofidCandidate[]; want: string; forbid: string[] }[] = [
  {
    query: "quinoa",
    candidates: [{ food_code: "1", food_name: "Quinoa, raw", food_group: "GA", matchKind: "partial" }],
    want: "quinoa",
    forbid: [],
  },
  {
    query: "couscous",
    candidates: [
      { food_code: "1", food_name: "Couscous, plain, raw", food_group: "AT", matchKind: "partial" },
      { food_code: "2", food_name: "Couscous, plain, cooked", food_group: "AT", matchKind: "partial" },
    ],
    want: "cooked",
    forbid: ["raw"],
  },
  {
    query: "lentils",
    candidates: [
      { food_code: "1", food_name: "Lentils, green and brown, whole, dried, raw", food_group: "DB", matchKind: "partial" },
      { food_code: "2", food_name: "Lentils, green and brown, whole, dried, boiled in unsalted water", food_group: "DB", matchKind: "partial" },
    ],
    want: "boiled",
    forbid: ["dried, raw"],
  },
  {
    query: "rice",
    candidates: [
      { food_code: "1", food_name: "Rice, white, long grain, boiled in unsalted water", food_group: "AC", matchKind: "partial" },
      { food_code: "2", food_name: "Rice, white, pudding, raw", food_group: "AC", matchKind: "partial" },
    ],
    want: "boiled",
    forbid: ["pudding"],
  },
  {
    query: "pasta",
    candidates: [
      { food_code: "1", food_name: "Pasta, white, dried, raw", food_group: "AC", matchKind: "partial" },
      { food_code: "2", food_name: "Pasta, white, fresh, boiled in unsalted water", food_group: "AC", matchKind: "partial" },
    ],
    want: "boiled",
    forbid: ["dried"],
  },
];

for (const { query, candidates, want, forbid } of classCases) {
  const best = pickBestCofidCandidate(query, candidates);
  const name = best?.food_name.toLowerCase() ?? "";
  const ok = name.includes(want) && !forbid.some((f) => name.includes(f));
  check(`matcher "${query}" → ${want}`, ok, best?.food_name ?? "no match");
}

// --- Local DB: quinoa is cooked density (~120 kcal / ~21g carb), not raw ---
const quinoaLocal = lookupNutrition("quinoa");
check(
  "local quinoa is cooked density",
  (quinoaLocal?.per_100g.carbs_g ?? 0) < 30 && (quinoaLocal?.per_100g.calories ?? 0) < 200,
  quinoaLocal
    ? `${quinoaLocal.per_100g.calories} kcal, ${quinoaLocal.per_100g.carbs_g}g carb /100g`
    : "missing",
);

check(
  "CoFID 'Quinoa, raw' detected as raw staple form",
  isRawDryStapleForm("Quinoa, raw") && isStapleGrainPulseQuery("quinoa"),
  "ok",
);

// --- Spec test meal (sync local path + cooked quinoa in DB) ---
const specMeal = calculateRecipeNutrition([
  { name: "chicken breast", quantity: 140, unit: "g" },
  { name: "mushrooms", quantity: 100, unit: "g" },
  { name: "avocado", quantity: 80, unit: "g" },
  { name: "courgette", quantity: 150, unit: "g" },
  { name: "quinoa", quantity: 200, unit: "g" },
]);

console.log(
  `\nSpec meal: ${Math.round(specMeal.calories)} kcal, ${Math.round(specMeal.carbs_g)}g carbs, ${Math.round(specMeal.protein_g)}g protein`,
);
check(
  "Spec meal kcal ≈620 (±15%)",
  specMeal.calories >= 520 && specMeal.calories <= 720,
  `${Math.round(specMeal.calories)} kcal`,
);
check(
  "Spec meal carbs ≈46 (±25%)",
  specMeal.carbs_g >= 34 && specMeal.carbs_g <= 58,
  `${Math.round(specMeal.carbs_g)}g`,
);

if (failures) {
  console.error(`\n${failures} raw-grain class check(s) failed.`);
  process.exit(1);
}
console.log("\nAll raw-grain class checks passed.");
