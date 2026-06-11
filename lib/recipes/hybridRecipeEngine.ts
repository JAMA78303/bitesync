import {
  buildGoalMatchedRecipeIngredients,
  buildGoalMatchedRecipeTitle,
  fractionForMealSlot,
  mealLabel,
  type GoalMealSlot,
} from "@/lib/ai/goal-matched-recipe";
import {
  generateFullRecipeForSlot,
  generateFullRecipeFromIngredients,
} from "@/lib/ai/generateFullRecipe";
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
  duplicateDraftOptsForAttempt,
  isDuplicateDraft,
  normalizeRecipeName,
  type BulkFillSlotPlan,
  type ExistingLibrarySnapshot,
  type HardDietConstraints,
} from "@/lib/recipes/bulkFillLibrary";
import { inferDietLabelsFromIngredients } from "@/lib/recipes/inferDietLabels";
import { isIngredientPileSnack } from "@/lib/recipes/snackRecipeQuality";
import { stepsMentionUnlistedIngredients } from "@/lib/recipes/stepIngredientAlignment";

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
  /** Snack slots only: bias ingredients toward foods rich in this nutrient key. */
  microFocusKey?: string;
  /** Planner snacks: only persist when the full LLM recipe (title + steps) succeeds. */
  requireFullLlmRecipe?: boolean;
};

const MAX_DEDUPE_RETRIES = 16;

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

  const requireFullLlm =
    input.requireFullLlmRecipe ?? input.slot.mealSlot === "snack";

  const dietaryLine = buildDietaryConstraints(input.hard.dietaryPreferences);
  const bannedTitles = [
    ...input.existing.names,
    ...input.acceptedInBatch.map((d) => d.name),
  ];

  for (let attempt = 0; attempt < MAX_DEDUPE_RETRIES; attempt++) {
    const variantSeed =
      (input.slot.variantSeed ^ (attempt * 0x517cc1b7) ^ (attempt << 12) ^ (attempt * 0x85ebca6b)) >>> 0;

    const ingredients = await buildGoalMatchedRecipeIngredients({
      targetCalories: targetMealCalories,
      mealSlot: input.slot.mealSlot,
      vegan: flags.vegan,
      vegetarian: flags.vegetarian,
      glutenFree: flags.glutenFree,
      variantSeed,
      proteinAxis: flags.proteinAxis,
      microFocusKey: input.slot.mealSlot === "snack" ? undefined : input.microFocusKey,
      composedSnackOnly: input.slot.mealSlot === "snack",
    });

    let name = buildGoalMatchedRecipeTitle(ingredients, input.slot.mealSlot);
    const draftCheck = { name, ingredients };
    if (
      isDuplicateDraft(
        draftCheck,
        input.existing,
        input.acceptedInBatch,
        duplicateDraftOptsForAttempt(attempt),
      )
    ) {
      continue;
    }

    let workingIngredients = ingredients;
    const templateSteps = buildMethodStepsFromIngredients(ingredients, input.slot.mealSlot);
    let intro = `A balanced ${mealLabel(input.slot.mealSlot).toLowerCase()} built from your nutrition targets and UK-style portions.`;
    let steps = templateSteps;
    let source: HybridRecipeDraft["source"] = "db";
    let fullLlmRecipe = false;

    if (input.useLlmMethod !== false) {
      const full = await generateFullRecipeFromIngredients({
        mealSlot: input.slot.mealSlot,
        seedIngredients: ingredients,
        targetCalories: targetMealCalories,
        dietaryConstraintsLine: dietaryLine,
        bannedIngredientTerms: [],
      });
      if (full && !stepsMentionUnlistedIngredients(full.steps, full.ingredients)) {
        name = full.title;
        intro = full.description;
        steps = full.steps;
        workingIngredients = full.ingredients;
        source = "db+llm";
        fullLlmRecipe = true;
      } else if (full && !stepsMentionUnlistedIngredients(templateSteps, ingredients)) {
        name = full.title;
        intro = full.description;
        steps = templateSteps;
        workingIngredients = full.ingredients;
        source = "db+llm";
        fullLlmRecipe = true;
      } else if (!requireFullLlm) {
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

    if (requireFullLlm && !fullLlmRecipe) {
      continue;
    }

    if (
      input.slot.mealSlot === "snack" &&
      isIngredientPileSnack(name, workingIngredients, steps)
    ) {
      continue;
    }

    const description = formatDescriptionWithMethod(intro, steps);
    const { totals } = await getRecipeNutritionTotals(workingIngredients, { aiEnabled: true });
    const inferred = inferDietLabelsFromIngredients(workingIngredients);

    const postLlmCheck = { name, ingredients: workingIngredients };
    if (
      isDuplicateDraft(
        postLlmCheck,
        input.existing,
        input.acceptedInBatch,
        duplicateDraftOptsForAttempt(attempt),
      )
    ) {
      continue;
    }

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

  if (input.useLlmMethod !== false) {
    const scratch = await generateFullRecipeForSlot({
      mealSlot: input.slot.mealSlot,
      targetCalories: targetMealCalories,
      dietaryConstraintsLine: dietaryLine,
      proteinAxis: input.slot.proteinAxis,
      bannedTitles,
      variantSeed: input.slot.variantSeed ^ 0xdeadbeef,
    });
    if (scratch) {
      const norm = normalizeRecipeName(scratch.title);
      const titleTaken =
        input.existing.names.some((n) => normalizeRecipeName(n) === norm) ||
        input.acceptedInBatch.some((d) => normalizeRecipeName(d.name) === norm);
      const pile =
        input.slot.mealSlot === "snack" &&
        isIngredientPileSnack(scratch.title, scratch.ingredients, scratch.steps);
      if (!titleTaken && !pile) {
        const description = formatDescriptionWithMethod(scratch.description, scratch.steps);
        const { totals } = await getRecipeNutritionTotals(scratch.ingredients, { aiEnabled: true });
        const inferred = inferDietLabelsFromIngredients(scratch.ingredients);
        return {
          name: scratch.title,
          description,
          steps: scratch.steps,
          ingredients: scratch.ingredients,
          mealSlot: input.slot.mealSlot,
          targetMealCalories,
          achievedCalories: Math.round(totals.calories * 10) / 10,
          achievedProteinG: Math.round(totals.protein_g * 10) / 10,
          fitsVegetarian: inferred.fitsVegetarian,
          fitsVegan: inferred.fitsVegan,
          fitsGlutenFree: inferred.fitsGlutenFree,
          source: "db+llm",
          slotLabel: input.slot.label,
        };
      }
    }
  }

  return null;
}
