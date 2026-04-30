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

export const tdeeSchema = z.object({
  weightKg: z.coerce.number().min(30, "Weight must be at least 30kg").max(300, "Please enter a valid weight"),
  heightCm: z.coerce.number().min(100, "Height must be at least 100cm").max(250, "Please enter a valid height"),
  age: z.coerce.number().int().min(16, "Must be at least 16").max(100, "Please enter a valid age"),
  sex: z.enum(["male", "female"]),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "extra_active"]),
  goal: z.enum(["lose", "maintain", "gain"]),
});

export type TDEEFormValues = z.infer<typeof tdeeSchema>;
