import { z } from "zod";

export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "extra_active";
export type Goal = "lose" | "maintain" | "gain";

export type TDEEInput = {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: Sex;
  activityLevel: ActivityLevel;
  goal: Goal;
};

export type TDEEResult = {
  bmr: number;
  tdee: number;
  dailyCalories: number;
  dailyProtein: number;
};

export const PAL: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  extra_active: 1.9,
};

export const ACTIVITY_OPTIONS = [
  { value: "sedentary", label: "Sedentary", description: "Desk job, little or no exercise" },
  { value: "light", label: "Lightly active", description: "Light exercise 1-3 days/week" },
  { value: "moderate", label: "Moderately active", description: "Moderate exercise 3-5 days/week" },
  { value: "active", label: "Very active", description: "Hard exercise 6-7 days/week" },
  { value: "extra_active", label: "Extremely active", description: "Physical job + hard training daily" },
] as const;

export const GOAL_OPTIONS = [
  { value: "lose", label: "Lose weight", description: "20% below your TDEE (~0.5kg/week)" },
  { value: "maintain", label: "Maintain weight", description: "Eat at your TDEE" },
  { value: "gain", label: "Build muscle", description: "10% above your TDEE — a lean gain" },
] as const;

export function calculateBMR(weightKg: number, heightCm: number, age: number, sex: Sex): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * PAL[activityLevel]);
}

/**
 * Goal adjustment as a share of TDEE, not a flat figure.
 *
 * A flat -500 is a 27% deficit for a 60kg woman (TDEE ~1815) and a 14% deficit
 * for a 140kg man (~3631) — the same number meaning very different things. A
 * proportion scales with the person.
 *
 * -20% lands most users near 0.5-0.75kg/week. +10% is a lean-gain surplus of
 * roughly 250-350 kcal; the previous +500 reliably added fat beyond what the
 * "Build muscle" label promises.
 */
export const GOAL_TDEE_ADJUSTMENT: Record<Goal, number> = {
  lose: -0.2,
  maintain: 0,
  gain: 0.1,
};

export function calculateGoalCalories(tdee: number, goal: Goal): number {
  return Math.round(tdee * (1 + GOAL_TDEE_ADJUSTMENT[goal]));
}

/**
 * Ideal body weight (Devine) — the reference for the obesity adjustment below.
 */
function idealBodyWeightKg(heightCm: number, sex: Sex): number {
  const inchesOver5ft = Math.max(0, heightCm / 2.54 - 60);
  return (sex === "male" ? 50 : 45.5) + 2.3 * inchesOver5ft;
}

/**
 * Weight to base protein on.
 *
 * Above BMI 30 the standard clinical adjustment applies — IBW + 25% of the excess
 * — because fat mass does not need feeding in proportion to its weight. Without
 * it, a 140kg man was prescribed 308g of protein a day (~1.5kg of chicken).
 */
export function proteinReferenceWeightKg(weightKg: number, heightCm: number, sex: Sex): number {
  const heightM = heightCm / 100;
  const bmi = heightM > 0 ? weightKg / (heightM * heightM) : 0;
  if (bmi < 30) return weightKg;
  const ibw = idealBodyWeightKg(heightCm, sex);
  return ibw + 0.25 * (weightKg - ibw);
}

/**
 * Protein g/kg of reference weight, scaled by how much the user actually trains.
 *
 * The previous flat 1.8–2.2 came from the resistance-trained-athlete-in-a-deficit
 * literature (Helms et al.) and was applied to everyone, including sedentary
 * users, on total bodyweight. Sedentary intakes now sit nearer healthy-adult
 * adequacy (just above the UK RNI of 0.75 g/kg); the athlete figures are
 * reserved for people whose stated activity justifies them. Activity is
 * already collected for TDEE.
 */
export const PROTEIN_G_PER_KG: Record<ActivityLevel, Record<Goal, number>> = {
  sedentary: { maintain: 1.0, lose: 1.2, gain: 1.2 },
  light: { maintain: 1.1, lose: 1.2, gain: 1.2 },
  moderate: { maintain: 1.4, lose: 1.6, gain: 1.6 },
  active: { maintain: 1.6, lose: 1.8, gain: 1.8 },
  extra_active: { maintain: 1.8, lose: 2.0, gain: 2.0 },
};

export function calculateProteinTarget(
  weightKg: number,
  goal: Goal,
  opts?: { heightCm?: number; sex?: Sex; activityLevel?: ActivityLevel },
): number {
  const activity = opts?.activityLevel ?? "moderate";
  const perKg = PROTEIN_G_PER_KG[activity][goal];
  const reference =
    opts?.heightCm && opts?.sex
      ? proteinReferenceWeightKg(weightKg, opts.heightCm, opts.sex)
      : weightKg;
  return Math.round(reference * perKg);
}

