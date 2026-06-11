import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildGoalMatchedRecipeIngredients,
  buildGoalMatchedRecipeTitle,
  fractionForMealSlot,
} from "@/lib/ai/goal-matched-recipe";
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
  const variantSeed = (Date.now() ^ gapKcal) >>> 0;

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
    existing: { names: [], signatures: [] },
    acceptedInBatch: [],
    useLlmMethod: true,
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
    ingredients = await buildGoalMatchedRecipeIngredients({
      targetCalories: targetSnack,
      mealSlot: "snack",
      vegan: hard.vegan,
      vegetarian: hard.vegetarian,
      glutenFree: hard.glutenFree,
      variantSeed,
    });
    if (!ingredients.length) return null;
    name = buildGoalMatchedRecipeTitle(ingredients, "snack");
    description = "AI-generated snack to help hit your daily calorie target.";
    steps = [];
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
  const gapKcal = band.min - minDayCal;
  let created = 0;

  for (let i = 0; i < 2; i += 1) {
    const snack = await createPlannerSnackRecipe(
      opts.supabase,
      opts.userId,
      opts.dailyTarget,
      opts.profile,
      gapKcal,
    );
    if (!snack) break;

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
