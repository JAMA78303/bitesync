import { isNamed, median } from "@/evals/photo-meals/score";
import { cleanIdentification } from "@/lib/photoMeal/identify";
import { formatRange, mealRange, microSummary, startingGrams } from "@/lib/photoMeal/totals";
import type { FoodMatch, ReviewItem } from "@/lib/photoMeal/types";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const rice: FoodMatch = {
  per100: { kcal: 130, protein: 2.7, carbs: 28, fat: 0.3, fibre: 0.4 },
  micros100: null,
  source: "CoFID: Rice, white, boiled",
};
const chicken: FoodMatch = {
  per100: { kcal: 160, protein: 30, carbs: 0, fat: 4, fibre: 0 },
  micros100: {
    vitamin_a_mcg: 10, vitamin_c_mg: 0, vitamin_d_mcg: 0.2, vitamin_b12_mcg: 0.4, folate_mcg: 5,
    iron_mg: 0.7, calcium_mg: 10, zinc_mg: 1.5, magnesium_mg: 30, potassium_mg: 350,
    selenium_mcg: 20, iodine_mcg: 5, saturated_fat_g: 1, salt_g: 0.2, sugar_g: 0,
  },
  source: "CoFID: Chicken breast, grilled",
};

const item = (key: string, match: FoodMatch | null, low: number, high: number, edited = false, grams?: number): ReviewItem => ({
  key,
  name: key,
  gramsLow: low,
  gramsHigh: high,
  grams: grams ?? startingGrams(low, high),
  edited,
  match,
});

// --- startingGrams: the middle of the range, to the nearest 5 g, never below 5.
assert(startingGrams(120, 180) === 150, "midpoint of 120–180 is 150");
assert(startingGrams(101, 112) === 105, `101–112 rounds to 105, got ${startingGrams(101, 112)}`);
assert(startingGrams(1, 2) === 5, "tiny ranges start at 5 g");

// --- mealRange: untouched foods span their range, edited ones are exact.
{
  const r = mealRange([item("rice", rice, 150, 250), item("chicken", chicken, 100, 140)]);
  assert(Math.round(r.low.kcal) === 355, `low kcal should be 195 + 160 = 355, got ${r.low.kcal}`);
  assert(Math.round(r.high.kcal) === 549, `high kcal should be 325 + 224 = 549, got ${r.high.kcal}`);
  assert(r.matchedCount === 2 && r.unmatchedCount === 0, "both foods matched");
}
{
  const r = mealRange([item("rice", rice, 150, 250, true, 200)]);
  assert(r.low.kcal === r.high.kcal && Math.round(r.current.kcal) === 260, "an edited food is one exact weight");
}
{
  // DEC-005: an unmatched food is unknown, not zero, and is counted as such.
  const r = mealRange([item("rice", rice, 150, 250), item("mystery stew", null, 300, 400)]);
  assert(r.unmatchedCount === 1 && r.matchedCount === 1, "unmatched food is counted separately");
  assert(Math.round(r.high.kcal) === 325, "unmatched food adds nothing to the numbers");
}

// --- formatRange
assert(formatRange(523, 641, "kcal") === "520–640 kcal", `got ${formatRange(523, 641, "kcal")}`);
assert(formatRange(580, 590, "kcal") === "590 kcal", `ends within 5% collapse to one value, got ${formatRange(580, 590, "kcal")}`);
assert(formatRange(0, 0, "g") === "0 g", `zero shows as one value, got ${formatRange(0, 0, "g")}`);
assert(formatRange(1234, 1600, "kcal") === "1,230–1,600 kcal", `thousands separator, got ${formatRange(1234, 1600, "kcal")}`);

