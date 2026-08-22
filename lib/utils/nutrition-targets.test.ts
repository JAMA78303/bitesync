import { calculateBMR, calculateTDEE } from "@/lib/utils/tdee";
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


// Protein used to scale off TOTAL bodyweight at athlete multipliers regardless of
// activity, prescribing a 140kg sedentary man 308g/day (~1.5kg of chicken).
{
  const heavySedentary = deriveNutritionTargets({
    weight_kg: 140, height_cm: 178, age: 35, sex: "male",
    activity_level: "sedentary", goal: "lose",
    daily_calorie_target: null, daily_protein_target: null,
  } as never);
  if (heavySedentary.protein > 130) {
    throw new Error(`140kg sedentary protein should use adjusted bodyweight, got ${heavySedentary.protein}g`);
  }

  // A trained user at the same weight should still get materially more.
  const heavyActive = deriveNutritionTargets({
    weight_kg: 140, height_cm: 178, age: 35, sex: "male",
    activity_level: "extra_active", goal: "lose",
    daily_calorie_target: null, daily_protein_target: null,
  } as never);
  if (heavyActive.protein <= heavySedentary.protein) {
    throw new Error("activity level must raise the protein target");
  }
}

// Fat was squeezed by high protein with no floor — a 60kg woman losing weight got
// 33g (0.55 g/kg). Held at 0.6 g/kg, funded from carbohydrate.
{
  const lightFemale = deriveNutritionTargets({
    weight_kg: 60, height_cm: 165, age: 30, sex: "female",
    activity_level: "sedentary", goal: "lose",
    daily_calorie_target: null, daily_protein_target: null,
  } as never);
  const gPerKg = lightFemale.fat / 60;
  if (gPerKg < 0.59) {
    throw new Error(`fat floor breached: ${lightFemale.fat}g (${gPerKg.toFixed(2)} g/kg)`);
  }
}


// A flat ±500 meant very different things at different body sizes: a 32% deficit
// for a small sedentary woman and ~18% for a large man. Adjustments are now
// proportional to TDEE, so the same goal means the same thing to everyone.
{
  const small = deriveNutritionTargets({
    weight_kg: 60, height_cm: 165, age: 30, sex: "female",
    activity_level: "sedentary", goal: "lose",
    daily_calorie_target: null, daily_protein_target: null,
  } as never);
  const large = deriveNutritionTargets({
    weight_kg: 140, height_cm: 178, age: 35, sex: "male",
    activity_level: "sedentary", goal: "lose",
    daily_calorie_target: null, daily_protein_target: null,
  } as never);

  const smallBmr = calculateBMR(60, 165, 30, "female");
  const largeBmr = calculateBMR(140, 178, 35, "male");
  const smallPct = (calculateTDEE(smallBmr, "sedentary") - small.kcal) / calculateTDEE(smallBmr, "sedentary");
  const largePct = (calculateTDEE(largeBmr, "sedentary") - large.kcal) / calculateTDEE(largeBmr, "sedentary");

  if (Math.abs(smallPct - largePct) > 0.02) {
    throw new Error(
      `deficit should be proportional: ${(smallPct * 100).toFixed(0)}% vs ${(largePct * 100).toFixed(0)}%`,
    );
  }
  if (Math.abs(smallPct - 0.2) > 0.02) {
    throw new Error(`expected ~20% deficit, got ${(smallPct * 100).toFixed(0)}%`);
  }
}

// "Build muscle" should be a lean gain, not a bulk — the old +500 added fat
// beyond what the label promises.
{
  const bmr = calculateBMR(75, 178, 35, "male");
  const tdee = calculateTDEE(bmr, "extra_active");
  const gain = deriveNutritionTargets({
    weight_kg: 75, height_cm: 178, age: 35, sex: "male",
    activity_level: "extra_active", goal: "gain",
    daily_calorie_target: null, daily_protein_target: null,
  } as never);
  const surplus = gain.kcal - tdee;
  if (surplus < 200 || surplus > 400) {
    throw new Error(`lean-gain surplus should be ~250-350 kcal, got ${surplus}`);
  }
}

console.log("nutrition-targets.test.ts: ok");
