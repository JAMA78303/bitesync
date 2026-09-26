import { validateGeneratedFullRecipe } from "@/lib/ai/generateFullRecipe";
import { cookedWeightFor, dryWeightFor, isCookedWeightStaple, isDryWeightGrain } from "@/lib/recipes/cookedWeight";
import { buildMethodStepsFromIngredients } from "@/lib/recipes/buildMethodSteps";

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

// Grains are dry, as bought.
for (const n of ["rice", "brown rice", "basmati rice", "pasta", "wholewheat pasta", "quinoa", "couscous", "spaghetti"]) {
  assert(isDryWeightGrain(n), `${n} is a dry-weight grain`);
  assert(!isCookedWeightStaple(n), `${n} is not a tinned pulse`);
}
for (const n of ["rice cake", "rice flour", "rice noodles", "rice pudding", "chicken breast", "oats"]) {
  assert(!isDryWeightGrain(n), `${n} is not a grain portion`);
}
// Pulses are the drained tin — cooked weight.
for (const n of ["lentils", "chickpeas", "kidney beans", "cannellini beans"]) {
  assert(isCookedWeightStaple(n), `${n} is a tinned pulse`);
}
assert(!isCookedWeightStaple("dried lentils"), "an explicitly dried pulse is not cooked weight");

// 95 g dry rice is about 270 g cooked; the inverse converts the old cooked-gram rows.
// Factors are CoFID raw ÷ boiled energy per 100 g: white basmati 351 / 117 = 3.0.
assert(cookedWeightFor("rice", 95) === 285, `95 g dry rice → 285 g cooked, got ${cookedWeightFor("rice", 95)}`);
assert(dryWeightFor("rice", 315) === 105, `315 g cooked rice → 105 g dry, got ${dryWeightFor("rice", 315)}`);
assert(cookedWeightFor("pasta", 100) === 200, `white pasta doubles (343 / 169), got ${cookedWeightFor("pasta", 100)}`);
assert(cookedWeightFor("wholewheat pasta", 100) === 250, `wholewheat pasta ×2.5 (329 / 134), got ${cookedWeightFor("wholewheat pasta", 100)}`);
assert(dryWeightFor("brown rice", 285) === 105, `285 g cooked brown rice → 105 g dry, got ${dryWeightFor("brown rice", 285)}`);
assert(cookedWeightFor("chicken breast", 140) === null, "meat has no grain conversion");

// The template method states the dry amount and what it becomes.
const steps = buildMethodStepsFromIngredients(
  [
    { name: "chicken breast", quantity: 140, unit: "g" },
    { name: "rice", quantity: 95, unit: "g" },
    { name: "broccoli", quantity: 100, unit: "g" },
  ],
  "dinner",
);
const carbStep = steps.find((s) => /rice/i.test(s)) ?? "";
assert(/Cook 95g Rice/.test(carbStep) && /about 285g once cooked/.test(carbStep), `carb step should state dry and cooked, got: "${carbStep}"`);

// Claude's oil is capped at 1 tbsp per serving; the recipe is kept.
const validated = validateGeneratedFullRecipe(
  {
    title: "Chicken, Tomato And Onion Rice Bowl",
    description: "x",
    servings: 1,
    total_time_mins: 25,
    ingredients: [
      { name: "chicken breast", quantity: 140, unit: "g" },
      { name: "rice", quantity: 95, unit: "g" },
      { name: "cooking oil", quantity: 2, unit: "tbsp" },
    ],
    steps: ["Cook the rice.", "Fry the chicken breast in the cooking oil."],
  },
  [],
);
assert(validated !== null, "recipe with excess oil should be kept, not rejected");
const oil = validated!.ingredients.find((i) => i.name === "cooking oil");
assert(oil?.quantity === 1, `2 tbsp oil for 1 serving should clamp to 1 tbsp, got ${oil?.quantity}`);

console.log("cookedWeight.test.ts: all assertions passed");
