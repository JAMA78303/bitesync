import type { GoalContext } from "@/lib/pricing/types";
import { buildDietaryConstraints } from "@/lib/dietary/constraints";

export { buildDietaryConstraints };

export function goalFirstBasketPrompt(params: {
  goals: GoalContext;
  recipeNames: string[];
  budgetCapGbp?: number;
  dietaryPreferences?: string[];
}): string {
  const dietaryLine = buildDietaryConstraints(params.dietaryPreferences ?? []);

  return [
    "You are a nutrition-conscious meal planning assistant.",
    "Generate a weekly grocery basket that prioritizes user goals first, then budget.",
    `Goals: calories=${params.goals.calorieTarget ?? "n/a"}, protein=${params.goals.proteinTarget ?? "n/a"}.`,
    `Diet flags: vegetarian=${params.goals.followsVegetarian}, vegan=${params.goals.followsVegan}, gluten_free=${params.goals.followsGlutenFree}, dairy_free=${params.goals.dairyFree ?? false}.`,
    `Allergens: ${(params.goals.allergens ?? []).join(", ") || "none"}.`,
    dietaryLine,
    `Budget cap GBP: ${params.budgetCapGbp ?? "not specified"}.`,
    `Candidate recipes: ${params.recipeNames.join(", ")}.`,
    "Return JSON only with meals[], ingredients[], rationale.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function substitutionPrompt(params: {
  goals: GoalContext;
  basketItems: string[];
  storeTotals: { store: string; total: number }[];
  dietaryPreferences?: string[];
}): string {
  const dietaryLine = buildDietaryConstraints(params.dietaryPreferences ?? []);

  return [
    "Suggest safe cost-saving substitutions for this basket.",
    "Hard constraints: never violate allergens or dietary flags.",
    "Do not reduce calories/protein below stated minimum targets.",
    `Diet flags: vegetarian=${params.goals.followsVegetarian}, vegan=${params.goals.followsVegan}, gluten_free=${params.goals.followsGlutenFree}, dairy_free=${params.goals.dairyFree ?? false}.`,
    `Allergens: ${(params.goals.allergens ?? []).join(", ") || "none"}.`,
    dietaryLine,
    `Targets: calories=${params.goals.calorieTarget ?? "n/a"}, protein=${params.goals.proteinTarget ?? "n/a"}.`,
    `Current basket items: ${params.basketItems.join(", ")}.`,
    `Store totals: ${params.storeTotals.map((s) => `${s.store}:£${s.total}`).join(" | ")}.`,
    "Return JSON with substitutions[{from,to,savings_gbp,macro_impact,safety_checks_passed,reason}]",
  ]
    .filter(Boolean)
    .join("\n");
}
