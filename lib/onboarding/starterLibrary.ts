import { randomInt } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { GoalContext } from "@/app/(app)/planner/ai-actions";
import {
  dietaryPreferencesToLegacyFlags,
  initialDietaryPreferencesFromProfile,
} from "@/lib/dietary/constraints";
import { firstRunLibraryCount } from "@/lib/onboarding/first-run";
import type { GoalMealSlot } from "@/lib/ai/goal-matched-recipe";
import { recipeMatchesPlannerSlot } from "@/lib/planner/meal-slot-eligibility";
import { readSnacksPerDay, resolveSnacksPerDay, type SnacksPerDay } from "@/lib/planner/snack-preference";
import {
  bulkFillMealTypeCountsExact,
  hardConstraintsFromPreferences,
  planBulkFillBatch,
  type BulkFillSlotPlan,
  type ExistingLibrarySnapshot,
} from "@/lib/recipes/bulkFillLibrary";
import { generateHybridRecipeDraft, type HybridRecipeDraft } from "@/lib/recipes/hybridRecipeEngine";
import { insertGeneratedRecipe } from "@/lib/recipes/saveGeneratedRecipe";
import {
  deriveNutritionTargets,
  getDailyCalorieTarget,
  getDailyProteinTarget,
  type ProfileForTargets,
} from "@/lib/utils/nutrition-targets";

/**
 * A starter recipe library, built instantly, so nobody's first look at the app
 * is an empty one.
 *
 * Of the eight people who got into the app between July and September, the two
 * who finished onboarding both planned a full week. The four who pressed "Skip
 * for now" planned nothing, and three of them had no recipes at all: step 2
 * asked them to wait a minute or two while recipes were generated, skipping
 * was one tap away, and skipping landed them on an empty planner.
 *
 * These come from the template engine only (useLlmMethod: false) — the same
 * compositions and computed nutrition as Fill my library, with template method
 * steps instead of written ones — so seeding takes seconds and costs nothing.
 * Pro users can still generate AI-written recipes on top.
 */

const EMPTY_LIBRARY: ExistingLibrarySnapshot = { names: [], signatures: [] };

/**
 * The planner never repeats a recipe within a day, so two snack slots a day
 * need at least two snacks, and three let the week rotate. The even split
 * gives a 10-recipe free set 3/3/2/2. The first paying customer (3026 kcal, so
 * two snacks a day by default) got two snack slots, and one of them came out
 * at 315 kcal, over the 300 kcal snack cap, so it never counted as a snack.
 * Every day of their week had one snack and an empty second slot.
 */
const MIN_SNACKS_FOR_TWO_A_DAY = 3;
/** Each meal type keeps at least this many recipes when snacks borrow from it. */
const MIN_PER_MEAL_TYPE = 2;

export function starterMealTypeCounts(total: number, snacksPerDay: SnacksPerDay): Record<GoalMealSlot, number> {
  const counts = { ...bulkFillMealTypeCountsExact(total) };
  if (snacksPerDay < 2) return counts;
  // Take from whichever of lunch and dinner has more (they share one pool of
  // mains in the planner), then breakfast — never below MIN_PER_MEAL_TYPE.
  while (counts.snack < MIN_SNACKS_FOR_TWO_A_DAY) {
    const donor = (["lunch", "dinner", "breakfast"] as const)
      .filter((t) => counts[t] > MIN_PER_MEAL_TYPE)
      .sort((a, b) => counts[b] - counts[a])[0];
    if (!donor) break;
    counts[donor] -= 1;
    counts.snack += 1;
  }
  return counts;
}

/** A snack the planner will actually put in a snack slot (size and kind). */
export function isUsableSnack(draft: Pick<HybridRecipeDraft, "name" | "ingredients" | "achievedCalories">): boolean {
  return recipeMatchesPlannerSlot(
    draft.name,
    draft.ingredients.map((i) => i.name),
    "snack",
    draft.achievedCalories,
  );
}

/** Snack slots get a few fresh seeds when the first composition is too big to be a snack. */
const SNACK_ATTEMPTS = 4;

function reseeded(slot: BulkFillSlotPlan, attempt: number): BulkFillSlotPlan {
  return attempt === 0 ? slot : { ...slot, variantSeed: (slot.variantSeed + attempt * 0x9e3779b1) >>> 0 };
}

/** Same floors Fill my library enforces before it will size a batch. */
const MIN_DAILY_KCAL = 800;
const MIN_DAILY_PROTEIN_G = 40;

