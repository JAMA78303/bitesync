import {
  fractionForMealSlot,
  mealLabel,
  type GoalMealSlot,
} from "@/lib/ai/goal-matched-recipe";
import { composeMealFromTemplate } from "@/lib/recipes/composeMealFromTemplate";
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
  excludeTemplateCountForAttempt,
  isDuplicateDraft,
  normalizeRecipeName,
  skipDuplicateChecks,
  type BulkFillSlotPlan,
  type ExistingLibrarySnapshot,
  type HardDietConstraints,
} from "@/lib/recipes/bulkFillLibrary";
import { inferDietLabelsFromIngredients } from "@/lib/recipes/inferDietLabels";
import {
  SNACK_MAX_CALORIES,
  SNACK_MIN_CALORIES,
} from "@/lib/planner/meal-slot-eligibility";
import { isIngredientPileSnack } from "@/lib/recipes/snackRecipeQuality";
import { stepsMentionUnlistedIngredients } from "@/lib/recipes/stepIngredientAlignment";
import { validateRecipeCoherence } from "@/lib/recipes/recipeCoherence";

export type HybridRecipeDraft = {
  name: string;
  description: string;
  steps: string[];
  ingredients: RecipeIngredientInput[];
  mealSlot: GoalMealSlot;
  targetMealCalories: number;
  targetMealProteinG?: number;
  achievedCalories: number;
  achievedProteinG: number;
  fitsVegetarian: boolean;
  fitsVegan: boolean;
  fitsGlutenFree: boolean;
  source: "db" | "db+llm";
  slotLabel: string;
  templateId?: string;
  /** True when variety rules were relaxed to fill the slot. */
  varietyRelaxed?: boolean;
  /** True when calories or protein still miss the per-meal target. */
  targetMiss?: boolean;
};

export type GenerateHybridRecipeInput = {
  slot: BulkFillSlotPlan;
  hard: HardDietConstraints;
  targetDailyCalories: number;
  targetDailyProtein?: number;
  existing: ExistingLibrarySnapshot;
  acceptedInBatch: HybridRecipeDraft[];
  useLlmMethod?: boolean;
  /** Snack slots only: bias ingredients toward foods rich in this nutrient key. */
  microFocusKey?: string;
  /** Planner snacks: only persist when the full LLM recipe (title + steps) succeeds. */
  requireFullLlmRecipe?: boolean;
};

const MAX_DEDUPE_RETRIES = 16;
const MAX_FORCE_FILL_ATTEMPTS = 10;
const MEAL_PROTEIN_FLOOR_RATIO = 0.95;

type DraftBuildContext = {
  slot: BulkFillSlotPlan;
  hard: HardDietConstraints;
  targetMealCalories: number;
  targetMealProteinG: number;
  dietaryLine: string;
  requireFullLlm: boolean;
  useLlmMethod: boolean;
  varietyRelaxed?: boolean;
};

async function finalizeDraft(
  ctx: DraftBuildContext,
  name: string,
  intro: string,
  steps: string[],
  ingredients: RecipeIngredientInput[],
  source: HybridRecipeDraft["source"],
  templateId?: string,
): Promise<HybridRecipeDraft | null> {
  const coherence = validateRecipeCoherence({ name, steps, ingredients });
  if (!coherence.ok) {
    console.warn(
      `[hybridRecipeEngine] coherence failed for "${name}": orphans=${coherence.orphanIngredients.join(",")} ${coherence.nameMismatch ?? ""}`,
    );
    return null;
  }

  if (
    ctx.slot.mealSlot === "snack" &&
    isIngredientPileSnack(name, ingredients, steps)
  ) {
    return null;
  }

  const description = formatDescriptionWithMethod(intro, steps);
  const { totals } = await getRecipeNutritionTotals(ingredients, { aiEnabled: true });
  const achievedCalories = Math.round(totals.calories * 10) / 10;
  const achievedProteinG = Math.round(totals.protein_g * 10) / 10;
  const inferred = inferDietLabelsFromIngredients(ingredients);

  const calMiss = Math.abs(achievedCalories - ctx.targetMealCalories) > 100;
  const proMiss =
    ctx.targetMealProteinG > 0 &&
    achievedProteinG < ctx.targetMealProteinG * MEAL_PROTEIN_FLOOR_RATIO;

  return {
    name,
    description,
    steps,
    ingredients,
    mealSlot: ctx.slot.mealSlot,
    targetMealCalories: ctx.targetMealCalories,
    targetMealProteinG: ctx.targetMealProteinG > 0 ? ctx.targetMealProteinG : undefined,
    achievedCalories,
    achievedProteinG,
    fitsVegetarian: inferred.fitsVegetarian,
    fitsVegan: inferred.fitsVegan,
    fitsGlutenFree: inferred.fitsGlutenFree,
    source,
    slotLabel: ctx.slot.label,
    templateId,
    varietyRelaxed: ctx.varietyRelaxed,
    targetMiss: calMiss || proMiss,
  };
}

