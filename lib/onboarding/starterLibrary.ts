import { randomInt } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { GoalContext } from "@/app/(app)/planner/ai-actions";
import {
  dietaryPreferencesToLegacyFlags,
  initialDietaryPreferencesFromProfile,
} from "@/lib/dietary/constraints";
import { firstRunLibraryCount } from "@/lib/onboarding/first-run";
import {
  hardConstraintsFromPreferences,
  planBulkFillBatch,
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
  const hard = hardConstraintsFromPreferences(initialDietaryPreferencesFromProfile(options.profile));
  const slots = planBulkFillBatch(
    firstRunLibraryCount(options.isPro),
    hard,
    randomInt(0, 0x7fff_fffe) >>> 0,
  );

  // One at a time: each draft is checked against the ones before it, which is
  // what keeps the set free of near-duplicates.
  const drafts: HybridRecipeDraft[] = [];
  for (const slot of slots) {
    const draft = await generateHybridRecipeDraft({
      slot,
      hard,
      targetDailyCalories: targets.kcal,
      targetDailyProtein: targets.protein,
      existing: EMPTY_LIBRARY,
      acceptedInBatch: drafts,
      useLlmMethod: false,
    });
    if (draft) drafts.push(draft);
  }

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
