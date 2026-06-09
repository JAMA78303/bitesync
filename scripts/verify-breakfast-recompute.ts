/**
 * Task 1 verification: breakfast recipe known to be wrong before CoFID banana fix.
 *
 * Usage (requires .env.local with service role):
 *   npx tsx scripts/verify-breakfast-recompute.ts
 *
 * Expected after real recompute: stored kcal ≈ 650–730 (not ~910).
 */
import { loadEnvFiles } from "@/lib/supabase/loadEnv";
import { createServiceClient } from "@/lib/supabase/service";
import { getRecipeNutritionTotals } from "@/lib/nutrition/recipeNutritionTotals";
import { setCofidLookupSupabase } from "@/lib/nutrition/cofidLookup";

const REFERENCE_BREAKFAST = [
  { name: "oats", quantity: 60, unit: "g" },
  { name: "banana", quantity: 100, unit: "g" },
  { name: "egg", quantity: 3, unit: "piece" },
  { name: "blueberries", quantity: 80, unit: "g" },
  { name: "olive oil", quantity: 10, unit: "ml" },
] as const;

function ingredientKey(name: string): string {
  return name.toLowerCase().trim();
}

async function main() {
  const freshOnly = process.argv.includes("--fresh-only");
  loadEnvFiles();

  let supabase: ReturnType<typeof createServiceClient> | null = null;
  try {
    supabase = createServiceClient();
    setCofidLookupSupabase(supabase);
  } catch {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
        "Add them to .env.local, then run: npm run verify:recompute",
    );
    process.exit(1);
  }

  const { totals: freshTotals } = await getRecipeNutritionTotals([...REFERENCE_BREAKFAST], {
    aiEnabled: false,
  });
  const freshKcal = Math.round(freshTotals.calories);
  console.log("Reference breakfast (current matcher, no DB):");
  console.log(`  Ingredients: oats 60g, banana 100g, 3 eggs, blueberries 80g, olive oil 10ml`);
  console.log(`  Fresh compute: ${freshKcal} kcal (expect ~650–730)\n`);

  if (freshOnly) {
    if (freshKcal > 850) {
      console.log("→ Matcher still computes ~910. Investigate CoFID banana match.");
      process.exitCode = 1;
    } else if (freshKcal < 620) {
      console.log("→ Fresh compute unexpectedly low. Investigate ingredient matching.");
      process.exitCode = 1;
    } else {
      console.log("→ Fresh compute verification PASSED.");
    }
    return;
  }

  const { data: ingredients, error: ingError } = await supabase
    .from("recipe_ingredients")
    .select("recipe_id, name, quantity, unit");

  if (ingError) {
    console.error("Could not load recipe_ingredients:", ingError.message);
    process.exit(1);
  }

  const refKeys = REFERENCE_BREAKFAST.map((i) => ingredientKey(i.name));
  const byRecipe = new Map<string, { name: string; quantity: number; unit: string }[]>();

  for (const row of ingredients ?? []) {
    const rid = String(row.recipe_id ?? "");
    if (!rid) continue;
    const list = byRecipe.get(rid) ?? [];
    list.push({
      name: String(row.name ?? ""),
      quantity: Number(row.quantity ?? 0),
      unit: String(row.unit ?? ""),
    });
    byRecipe.set(rid, list);
  }

  type Match = { recipeId: string; storedKcal: number | null; name: string };
  const matches: Match[] = [];

  for (const [recipeId, ings] of byRecipe) {
    const names = new Set(ings.map((i) => ingredientKey(i.name)));
    const hasAll = refKeys.every((k) => [...names].some((n) => n.includes(k) || k.includes(n)));
    if (!hasAll || ings.length < 4) continue;

    const { data: recipe } = await supabase.from("recipes").select("name, archived_at").eq("id", recipeId).maybeSingle();
    if (recipe?.archived_at) continue;

    const { data: nutrition } = await supabase
      .from("recipe_nutrition")
      .select("calories")
      .eq("recipe_id", recipeId)
      .maybeSingle();

    matches.push({
      recipeId,
      name: String(recipe?.name ?? "(unnamed)"),
      storedKcal: nutrition?.calories != null ? Math.round(Number(nutrition.calories)) : null,
    });
  }

  if (!matches.length) {
    console.log("No stored recipe found matching reference breakfast ingredients.");
    console.log("Fresh compute above still validates the matcher path.");
    return;
  }

  console.log("Matching recipes in database:");
  for (const m of matches) {
    const ok = m.storedKcal != null && m.storedKcal >= 620 && m.storedKcal <= 760;
    const flag = ok ? "OK" : m.storedKcal != null && m.storedKcal > 850 ? "STALE (~910?)" : "CHECK";
    console.log(`  [${flag}] ${m.name} · stored ${m.storedKcal ?? "?"} kcal · id ${m.recipeId}`);
  }

  const anyStale = matches.some((m) => m.storedKcal != null && m.storedKcal > 850);
  if (anyStale) {
    console.log("\n→ Stored kcal still high. Run: npm run recompute:macros");
    process.exitCode = 1;
  } else if (freshKcal > 850) {
    console.log("\n→ Matcher still computes ~910. Investigate CoFID banana match.");
    process.exitCode = 1;
  } else {
    console.log("\n→ Recompute verification PASSED (stored + fresh compute in expected range).");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
