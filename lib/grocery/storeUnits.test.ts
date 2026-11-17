import assert from "node:assert/strict";
import { formatGroceryItem, getStoreUnit } from "./storeUnits";

const cases: [name: string, quantity: number, unit: string, shown: string][] = [
  // Packs counted from what the week needs, not always one.
  ["chopped tomatoes", 400, "g", "1 tin chopped tomatoes (400 g needed)"],
  ["chopped tomatoes", 800, "g", "2 tins chopped tomatoes (800 g needed)"],
  ["chopped tomatoes", 410, "g", "1 tin chopped tomatoes (410 g needed)"],
  ["chickpeas", 1200, "g", "3 tins chickpeas (1200 g needed)"],
  ["coconut milk", 800, "ml", "2 tins coconut milk (800 ml needed)"],
  ["rice", 2.5, "kg", "3 bags rice (2.5 kg needed)"],
  ["milk", 2400, "ml", "3 bottles milk (2400 ml needed)"],
  ["greek yogurt", 1250, "g", "3 tubs greek yogurt (1250 g needed)"],
  ["olive oil, extra virgin", 45, "ml", "1 bottle olive oil, extra virgin (45 ml needed)"],
  // Already in packs, or added by hand as a count.
  ["olive oil", 1, "bottle", "1 bottle olive oil"],
  ["tuna", 2, "can", "2 tins tuna"],
  ["tinned tomatoes", 2, "tins", "2 tins tinned tomatoes"],
  ["bread", 2, "loaf", "2 loaves bread"],
  ["milk", 2, "piece", "2 bottles milk"],
  ["tortilla wraps", 10, "piece", "2 packs tortilla wraps"],
  ["stock cube", 3, "piece", "1 box stock cube"],
  // Spoonfuls of something sold by weight: one jar when it plainly fits.
  ["smoked paprika", 5, "ml", "1 jar smoked paprika (5 ml needed)"],
  ["honey", 30, "ml", "1 jar honey (30 ml needed)"],
  ["maple syrup", 300, "g", "300 g maple syrup"],
  // Foods bought whole, counted, with proper plurals.
  ["red onion", 450, "g", "3 red onions"],
  ["red onions", 450, "g", "3 red onions"],
  ["tomatoes", 300, "g", "3 tomatoes"],
  ["eggs", 12, "piece", "12 eggs"],
  ["garlic", 2, "bulb", "2 garlic bulbs"],
  ["onion", 240, "ml", "240 ml onion"],
  // The more specific name wins over a food inside it.
  ["black pepper", 2, "ml", "1 jar black pepper (2 ml needed)"],
  ["garlic powder", 5, "ml", "1 jar garlic powder (5 ml needed)"],
  ["tomato paste", 140, "g", "1 tin tomato paste (140 g needed)"],
  // Not packs or whole foods: the amount as it is.
  ["chicken", 500, "g", "500 g chicken"],
  ["beef", 500, "g", "500 g beef"],
  ["flour tortillas", 8, "piece", "8 flour tortillas"],
  ["rice noodles", 300, "g", "300 g rice noodles"],
  ["egg noodles", 300, "g", "300 g egg noodles"],
  ["lemon juice", 30, "ml", "30 ml lemon juice"],
  ["fresh coriander", 20, "g", "20 g fresh coriander"],
  ["milk chocolate", 100, "g", "100 g milk chocolate"],
  ["chicken breast", 2, "pieces", "2 chicken breast"],
];

for (const [name, quantity, unit, shown] of cases) {
  assert.equal(formatGroceryItem(name, quantity, unit), shown, `${quantity} ${unit} ${name}`);
}

// No amount: just the name.
assert.equal(formatGroceryItem("washing-up liquid", undefined, undefined), "washing-up liquid");

// Packs match the food a name ends with, never a word inside another food's name.
assert.equal(getStoreUnit("brown rice")?.unit, "bag");
assert.equal(getStoreUnit("rice noodles"), null);
assert.equal(getStoreUnit("tomatoes"), null);
assert.equal(getStoreUnit("chicken"), null);

console.log("grocery store unit tests passed");
