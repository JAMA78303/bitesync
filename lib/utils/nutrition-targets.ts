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

function macroSplitFromKcalProtein(kcal: number, protein: number): Pick<UserNutritionTargets, "carbs" | "fat" | "fibre"> {
  const proteinKcal = protein * 4;
  const remaining = Math.max(0, kcal - proteinKcal);
  return {
    carbs: Math.round((remaining * 0.5) / 4),
    fat: Math.round((remaining * 0.3) / 9),
    fibre: 30,
  };
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
  return { kcal, protein, ...macroSplitFromKcalProtein(kcal, protein) };
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
