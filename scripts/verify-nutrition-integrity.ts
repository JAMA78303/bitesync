/**
 * Read-only integrity audit of stored recipe nutrition.
 *
 * Every nutrition bug this codebase has hit was found by a human noticing an odd
 * number on a screen: ~100g of phantom almonds counted into a porridge, plant
 * milks resolving to dairy and then to whole nuts, 460g of potato priced as fried
 * chips, an imported recipe whose every quantity parsed as 1g.
 *
 * They share one signature: the stored macros stop describing the stored
 * ingredients. This recomputes each recipe through the SAME pipeline the app uses
 * at save time and reports where the two disagree, so that class of bug is caught
 * mechanically instead of by screenshot.
 *
 * Writes nothing. To repair what it finds, use `npm run recompute:macros`.
 *
 * Usage:
 *   npm run verify:nutrition-integrity
 *   npm run verify:nutrition-integrity -- --user-id=<uuid> --limit=500 --verbose
 */
import { loadEnvFiles } from "@/lib/supabase/loadEnv";
import { setCofidLookupSupabase } from "@/lib/nutrition/cofidLookup";
import { createServiceClient } from "@/lib/supabase/service";
import { getRecipeNutritionTotals } from "@/lib/nutrition/recipeNutritionTotals";
import type { RecipeIngredientInput } from "@/lib/nutrition/calculate";

/** Stored vs recomputed always differ a little; these separate noise from bugs. */
const DRIFT_WARN_PCT = 0.1;
const DRIFT_FAIL_PCT = 0.25;
const DRIFT_FAIL_MIN_KCAL = 200;
/** Atwater: protein/carbs 4 kcal/g, fat 9. Fibre and rounding explain ~10%. */
const ATWATER_WARN_PCT = 0.2;

type Severity = "fail" | "warn";

type Finding = {
  severity: Severity;
  recipe: string;
  issue: string;
  detail: string;
};

function parseArgs(argv: string[]) {
  const userArg = argv.find((a) => a.startsWith("--user-id="));
  const limitArg = argv.find((a) => a.startsWith("--limit="));
  return {
    userId: userArg?.split("=")[1]?.trim() || undefined,
    limit: limitArg ? Number(limitArg.split("=")[1]) : 1000,
    verbose: argv.includes("--verbose"),
  };
}

function pct(a: number, b: number): number {
  if (b === 0) return a === 0 ? 0 : 1;
  return Math.abs(a - b) / Math.abs(b);
}

