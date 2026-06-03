import {
  computeNutritionTargetsFromProfile,
  deriveNutritionTargets,
  getDailyCalorieTarget,
  storedTargetsAreStale,
} from "@/lib/utils/nutrition-targets";

/** Profile shape matching the 2227 vs 2027 bug: gain goal, stale stored kcal. */
const profile = {
  weight_kg: 80,
  height_cm: 180,
  age: 30,
  sex: "male" as const,
  activity_level: "moderate",
  goal: "gain",
  daily_calorie_target: 2027,
  daily_protein_target: 122,
};

const computed = computeNutritionTargetsFromProfile(profile);
if (!computed) throw new Error("expected computed targets");

const derived = deriveNutritionTargets(profile);
const daily = getDailyCalorieTarget(profile);

if (derived.kcal !== computed.kcal) {
  throw new Error(`deriveNutritionTargets kcal ${derived.kcal} !== computed ${computed.kcal}`);
}
if (daily !== computed.kcal) {
  throw new Error(`getDailyCalorieTarget ${daily} !== computed ${computed.kcal}`);
}
if (derived.protein !== computed.protein) {
  throw new Error(`deriveNutritionTargets protein ${derived.protein} !== computed ${computed.protein}`);
}
if (!storedTargetsAreStale(profile)) {
  throw new Error("expected stale stored targets to be detected");
}
if (computed.kcal <= 2027) {
  throw new Error(`expected live target > stale 2027, got ${computed.kcal}`);
}

console.log(`OK: single source kcal=${computed.kcal}, protein=${computed.protein}, stale detected`);
