import assert from "node:assert/strict";
import { applyFastingDays, planFastingDay, type FastingRecipe } from "@/lib/fasting/dayPlan";
import { dailyCalorieBand } from "@/lib/planner/calorie-bands";
import { PROTEIN_FLOOR_RATIO } from "@/lib/planner/plan-calorie-tuning";

/**
 * Spec, "Done when": daily protein is met across suhoor, iftar and the late
 * snack on 20 generated weeks. Each week is a different person (calorie and
 * protein targets from 1,500 to 3,200 kcal) with a different library, drawn
 * from a seeded random generator so the run is repeatable.
 */

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BREAKFASTS: [string, string[]][] = [
  ["Overnight oats with yoghurt", ["oats", "greek yoghurt", "milk", "blueberries"]],
  ["Peanut butter porridge", ["oats", "milk", "peanut butter", "banana"]],
  ["Scrambled eggs on wholemeal toast", ["eggs", "wholemeal bread", "spinach"]],
  ["Greek yoghurt bowl", ["greek yoghurt", "granola", "berries", "honey"]],
  ["Protein pancakes", ["oats", "eggs", "protein powder", "banana"]],
  ["Cottage cheese and fruit bowl", ["cottage cheese", "peach", "chia seeds"]],
  ["Egg and avocado toast", ["eggs", "avocado", "sourdough"]],
  ["Chia pudding", ["chia seeds", "almond milk", "mango"]],
];

const MAINS: [string, string[]][] = [
  ["Chicken biryani", ["chicken breast", "basmati rice", "onion", "yoghurt"]],
  ["Lamb kofta with rice", ["lamb mince", "rice", "onion", "parsley"]],
  ["Lentil soup with chicken", ["red lentils", "chicken thigh", "carrot", "cumin"]],
  ["Salmon with new potatoes", ["salmon fillet", "new potatoes", "green beans"]],
  ["Beef and vegetable stew", ["beef", "potato", "carrot", "stock"]],
  ["Chickpea and spinach curry", ["chickpeas", "spinach", "tomato", "rice"]],
  ["Turkey meatball pasta", ["turkey mince", "pasta", "tomato"]],
  ["Grilled chicken fattoush", ["chicken breast", "pitta", "cucumber", "tomato"]],
  ["Tuna pasta bake", ["tuna", "pasta", "cheddar", "sweetcorn"]],
  ["Prawn stir fry", ["prawns", "noodles", "pepper", "broccoli"]],
];

const SNACKS: [string, string[]][] = [
  ["Greek yoghurt with berries", ["greek yoghurt", "blueberries"]],
  ["Cottage cheese and pineapple", ["cottage cheese", "pineapple"]],
  ["Protein shake", ["whey protein", "milk", "banana"]],
  ["Hummus and carrot sticks", ["hummus", "carrot"]],
  ["Boiled eggs", ["eggs"]],
  ["Apple and almonds", ["apple", "almonds"]],
];

/**
 * A library sized for the person, as BiteSync's generated libraries are:
 * meals around 40% of the day's calories, with protein that goes with the
 * food (g per kcal) rather than drawn on its own.
 */
function library(seed: number, kcal: number): FastingRecipe[] {
  const r = rng(seed);
  const between = (lo: number, hi: number) => lo + (hi - lo) * r();
  const recipe = (prefix: string, [name, ingredientNames]: [string, string[]], i: number, k: number, gPerKcal: number) => ({
    id: `${prefix}${i}`,
    name,
    ingredientNames,
    calories: Math.round(k),
    protein: Math.round(k * gPerKcal),
  });
  return [
    ...BREAKFASTS.map((b, i) => recipe("b", b, i, kcal * 0.4 * between(0.6, 1.2), between(0.05, 0.1))),
    ...MAINS.map((m, i) => recipe("m", m, i, kcal * 0.4 * between(0.7, 1.3), between(0.05, 0.11))),
    ...SNACKS.map((s, i) => recipe("s", s, i, between(120, 290), between(0.03, 0.13))),
  ];
}

