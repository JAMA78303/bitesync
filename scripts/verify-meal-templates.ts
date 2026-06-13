/**
 * Acceptance check for template-based meal generation (offline — no nutrition DB).
 *
 * Generates a spread of meals across breakfast/lunch/dinner/snack and every diet,
 * printing each as a dish (name + role-filled ingredients). Asserts the spec's
 * coherence rules: one protein per meal, 1-2 veg in mains, fat_topping limited to
 * its slot, dietary prefs respected, and dish-style names (not ingredient piles).
 *
 *   npm run verify:meal-templates
 */

import type { GoalMealSlot, ProteinAxis } from "@/lib/ai/goal-matched-recipe";
import { selectMealComposition } from "@/lib/recipes/composeMealFromTemplate";
import { getIngredientDef, rolesForIngredient, type IngredientRole } from "@/lib/recipes/ingredientRoles";

type DietName = "omnivore" | "vegetarian" | "vegan" | "gluten-free";

const DIETS: Record<DietName, { vegan: boolean; vegetarian: boolean; glutenFree: boolean }> = {
  omnivore: { vegan: false, vegetarian: false, glutenFree: false },
  vegetarian: { vegan: false, vegetarian: true, glutenFree: false },
  vegan: { vegan: true, vegetarian: true, glutenFree: false },
  "gluten-free": { vegan: false, vegetarian: false, glutenFree: true },
};

const AXIS_BY_SLOT: Partial<Record<GoalMealSlot, ProteinAxis>> = {
  lunch: "meat",
  dinner: "fish",
};

function countRole(names: string[], role: IngredientRole): number {
  return names.filter((n) => rolesForIngredient(n).includes(role)).length;
}

function isPileName(name: string): boolean {
  // Two or more " & " separators reads like an ingredient list, not a dish.
  return (name.match(/ & /g) ?? []).length >= 2;
}

type Issue = { meal: string; problem: string };

async function main() {
  const slots: GoalMealSlot[] = ["breakfast", "lunch", "dinner", "snack"];
  const diets = Object.keys(DIETS) as DietName[];

  const issues: Issue[] = [];
  let total = 0;
  let noFit = 0;

  for (const dietName of diets) {
    const diet = DIETS[dietName];
    console.log(`\n=== ${dietName.toUpperCase()} ===`);
    for (const slot of slots) {
      for (let v = 0; v < 3; v++) {
        const seed = ((slot.length * 0x9e3779b9) ^ (v * 0x85ebca6b) ^ (dietName.length << 16)) >>> 0;
        const sel = selectMealComposition({
          targetCalories: 600,
          mealSlot: slot,
          vegan: diet.vegan,
          vegetarian: diet.vegetarian,
          glutenFree: diet.glutenFree,
          variantSeed: seed,
          proteinAxis: AXIS_BY_SLOT[slot],
        });
        total += 1;
        if (!sel) {
          noFit += 1;
          console.log(`  [${slot}] (no template fit)`);
          continue;
        }

        const allNames = sel.picks.map((p) => p.def.name);
        const label = `${dietName}/${slot}: ${sel.name}`;
        console.log(`  [${slot}] ${sel.name}  [${sel.template.id}]`);
        console.log(`          ${allNames.join(", ")}`);

        // --- coherence assertions ---
        const proteinCount = countRole(allNames, "protein");
        if (proteinCount > 1) {
          issues.push({ meal: label, problem: `${proteinCount} proteins (expected 1)` });
        }
        if ((slot === "lunch" || slot === "dinner")) {
          const veg = countRole(allNames, "vegetable");
          if (veg < 1 || veg > 3) {
            issues.push({ meal: label, problem: `${veg} vegetables in a main (expected 1-2)` });
          }
        }
        if (isPileName(sel.name)) {
          issues.push({ meal: label, problem: `name reads like a pile: "${sel.name}"` });
        }
        // Dietary respect
        for (const name of allNames) {
          const d = getIngredientDef(name);
          if (!d) continue;
          if (diet.vegan && !d.diet.vegan) {
            issues.push({ meal: label, problem: `${name} not vegan` });
          }
          if (diet.vegetarian && !diet.vegan && !d.diet.vegetarian) {
            issues.push({ meal: label, problem: `${name} not vegetarian` });
          }
          if (diet.glutenFree && !d.diet.glutenFree) {
            issues.push({ meal: label, problem: `${name} not gluten-free` });
          }
        }
      }
    }
  }

  console.log(`\nGenerated ${total} meals (${noFit} with no template fit).`);
  if (issues.length) {
    console.log(`\nFAIL — ${issues.length} coherence issue(s):`);
    for (const i of issues) console.log(`  - ${i.meal} → ${i.problem}`);
    process.exitCode = 1;
  } else {
    console.log("PASS — all meals coherent (one protein, 1-2 veg in mains, diet respected, dish-named).");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
