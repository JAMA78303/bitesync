import type { SupabaseClient } from "@supabase/supabase-js";
import { fractionForMealSlot } from "@/lib/ai/goal-matched-recipe";
import { dailyCalorieBand } from "@/lib/planner/calorie-bands";
import {
  dayCaloriesFromRows,
  poolHasSnackRecipes,
  type PlanCalorieRow,
  type PlanRecipeMeta,
} from "@/lib/planner/plan-calorie-tuning";
import { generateHybridRecipeDraft } from "@/lib/recipes/hybridRecipeEngine";
import { insertGeneratedRecipe } from "@/lib/recipes/saveGeneratedRecipe";
import { canCreateRecipe, getUserTier } from "@/lib/subscription";
import { initialDietaryPreferencesFromProfile } from "@/lib/dietary/constraints";
import type { MicroPriority } from "@/lib/nutrition/micro-rich-foods";
import type { ProfileForTargets } from "@/lib/utils/nutrition-targets";
import { hardConstraintsFromPreferences } from "@/lib/recipes/bulkFillLibrary";
import { SNACK_MAX_CALORIES, SNACK_MIN_CALORIES } from "@/lib/planner/meal-slot-eligibility";

export type PlannerSnackRecipe = PlanRecipeMeta;

/** Create a goal-matched snack recipe in the user's library when the pool has none. */
export async function createPlannerSnackRecipe(
  supabase: SupabaseClient,
  userId: string,
  dailyCalorieTarget: number,
  profile: ProfileForTargets,
  gapKcal: number,
  opts?: { attempt?: number; existingNames?: string[]; microPriorities?: MicroPriority[] },
): Promise<PlannerSnackRecipe | null> {
  const tier = await getUserTier();
  if (tier === "free") {
    const allowed = await canCreateRecipe();
    if (!allowed) return null;
  }

  const targetSnack = Math.min(
    SNACK_MAX_CALORIES,
    Math.max(SNACK_MIN_CALORIES, Math.round(gapKcal)),
  );
  const hard = hardConstraintsFromPreferences(initialDietaryPreferencesFromProfile(profile));
  const attempt = opts?.attempt ?? 0;
  const variantSeed = (Date.now() ^ gapKcal ^ Math.imul(attempt + 1, 0x9e3779b9)) >>> 0;
  const hybrid = await generateHybridRecipeDraft({
    slot: {
      slotId: `planner-snack-${variantSeed}`,
      mealSlot: "snack",
      label: "Snack",
      variantSeed,
      proteinAxis: hard.vegan ? "vegan" : hard.vegetarian ? "vegetarian" : "plant",
    },
    hard,
    targetDailyCalories: Math.round(targetSnack / fractionForMealSlot("snack")),
    existing: { names: opts?.existingNames ?? [], signatures: [] },
    acceptedInBatch: [],
    useLlmMethod: true,
    requireFullLlmRecipe: true,
  });

  let name: string;
  let description: string;
  let steps: string[];
  let ingredients;

  if (hybrid) {
    name = hybrid.name;
    description = hybrid.description;
    steps = hybrid.steps;
    ingredients = hybrid.ingredients;
  } else {
    // No LLM recipe — skip creating a raw-ingredient pile in the library.
    return null;
  }

  const inserted = await insertGeneratedRecipe(supabase, userId, {
    name,
    description,
    ingredients,
    steps,
    recipeSource: "ai",
    fitsVegetarian: hard.vegetarian ? true : null,
    fitsVegan: hard.vegan ? true : null,
    fitsGlutenFree: hard.glutenFree ? true : null,
  });

  if (!inserted) return null;

  const { data: nutrition } = await supabase
    .from("recipe_nutrition")
    .select("calories, protein_g")
    .eq("recipe_id", inserted.id)
    .maybeSingle();

  return {
    id: inserted.id,
    name,
    calories: Math.round(nutrition?.calories ?? targetSnack),
    protein: nutrition?.protein_g ?? 0,
    ingredientNames: ingredients.map((i) => i.name),
  };
}

/** When the library has no snacks but days are under band, auto-create snacks and re-tune. */
export async function autoFillSnackRecipesForPlan(opts: {
  supabase: SupabaseClient;
  userId: string;
  profile: ProfileForTargets;
  dailyTarget: number;
  days: number[];
  rows: PlanCalorieRow[];
  pool: PlanRecipeMeta[];
  calById: Map<string, number>;
  allowedRecipeIds: Set<string>;
  tuneDay: (day: number) => void;
  microPriorities?: MicroPriority[];
  /** When set, also create snacks so every day can carry this many snack slots. */
  snackCountPerDay?: number;
}): Promise<number> {
  if (poolHasSnackRecipes(opts.pool)) return 0;

  const band = dailyCalorieBand(opts.dailyTarget);
  const underDays = opts.days.filter(
    (d) => dayCaloriesFromRows(opts.rows, d, opts.calById) < band.min,
  );
  if (!underDays.length) return 0;

  const minDayCal = Math.min(
    ...underDays.map((d) => dayCaloriesFromRows(opts.rows, d, opts.calById)),
  );
  const gapKcal = Math.min(band.min - minDayCal, Math.round(opts.dailyTarget * 0.1));
  let created = 0;
  const createdNames: string[] = [];

  for (let i = 0; i < 2; i += 1) {
    const snack = await createPlannerSnackRecipe(
      opts.supabase,
      opts.userId,
      opts.dailyTarget,
      opts.profile,
      gapKcal,
      { attempt: i, existingNames: createdNames, microPriorities: opts.microPriorities },
    );
    if (!snack) break;
    createdNames.push(snack.name);

    opts.pool.push(snack);
    opts.calById.set(snack.id, snack.calories);
    opts.allowedRecipeIds.add(snack.id);
    created += 1;
  }

  if (created > 0) {
    for (const day of opts.days) {
      opts.tuneDay(day);
    }
  }

  return created;
}
