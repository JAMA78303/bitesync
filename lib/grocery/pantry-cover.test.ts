import { pantryCoversIngredient } from "@/lib/matching/ingredient-overlap";
import { applyPantryToShoppingList } from "@/lib/grocery/applyPantryToShoppingList";

function assertCover(pantry: string, ingredient: string, expected: boolean): void {
  const actual = pantryCoversIngredient(pantry, ingredient);
  if (actual !== expected) {
    throw new Error(
      `pantry "${pantry}" vs "${ingredient}": expected ${expected ? "covered" : "not covered"}`,
    );
  }
}

// Reported bug: items absent from the pantry were dropped from the grocery list.
// A modifier-prefixed food is a different food — owning pepper is not owning red
// peppers, and owning butter is not owning peanut butter.
assertCover("Pepper", "red pepper", false);
assertCover("Butter", "peanut butter", false);
assertCover("Milk", "almond milk", false);
assertCover("Milk", "oat milk", false);
assertCover("Onion", "spring onion", false);
assertCover("Bread", "wholemeal bread", false);
assertCover("Bread", "garlic bread", false);
assertCover("Olive Oil", "coconut oil", false);
assertCover("Chicken Breast", "chicken thigh", false);

// Genuine matches must still be omitted, or the pantry feature does nothing.
assertCover("Eggs", "egg", true);
assertCover("Onion", "onions", true);
assertCover("Tomatoes", "tomato", true);
assertCover("Olive Oil", "olive oil", true);
assertCover("Chicken Breast", "chicken breast", true);
assertCover("red pepper", "Red Peppers", true);
assertCover("Fresh Basil", "basil", true);
// Form words describe how a food is sold, not which food it is.
assertCover("Garlic", "garlic cloves", true);
assertCover("Rosemary", "rosemary sprigs", true);
assertCover("Cod", "cod fillets", true);

// A pantry item with no quantity means "enough" only for store-cupboard staples.
// Owning *some* chicken says nothing about owning the 980g a week of meals needs.
{
  const perishables = applyPantryToShoppingList(
    [
      { name: "chicken breast", quantity: 980, unit: "g" },
      { name: "milk", quantity: 1400, unit: "ml" },
      { name: "onion", quantity: 350, unit: "g" },
      { name: "olive oil", quantity: 56, unit: "ml" },
      { name: "garlic", quantity: 30, unit: "g" },
      { name: "flour", quantity: 200, unit: "g" },
    ],
    [
      { name: "Chicken Breast" },
      { name: "Milk" },
      { name: "Onion" },
      { name: "Olive Oil" },
      { name: "Garlic" },
      { name: "Flour" },
    ].map((p) => ({ ...p, runningLow: false })),
  );
  const kept = perishables.items.map((i) => i.name).sort().join(",");
  if (kept !== "chicken breast,milk,onion") {
    throw new Error(`perishables must stay on the list; got: ${kept}`);
  }
  if (perishables.omittedCount !== 3) {
    throw new Error(`staples should account for 3 omissions, got ${perishables.omittedCount}`);
  }
}

// A recorded quantity still reduces a perishable rather than dropping it.
{
  const result = applyPantryToShoppingList(
    [{ name: "chicken breast", quantity: 980, unit: "g" }],
    [{ name: "Chicken Breast", quantity: 500, unit: "g", runningLow: false }],
  );
  if (result.items[0]?.quantity !== 480 || result.reducedCount !== 1) {
    throw new Error(`expected 480g remaining, got ${JSON.stringify(result.items[0])}`);
  }
}

// Running-low stock must never omit a line — that is the point of the flag.
{
  const result = applyPantryToShoppingList(
    [{ name: "olive oil", quantity: 100, unit: "ml" }],
    [{ name: "olive oil", quantity: 500, unit: "ml", runningLow: true }],
  );
  if (result.items.length !== 1 || result.omittedCount !== 0) {
    throw new Error("running-low pantry stock must not omit a shopping line");
  }
}

// End to end: only genuinely-covered lines disappear.
//  - "Pepper" must not cover "red pepper"     (different food)
//  - "Butter" must not cover "peanut butter"  (different food)
//  - "Onion" has no quantity and is perishable, so onion stays on the list
//  - "Olive Oil" is a staple, so oil drops even without a quantity
{
  const result = applyPantryToShoppingList(
    [
      { name: "red pepper", quantity: 2, unit: "" },
      { name: "peanut butter", quantity: 40, unit: "g" },
      { name: "onion", quantity: 1, unit: "" },
      { name: "olive oil", quantity: 15, unit: "ml" },
    ],
    [
      { name: "Pepper", runningLow: false },
      { name: "Butter", runningLow: false },
      { name: "Onion", runningLow: false },
      { name: "Olive Oil", runningLow: false },
    ],
  );
  const names = result.items.map((i) => i.name).sort();
  if (names.join(",") !== "onion,peanut butter,red pepper") {
    throw new Error(`unexpected surviving lines: ${names.join(",")}`);
  }
  if (result.omittedCount !== 1) {
    throw new Error(`expected exactly 1 omission (olive oil), got ${result.omittedCount}`);
  }
}

console.log("pantry-cover.test.ts: all assertions passed");