async function main() {
  loadEnvFiles();
  const args = parseArgs(process.argv.slice(2));
  const supabase = createServiceClient();
  setCofidLookupSupabase(supabase);

  let recipeQuery = supabase
    .from("recipes")
    .select("id,name,user_id")
    .is("archived_at", null)
    .limit(args.limit);
  if (args.userId) recipeQuery = recipeQuery.eq("user_id", args.userId);

  const { data: recipes, error } = await recipeQuery;
  if (error) {
    console.error("Could not load recipes:", error.message);
    process.exit(1);
  }
  if (!recipes?.length) {
    console.log("No recipes to audit.");
    return;
  }

  const ids = recipes.map((r) => r.id as string);
  const [{ data: ingredientRows }, { data: nutritionRows }] = await Promise.all([
    supabase.from("recipe_ingredients").select("recipe_id,name,quantity,unit").in("recipe_id", ids),
    supabase
      .from("recipe_nutrition")
      .select("recipe_id,calories,protein_g,carbs_g,fat_g")
      .in("recipe_id", ids),
  ]);

  const byRecipe = new Map<string, RecipeIngredientInput[]>();
  for (const row of ingredientRows ?? []) {
    const list = byRecipe.get(row.recipe_id as string) ?? [];
    list.push({
      name: String(row.name ?? ""),
      quantity: Number(row.quantity ?? 0),
      unit: String(row.unit ?? "g"),
    });
    byRecipe.set(row.recipe_id as string, list);
  }
  const nutritionById = new Map(nutritionRows?.map((n) => [n.recipe_id as string, n]) ?? []);

  const findings: Finding[] = [];
  let audited = 0;

  for (const recipe of recipes) {
    const id = recipe.id as string;
    const name = String(recipe.name ?? "(unnamed)");
    const ingredients = byRecipe.get(id) ?? [];

    if (!ingredients.length) {
      findings.push({
        severity: "fail",
        recipe: name,
        issue: "no ingredients",
        detail: "recipe has no ingredient rows — nutrition cannot be verified",
      });
      continue;
    }

    // Every quantity parsing as 1 is the import-parser failure signature.
    if (ingredients.every((i) => i.quantity <= 1)) {
      findings.push({
        severity: "warn",
        recipe: name,
        issue: "placeholder quantities",
        detail: `all ${ingredients.length} ingredients are ≤1 — likely an import whose quantities failed to parse`,
      });
    }

    const stored = nutritionById.get(id);
    if (!stored) {
      findings.push({
        severity: "warn",
        recipe: name,
        issue: "no stored nutrition",
        detail: "recipe_nutrition row missing; the app will derive it on read",
      });
      continue;
    }

    const storedKcal = Number(stored.calories ?? 0);
    const { totals } = await getRecipeNutritionTotals(ingredients, { aiEnabled: false });
    audited += 1;

    const drift = pct(storedKcal, totals.calories);
    const absDrift = Math.abs(storedKcal - totals.calories);
    if (drift > DRIFT_FAIL_PCT && absDrift > DRIFT_FAIL_MIN_KCAL) {
      findings.push({
        severity: "fail",
        recipe: name,
        issue: "stored macros do not match ingredients",
        detail: `stored ${Math.round(storedKcal)} kcal vs ${Math.round(totals.calories)} from its ${ingredients.length} ingredients (${Math.round(drift * 100)}% out)`,
      });
    } else if (drift > DRIFT_WARN_PCT) {
      findings.push({
        severity: "warn",
        recipe: name,
        issue: "nutrition drift",
        detail: `stored ${Math.round(storedKcal)} kcal vs ${Math.round(totals.calories)} recomputed (${Math.round(drift * 100)}% out) — recompute to refresh`,
      });
    }

    // A recipe's own macros should reconcile to its own calorie figure.
    const atwater =
      Number(stored.protein_g ?? 0) * 4 + Number(stored.carbs_g ?? 0) * 4 + Number(stored.fat_g ?? 0) * 9;
    if (storedKcal > 0 && pct(atwater, storedKcal) > ATWATER_WARN_PCT) {
      findings.push({
        severity: "warn",
        recipe: name,
        issue: "macros inconsistent with calories",
        detail: `${Math.round(Number(stored.protein_g ?? 0))}p/${Math.round(Number(stored.carbs_g ?? 0))}c/${Math.round(Number(stored.fat_g ?? 0))}f implies ${Math.round(atwater)} kcal, stored says ${Math.round(storedKcal)}`,
      });
    }
  }

  const fails = findings.filter((f) => f.severity === "fail");
  const warns = findings.filter((f) => f.severity === "warn");

  console.log(`Audited ${audited} of ${recipes.length} recipes.\n`);

  for (const group of [fails, warns]) {
    if (!group.length) continue;
    const label = group[0]!.severity === "fail" ? "FAIL" : "WARN";
    for (const f of group) {
      console.log(`  ${label}  ${f.recipe} — ${f.issue}`);
      console.log(`        ${f.detail}`);
    }
    console.log("");
  }

  if (!findings.length) {
    console.log("✅ Every recipe's stored nutrition matches its ingredients.");
    return;
  }

  console.log(`${fails.length} failing, ${warns.length} warning.`);
  if (warns.length && !fails.length) {
    console.log("Warnings are usually stale values — run `npm run recompute:macros` to refresh.");
  }
  if (fails.length) {
    console.log("\nFailures mean stored macros describe ingredients the recipe does not contain.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
