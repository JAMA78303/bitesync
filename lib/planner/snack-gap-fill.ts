import type { SupabaseClient } from "@supabase/supabase-js";
import { fractionForMealSlot } from "@/lib/ai/goal-matched-recipe";
import { dailyCalorieBand } from "@/lib/planner/calorie-bands";
import {
  countPoolSnackRecipes,
  dayCaloriesFromRows,
  type PlanCalorieRow,
  type PlanRecipeMeta,
} from "@/lib/planner/plan-calorie-tuning";
import { generateHybridRecipeDraft } from "@/lib/recipes/hybridRecipeEngine";
import { insertGeneratedRecipe } from "@/lib/recipes/saveGeneratedRecipe";
import { canCreateRecipe, getUserTier } from "@/lib/subscription";
import { initialDietaryPreferencesFromProfile } from "@/lib/dietary/constraints";
import type { MicroPriority } from "@/lib/nutrition/micro-rich-foods";
import type { ProfileForTargets } from "@/lib/utils/nutrition-targets";
import { getDailyProteinTarget } from "@/lib/utils/nutrition-targets";
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
  const microPriorities = [...(opts?.microPriorities ?? [])].sort((a, b) => b.weight - a.weight);
  // Rotate through priority nutrients across attempts so a batch of snacks covers more than one gap.
  const microFocusKey = microPriorities.length
    ? microPriorities[attempt % microPriorities.length]?.key
    : undefined;
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
    targetDailyProtein: getDailyProteinTarget(profile) ?? undefined,
    existing: { names: opts?.existingNames ?? [], signatures: [] },
    acceptedInBatch: [],
    useLlmMethod: true,
    microFocusKey,
  });

  if (!hybrid) return null;

  const { name, description, steps, ingredients } = hybrid;

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
  // A day needs snackCountPerDay distinct snack recipes to fill every slot without
  // repeats — create the shortfall, not only when the library has zero snacks.
  const distinctSnacks = countPoolSnackRecipes(opts.pool);
  const wantSnacks = Math.max(1, opts.snackCountPerDay ?? 1);
  const snackShortfall = Math.max(0, wantSnacks - distinctSnacks);

  const band = dailyCalorieBand(opts.dailyTarget);
  const underDays = opts.days.filter(
    (d) => dayCaloriesFromRows(opts.rows, d, opts.calById) < band.min,
  );
  if (snackShortfall === 0 && !underDays.length) return 0;

  const minDayCal = underDays.length
    ? Math.min(...underDays.map((d) => dayCaloriesFromRows(opts.rows, d, opts.calById)))
    : opts.dailyTarget;
  const gapKcal = Math.max(
    SNACK_MIN_CALORIES,
    Math.min(band.min - minDayCal, Math.round(opts.dailyTarget * 0.1)),
  );
  const toCreate = Math.min(2, Math.max(snackShortfall, underDays.length ? 1 : 0));
  let created = 0;
  const createdNames: string[] = [];

  for (let i = 0; i < toCreate; i += 1) {
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
