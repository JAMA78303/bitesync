import { applyPantryToShoppingList } from "@/lib/grocery/applyPantryToShoppingList";

function assertEqual(actual: number, expected: number, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

// No pantry — pass through
const passthrough = applyPantryToShoppingList(
  [{ name: "Chicken breast", quantity: 500, unit: "g" }],
  [],
);
assertEqual(passthrough.items.length, 1, "empty pantry");
assertEqual(passthrough.omittedCount, 0, "empty pantry omitted");

// Name match, no quantity — omit line
const omitted = applyPantryToShoppingList(
  [{ name: "Olive oil", quantity: 500, unit: "ml" }],
  [{ name: "Olive oil" }],
);
assertEqual(omitted.items.length, 0, "omit when pantry has no qty");
assertEqual(omitted.omittedCount, 1, "omit count");

// Same unit — subtract quantity
const reduced = applyPantryToShoppingList(
  [{ name: "Basmati rice", quantity: 1000, unit: "g" }],
  [{ name: "Rice", quantity: 400, unit: "g" }],
);
assertEqual(reduced.items.length, 1, "partial subtract keeps line");
assertEqual(reduced.items[0]?.quantity, 600, "partial subtract qty");
assertEqual(reduced.reducedCount, 1, "reduced count");
assertEqual(reduced.omittedCount, 0, "not fully omitted");

// Pantry covers need — omit
const covered = applyPantryToShoppingList(
  [{ name: "Eggs", quantity: 6, unit: "piece" }],
  [{ name: "Eggs", quantity: 12, unit: "piece" }],
);
assertEqual(covered.items.length, 0, "fully covered");
assertEqual(covered.omittedCount, 1, "fully covered omitted");

// Running low — keep on list
const runningLow = applyPantryToShoppingList(
  [{ name: "Milk", quantity: 1, unit: "l" }],
  [{ name: "Milk", quantity: 2, unit: "l", runningLow: true }],
);
assertEqual(runningLow.items.length, 1, "running low keeps line");
assertEqual(runningLow.omittedCount, 0, "running low not omitted");

// Unit mismatch — keep full amount
const unitMismatch = applyPantryToShoppingList(
  [{ name: "Flour", quantity: 500, unit: "g" }],
  [{ name: "Flour", quantity: 1, unit: "kg" }],
);
assertEqual(unitMismatch.items.length, 1, "unit mismatch keeps line");
assertEqual(unitMismatch.items[0]?.quantity, 500, "unit mismatch full qty");

console.log("applyPantryToShoppingList: all checks passed");
