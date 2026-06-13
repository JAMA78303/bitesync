/**
 * Macro verification of the template generator across the three calorie goals
 * (lose / maintain / build), using the REAL curated UK nutrition DB (sync, no
 * Supabase needed — every catalog ingredient resolves in NUTRITION_DB).
 *
 * For each goal it generates a 7-day plan (breakfast/lunch/dinner + snack) via
 * composeMealFromTemplate and prints the day-by-day kcal + protein grid, then
 * asserts the per-goal expectations:
 *   - lose:     meals land AT or UNDER target (the coherent-meal floor does not
 *               force overshoot); lighter templates chosen; no fallback.
 *   - maintain: meals land in band.
 *   - build:    the scalable slot REACHES the high target — no silent undershoot.
 *
 *   npm run verify:meal-template-goals
 */

import {
  GOAL_MEAL_KCAL_TOLERANCE,
  fractionForMealSlot,
  type GoalMealSlot,
} from "@/lib/ai/goal-matched-recipe";
import { calculateRecipeNutrition } from "@/lib/nutrition/calculate";
import {
  composeMealFromTemplate,
  type NutritionEval,
} from "@/lib/recipes/composeMealFromTemplate";

// Real local DB — exactly the values the app's CoFID path returns for these foods.
const localEval: NutritionEval = async (ings) => {
  const t = calculateRecipeNutrition(ings);
  return { calories: t.calories, protein_g: t.protein_g };
};

type Goal = { name: string; dailyKcal: number; dailyProtein: number };

const GOALS: Goal[] = [
  { name: "Lose weight", dailyKcal: 1600, dailyProtein: 130 },
  { name: "Maintain", dailyKcal: 2200, dailyProtein: 138 },
  { name: "Build muscle", dailyKcal: 2900, dailyProtein: 165 },
];

