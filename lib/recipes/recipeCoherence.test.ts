import { buildMethodStepsFromIngredients } from "@/lib/recipes/buildMethodSteps";
import {
  orphanIngredients,
  stepsCoverAllIngredients,
  validateRecipeCoherence,
} from "@/lib/recipes/recipeCoherence";
import { stepsMentionUnlistedIngredients } from "@/lib/recipes/stepIngredientAlignment";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

// Spec bug: Banana & PB Toast with bread — method must toast bread
const toastIngredients = [
  { name: "peanut butter", quantity: 20, unit: "g" },
  { name: "banana", quantity: 120, unit: "g" },
  { name: "wholemeal bread", quantity: 170, unit: "g" },
];
const toastSteps = buildMethodStepsFromIngredients(toastIngredients, "breakfast");
const toastText = toastSteps.join(" ").toLowerCase();
assert(toastText.includes("toast"), "toast steps mention toasting");
assert(toastText.includes("bread"), "toast steps mention bread");
assert(toastText.includes("peanut butter"), "toast steps mention peanut butter");
assert(toastText.includes("banana"), "toast steps mention banana");
assert(
  stepsCoverAllIngredients(toastSteps, toastIngredients),
  "toast steps cover all ingredients",
);

// Incoherent bowl method must fail validation for Toast title
const badBowlSteps = [
  "Slice the banana and arrange on a plate or in a bowl.",
  "Spread peanut butter over the fruit and serve.",
];
assert(
  !validateRecipeCoherence({
    name: "Banana & Peanut Butter Toast",
    steps: badBowlSteps,
    ingredients: toastIngredients,
  }).ok,
  "bowl method fails coherence for Toast title with bread",
);
assert(
  orphanIngredients(badBowlSteps, toastIngredients).some((i) => /bread/i.test(i.name)),
  "bad bowl steps orphan bread",
);

// Coherent toast passes
assert(
  validateRecipeCoherence({
    name: "Banana & Peanut Butter Toast",
    steps: toastSteps,
    ingredients: toastIngredients,
  }).ok,
  "template toast steps pass coherence",
);

// Fruit + PB without bread — no false toast requirement
const bowlIngredients = [
  { name: "peanut butter", quantity: 18, unit: "g" },
  { name: "banana", quantity: 100, unit: "g" },
];
const bowlSteps = buildMethodStepsFromIngredients(bowlIngredients, "snack");
assert(
  validateRecipeCoherence({
    name: "Banana & Peanut Butter Bowl",
    steps: bowlSteps,
    ingredients: bowlIngredients,
  }).ok,
  "fruit bowl passes without bread",
);

assert(
  stepsMentionUnlistedIngredients(
    ["Beat the eggs and fold through the oats."],
    [
      { name: "oats", quantity: 30, unit: "g" },
      { name: "banana", quantity: 100, unit: "g" },
    ],
  ),
  "unlisted egg still flagged",
);

console.log("recipeCoherence.test.ts: ok");
