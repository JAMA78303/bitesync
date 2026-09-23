import { fixMisplacedBreakfastRecipesForDay } from "@/app/(app)/planner/ai-actions";

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}
type Row = Parameters<typeof fixMisplacedBreakfastRecipesForDay>[0][number];
const pool = [
  { id: "oats", name: "Banana Overnight Oats", calories: 400, protein: 20, carbs_g: 0, fat_g: 0, ingredientNames: ["oats"], fits_vegetarian: null, fits_vegan: null, fits_gluten_free: null },
  { id: "porridge", name: "Orange Porridge", calories: 420, protein: 18, carbs_g: 0, fat_g: 0, ingredientNames: ["oats"], fits_vegetarian: null, fits_vegan: null, fits_gluten_free: null },
  { id: "curry", name: "Chicken Curry With Rice", calories: 700, protein: 45, carbs_g: 0, fat_g: 0, ingredientNames: ["chicken breast"], fits_vegetarian: null, fits_vegan: null, fits_gluten_free: null },
] as Parameters<typeof fixMisplacedBreakfastRecipesForDay>[2];

const row = (recipe_id: string, meal_type: Row["meal_type"]): Row => ({
  meal_plan_id: "p", recipe_id, day_of_week: 0, meal_type, slot_index: 0, quick_add_name: null, quick_add_calories: null,
});

// The hang: two breakfast dishes on one day, one of them in a main slot.
// Before the fix this swapped them back and forth until the platform killed it.
{
  const rows = [row("porridge", "breakfast"), row("oats", "lunch"), row("curry", "dinner")];
  fixMisplacedBreakfastRecipesForDay(rows, 0, pool);
  assert(rows.length === 3, "rows are not lost");
  assert(rows.some((r) => r.meal_type === "breakfast"), "breakfast slot still filled");
}

// A breakfast dish in a main slot is moved into an empty breakfast slot.
{
  const rows = [row("oats", "lunch"), row("curry", "dinner")];
  fixMisplacedBreakfastRecipesForDay(rows, 0, pool);
  const bf = rows.find((r) => r.meal_type === "breakfast");
  assert(bf?.recipe_id === "oats", `oats should move to breakfast, got ${bf?.recipe_id}`);
}

// A breakfast dish in a main slot swaps with a non-breakfast dish at breakfast.
{
  const rows = [row("curry", "breakfast"), row("oats", "lunch")];
  fixMisplacedBreakfastRecipesForDay(rows, 0, pool);
  assert(rows[0]!.recipe_id === "oats", "oats swap into breakfast");
  assert(rows[1]!.recipe_id === "curry", "curry swaps out to lunch");
}

// Nothing to do: a correct day is left alone.
{
  const rows = [row("oats", "breakfast"), row("curry", "dinner")];
  fixMisplacedBreakfastRecipesForDay(rows, 0, pool);
  assert(rows[0]!.recipe_id === "oats" && rows[1]!.recipe_id === "curry", "correct day unchanged");
}

// Three breakfast dishes on one day still terminates.
{
  const rows = [row("porridge", "breakfast"), row("oats", "lunch"), row("oats", "dinner")];
  fixMisplacedBreakfastRecipesForDay(rows, 0, pool);
  assert(rows.length === 3, "terminates with three breakfast dishes");
}

console.log("breakfast-fix.test.ts: all assertions passed");
