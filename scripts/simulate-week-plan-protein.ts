/**
 * Simulate heuristic week planning for a user's library (read-only diagnostic).
 * Usage: npx tsx scripts/simulate-week-plan-protein.ts [week_start_date]
 */
import { loadEnvFiles } from "@/lib/supabase/loadEnv";
import { createServiceClient } from "@/lib/supabase/service";
import { fetchRecipeNutritionMap } from "@/lib/supabase/recipe-nutrition-query";
import {
  dailyCalorieBand,
  isWithinDailyCalorieBand,
} from "@/lib/planner/calorie-bands";
import {
  dayCaloriesFromRows,
  dayProteinFromRows,
  ensureDailySnackCoverage,
  plannerSlotSpecs,
  type PlanCalorieRow,
  type PlanRecipeMeta,
  tuneDayTowardCalorieBand,
} from "@/lib/planner/plan-calorie-tuning";
import { deriveNutritionTargets } from "@/lib/utils/nutrition-targets";
import { calorieGoalBiasFromProfile } from "@/lib/planner/plan-calorie-tuning";

loadEnvFiles();
const supabase = createServiceClient();

async function main() {
  const week = process.argv[2] ?? "2026-06-08";
  const { data: plan } = await supabase
    .from("meal_plans")
    .select("id,user_id")
    .eq("week_start_date", week)
    .maybeSingle();
  if (!plan) {
    console.log("No plan");
    return;
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", plan.user_id).single();
  const targets = deriveNutritionTargets(profile);
  const dailyCalorieTarget = targets.kcal;
  const dailyProteinTarget = targets.protein;
  const snackCountPerDay = dailyCalorieTarget >= 2200 ? 2 : 1;
  const goalBias = calorieGoalBiasFromProfile(profile);

  const { data: recipes } = await supabase.from("recipes").select("id,name").eq("user_id", plan.user_id);
  const { data: ings } = await supabase
    .from("recipe_ingredients")
    .select("recipe_id,name")
    .in("recipe_id", (recipes ?? []).map((r) => r.id));
  const namesById = new Map<string, string[]>();
  for (const i of ings ?? []) {
    const cur = namesById.get(i.recipe_id) ?? [];
    cur.push(i.name);
    namesById.set(i.recipe_id, cur);
  }
  const nmap = await fetchRecipeNutritionMap(supabase, (recipes ?? []).map((r) => r.id), {
    fillMissing: true,
  });
  const pool: PlanRecipeMeta[] = (recipes ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    calories: nmap.get(r.id)?.calories ?? 0,
    protein: nmap.get(r.id)?.protein_g ?? 0,
    ingredientNames: namesById.get(r.id) ?? [],
  }));

  const calById = new Map(pool.map((r) => [r.id, r.calories]));
  const proById = new Map(pool.map((r) => [r.id, r.protein]));
  const allowedIds = new Set(pool.map((r) => r.id));
  const mealPlanId = plan.id;
  const rows: PlanCalorieRow[] = [];

  // Simple greedy pick like heuristic (top protein/cal match per slot)
  const slotPlan = plannerSlotSpecs(snackCountPerDay);
  const bandMax = dailyCalorieBand(dailyCalorieTarget).max;
  for (let day = 0; day < 7; day += 1) {
    const usedOnDay = new Set<string>();
    let remaining = bandMax;
    for (const spec of slotPlan) {
      const target = dailyCalorieTarget * spec.calFrac;
      const candidates = pool
        .filter(
          (r) =>
            allowedIds.has(r.id) &&
            !usedOnDay.has(r.id) &&
            r.calories <= remaining &&
            r.calories <= target * 1.3,
        )
        .sort((a, b) => Math.abs(a.calories - target) - Math.abs(b.calories - target));
      const pick = candidates[0];
      if (!pick) continue;
      usedOnDay.add(pick.id);
      remaining -= pick.calories;
      rows.push({
        meal_plan_id: mealPlanId,
        recipe_id: pick.id,
        day_of_week: day,
        meal_type: spec.meal_type,
        slot_index: spec.slot_index,
        quick_add_name: null,
        quick_add_calories: null,
      });
    }
  }

  const tuneDay = (day: number) =>
    tuneDayTowardCalorieBand({
      rows,
      day,
      pool,
      calById,
      proById,
      mealPlanId,
      dailyTarget: dailyCalorieTarget,
      dailyProteinTarget,
      snackCountPerDay,
      allowedRecipeIds: allowedIds,
      goalBias,
      trimSnacksWhileOver: () => {},
      trimSnacksIfOverMacroCaps: () => {},
    });

  for (let day = 0; day < 7; day += 1) tuneDay(day);
  ensureDailySnackCoverage({
    rows,
    days: [0, 1, 2, 3, 4, 5, 6],
    pool,
    calById,
    mealPlanId,
    dailyTarget: dailyCalorieTarget,
    snackCountPerDay,
    allowedRecipeIds: allowedIds,
    tuneDay,
  });
  for (let day = 0; day < 7; day += 1) tuneDay(day);

  const band = dailyCalorieBand(dailyCalorieTarget);
  let sumP = 0;
  let sumK = 0;
  for (let day = 0; day < 7; day += 1) {
    const k = dayCaloriesFromRows(rows, day, calById);
    const p = dayProteinFromRows(rows, day, proById);
    sumK += k;
    sumP += p;
    const slots = rows.filter((r) => r.day_of_week === day);
    console.log(
      `Day ${day}: ${Math.round(p)}g P / ${Math.round(k)} kcal (${slots.length} slots, in band: ${isWithinDailyCalorieBand(k, dailyCalorieTarget)})`,
    );
  }
  console.log("\nSimulated week avg:", Math.round(sumP / 7), "g P,", Math.round(sumK / 7), "kcal");
  console.log("Target:", dailyProteinTarget, "g P,", dailyCalorieTarget, "kcal");
  console.log("Band:", band.min, "-", band.max);
}

main().catch(console.error);