/**
 * Daily targets to size the starter set to. Someone who skipped the targets
 * step has none, so this falls back to deriveNutritionTargets' defaults rather
 * than refusing — a library sized to typical targets beats an empty one.
 */
export function starterTargets(profile: ProfileForTargets | null): { kcal: number; protein: number } {
  const defaults = deriveNutritionTargets({});
  const t = deriveNutritionTargets(profile ?? {});
  return {
    kcal: Number.isFinite(t.kcal) && t.kcal >= MIN_DAILY_KCAL ? t.kcal : defaults.kcal,
    protein: Number.isFinite(t.protein) && t.protein >= MIN_DAILY_PROTEIN_G ? t.protein : defaults.protein,
  };
}

/**
 * Planner goals from the profile. Diet flags go through the preference list,
 * not the legacy booleans alone: onboarding's picker saves the list, and
 * dairy-free exists only there.
 */
export function goalsFromProfile(profile: ProfileForTargets | null): GoalContext {
  const flags = dietaryPreferencesToLegacyFlags(initialDietaryPreferencesFromProfile(profile));
  return {
    calorieTarget: getDailyCalorieTarget(profile ?? {}),
    proteinTarget: getDailyProteinTarget(profile ?? {}),
    ...flags,
  };
}

/**
 * The starter set's recipes, before anything is saved. Split into its own
 * function so it can be run offline against a real profile's targets.
 */
export async function buildStarterDrafts(opts: {
  total: number;
  snacksPerDay: SnacksPerDay;
  targets: { kcal: number; protein: number };
  hard: ReturnType<typeof hardConstraintsFromPreferences>;
  seed: number;
}): Promise<HybridRecipeDraft[]> {
  const slots = planBulkFillBatch(
    opts.total,
    opts.hard,
    opts.seed,
    starterMealTypeCounts(opts.total, opts.snacksPerDay),
  );

  // One at a time: each draft is checked against the ones before it, which is
  // what keeps the set free of near-duplicates.
  const drafts: HybridRecipeDraft[] = [];
  for (const slot of slots) {
    const attempts = slot.mealSlot === "snack" ? SNACK_ATTEMPTS : 1;
    let kept: HybridRecipeDraft | null = null;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const draft = await generateHybridRecipeDraft({
        slot: reseeded(slot, attempt),
        hard: opts.hard,
        targetDailyCalories: opts.targets.kcal,
        targetDailyProtein: opts.targets.protein,
        existing: EMPTY_LIBRARY,
        acceptedInBatch: drafts,
        useLlmMethod: false,
      });
      if (!draft) continue;
      kept = draft;
      if (slot.mealSlot !== "snack" || isUsableSnack(draft)) break;
    }
    // A snack that never came out snack-sized is still a recipe; keep it.
    if (kept) drafts.push(kept);
  }
  return drafts;
}

/**
 * Fills an empty library with the first-run starter set: 10 recipes on free
 * (its cap — the same end state as finishing step 2), 16 on Pro. Does nothing
 * if the user already has a recipe, so it is safe to call from every path.
 */
export async function seedStarterLibrary(
  supabase: SupabaseClient,
  userId: string,
  options: { profile: ProfileForTargets | null; isPro: boolean },
): Promise<{ seeded: number; names: string[] }> {
  const { count } = await supabase
    .from("recipes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("archived_at", null);
  if ((count ?? 0) > 0) return { seeded: 0, names: [] };

  const targets = starterTargets(options.profile);
  // The same snacks-per-day the planner will use for this user.
  const snacksPerDay = resolveSnacksPerDay(
    await readSnacksPerDay(supabase, userId),
    getDailyCalorieTarget(options.profile ?? {}),
  );
  const drafts = await buildStarterDrafts({
    total: firstRunLibraryCount(options.isPro),
    snacksPerDay,
    targets,
    hard: hardConstraintsFromPreferences(initialDietaryPreferencesFromProfile(options.profile)),
    seed: randomInt(0, 0x7fff_fffe) >>> 0,
  });

  const inserted = await Promise.all(
    drafts.map((d) =>
      insertGeneratedRecipe(supabase, userId, {
        name: d.name,
        description: d.description,
        ingredients: d.ingredients,
        steps: d.steps,
        recipeSource: "ai",
        fitsVegetarian: d.fitsVegetarian,
        fitsVegan: d.fitsVegan,
        fitsGlutenFree: d.fitsGlutenFree,
      }),
    ),
  );

  const names = drafts.filter((_, i) => inserted[i]).map((d) => d.name);
  return { seeded: names.length, names };
}