/** Whether any suhoor + iftar + up to two snacks meets protein within ±10% of calories (repeats allowed). */
function feasible(pool: FastingRecipe[], kcalTarget: number, proteinTarget: number): boolean {
  const b = pool.filter((x) => x.id.startsWith("b"));
  const m = pool.filter((x) => x.id.startsWith("m"));
  const s = pool.filter((x) => x.id.startsWith("s"));
  const snackSets: FastingRecipe[][] = [[]];
  s.forEach((x, i) => {
    snackSets.push([x]);
    s.slice(i + 1).forEach((y) => snackSets.push([x, y]));
  });
  return b.some((x) =>
    m.some((y) =>
      snackSets.some((set) => {
        const all = [x, y, ...set];
        const kcal = all.reduce((t, z) => t + z.calories, 0);
        const protein = all.reduce((t, z) => t + z.protein, 0);
        return protein >= proteinTarget * PROTEIN_FLOOR_RATIO && Math.abs(kcal - kcalTarget) / kcalTarget <= 0.1;
      }),
    ),
  );
}

type Row = { day_of_week: number; meal_type: string; slot_index: number; recipe_id: string | null };

let daysChecked = 0;
let daysInBand = 0;
let weeksFeasible = 0;
let weeksTried = 0;
for (let week = 0; weeksFeasible < 20 && week < 30; week += 1) {
  weeksTried += 1;
  const r = rng(1000 + week);
  const kcalTarget = Math.round(1500 + r() * 1700);
  const proteinTarget = Math.round(kcalTarget * (0.05 + r() * 0.025)); // 20–30% of calories
  const pool = library(week + 1, kcalTarget);
  const byId = new Map(pool.map((x) => [x.id, x]));
  // A library that can't reach the protein at all is the library's problem,
  // which the planner already warns about; only judge weeks that can.
  if (!feasible(pool, kcalTarget, proteinTarget)) continue;
  weeksFeasible += 1;

  // A normal week as the planner left it (lunch included), then Ramadan.
  const rows: Row[] = [];
  for (let day = 0; day < 7; day += 1) {
    rows.push({ day_of_week: day, meal_type: "breakfast", slot_index: 0, recipe_id: `b${day % 8}` });
    rows.push({ day_of_week: day, meal_type: "lunch", slot_index: 0, recipe_id: `m${day % 10}` });
    rows.push({ day_of_week: day, meal_type: "dinner", slot_index: 0, recipe_id: `m${(day + 3) % 10}` });
    rows.push({ day_of_week: day, meal_type: "snack", slot_index: 0, recipe_id: `s${day % 6}` });
  }
  const { unplanned } = applyFastingDays(rows, [0, 1, 2, 3, 4, 5, 6], {
    pool,
    kcalTarget,
    proteinTarget,
    makeRow: (pick, day) => ({ ...pick, day_of_week: day }),
  });
  assert.deepEqual(unplanned, [], `week ${week}: every day planned`);

  const band = dailyCalorieBand(kcalTarget);
  for (let day = 0; day < 7; day += 1) {
    const dayRows = rows.filter((x) => x.day_of_week === day);
    const count = (t: string) => dayRows.filter((x) => x.meal_type === t).length;
    assert.equal(count("lunch"), 0, `week ${week} day ${day}: no lunch while fasting`);
    assert.equal(count("breakfast"), 1, `week ${week} day ${day}: one suhoor`);
    assert.equal(count("dinner"), 1, `week ${week} day ${day}: one iftar`);
    assert.ok(count("snack") <= 2, `week ${week} day ${day}: at most two late snacks`);

    const recipes = dayRows.map((x) => byId.get(x.recipe_id!)!);
    const protein = recipes.reduce((t, x) => t + x.protein, 0);
    const kcal = recipes.reduce((t, x) => t + x.calories, 0);
    assert.ok(
      protein >= proteinTarget * PROTEIN_FLOOR_RATIO,
      `week ${week} day ${day}: protein ${protein}g vs target ${proteinTarget}g`,
    );
    assert.ok(Math.abs(kcal - kcalTarget) / kcalTarget <= 0.12, `week ${week} day ${day}: ${kcal} kcal vs ${kcalTarget}`);
    daysChecked += 1;
    if (kcal >= band.min && kcal <= band.max) daysInBand += 1;

    // No single meal carries it all: suhoor and iftar each bring a real share.
    const suhoor = byId.get(dayRows.find((x) => x.meal_type === "breakfast")!.recipe_id!)!;
    const iftar = byId.get(dayRows.find((x) => x.meal_type === "dinner")!.recipe_id!)!;
    assert.ok(suhoor.protein / protein >= 0.2, `week ${week} day ${day}: suhoor protein share`);
    assert.ok(iftar.protein / protein >= 0.2, `week ${week} day ${day}: iftar protein share`);
  }
  // The non-fasting rows of the week weren't touched (there are none here),
  // and every fasting day was rebuilt from the library.
  assert.equal(rows.length, rows.filter((x) => byId.has(x.recipe_id!)).length);
}
assert.equal(weeksFeasible, 20, "20 generated weeks checked");
assert.ok(weeksTried <= 24, `most generated libraries can reach their protein (${weeksTried} tried for 20)`);
assert.ok(daysInBand / daysChecked >= 0.85, `days inside the daily calorie band: ${daysInBand}/${daysChecked}`);

