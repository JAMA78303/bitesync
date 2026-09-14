/**
 * Score a real week plan from the database.
 *
 * Reads a user's plan for a given week and reports the things a planner is
 * supposed to get right: variety, calorie-band adherence, protein, snack
 * sanity and slot correctness. Built to compare the Claude planner against
 * the heuristic on identical input — the same library, targets and week —
 * which nothing else in the repo could do, since neither planner's output
 * was ever measured after it shipped.
 *
 * Read-only. Uses the service role from .env.local.
 *
 *   npx tsx scripts/score-week-plan.ts                 # busiest user, current week
 *   npx tsx scripts/score-week-plan.ts --user 8d31     # user id prefix
 *   npx tsx scripts/score-week-plan.ts --week 2026-09-14
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dailyCalorieBand, weekAvgCalorieBand } from "@/lib/planner/calorie-bands";
import {
  excludeFromMainMealSlots,
  recipeMatchesPlannerSlot,
  suitableForBreakfastSlot,
  SNACK_MAX_CALORIES,
  SNACK_MIN_CALORIES,
} from "@/lib/planner/meal-slot-eligibility";
import { MACRO_CAP_MAX_RATIO, proteinFloorForTarget } from "@/lib/planner/plan-calorie-tuning";
import { fetchRecipeNutritionMap } from "@/lib/supabase/recipe-nutrition-query";
import { normalizeRecipeNutritionEmbed, type RecipeNutritionSummary } from "@/lib/utils/recipe-nutrition";
import { getMonday, toLocalISO } from "@/lib/utils/dates";

// .env.local is not loaded by tsx; read the two keys we need without a dep.
function loadEnv(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    for (const line of readFileSync(".env.local", "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) out[m[1]!] = m[2]!.replace(/^["']|["']$/g, "");
    }
  } catch {
    /* fall through to process.env */
  }
  return { ...out, ...process.env } as Record<string, string>;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SERVICE_ROLE;
