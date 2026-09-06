import {
  isDistinctlyBreakfastDish,
  recipeMatchesPlannerSlot,
  suitableForBreakfastSlot,
} from "@/lib/planner/meal-slot-eligibility";

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

// A food can be both a breakfast and a snack. Rejecting every breakfast-classified
// recipe from snack slots left a real 40-recipe library with 2 eligible snacks, so
// the planner served the same cottage cheese pot every day of the week.
const snackable: [string, string[], number][] = [
  ["Cottage Cheese & Blueberry", ["cottage cheese", "blueberries"], 282],
  ["Cottage Cheese & Orange", ["cottage cheese", "orange"], 283],
  ["Boiled Eggs With Cucumber", ["eggs", "cucumber"], 253],
  ["Apple Yogurt Pot", ["greek yogurt", "apple"], 282],
];
for (const [name, ings, cal] of snackable) {
  assert(
    recipeMatchesPlannerSlot(name, ings, "snack", cal),
    `"${name}" is an ordinary snack and should be eligible`,
  );
}

// Genuine breakfast dishes stay out of snack slots even when snack-sized.
const breakfastDishes: [string, string[], number][] = [
  ["Almonds Overnight Oats", ["oats", "almond milk", "almonds"], 282],
  ["Strawberry Porridge", ["oats", "milk", "strawberries"], 290],
  ["Scrambled Eggs On Toast", ["eggs", "wholemeal bread"], 295],
];
for (const [name, ings, cal] of breakfastDishes) {
  assert(isDistinctlyBreakfastDish(name, ings), `"${name}" is a breakfast dish`);
  assert(
    !recipeMatchesPlannerSlot(name, ings, "snack", cal),
    `"${name}" should not fill a snack slot`,
  );
  // …and must still be usable at breakfast.
  assert(suitableForBreakfastSlot(name, ings), `"${name}" should still suit breakfast`);
}

// The calorie band still applies — a main meal is not a snack at any classification.
assert(
  !recipeMatchesPlannerSlot("Chicken With Potato", ["chicken breast", "potato"], "snack", 700),
  "a 700 kcal main is never a snack",
);
assert(
  !recipeMatchesPlannerSlot("Cottage Cheese Bowl", ["cottage cheese"], "snack", 480),
  "an oversized pot is still outside the snack band",
);

console.log("snack-eligibility.test.ts: all assertions passed");
