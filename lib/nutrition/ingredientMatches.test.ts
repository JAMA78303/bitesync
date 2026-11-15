/**
 * Local nutrition DB, micronutrient and unit fixes for the wrong matches found
 * on 15 Nov 2026 while writing the high-protein vegetarian meal plan.
 * CoFID row choice is covered in cofidMatch.test.ts.
 */
import { toGrams } from "@/lib/nutrition/convert";
import { canonicalIngredientPhrase } from "@/lib/nutrition/ingredientPhrase";
import { lookupNutrition } from "@/lib/nutrition/lookup";
import { lookupMicros } from "@/lib/nutrition/micros";

function assert(condition: boolean, label: string): void {
  if (!condition) throw new Error(label);
}

function local(name: string) {
  const entry = lookupNutrition(name);
  if (!entry) throw new Error(`no local entry for "${name}"`);
  return entry;
}

// --- phrase canonicalisation ---
assert(canonicalIngredientPhrase("0% Greek yogurt") === "fat free greek yoghurt", "0% → fat free");
assert(canonicalIngredientPhrase("0% fat greek yoghurt") === "fat free greek yoghurt", "0% fat → fat free");
assert(canonicalIngredientPhrase("Fat-free Greek yoghurt") === "fat free greek yoghurt", "fat-free");
assert(canonicalIngredientPhrase("nonfat greek yogurt") === "fat free greek yoghurt", "nonfat");
assert(canonicalIngredientPhrase("low-fat yogurt") === "low fat yoghurt", "low-fat");
assert(canonicalIngredientPhrase("whole-wheat noodles") === "wholewheat noodles", "whole-wheat");
// A number with a % that isn't 0 is left alone.
assert(canonicalIngredientPhrase("10% fat mince") === "10% fat mince", "10% untouched");

// --- local nutrition DB ---
// Skyr was costed as halloumi (~320 kcal, 25 g fat per 100 g).
const skyr = local("skyr");
assert(skyr.per_100g.calories < 100 && skyr.per_100g.fat_g < 1 && skyr.per_100g.protein_g >= 9, "skyr is skyr");
assert(local("natural skyr").per_100g.calories < 100, "natural skyr");

// Black turtle beans are black beans.
assert(local("black turtle beans").name === local("black beans").name, "turtle beans → black beans");
assert(local("black beans").per_100g.calories < 160, "black beans as cooked/canned");

// Butter beans as bought canned, not dried raw (~290 kcal).
const butterBeans = local("butter beans");
assert(butterBeans.per_100g.calories < 150 && butterBeans.per_100g.fibre_g > 3, "butter beans canned");

// Rice cakes are puffed rice cakes, not raw rice or salted crackers.
const riceCakes = local("rice cakes");
assert(riceCakes.name === "rice cake", `rice cakes → ${riceCakes.name}`);
assert(Math.abs(riceCakes.per_100g.calories - 394) < 20, "rice cakes ~394 kcal");

// Wholemeal pitta was unmatched.
const pitta = local("wholemeal pitta");
assert(pitta.per_100g.fibre_g > 5 && pitta.typical_piece_g === 56, "wholemeal pitta");
assert(local("wholewheat pitta bread").name === pitta.name, "wholewheat pitta bread alias");

// Fat-free and low-fat Greek yoghurt keep their fat level.
for (const name of ["0% greek yoghurt", "fat-free greek yogurt", "0% fat greek yoghurt", "fat free greek style yoghurt"]) {
  const e = local(name);
  assert(e.per_100g.fat_g <= 0.5 && e.per_100g.protein_g >= 9, `${name} → ${e.name} (${e.per_100g.fat_g} g fat)`);
}
const lowFatGreek = local("low fat greek yoghurt");
assert(lowFatGreek.per_100g.fat_g <= 3 && lowFatGreek.per_100g.fat_g > 0.5, "low fat greek yoghurt");

// Frozen mixed berries had fibre 0.
assert(local("frozen mixed berries").per_100g.fibre_g > 2, "mixed berries fibre");

// Bean sprouts and frozen soya beans were raw broad beans.
assert(local("bean sprouts").per_100g.calories < 50, "bean sprouts");
assert(local("frozen soya beans").name === "edamame", "frozen soya beans → edamame");

// Wholewheat noodles were egg noodles; costed dry like other pasta.
const noodles = local("wholewheat noodles");
assert(noodles.per_100g.calories > 300 && noodles.per_100g.fibre_g > 8, "wholewheat noodles dry");
assert(local("whole-wheat noodles").name === noodles.name, "whole-wheat noodles");

// --- size words as units: "2 medium eggs" was unmatched ---
const medium = toGrams(2, "medium", "eggs");
const large = toGrams(2, "large", "eggs");
const small = toGrams(2, "small", "eggs");
assert(medium != null && Math.abs(medium - 116) < 1, `2 medium eggs = ${medium} g`);
assert(large != null && medium != null && large > medium, "large > medium");
assert(small != null && medium != null && small < medium, "small < medium");
assert(toGrams(1, "medium", "apple") != null, "1 medium apple");
assert(toGrams(1, "medium", "not a real food") == null, "size word with no piece weight stays unmatched");

// --- micronutrients ---
// Feta and cheddar had no vitamin and mineral data.
const feta = lookupMicros("feta");
assert(feta != null && feta.calcium_mg > 300, "feta micros");
const cheddar = lookupMicros("cheddar");
assert(cheddar != null && cheddar.calcium_mg > 600, "cheddar micros");

// Quorn: CoFID 0.3 µg B12 per 100 g, not 2.5.
const quorn = lookupMicros("quorn mince");
assert(quorn != null && quorn.vitamin_b12_mcg === 0.3, `quorn B12 ${quorn?.vitamin_b12_mcg}`);
assert(quorn != null && quorn.zinc_mg > 5, "quorn zinc");

// Meat-free names never borrow a meat or fish row.
for (const name of ["vegan mince", "vegetarian sausages", "meat-free chicken pieces"]) {
  const m = lookupMicros(name);
  assert(m == null || m.vitamin_b12_mcg < 1.5, `${name} took a meat row (B12 ${m?.vitamin_b12_mcg})`);
}

// Skyr and fat-free Greek yoghurt use the fat-free yoghurt row, not full-fat Greek.
for (const name of ["skyr", "0% greek yoghurt", "fat-free greek yogurt"]) {
  const m = lookupMicros(name);
  assert(m != null && m.saturated_fat_g < 0.5, `${name} saturated fat ${m?.saturated_fat_g}`);
}
const lowFat = lookupMicros("low fat greek yoghurt");
assert(lowFat != null && lowFat.saturated_fat_g < 1.5, "low fat greek yoghurt micros");

// Wholemeal pitta and black turtle beans have micros through their aliases.
assert(lookupMicros("wholemeal pitta") != null, "wholemeal pitta micros");
assert(lookupMicros("black turtle beans") != null, "black turtle beans micros");

console.log("ingredientMatches.test.ts: all assertions passed");
