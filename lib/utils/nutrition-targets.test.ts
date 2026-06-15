import {
  computeNutritionTargetsFromProfile,
  deriveNutritionTargets,
  macroTargetsKcalSum,
} from "./nutrition-targets";
import { calculateNutritionTargets, type Goal, type Sex } from "./tdee";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

function assertMacroSumWithinTwoPercent(kcal: number, protein: number, carbs: number, fat: number, label: string) {
  const sum = macroTargetsKcalSum({ protein, carbs, fat });
  const pctDiff = Math.abs(sum - kcal) / kcal;
  assert(
    pctDiff <= 0.02,
    `${label}: macro kcal sum ${sum} vs target ${kcal} (${(pctDiff * 100).toFixed(1)}% off)`,
  );
}

function macroSplitExample(kcal: number, protein: number) {
  const t = deriveNutritionTargets({
    daily_calorie_target: kcal,
    daily_protein_target: protein,
  });
  return { ...t, sum: macroTargetsKcalSum(t) };
}

// Spec example: 2834 kcal / 200g protein must not sum to 2428
const specExample = macroSplitExample(2834, 200);

assert(specExample.sum >= 2777, `2834/200g example sum ${specExample.sum} still too low (was 2428)`);
assert(specExample.sum <= 2891, `2834/200g example sum ${specExample.sum} overshoots`);
assert(specExample.carbs >= 300, `expected ~315g carbs, got ${specExample.carbs}`);
assert(specExample.fat >= 80, `expected ~86g fat, got ${specExample.fat}`);

const goals: Goal[] = ["lose", "maintain", "gain"];
const profiles = [
  { weight_kg: 62, height_cm: 165, age: 28, sex: "female" as Sex, activity_level: "light" },
  { weight_kg: 80, height_cm: 180, age: 30, sex: "male" as Sex, activity_level: "moderate" },
  { weight_kg: 100, height_cm: 188, age: 35, sex: "male" as Sex, activity_level: "active" },
];

for (const goal of goals) {
  for (const body of profiles) {
    const profile = { ...body, goal };
    const computed = computeNutritionTargetsFromProfile(profile);
    assert(computed != null, `expected targets for ${goal} ${body.sex}`);
    assertMacroSumWithinTwoPercent(
      computed!.kcal,
      computed!.protein,
      computed!.carbs,
      computed!.fat,
      `${goal} ${body.weight_kg}kg`,
    );

    const tdee = calculateNutritionTargets({
      weightKg: body.weight_kg,
      heightCm: body.height_cm,
      age: body.age,
      sex: body.sex,
      activityLevel: body.activity_level as "light" | "moderate" | "active",
      goal,
    });
    assert(computed!.kcal === tdee.dailyCalories, "kcal matches TDEE path");
    assert(computed!.protein === tdee.dailyProtein, "protein matches TDEE path");
  }
}

// Stored fallback path (no full TDEE profile)
for (const kcal of [1500, 2000, 2500, 2834, 3200]) {
  for (const protein of [100, 150, 200]) {
    const t = deriveNutritionTargets({ daily_calorie_target: kcal, daily_protein_target: protein });
    assertMacroSumWithinTwoPercent(t.kcal, t.protein, t.carbs, t.fat, `stored ${kcal}/${protein}g`);
  }
}

console.log("nutrition-targets.test.ts: ok");
