import { asksForNonDairy, isDairyIngredient } from "@/lib/dietary/dairy";
import { ingredientsForRole } from "@/lib/recipes/ingredientRoles";
import { microSnackCombosFor, MICRO_SNACK_COMBOS } from "@/lib/nutrition/micro-snack-combos";

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

for (const n of ["cottage cheese", "greek yoghurt", "cheddar cheese", "milk", "butter", "double cream", "Cheese, Caerphilly", "feta cheese"]) {
  assert(isDairyIngredient(n), `${n} is dairy`);
}
for (const n of ["oat milk", "almond milk", "coconut cream", "peanut butter", "almond butter", "soya yoghurt", "dairy-free cottage cheese alternative", "Milk, soya, non-dairy alternative to milk", "chicken breast", "eggs"]) {
  assert(!isDairyIngredient(n), `${n} is not dairy`);
}
assert(asksForNonDairy("dairy-free cottage cheese alternative") && asksForNonDairy("vegan cheese") && !asksForNonDairy("cottage cheese"), "asksForNonDairy");

// The template engine: a dairy-free user's protein and dairy slots carry no dairy —
// this is the pick that became "dairy-free cottage cheese alternative" at 375 kcal/100 g.
for (const role of ["protein", "dairy"] as const) {
  const offered = ingredientsForRole(role, { dairyFree: true }).map((d) => d.name);
  const leaked = offered.filter(isDairyIngredient);
  assert(leaked.length === 0, `dairy-free ${role} slot still offers: ${leaked.join(", ")}`);
  assert(offered.length > 0, `dairy-free ${role} slot should still have options`);
}
// …and plant milks still fill the milk slot.
assert(ingredientsForRole("dairy", { dairyFree: true }).some((d) => d.name === "oat milk"), "oat milk stays available dairy-free");

// The curated snack combos: none with dairy reaches a dairy-free user, for any nutrient.
for (const key of Object.keys(MICRO_SNACK_COMBOS)) {
  for (const combo of microSnackCombosFor(key, { vegan: false, vegetarian: false, glutenFree: false, dairyFree: true })) {
    const dairy = combo.ingredients.filter((i) => isDairyIngredient(i.name));
    assert(dairy.length === 0, `${key}: "${combo.name}" offered dairy-free but contains ${dairy.map((i) => i.name).join(", ")}`);
  }
}

console.log("dairy.test.ts: all assertions passed");
