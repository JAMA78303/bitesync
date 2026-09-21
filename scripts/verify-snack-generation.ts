/**
 * Acceptance check: bulk-fill snack slots actually produce coherent snacks.
 *
 *   npm run verify:snack-generation
 */

import { loadEnvFiles } from "@/lib/supabase/loadEnv";
import { createServiceClient } from "@/lib/supabase/service";
import { setCofidLookupSupabase } from "@/lib/nutrition/cofidLookup";
import { planBulkFillBatch } from "@/lib/recipes/bulkFillLibrary";
import { generateHybridRecipeDraft } from "@/lib/recipes/hybridRecipeEngine";
import {
  isRecipeAISnackAppropriate,
  SNACK_MAX_CALORIES,
  SNACK_MIN_CALORIES,
} from "@/lib/planner/meal-slot-eligibility";

const DAILY_TARGETS = [1600, 2200, 2800];

async function main() {
  loadEnvFiles();
  try {
    setCofidLookupSupabase(createServiceClient());
  } catch {
    console.error("Missing Supabase env — add .env.local then re-run.");
    process.exit(1);
  }
  const hard = {
    vegan: false,
    vegetarian: false,
    glutenFree: false,
    dairyFree: false,
    dietaryPreferences: [] as string[],
  };

  let snackSlots = 0;
  let generated = 0;
  const results: { label: string; name: string; kcal: number; ok: boolean }[] = [];

  for (const dailyTarget of DAILY_TARGETS) {
    const batch = planBulkFillBatch(10, hard, dailyTarget);
    const snacks = batch.filter((s) => s.mealSlot === "snack");
    snackSlots += snacks.length;

    const accepted: Awaited<ReturnType<typeof generateHybridRecipeDraft>>[] = [];
    for (const slot of snacks) {
      const draft = await generateHybridRecipeDraft({
        slot,
        hard,
        targetDailyCalories: dailyTarget,
        existing: { names: [], signatures: [] },
        acceptedInBatch: accepted.filter((d): d is NonNullable<typeof d> => d != null),
        useLlmMethod: false,
      });
      if (draft) {
        accepted.push(draft);
        generated += 1;
        const ok =
          draft.achievedCalories >= SNACK_MIN_CALORIES &&
          draft.achievedCalories <= SNACK_MAX_CALORIES &&
          isRecipeAISnackAppropriate(
            draft.achievedCalories,
            draft.ingredients.map((i) => i.name),
          );
        results.push({
          label: slot.label,
          name: draft.name,
          kcal: draft.achievedCalories,
          ok,
        });
      } else {
        results.push({ label: slot.label, name: "(failed)", kcal: 0, ok: false });
      }
    }
  }

  console.log(`Snack slots in bulk plan: ${snackSlots} (2 per batch × ${DAILY_TARGETS.length} targets)`);
  console.log(`Generated offline (no LLM): ${generated}/${snackSlots}\n`);

  for (const r of results) {
    const flag = r.ok ? "OK" : "FAIL";
    console.log(`  [${flag}] ${r.label}: ${r.name} — ${Math.round(r.kcal)} kcal`);
  }

  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    console.error(`\n${failed.length} snack(s) failed sizing or planner eligibility.`);
    process.exit(1);
  }
  console.log("\nAll snack slots produced planner-eligible snacks.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
