import { validateGeneratedFullRecipe } from "@/lib/ai/generateFullRecipe";
import { dryWeightFor, isCookedWeightStaple } from "@/lib/recipes/cookedWeight";
import { buildMethodStepsFromIngredients } from "@/lib/recipes/buildMethodSteps";

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

// The staples the template engine costs at cooked values.
for (const n of ["rice", "brown rice", "basmati rice", "pasta", "wholewheat pasta", "quinoa", "lentils", "chickpeas"]) {
  assert(isCookedWeightStaple(n), `${n} should be a cooked-weight staple`);
}
// Things that contain the words but are not cooked-weight portions.
for (const n of ["rice cake", "rice flour", "rice noodles", "dry rice", "uncooked pasta", "chicken breast", "oats"]) {
  assert(!isCookedWeightStaple(n), `${n} should NOT be a cooked-weight staple`);
}

// 315 g cooked rice is about 105 g dry — the number the recipe used to imply
// the cook should weigh three times over.
assert(dryWeightFor("rice", 315) === 105, `315 g cooked rice → 105 g dry, got ${dryWeightFor("rice", 315)}`);
assert(dryWeightFor("pasta", 225) === 100, `225 g cooked pasta → 100 g dry, got ${dryWeightFor("pasta", 225)}`);
assert(dryWeightFor("chicken breast", 140) === null, "non-staples have no dry weight");

// Template method names the dry amount.
const steps = buildMethodStepsFromIngredients(
  [
    { name: "chicken breast", quantity: 140, unit: "g" },
    { name: "rice", quantity: 315, unit: "g" },
    { name: "broccoli", quantity: 100, unit: "g" },
  ],
  "dinner",
);
const carbStep = steps.find((s) => /rice/i.test(s)) ?? "";
assert(/105g dry/.test(carbStep) && /315g cooked/.test(carbStep), `carb step should state dry and cooked weights, got: "${carbStep}"`);

// Claude's oil is capped at 1 tbsp per serving; the recipe is kept.
const validated = validateGeneratedFullRecipe(
  {
    title: "Chicken, Tomato And Onion Rice Bowl",
    description: "x",
    servings: 1,
    total_time_mins: 25,
    ingredients: [
      { name: "chicken breast", quantity: 140, unit: "g" },
      { name: "rice", quantity: 315, unit: "g" },
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
