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

const PAL: Record<ActivityLevel, number> = {
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
  { value: "lose", label: "Lose weight", description: "500 kcal daily deficit (~0.5kg/week)" },
  { value: "maintain", label: "Maintain weight", description: "Eat at your TDEE" },
  { value: "gain", label: "Build muscle", description: "500 kcal daily surplus (~0.5kg/week)" },
] as const;

export function calculateBMR(weightKg: number, heightCm: number, age: number, sex: Sex): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * PAL[activityLevel]);
}

export function calculateGoalCalories(tdee: number, goal: Goal): number {
  if (goal === "lose") return tdee - 500;
  if (goal === "gain") return tdee + 500;
  return tdee;
}

export function calculateProteinTarget(weightKg: number, goal: Goal): number {
  const multipliers: Record<Goal, number> = { lose: 2.2, maintain: 1.8, gain: 2.0 };
  return Math.round(weightKg * multipliers[goal]);
}

export function calculateNutritionTargets(input: TDEEInput): TDEEResult {
  const bmr = calculateBMR(input.weightKg, input.heightCm, input.age, input.sex);
  const tdee = calculateTDEE(bmr, input.activityLevel);
  const dailyCalories = calculateGoalCalories(tdee, input.goal);
  const dailyProtein = calculateProteinTarget(input.weightKg, input.goal);
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

/** Tailwind utility classes for BMI badge (light UI). */
export function getBMIColour(category: BMICategory): string {
  switch (category) {
    case "underweight":
      return "text-blue-600 bg-blue-50 dark:text-blue-200 dark:bg-blue-950/40";
    case "healthy":
      return "text-[#1A4731] bg-[#D1FAE5] dark:text-emerald-100 dark:bg-emerald-950/50";
    case "overweight":
      return "text-amber-600 bg-amber-50 dark:text-amber-100 dark:bg-amber-950/40";
    case "obese":
      return "text-red-600 bg-red-50 dark:text-red-100 dark:bg-red-950/40";
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
