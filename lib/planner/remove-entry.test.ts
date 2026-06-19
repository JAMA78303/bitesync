import {
  buildGridFromEntries,
  entriesAfterRemove,
  isValidPlannerGridEntry,
} from "@/lib/planner/build-grid";
import { sumDayNutritionFromEntries } from "@/lib/planner/weekly-macros";
import type { MealPlanEntry } from "@/types";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

function sampleEntry(overrides: Partial<MealPlanEntry> & Pick<MealPlanEntry, "id">): MealPlanEntry {
  return {
    meal_plan_id: "plan-1",
    recipe_id: "recipe-1",
    day_of_week: 0,
    meal_type: "lunch",
    slot_index: 0,
    quick_add_name: null,
    quick_add_calories: null,
    recipe: {
      id: "recipe-1",
      name: "Chicken Bowl",
      recipe_nutrition: {
        calories: 520,
        protein_g: 42,
        carbs_g: 45,
        fat_g: 18,
      },
    },
    ...overrides,
  };
}

// --- buildGrid guards ---
assert(!isValidPlannerGridEntry(sampleEntry({ id: "bad-day", day_of_week: 99 })), "day 99 invalid");
assert(!isValidPlannerGridEntry(sampleEntry({ id: "bad-meal", meal_type: "brunch" as MealPlanEntry["meal_type"] })), "bad meal type invalid");
assert(isValidPlannerGridEntry(sampleEntry({ id: "ok" })), "valid entry");

const badRow = sampleEntry({ id: "bad", day_of_week: 8 });
const gridWithBad = buildGridFromEntries([badRow, sampleEntry({ id: "good", day_of_week: 2, meal_type: "dinner" })]);
assert(gridWithBad[2]?.dinner?.id === "good", "grid skips bad row and keeps valid");
assert(gridWithBad[8] === undefined, "no grid bucket for invalid day");

// --- remove last item on a day → zero totals ---
const mondayOnly: MealPlanEntry[] = [
  sampleEntry({ id: "only", day_of_week: 1, meal_type: "breakfast" }),
];
const afterLast = entriesAfterRemove(mondayOnly, "only");
const emptyTotals = sumDayNutritionFromEntries(1, afterLast);
assert(emptyTotals.kcal === 0, "empty day kcal is 0");
assert(emptyTotals.protein === 0, "empty day protein is 0");
assert(!Number.isNaN(emptyTotals.kcal), "kcal not NaN");
assert(!Number.isNaN(emptyTotals.protein), "protein not NaN");

// --- day with snacks: remove one snack, others remain ---
const snackA = sampleEntry({
  id: "snack-a",
  day_of_week: 3,
  meal_type: "snack",
  slot_index: 0,
  recipe_id: "snack-recipe-a",
  recipe: {
    id: "snack-recipe-a",
    name: "Yogurt Pot",
    recipe_nutrition: { calories: 180, protein_g: 15, carbs_g: 12, fat_g: 6 },
  },
});
const snackB = sampleEntry({
  id: "snack-b",
  day_of_week: 3,
  meal_type: "snack",
  slot_index: 1,
  recipe_id: "snack-recipe-b",
  recipe: {
    id: "snack-recipe-b",
    name: "Banana PB",
    recipe_nutrition: { calories: 220, protein_g: 8, carbs_g: 24, fat_g: 12 },
  },
});
const lunch = sampleEntry({
  id: "lunch-d3",
  day_of_week: 3,
  meal_type: "lunch",
  slot_index: 0,
});
const dayWithSnacks = [snackA, snackB, lunch];
const afterSnackRemove = entriesAfterRemove(dayWithSnacks, "snack-a");
const snackTotals = sumDayNutritionFromEntries(3, afterSnackRemove);
assert(Math.round(snackTotals.kcal) === 740, `expected 740 kcal after one snack removed, got ${snackTotals.kcal}`);
assert(Math.round(snackTotals.protein) === 50, `expected 50g P, got ${snackTotals.protein}`);

// snack slot_index > 0 counts in day totals but not the grid's snack cell (PlannerGrid lists snacks from entries)
const gridAfterSnack = buildGridFromEntries(afterSnackRemove);
assert(gridAfterSnack[3]?.lunch?.id === "lunch-d3", "lunch still in grid");
assert(gridAfterSnack[3]?.snack === null, "grid snack cell empty after slot-0 snack removed");
const snacksLeft = afterSnackRemove.filter((e) => e.day_of_week === 3 && e.meal_type === "snack");
assert(snacksLeft.length === 1 && snacksLeft[0]!.id === "snack-b", "snack-b still listed for the day");

// --- remove main meal, snacks untouched ---
const afterLunchRemove = entriesAfterRemove(dayWithSnacks, "lunch-d3");
const totalsNoLunch = sumDayNutritionFromEntries(3, afterLunchRemove);
assert(Math.round(totalsNoLunch.kcal) === 400, `snacks only: 400 kcal, got ${totalsNoLunch.kcal}`);

console.log("remove-entry.test.ts: ok");