async function buildDraftFromIngredients(
  ctx: DraftBuildContext,
  ingredients: RecipeIngredientInput[],
  composedName: string,
  templateId?: string,
): Promise<HybridRecipeDraft | null> {
  let name = composedName;
  const templateSteps = buildMethodStepsFromIngredients(ingredients, ctx.slot.mealSlot);
  let intro = `A balanced ${mealLabel(ctx.slot.mealSlot).toLowerCase()} built from your nutrition targets and UK-style portions.`;
  let steps = templateSteps;
  let source: HybridRecipeDraft["source"] = "db";
  let workingIngredients = ingredients;
  let fullLlmRecipe = false;

  function isCoherent(recipeName: string, recipeSteps: string[], ings: RecipeIngredientInput[]): boolean {
    if (stepsMentionUnlistedIngredients(recipeSteps, ings)) return false;
    return validateRecipeCoherence({ name: recipeName, steps: recipeSteps, ingredients: ings }).ok;
  }

  if (ctx.useLlmMethod) {
    const full = await generateFullRecipeFromIngredients({
      mealSlot: ctx.slot.mealSlot,
      seedIngredients: ingredients,
      targetCalories: ctx.targetMealCalories,
      dietaryConstraintsLine: ctx.dietaryLine,
      bannedIngredientTerms: [],
    });
    if (full && isCoherent(full.title, full.steps, full.ingredients)) {
      name = full.title;
      intro = full.description;
      steps = full.steps;
      workingIngredients = full.ingredients;
      source = "db+llm";
      fullLlmRecipe = true;
    } else if (full && isCoherent(full.title, templateSteps, full.ingredients)) {
      name = full.title;
      intro = full.description;
      steps = templateSteps;
      workingIngredients = full.ingredients;
      source = "db+llm";
      fullLlmRecipe = true;
    } else if (!ctx.requireFullLlm) {
      const llm = await generateRecipeMethodWithLLM(
        name,
        ingredients,
        ctx.slot.mealSlot,
        ctx.dietaryLine,
      );
      if (llm && isCoherent(name, llm.steps, ingredients)) {
        intro = llm.description;
        steps = llm.steps;
        source = "db+llm";
      }
    }
  }

  if (!isCoherent(name, steps, workingIngredients) && isCoherent(composedName, templateSteps, ingredients)) {
    name = composedName;
    steps = templateSteps;
    workingIngredients = ingredients;
    source = "db";
  }

  if (!isCoherent(name, steps, workingIngredients)) {
    return null;
  }

  if (ctx.requireFullLlm && !fullLlmRecipe) {
    return null;
  }

  return finalizeDraft(ctx, name, intro, steps, workingIngredients, source, templateId);
}

function uniqueTitle(name: string, attempt: number): string {
  if (attempt <= 0) return name;
  return `${name} (${attempt + 1})`;
}

/**
 * Hybrid recipe engine: nutrition DB templates first, optional LLM for method copy.
 * Single entry point for goal-matched draft and bulk fill library.
 */
