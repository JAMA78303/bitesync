import assert from "node:assert/strict";
import { groceryShareText } from "./shareText";

const text = groceryShareText("5th Oct – 11th Oct, 2026", [
  { name: "olive oil", quantity: 1, unit: "bottle" },
  { name: "spinach", quantity: 200, unit: "g" },
  { name: "chicken breast", quantity: 500, unit: "g" },
]);
const lines = text.split("\n");

assert.equal(lines[0], "Grocery list");
assert.equal(lines[1], "5th Oct – 11th Oct, 2026");
// Groups in aisle order, each with a heading.
const headings = lines.filter((l) => /^[A-Z&\s]+$/.test(l) && l.trim());
assert.deepEqual(headings, ["FRUIT & VEG", "PROTEIN & DAIRY", "CUPBOARD"]);
assert.ok(lines.some((l) => l.startsWith("• ") && /spinach/i.test(l)));
assert.equal(lines.at(-1), "Planned with BiteSync · bitesync.io");

// Nothing to buy → just the title, week and sign-off.
assert.equal(groceryShareText("Week", []).split("\n").filter(Boolean).length, 3);

console.log("grocery share text tests passed");
