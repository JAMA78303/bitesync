import assert from "node:assert/strict";
import { goalsFromProfile, isUsableSnack, starterMealTypeCounts, starterTargets } from "./starterLibrary";

// Skipped the targets step: no stats, no stored targets → the app's defaults, not a refusal.
assert.deepEqual(starterTargets(null), { kcal: 2000, protein: 150 });
assert.deepEqual(starterTargets({}), { kcal: 2000, protein: 150 });

// Stored targets are used as they are.
assert.deepEqual(starterTargets({ daily_calorie_target: 1800, daily_protein_target: 120 }), {
  kcal: 1800,
  protein: 120,
});

// Below the floors Fill my library enforces → defaults, so the engine is never sized to nonsense.
assert.deepEqual(starterTargets({ daily_calorie_target: 500, daily_protein_target: 10 }), {
  kcal: 2000,
  protein: 150,
});

// Body stats win over stale stored targets, as everywhere else in the app.
const fromStats = starterTargets({
  weight_kg: 70,
  height_cm: 175,
  age: 30,
  sex: "male",
  activity_level: "moderate",
  goal: "maintain",
  daily_calorie_target: 1200,
});
assert.notEqual(fromStats.kcal, 1200);
assert.ok(fromStats.kcal >= 800);

// Diet flags come from the preference list, including dairy-free, which has no legacy boolean.
const goals = goalsFromProfile({ dietary_preferences: ["vegan", "dairy_free"] });
assert.equal(goals.followsVegan, true);
assert.equal(goals.followsVegetarian, true);
assert.equal(goals.dairyFree, true);
assert.equal(goals.followsGlutenFree, false);

// No targets → null, which the planner already treats as "use 2000".
assert.equal(goalsFromProfile(null).calorieTarget, null);
assert.equal(goalsFromProfile({ daily_calorie_target: 1900 }).calorieTarget, 1900);

// Two snacks a day need at least three snacks in the starter set; one a day keeps the even split.
assert.deepEqual(starterMealTypeCounts(10, 1), { breakfast: 3, lunch: 3, dinner: 2, snack: 2 });
assert.deepEqual(starterMealTypeCounts(10, 2), { breakfast: 3, lunch: 2, dinner: 2, snack: 3 });
assert.deepEqual(starterMealTypeCounts(16, 2), { breakfast: 4, lunch: 4, dinner: 4, snack: 4 });
for (const total of [8, 10, 12, 16]) {
  const c = starterMealTypeCounts(total, 2);
  assert.equal(c.breakfast + c.lunch + c.dinner + c.snack, total, `split keeps the total of ${total}`);
}

// The first paying customer's starter "snack": 315 kcal, over the cap, so never used as one.
const ings = (...names: string[]) => names.map((name) => ({ name, quantity: 1, unit: "g" }));
assert.equal(
  isUsableSnack({ name: "Almonds Overnight Oats", ingredients: ings("milk", "strawberries", "almonds", "oats"), achievedCalories: 315 }),
  false,
);
assert.equal(
  isUsableSnack({ name: "Cottage Cheese & Strawberry", ingredients: ings("strawberries", "cottage cheese"), achievedCalories: 274 }),
  true,
);

console.log("starterLibrary tests passed");
