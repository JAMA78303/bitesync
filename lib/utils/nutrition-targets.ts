export type UserNutritionTargets = {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
};

type ProfileTargets = {
  daily_calorie_target?: number | null;
  daily_protein_target?: number | null;
} | null;

/** Daily macro targets from profile, with sensible defaults and derived carbs/fat. */
export function deriveNutritionTargets(profile: ProfileTargets): UserNutritionTargets {
  const kcal = Math.round(Number(profile?.daily_calorie_target ?? 2000));
  const protein = Math.round(Number(profile?.daily_protein_target ?? 150));
  const proteinKcal = protein * 4;
  const remaining = Math.max(0, kcal - proteinKcal);
  const carbs = Math.round((remaining * 0.5) / 4);
  const fat = Math.round((remaining * 0.3) / 9);
  const fibre = 30;
  return { kcal, protein, carbs, fat, fibre };
}
