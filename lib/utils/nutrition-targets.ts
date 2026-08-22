import {
  calculateNutritionTargetsWithSafety,
  type ActivityLevel,
  type Goal,
  type Sex,
  type TDEEFormValues,
} from "@/lib/utils/tdee";

export type UserNutritionTargets = {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
};

export type ProfileForTargets = {
  weight_kg?: number | null;
  height_cm?: number | null;
  age?: number | null;
  sex?: string | null;
  activity_level?: string | null;
  goal?: string | null;
  daily_calorie_target?: number | null;
  daily_protein_target?: number | null;
  dietary_preferences?: unknown;
  follows_vegetarian?: boolean | null;
  follows_vegan?: boolean | null;
  follows_gluten_free?: boolean | null;
} | null;

/** Carbs:fat kcal split of the budget left after protein (5:3 → 100% of remainder). */
const CARB_KCAL_SHARE = 0.5 / (0.5 + 0.3);
const FAT_KCAL_SHARE = 0.3 / (0.5 + 0.3);

function macroKcalSum(protein: number, carbs: number, fat: number): number {
  return protein * 4 + carbs * 4 + fat * 9;
}

function reconcileCarbFatRounding(kcal: number, protein: number, carbs: number, fat: number): { carbs: number; fat: number } {
  let c = carbs;
  let f = fat;
  let drift = kcal - macroKcalSum(protein, c, f);

  for (let delta = -3; delta <= 3; delta++) {
    const tryCarbs = Math.max(0, c + delta);
    const tryDrift = kcal - macroKcalSum(protein, tryCarbs, f);
    if (Math.abs(tryDrift) < Math.abs(drift)) {
      c = tryCarbs;
      drift = tryDrift;
    }
  }
  for (let delta = -2; delta <= 2; delta++) {
    const tryFat = Math.max(0, f + delta);
    const tryDrift = kcal - macroKcalSum(protein, c, tryFat);
    if (Math.abs(tryDrift) < Math.abs(drift)) {
      f = tryFat;
      drift = tryDrift;
    }
  }

  return { carbs: c, fat: f };
}

/**
 * Minimum dietary fat, g per kg bodyweight.
 *
 * The 5:3 carb:fat split runs on whatever is left after protein, so a high
 * protein target used to squeeze fat toward levels associated with hormonal
 * disruption — a 60kg woman losing weight was given 33g (0.55 g/kg) with nothing
 * stopping it going lower. Held at 0.6 g/kg, taking the shortfall from carbs.
 */
const MIN_FAT_G_PER_KG = 0.6;

function macroSplitFromKcalProtein(
  kcal: number,
  protein: number,
  weightKg?: number,
): Pick<UserNutritionTargets, "carbs" | "fat" | "fibre"> {
  const remaining = Math.max(0, kcal - protein * 4);
  let carbs = Math.round((remaining * CARB_KCAL_SHARE) / 4);
  let fat = Math.round((remaining * FAT_KCAL_SHARE) / 9);

  const fatFloor = weightKg && weightKg > 0 ? Math.round(weightKg * MIN_FAT_G_PER_KG) : 0;
  if (fatFloor > fat) {
    // Buy the extra fat with carbohydrate so the calorie total still holds.
    const extraKcal = (fatFloor - fat) * 9;
    fat = fatFloor;
    carbs = Math.max(0, carbs - Math.round(extraKcal / 4));
  }

  const rounded = reconcileCarbFatRounding(kcal, protein, carbs, fat);
  return { ...rounded, fibre: 30 };
}

/** kcal from protein/carbs/fat gram targets — used in tests and sanity checks. */
export function macroTargetsKcalSum(targets: Pick<UserNutritionTargets, "protein" | "carbs" | "fat">): number {
  return macroKcalSum(targets.protein, targets.carbs, targets.fat);
}

/** Profile has all inputs required to run the TDEE calculator. */
export function hasCompleteTdeeProfile(profile: ProfileForTargets): boolean {
  if (!profile) return false;
  const weight = Number(profile.weight_kg);
  const height = Number(profile.height_cm);
  const age = Number(profile.age);
  return (
    Number.isFinite(weight) &&
    weight >= 30 &&
    Number.isFinite(height) &&
    height >= 100 &&
    Number.isFinite(age) &&
    age >= 16 &&
    (profile.sex === "male" || profile.sex === "female") &&
    !!profile.activity_level &&
    !!profile.goal
  );
}

function profileToTdeeValues(profile: NonNullable<ProfileForTargets>): TDEEFormValues {
  return {
    weightKg: Number(profile.weight_kg),
    heightCm: Number(profile.height_cm),
    age: Number(profile.age),
    sex: profile.sex as Sex,
    activityLevel: profile.activity_level as ActivityLevel,
    goal: profile.goal as Goal,
  };
}

/**
 * Single source of truth: TDEE + goal adjustment (+ safety rules) from profile body stats.
 * Used by dashboard, Today ring, planner, and targets preview.
 */
export function computeNutritionTargetsFromProfile(profile: ProfileForTargets): UserNutritionTargets | null {
  if (!hasCompleteTdeeProfile(profile)) return null;
  const safe = calculateNutritionTargetsWithSafety(profileToTdeeValues(profile!));
  const kcal = safe.result.dailyCalories;
  const protein = safe.result.dailyProtein;
  return { kcal, protein, ...macroSplitFromKcalProtein(kcal, protein, Number(profile!.weight_kg)) };
}

/** Daily calorie target for display/comparison, or null if user has not set targets. */
export function getDailyCalorieTarget(profile: ProfileForTargets): number | null {
  const computed = computeNutritionTargetsFromProfile(profile);
  if (computed) return computed.kcal;
  const stored = profile?.daily_calorie_target;
  return stored != null && Number.isFinite(Number(stored)) ? Math.round(Number(stored)) : null;
}

/** Daily protein target for display/comparison, or null if user has not set targets. */
export function getDailyProteinTarget(profile: ProfileForTargets): number | null {
  const computed = computeNutritionTargetsFromProfile(profile);
  if (computed) return computed.protein;
  const stored = profile?.daily_protein_target;
  return stored != null && Number.isFinite(Number(stored)) ? Math.round(Number(stored)) : null;
}

/** Daily macro targets — recomputes from body stats when possible, else stored values or defaults. */
export function deriveNutritionTargets(profile: ProfileForTargets): UserNutritionTargets {
  const computed = computeNutritionTargetsFromProfile(profile);
  if (computed) return computed;

  const kcal = Math.round(Number(profile?.daily_calorie_target ?? 2000));
  const protein = Math.round(Number(profile?.daily_protein_target ?? 150));
  return { kcal, protein, ...macroSplitFromKcalProtein(kcal, protein) };
}

/** True when persisted targets differ from what the calculator would produce now. */
export function storedTargetsAreStale(profile: ProfileForTargets): boolean {
  const computed = computeNutritionTargetsFromProfile(profile);
  if (!computed || !profile) return false;
  const storedKcal = profile.daily_calorie_target;
  const storedProtein = profile.daily_protein_target;
  if (storedKcal == null && storedProtein == null) return false;
  return (
    Math.round(Number(storedKcal ?? 0)) !== computed.kcal ||
    Math.round(Number(storedProtein ?? 0)) !== computed.protein
  );
}