// --- microSummary: only foods with data count; share of a day's reference intake.
{
  const s = microSummary([item("rice", rice, 150, 150, true, 150), item("chicken", chicken, 200, 200, true, 200)], {
    sex: "male",
    age: 30,
  });
  assert(s.foodsMatched === 2 && s.foodsWithData === 1, `rice has no micro data: ${s.foodsWithData}/${s.foodsMatched}`);
  const selenium = s.contributions.find((c) => c.key === "selenium_mcg");
  assert(Boolean(selenium) && Math.round(selenium!.amount) === 40, `200 g chicken has 40 mcg selenium, got ${selenium?.amount}`);
  for (let i = 1; i < s.contributions.length; i++) {
    assert(s.contributions[i - 1]!.shareOfDay >= s.contributions[i]!.shareOfDay, "biggest share first");
  }
}
{
  const s = microSummary([item("rice", rice, 150, 150)], "female");
  assert(s.contributions.length === 0 && s.foodsWithData === 0, "no data means no contributions, not zeros");
}

// --- cleanIdentification: the model's JSON made safe to use.
{
  const out = cleanIdentification({
    is_food: true,
    title: "  Chicken and rice  ",
    items: [
      { food: " Chicken breast, grilled ", cooking_method: "grilled", portion_g_low: 180, portion_g_high: 120, confidence: "high" },
      { food: "Rice, white, boiled", cooking_method: "", portion_g_low: 0, portion_g_high: 9000, confidence: "medium" },
      { food: "   ", cooking_method: "", portion_g_low: 10, portion_g_high: 20, confidence: "low" },
    ],
    hidden_extras: [
      { food: "Olive oil", typical_g: 8.4 },
      { food: "chicken breast, grilled", typical_g: 50 },
    ],
  });
  assert(out.kind === "meal", `expected a meal, got ${out.kind}`);
  if (out.kind === "meal") {
    assert(out.title === "Chicken and rice", "title trimmed");
    assert(out.foods.length === 2, "blank food names are dropped");
    assert(out.foods[0]!.gramsLow === 120 && out.foods[0]!.gramsHigh === 180, "low and high put in order");
    assert(out.foods[0]!.food === "Chicken breast, grilled", "names trimmed");
    assert(out.foods[1]!.gramsLow === 1 && out.foods[1]!.gramsHigh === 2000, "grams clamped to 1–2000");
    assert(out.foods[1]!.cookingMethod === null, "empty cooking method is null");
    assert(out.extras.length === 1 && out.extras[0]!.food === "Olive oil" && out.extras[0]!.grams === 8, "extras deduped against foods");
  }
}
assert(cleanIdentification({ is_food: false, title: "", items: [], hidden_extras: [] }).kind === "not_food", "not food");
assert(
  cleanIdentification({ is_food: true, title: "Plate", items: [], hidden_extras: [] }).kind === "not_food",
  "food with no items is treated as not food",
);
assert(cleanIdentification({ nonsense: true }).kind === "failed", "wrong shape fails");
assert(cleanIdentification(null).kind === "failed", "null fails");
{
  const many = cleanIdentification({
    is_food: true,
    title: "",
    items: Array.from({ length: 20 }, (_, i) => ({
      food: `Food ${i}`,
      cooking_method: "",
      portion_g_low: 10,
      portion_g_high: 20,
      confidence: "low",
    })),
    hidden_extras: [],
  });
  assert(many.kind === "meal" && many.foods.length === 12, "at most 12 foods");
  assert(many.kind === "meal" && many.title === "Food 0 and Food 1", "empty title falls back to the first foods");
}

// --- Eval scoring
assert(isNamed({ name: "Rice, white, boiled", grams: 150 }, ["Basmati rice, boiled"]), "rice named");
assert(!isNamed({ name: "Rice, white, boiled", grams: 150 }, ["Licorice"]), "a word inside another word doesn't count");
assert(isNamed({ name: "Lamb biryani", grams: 400, accept: ["biryani"] }, ["Chicken biryani"]), "accept words");
assert(!isNamed({ name: "Raita", grams: 60 }, ["Rice, white, boiled"]), "a different food isn't a match");
assert(median([0.3, 0.1, 0.2]) === 0.2 && median([0.1, 0.3]) === 0.2 && median([]) === null, "median");

console.log("photoMeal.test.ts: all assertions passed");