if (!url || !key) {
  console.error("Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
type Slot = "breakfast" | "lunch" | "dinner" | "snack";

type Entry = {
  day_of_week: number;
  meal_type: Slot;
  slot_index: number;
  recipe_id: string | null;
  quick_add_name: string | null;
  quick_add_calories: number | null;
};

type Recipe = { id: string; name: string; kcal: number; protein: number; ingredientNames: string[] };

async function resolveUser(prefix?: string): Promise<string> {
  const { data } = await supabase.from("meal_plans").select("user_id");
  const counts = new Map<string, number>();
  for (const p of data ?? []) counts.set(p.user_id, (counts.get(p.user_id) ?? 0) + 1);
  if (prefix) {
    const hit = [...counts.keys()].find((id) => id.startsWith(prefix));
    if (!hit) throw new Error(`No user with id starting ${prefix}`);
    return hit;
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]![0];
}

async function main() {
  const userId = await resolveUser(arg("--user"));
  const week = arg("--week") ?? toLocalISO(getMonday(new Date()));

  const { data: profile } = await supabase
    .from("profiles")
    .select("daily_calorie_target, daily_protein_target")
    .eq("id", userId)
    .maybeSingle();
  const kcalTarget = Number(profile?.daily_calorie_target ?? 0);
  const proteinTarget = Number(profile?.daily_protein_target ?? 0);
  if (!kcalTarget) throw new Error("User has no calorie target");
  const snackCountPerDay = kcalTarget >= 2200 ? 2 : 1;

  const { data: plan } = await supabase
    .from("meal_plans")
    .select("id")
    .eq("user_id", userId)
    .eq("week_start_date", week)
    .maybeSingle();
  if (!plan) throw new Error(`No plan for user ${userId.slice(0, 8)} on week ${week}`);

  const { data: entriesRaw } = await supabase
    .from("meal_plan_entries")
    .select("day_of_week, meal_type, slot_index, recipe_id, quick_add_name, quick_add_calories")
    .eq("meal_plan_id", plan.id);
  const entries = (entriesRaw ?? []) as Entry[];
  if (!entries.length) throw new Error("Plan has no entries");

  // Library = what the planner had to choose from, so variety is judged
  // against the possible, not the absolute.
  const { data: libraryRaw } = await supabase
    .from("recipes")
    .select("id, name")
    .eq("user_id", userId)
    .is("archived_at", null);
  const library = libraryRaw ?? [];
  const libIds = library.map((r) => r.id as string);

  const { data: ingRaw } = await supabase
    .from("recipe_ingredients")
    .select("recipe_id, name")
    .in("recipe_id", libIds);
  const ingredientsByRecipe = new Map<string, string[]>();
  for (const row of ingRaw ?? []) {
    const list = ingredientsByRecipe.get(row.recipe_id) ?? [];
    list.push(String(row.name));
    ingredientsByRecipe.set(row.recipe_id, list);
  }

  const nutrition = await fetchRecipeNutritionMap(supabase, libIds);
  const recipes = new Map<string, Recipe>();
  for (const r of library) {
    const n = normalizeRecipeNutritionEmbed(nutrition.get(r.id) as RecipeNutritionSummary | null | undefined);
    recipes.set(r.id, {
      id: r.id,
      name: r.name,
      kcal: Math.round(n?.calories ?? 0),
      protein: Math.round(n?.protein_g ?? 0),
      ingredientNames: ingredientsByRecipe.get(r.id) ?? [],
    });
  }

  // ---- scoring ----------------------------------------------------------

  const band = dailyCalorieBand(kcalTarget);
  const weekBand = weekAvgCalorieBand(kcalTarget);
  const proteinFloor = proteinTarget > 0 ? proteinFloorForTarget(proteinTarget) : 0;

  const uses = new Map<string, number>();
  const mainUses = new Map<string, number>();
  let recipeSlots = 0;
  const violations: string[] = [];
  const dayLines: string[] = [];
  let daysInBand = 0;
  let daysProteinOk = 0;
  let daysWithDup = 0;
  let missingMainSlots = 0;
  let missingSnackSlots = 0;
  let weekKcal = 0;

  for (let day = 0; day < 7; day += 1) {
    const rows = entries.filter((e) => e.day_of_week === day);
    let kcal = 0;
    let protein = 0;
    const seen = new Set<string>();
    let dup = false;

    for (const slot of ["breakfast", "lunch", "dinner"] as Slot[]) {
      if (!rows.some((e) => e.meal_type === slot)) {
        missingMainSlots += 1;
        violations.push(`${DAYS[day]}: ${slot} slot empty`);
      }
    }
    const snackRows = rows.filter((e) => e.meal_type === "snack");
    if (snackRows.length < snackCountPerDay) {
      missingSnackSlots += snackCountPerDay - snackRows.length;
    }

    for (const e of rows) {
      if (e.quick_add_name) {
        kcal += Number(e.quick_add_calories ?? 0);
        continue;
      }
      if (!e.recipe_id) continue;
      const r = recipes.get(e.recipe_id);
      if (!r) {
        violations.push(`${DAYS[day]}: ${e.meal_type} references a recipe not in the library`);
        continue;
      }
      recipeSlots += 1;
      kcal += r.kcal;
      protein += r.protein;
      uses.set(r.id, (uses.get(r.id) ?? 0) + 1);
      if (seen.has(r.id)) dup = true;
      seen.add(r.id);

      if (e.meal_type === "breakfast") {
        if (!suitableForBreakfastSlot(r.name, r.ingredientNames)) {
          violations.push(`${DAYS[day]}: breakfast is "${r.name}" (not a breakfast dish)`);
        }
      } else if (e.meal_type === "lunch" || e.meal_type === "dinner") {
        mainUses.set(r.id, (mainUses.get(r.id) ?? 0) + 1);
        if (excludeFromMainMealSlots(r.name, r.ingredientNames)) {
          violations.push(`${DAYS[day]}: ${e.meal_type} is "${r.name}" (breakfast/snack food in a main slot)`);
        }
      } else if (e.meal_type === "snack") {
        if (r.kcal < SNACK_MIN_CALORIES || r.kcal > SNACK_MAX_CALORIES) {
          violations.push(`${DAYS[day]}: snack "${r.name}" is ${r.kcal} kcal (cap ${SNACK_MIN_CALORIES}–${SNACK_MAX_CALORIES})`);
        } else if (!recipeMatchesPlannerSlot(r.name, r.ingredientNames, "snack", r.kcal)) {
          violations.push(`${DAYS[day]}: snack "${r.name}" is not snack-eligible`);
        }
      }
    }

    weekKcal += kcal;
    const inBand = kcal >= band.min && kcal <= band.max;
    // The tuner's contract: at least the 95% floor, at most the 125% cap.
    const proteinOk =
      proteinFloor === 0 || (protein >= proteinFloor && protein <= proteinTarget * MACRO_CAP_MAX_RATIO);
    if (inBand) daysInBand += 1;
    if (proteinOk) daysProteinOk += 1;
    if (dup) daysWithDup += 1;
    dayLines.push(
      `  ${DAYS[day]}: ${String(kcal).padStart(5)} kcal ${inBand ? "✓" : "✗"}  ${String(protein).padStart(3)}g P ${proteinOk ? "✓" : "✗"}${dup ? "  (same recipe twice)" : ""}`,
    );
  }

  const weekAvg = Math.round(weekKcal / 7);
  const distinct = uses.size;
  const maxUses = Math.max(0, ...uses.values());
  const mostUsed = [...uses.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const distinctMains = mainUses.size;
  const mainSlots = [...mainUses.values()].reduce((a, b) => a + b, 0);

  console.log(`\nWeek ${week} · user ${userId.slice(0, 8)} · library ${library.length} recipes`);
  console.log(`Targets: ${kcalTarget} kcal (band ${band.min}–${band.max}), ${proteinTarget}g protein (floor ${proteinFloor}), ${snackCountPerDay} snack/day`);
  console.log(`\nDays`);
  for (const l of dayLines) console.log(l);
  console.log(`\nCalories`);
  console.log(`  Days in band:      ${daysInBand}/7`);
  console.log(`  Week average:      ${weekAvg} kcal ${weekAvg >= weekBand.min && weekAvg <= weekBand.max ? "✓" : "✗"} (band ${weekBand.min}–${weekBand.max})`);
  console.log(`  Protein days ok:   ${daysProteinOk}/7`);
  console.log(`\nVariety`);
  console.log(`  Distinct recipes:  ${distinct} across ${recipeSlots} slots (${recipeSlots ? Math.round((distinct / recipeSlots) * 100) : 0}% unique)`);
  console.log(`  Distinct mains:    ${distinctMains} across ${mainSlots} main slots`);
  console.log(`  Most repeated:     ${mostUsed.map(([id, n]) => `"${recipes.get(id)?.name ?? id}" ×${n}`).join(", ") || "—"}`);
  console.log(`  Max uses of one:   ${maxUses}`);
  console.log(`  Days w/ duplicate: ${daysWithDup}/7`);
  console.log(`\nCoverage`);
  console.log(`  Empty main slots:  ${missingMainSlots}`);
  console.log(`  Missing snacks:    ${missingSnackSlots}`);
  console.log(`\nSlot / snack violations: ${violations.length}`);
  for (const v of violations) console.log(`  • ${v}`);
  console.log("");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
