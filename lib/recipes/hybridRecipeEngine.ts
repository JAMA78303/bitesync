import {
  buildGoalMatchedRecipeIngredients,
  buildGoalMatchedRecipeTitle,
  fractionForMealSlot,
  mealLabel,
  type GoalMealSlot,
} from "@/lib/ai/goal-matched-recipe";
import { generateFullRecipeFromIngredients } from "@/lib/ai/generateFullRecipe";
import { generateRecipeMethodWithLLM } from "@/lib/ai/generateRecipeMethod";
import { buildDietaryConstraints } from "@/lib/dietary/constraints";
import type { RecipeIngredientInput } from "@/lib/nutrition/calculate";
import { getRecipeNutritionTotals } from "@/lib/nutrition/recipeNutritionTotals";
import {
  buildMethodStepsFromIngredients,
  formatDescriptionWithMethod,
} from "@/lib/recipes/buildMethodSteps";
import {
  dietFlagsForSlot,
  isDuplicateDraft,
  type BulkFillSlotPlan,
  type ExistingLibrarySnapshot,
  type HardDietConstraints,
} from "@/lib/recipes/bulkFillLibrary";
import { inferDietLabelsFromIngredients } from "@/lib/recipes/inferDietLabels";

export type HybridRecipeDraft = {
  name: string;
  description: string;
  steps: string[];
  ingredients: RecipeIngredientInput[];
  mealSlot: GoalMealSlot;
  targetMealCalories: number;
  achievedCalories: number;
  achievedProteinG: number;
  fitsVegetarian: boolean;
  fitsVegan: boolean;
  fitsGlutenFree: boolean;
  source: "db" | "db+llm";
  slotLabel: string;
};

export type GenerateHybridRecipeInput = {
  slot: BulkFillSlotPlan;
  hard: HardDietConstraints;
  targetDailyCalories: number;
  existing: ExistingLibrarySnapshot;
  acceptedInBatch: HybridRecipeDraft[];
  useLlmMethod?: boolean;
};

const MAX_DEDUPE_RETRIES = 4;

/**
 * Hybrid recipe engine: nutrition DB templates first, optional LLM for method copy.
 * Single entry point for goal-matched draft and bulk fill library.
 */
export async function generateHybridRecipeDraft(
  input: GenerateHybridRecipeInput,
): Promise<HybridRecipeDraft | null> {
  const flags = dietFlagsForSlot(input.slot, input.hard);
  const fraction = fractionForMealSlot(input.slot.mealSlot);
  const targetMealCalories = Math.round(input.targetDailyCalories * fraction);

  for (let attempt = 0; attempt < MAX_DEDUPE_RETRIES; attempt++) {
    const variantSeed = (input.slot.variantSeed ^ (attempt * 0x517cc1b7)) >>> 0;

    const ingredients = await buildGoalMatchedRecipeIngredients({
      targetCalories: targetMealCalories,
      mealSlot: input.slot.mealSlot,
      vegan: flags.vegan,
      vegetarian: flags.vegetarian,
      glutenFree: flags.glutenFree,
      variantSeed,
      proteinAxis: flags.proteinAxis,
    });

    let name = buildGoalMatchedRecipeTitle(ingredients, input.slot.mealSlot);
    const draftCheck = { name, ingredients };
    if (
      isDuplicateDraft(draftCheck, input.existing, input.acceptedInBatch)
    ) {
      continue;
    }

    let workingIngredients = ingredients;
    const templateSteps = buildMethodStepsFromIngredients(ingredients, input.slot.mealSlot);
    let intro = `A balanced ${mealLabel(input.slot.mealSlot).toLowerCase()} built from your nutrition targets and UK-style portions.`;
    let steps = templateSteps;
    let source: HybridRecipeDraft["source"] = "db";

    if (input.useLlmMethod !== false) {
      const dietaryLine = buildDietaryConstraints(input.hard.dietaryPreferences);
      const full = await generateFullRecipeFromIngredients({
        mealSlot: input.slot.mealSlot,
        seedIngredients: ingredients,
        targetCalories: targetMealCalories,
        dietaryConstraintsLine: dietaryLine,
        bannedIngredientTerms: [],
      });
      if (full) {
        name = full.title;
        intro = full.description;
        steps = full.steps;
        workingIngredients = full.ingredients;
        source = "db+llm";
      } else {
        const llm = await generateRecipeMethodWithLLM(
          name,
          ingredients,
          input.slot.mealSlot,
          dietaryLine,
        );
        if (llm) {
          intro = llm.description;
          steps = llm.steps;
          source = "db+llm";
        }
      }
    }

    const description = formatDescriptionWithMethod(intro, steps);
    const { totals } = await getRecipeNutritionTotals(workingIngredients, { aiEnabled: true });
    const inferred = inferDietLabelsFromIngredients(workingIngredients);

    return {
      name,
      description,
      steps,
      ingredients: workingIngredients,
      mealSlot: input.slot.mealSlot,
      targetMealCalories,
      achievedCalories: Math.round(totals.calories * 10) / 10,
      achievedProteinG: Math.round(totals.protein_g * 10) / 10,
      fitsVegetarian: inferred.fitsVegetarian,
      fitsVegan: inferred.fitsVegan,
      fitsGlutenFree: inferred.fitsGlutenFree,
      source,
      slotLabel: input.slot.label,
    };
  }

  return null;
}
