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

// End to end: only the genuinely-owned line disappears.
{
  const result = applyPantryToShoppingList(
    [
      { name: "red pepper", quantity: 2, unit: "" },
      { name: "peanut butter", quantity: 40, unit: "g" },
      { name: "onion", quantity: 1, unit: "" },
    ],
    [
      { name: "Pepper", runningLow: false },
      { name: "Butter", runningLow: false },
      { name: "Onion", runningLow: false },
    ],
  );
  const names = result.items.map((i) => i.name).sort();
  if (names.join(",") !== "peanut butter,red pepper") {
    throw new Error(`expected red pepper + peanut butter to survive, got: ${names.join(",")}`);
  }
  if (result.omittedCount !== 1) {
    throw new Error(`expected exactly 1 omission (onion), got ${result.omittedCount}`);
  }
}

console.log("pantry-cover.test.ts: all assertions passed");