export async function generateHybridRecipeDraft(
  input: GenerateHybridRecipeInput,
): Promise<HybridRecipeDraft | null> {
  const flags = dietFlagsForSlot(input.slot, input.hard);
  const fraction = fractionForMealSlot(input.slot.mealSlot);
  const rawTarget = Math.round(input.targetDailyCalories * fraction);
  const targetMealCalories =
    input.slot.mealSlot === "snack"
      ? Math.min(SNACK_MAX_CALORIES, Math.max(SNACK_MIN_CALORIES, rawTarget))
      : rawTarget;
  const targetMealProteinG = input.targetDailyProtein
    ? Math.round(input.targetDailyProtein * fraction)
    : 0;

  const requireFullLlm = input.requireFullLlmRecipe ?? false;
  const useLlmMethod = input.useLlmMethod !== false;

  const dietaryLine = buildDietaryConstraints(input.hard.dietaryPreferences);
  const bannedTitles = [
    ...input.existing.names,
    ...input.acceptedInBatch.map((d) => d.name),
  ];
  const allExcludeTemplateIds = input.acceptedInBatch
    .map((d) => d.templateId)
    .filter((id): id is string => Boolean(id));

  const buildCtx: DraftBuildContext = {
    slot: input.slot,
    hard: input.hard,
    targetMealCalories,
    targetMealProteinG,
    dietaryLine,
    requireFullLlm,
    useLlmMethod,
  };

  for (let attempt = 0; attempt < MAX_DEDUPE_RETRIES; attempt++) {
    const variantSeed =
      (input.slot.variantSeed ^ (attempt * 0x517cc1b7) ^ (attempt << 12) ^ (attempt * 0x85ebca6b)) >>> 0;
    const excludeCount = excludeTemplateCountForAttempt(attempt, allExcludeTemplateIds.length);
    const excludeTemplateIds = allExcludeTemplateIds.slice(0, excludeCount);
    const relaxProteinAxis = attempt >= 8 && flags.proteinAxis != null;

    const composed = await composeMealFromTemplate({
      targetCalories: targetMealCalories,
      mealSlot: input.slot.mealSlot,
      vegan: flags.vegan,
      vegetarian: flags.vegetarian,
      glutenFree: flags.glutenFree,
      variantSeed,
      proteinAxis: relaxProteinAxis ? undefined : flags.proteinAxis,
      microFocusKey: input.microFocusKey,
      composedSnackOnly: input.slot.mealSlot === "snack",
      excludeTemplateIds,
    });
    if (!composed) continue;

    const draftCheck = { name: composed.name, ingredients: composed.ingredients };
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

    const draft = await buildDraftFromIngredients(
      buildCtx,
      composed.ingredients,
      composed.name,
      composed.templateId,
    );
    if (!draft) continue;

    const postLlmCheck = { name: draft.name, ingredients: draft.ingredients };
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

    if (
      targetMealProteinG > 0 &&
      draft.achievedProteinG < targetMealProteinG * MEAL_PROTEIN_FLOOR_RATIO &&
      attempt < MAX_DEDUPE_RETRIES - 2
    ) {
      continue;
    }

    return draft;
  }

  if (useLlmMethod) {
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
        const draft = await finalizeDraft(
          buildCtx,
          scratch.title,
          scratch.description,
          scratch.steps,
          scratch.ingredients,
          "db+llm",
        );
        if (draft) return draft;
      }
    }
  }

  // Graceful fallback: fill the slot even when uniqueness cannot be satisfied.
  for (let attempt = 0; attempt < MAX_FORCE_FILL_ATTEMPTS; attempt++) {
    const variantSeed =
      (input.slot.variantSeed ^ (attempt * 0x6c078965) ^ 0xa5a5a5a5 ^ (attempt << 8)) >>> 0;
    const composed = await composeMealFromTemplate({
      targetCalories: targetMealCalories,
      mealSlot: input.slot.mealSlot,
      vegan: flags.vegan,
      vegetarian: flags.vegetarian,
      glutenFree: flags.glutenFree,
      variantSeed,
      proteinAxis: attempt >= 4 ? undefined : flags.proteinAxis,
      microFocusKey: input.microFocusKey,
      composedSnackOnly: input.slot.mealSlot === "snack",
      excludeTemplateIds: attempt >= 2 ? [] : allExcludeTemplateIds.slice(0, 1),
    });
    if (!composed) continue;

    const fallbackCtx: DraftBuildContext = {
      ...buildCtx,
      varietyRelaxed: true,
      requireFullLlm: false,
    };

    let draft = await buildDraftFromIngredients(
      fallbackCtx,
      composed.ingredients,
      composed.name,
      composed.templateId,
    );
    if (!draft) continue;

    if (
      isDuplicateDraft(
        { name: draft.name, ingredients: draft.ingredients },
        input.existing,
        input.acceptedInBatch,
        attempt >= 6 ? skipDuplicateChecks() : { nameOnly: true },
      )
    ) {
      draft = await buildDraftFromIngredients(
        fallbackCtx,
        composed.ingredients,
        uniqueTitle(composed.name, attempt),
        composed.templateId,
      );
      if (!draft) continue;
    }

    return draft;
  }

  return null;
}