export function calculateNutritionTargets(input: TDEEInput): TDEEResult {
  const bmr = calculateBMR(input.weightKg, input.heightCm, input.age, input.sex);
  const tdee = calculateTDEE(bmr, input.activityLevel);
  const dailyCalories = calculateGoalCalories(tdee, input.goal);
  const dailyProtein = calculateProteinTarget(input.weightKg, input.goal, {
    heightCm: input.heightCm,
    sex: input.sex,
    activityLevel: input.activityLevel,
  });
  return { bmr, tdee, dailyCalories, dailyProtein };
}

/** BMI — weight kg / height m² */
export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  if (heightM <= 0 || weightKg <= 0) return 0;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export type BMICategory = "underweight" | "healthy" | "overweight" | "obese";

export function getBMICategory(bmi: number): BMICategory {
  if (bmi < 18.5) return "underweight";
  if (bmi < 25) return "healthy";
  if (bmi < 30) return "overweight";
  return "obese";
}

export function getBMILabel(category: BMICategory): string {
  switch (category) {
    case "underweight":
      return "Underweight";
    case "healthy":
      return "Healthy weight";
    case "overweight":
      return "Overweight";
    case "obese":
      return "Obese";
  }
}

/** Tailwind utility classes for BMI badge (informative, neutral tone). */
export function getBMIColour(category: BMICategory): string {
  switch (category) {
    case "underweight":
      return "text-slate-700 bg-slate-100 dark:text-slate-200 dark:bg-slate-800/60";
    case "healthy":
      return "text-[#1A4731] bg-[#D1FAE5] dark:text-emerald-100 dark:bg-emerald-950/50";
    case "overweight":
      return "text-slate-700 bg-slate-100 dark:text-slate-200 dark:bg-slate-800/60";
    case "obese":
      return "text-slate-700 bg-slate-100 dark:text-slate-200 dark:bg-slate-800/60";
  }
}

export function isSafeToLoseWeight(bmi: number): boolean {
  return bmi >= 18.5;
}

/** NHS-style minimum daily calories — never go below without medical supervision */
export function getMinimumCalories(sex: Sex): number {
  return sex === "male" ? 1500 : 1200;
}

export type NutritionSafetyOverrideReason = "underweight" | "minimum_calories";

export const tdeeSchema = z.object({
  weightKg: z.coerce.number().min(30, "Weight must be at least 30kg").max(300, "Please enter a valid weight"),
  heightCm: z.coerce.number().min(100, "Height must be at least 100cm").max(250, "Please enter a valid height"),
  age: z.coerce.number().int().min(16, "Must be at least 16").max(100, "Please enter a valid age"),
  sex: z.enum(["male", "female"]),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "extra_active"]),
  goal: z.enum(["lose", "maintain", "gain"]),
});

export type TDEEFormValues = z.infer<typeof tdeeSchema>;

/** Applies WHO underweight rule + calorie floor before persisting or previewing. */
export function calculateNutritionTargetsWithSafety(values: TDEEFormValues): {
  result: TDEEResult;
  bmi: number;
  storedGoal: Goal;
  overrideApplied: boolean;
  overrideReason: NutritionSafetyOverrideReason | null;
  rawDailyCalories: number;
} {
  const bmi = calculateBMI(values.weightKg, values.heightCm);
  let storedGoal: Goal = values.goal;
  let overrideReason: NutritionSafetyOverrideReason | null = null;

  const loseBlocked = values.goal === "lose" && !isSafeToLoseWeight(bmi);
  const inputForCalc: TDEEInput = {
    ...values,
    goal: loseBlocked ? "maintain" : values.goal,
  };

  if (loseBlocked) {
    storedGoal = "maintain";
    overrideReason = "underweight";
  }

  const result = calculateNutritionTargets(inputForCalc);
  const rawDailyCalories = result.dailyCalories;

  const minCal = getMinimumCalories(values.sex);
  let overrideApplied = loseBlocked;

  if (result.dailyCalories < minCal) {
    const clamped = { ...result, dailyCalories: minCal };
    overrideApplied = true;
    if (!overrideReason) overrideReason = "minimum_calories";
    return {
      result: clamped,
      bmi,
      storedGoal,
      overrideApplied,
      overrideReason,
      rawDailyCalories,
    };
  }

  return {
    result,
    bmi,
    storedGoal,
    overrideApplied,
    overrideReason,
    rawDailyCalories,
  };
}
