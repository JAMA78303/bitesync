import {
  bulkFillBatchSummary,
  bulkFillMealTypeCounts,
  defaultBulkRecipeCount,
  hardConstraintsFromPreferences,
  planBulkFillBatch,
  recipesPerMealType,
} from "@/lib/recipes/bulkFillLibrary";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(defaultBulkRecipeCount() === 28, "default is 28 (7 per type)");
assert(recipesPerMealType(28) === 7, "28 → 7 per type");
assert(recipesPerMealType(20) === 5, "20 → 5 per type");
assert(recipesPerMealType(40) === 10, "40 → 10 per type");

const hard = hardConstraintsFromPreferences([]);
const batch = planBulkFillBatch(28, hard, 42);
assert(batch.length === 28, "28 slots total");

const counts = bulkFillMealTypeCounts(28);
assert(counts.breakfast === 7 && counts.lunch === 7 && counts.dinner === 7 && counts.snack === 7, "even split");

const byType = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
for (const slot of batch) {
  byType[slot.mealSlot] += 1;
}
assert(byType.breakfast === 7, "7 breakfasts in batch");
assert(byType.lunch === 7, "7 lunches in batch");
assert(byType.dinner === 7, "7 dinners in batch");
assert(byType.snack === 7, "7 snacks in batch");

// Grouped by meal type — all breakfasts, then lunches, then dinners, then snacks.
// Interleaving left the review list shuffled, so users could not tell whether a
// meal type had enough depth without scanning the whole batch.
const order = batch.map((s) => s.mealSlot);
const MEAL_ORDER = ["breakfast", "lunch", "dinner", "snack"] as const;
const firstIndex = MEAL_ORDER.map((t) => order.indexOf(t));
assert(
  firstIndex.every((idx, i) => idx >= 0 && (i === 0 || idx > firstIndex[i - 1]!)),
  `meal types should appear in blocks, got ${order.join(",")}`,
);
for (const type of MEAL_ORDER) {
  const positions = order.map((t, i) => (t === type ? i : -1)).filter((i) => i >= 0);
  const contiguous = positions.every((p, i) => i === 0 || p === positions[i - 1]! + 1);
  assert(contiguous, `${type} slots should be contiguous, got ${positions.join(",")}`);
}

assert(bulkFillBatchSummary(28).includes("7 breakfast"), "summary mentions per-type counts");

console.log("bulkFillLibrary.test.ts: ok");