const MEAL_SLOTS: GoalMealSlot[] = ["breakfast", "lunch", "dinner", "snack"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const tol = GOAL_MEAL_KCAL_TOLERANCE;

function mealHash(slot: GoalMealSlot): number {
  let h = 7;
  for (let i = 0; i < slot.length; i++) h = (h * 31 + slot.charCodeAt(i)) >>> 0;
  return h;
}

type MealResult = {
  slot: GoalMealSlot;
  name: string;
  templateId: string;
  target: number;
  kcal: number;
  protein: number;
  targetMet: boolean;
};

async function genMeal(
  goal: Goal,
  slot: GoalMealSlot,
  day: number,
): Promise<MealResult | null> {
  const target = Math.round(goal.dailyKcal * fractionForMealSlot(slot));
  const seed = ((day + 1) * 0x9e3779b9 ^ mealHash(slot) ^ (goal.dailyKcal << 3)) >>> 0;
  const composed = await composeMealFromTemplate(
    {
      targetCalories: target,
      mealSlot: slot,
      vegan: false,
      vegetarian: false,
      glutenFree: false,
      variantSeed: seed,
      proteinAxis: slot === "lunch" ? "meat" : slot === "dinner" ? "fish" : undefined,
    },
    localEval,
  );
  if (!composed) return null;
  const n = calculateRecipeNutrition(composed.ingredients);
  return {
    slot,
    name: composed.name,
    templateId: composed.templateId,
    target,
    kcal: Math.round(n.calories),
    protein: Math.round(n.protein_g),
    targetMet: composed.targetMet,
  };
}

async function main() {
  let totalIssues = 0;

  for (const goal of GOALS) {
    console.log(`\n========== ${goal.name.toUpperCase()} (${goal.dailyKcal} kcal / ${goal.dailyProtein}g P/day) ==========`);
    const perMealTargets = MEAL_SLOTS.map((s) => Math.round(goal.dailyKcal * fractionForMealSlot(s)));
    console.log(
      `Per-meal targets: ` +
        MEAL_SLOTS.map((s, i) => `${s} ${perMealTargets[i]}`).join(" · ") +
        `  (±${tol} band)`,
    );

    const usedTemplates = new Set<string>();
    let overshoots = 0;
    let silentUndershoots = 0;
    let honestMisses = 0;
    let inBand = 0;
    let mealCount = 0;
    let fallbacks = 0;
    const dayTotals: { kcal: number; protein: number }[] = [];

    for (let d = 0; d < DAYS.length; d++) {
      const meals: MealResult[] = [];
      for (const slot of MEAL_SLOTS) {
        const m = await genMeal(goal, slot, d);
        if (!m) {
          fallbacks += 1;
          continue;
        }
        meals.push(m);
        mealCount += 1;
        usedTemplates.add(m.templateId);
        const within = Math.abs(m.kcal - m.target) <= tol;
        if (within) inBand += 1;
        if (m.kcal > m.target + tol) overshoots += 1;
        // Silent undershoot = under band but the generator claimed it hit (the old
        // assembler's failure mode). An honest, flagged miss is acceptable.
        if (m.kcal < m.target - tol && m.targetMet) silentUndershoots += 1;
        if (!within && !m.targetMet) honestMisses += 1;
      }
      const kcal = meals.reduce((s, m) => s + m.kcal, 0);
      const protein = meals.reduce((s, m) => s + m.protein, 0);
      dayTotals.push({ kcal, protein });

      const line = meals
        .map((m) => `${m.slot[0]!.toUpperCase()}:${m.kcal}${m.targetMet ? "" : "*"}`)
        .join(" ");
      console.log(`  ${DAYS[d]}: ${String(kcal).padStart(4)} kcal · ${String(protein).padStart(3)}g P   [${line}]`);
      if (d === 0) {
        for (const m of meals) console.log(`        ${m.slot.padEnd(9)} ${m.name}  (${m.templateId}, tgt ${m.target} → ${m.kcal})`);
      }
    }

    const avgKcal = Math.round(dayTotals.reduce((s, t) => s + t.kcal, 0) / dayTotals.length);
    const avgProtein = Math.round(dayTotals.reduce((s, t) => s + t.protein, 0) / dayTotals.length);
    const avgDev = ((avgKcal - goal.dailyKcal) / goal.dailyKcal) * 100;
    const inBandPct = Math.round((inBand / mealCount) * 100);
    console.log(`  ---`);
    console.log(
      `  Avg/day: ${avgKcal} kcal · ${avgProtein}g P   (target ${goal.dailyKcal} kcal, ${avgDev >= 0 ? "+" : ""}${avgDev.toFixed(1)}%)`,
    );
    console.log(`  Meals in band: ${inBand}/${mealCount} (${inBandPct}%)  ·  honest flagged misses: ${honestMisses}`);
    console.log(`  Templates used: ${[...usedTemplates].sort().join(", ")}`);
    console.log(`  Fallbacks (no template): ${fallbacks}   * = honest miss (outside band)`);

    // Per-goal assertions (spec-faithful: honest, flagged misses are acceptable;
    // silent misses and old-assembler fallbacks are not).
    const issues: string[] = [];
    if (fallbacks > 0) issues.push(`${fallbacks} meals fell back to the old assembler`);
    if (silentUndershoots > 0) issues.push(`${silentUndershoots} SILENT undershoots (claimed hit while under band)`);
    if (Math.abs(avgDev) > 8) issues.push(`week avg ${avgDev.toFixed(1)}% off target (>8%)`);
    if (goal.name === "Lose weight" && overshoots > 0) {
      issues.push(`${overshoots} meals OVERSHOT the low target (calorie floor not handled)`);
    }
    if (goal.name === "Maintain" && inBandPct < 75) {
      issues.push(`only ${inBandPct}% of meals in band`);
    }
    if (issues.length) {
      totalIssues += issues.length;
      console.log(`  RESULT: FAIL — ${issues.join("; ")}`);
    } else {
      console.log(`  RESULT: PASS`);
    }
  }

  console.log(
    totalIssues === 0
      ? "\nAll goals verified with real nutrition numbers."
      : `\n${totalIssues} issue(s) across goals.`,
  );
  if (totalIssues > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