// Only some days fasting (Monday and Thursday): the others keep their meals.
{
  const pool = library(99, 2200);
  const rows: Row[] = [];
  for (let day = 0; day < 7; day += 1) {
    for (const meal of ["breakfast", "lunch", "dinner"]) {
      rows.push({ day_of_week: day, meal_type: meal, slot_index: 0, recipe_id: meal === "breakfast" ? "b0" : "m0" });
    }
  }
  const before = rows.filter((x) => x.day_of_week !== 0 && x.day_of_week !== 3).map((x) => JSON.stringify(x));
  applyFastingDays(rows, [3, 0], { pool, kcalTarget: 2200, proteinTarget: 140, makeRow: (p, d) => ({ ...p, day_of_week: d }) });
  const after = rows.filter((x) => x.day_of_week !== 0 && x.day_of_week !== 3).map((x) => JSON.stringify(x));
  assert.deepEqual(after.sort(), before.sort(), "normal days untouched");
  assert.equal(rows.filter((x) => x.day_of_week === 0 && x.meal_type === "lunch").length, 0);
  assert.equal(rows.filter((x) => x.day_of_week === 2 && x.meal_type === "lunch").length, 1);
}

// The AI planner's pick for the day is kept when it fits as well as anything else.
{
  const pool = library(7, 2000);
  const plain = planFastingDay({ pool, kcalTarget: 2000, proteinTarget: 120 })!;
  const iftarId = plain.picks.find((p) => p.meal_type === "dinner")!.recipe_id;
  const alternative = pool.find((x) => x.id.startsWith("m") && x.id !== iftarId)!;
  const withPreference = planFastingDay({
    pool: pool.map((x) => (x.id === alternative.id ? { ...x, calories: byIdOf(pool, iftarId).calories, protein: byIdOf(pool, iftarId).protein } : x)),
    kcalTarget: 2000,
    proteinTarget: 120,
    preferred: [alternative.id],
  })!;
  assert.equal(withPreference.picks.find((p) => p.meal_type === "dinner")!.recipe_id, alternative.id);
}
function byIdOf(pool: FastingRecipe[], id: string) {
  return pool.find((x) => x.id === id)!;
}

// A library with no breakfast-style recipe can't make a suhoor: the day is reported, not invented.
{
  const pool = library(3, 2000).filter((x) => !x.id.startsWith("b") && !x.id.startsWith("s"));
  const mainsOnly = pool.map((x) => ({ ...x, name: `${x.name} dinner` }));
  const rows: Row[] = [{ day_of_week: 0, meal_type: "lunch", slot_index: 0, recipe_id: "m1" }];
  const { unplanned } = applyFastingDays(rows, [0], {
    pool: mainsOnly.filter((x) => /biryani|kofta|stew/i.test(x.name)).map((x) => ({ ...x, ingredientNames: ["chicken breast", "rice"] })),
    kcalTarget: 2000,
    proteinTarget: 120,
    makeRow: (p, d) => ({ ...p, day_of_week: d }),
  });
  assert.deepEqual(unplanned, [0]);
  assert.equal(rows.length, 1, "left as it was");
}

console.log(
  `fasting day plan tests passed: 20 weeks (${weeksTried} libraries tried), protein met on all ${daysChecked} days, ` +
    `${daysInBand}/${daysChecked} inside the daily calorie band`,
);
