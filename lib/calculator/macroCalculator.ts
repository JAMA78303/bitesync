import { computeNutritionTargetsFromProfile } from "@/lib/utils/nutrition-targets";
import {
  calculateNutritionTargetsWithSafety,
  tdeeSchema,
  type Goal,
  type NutritionSafetyOverrideReason,
  type TDEEFormValues,
} from "@/lib/utils/tdee";

/**
 * The public macro calculator (/macro-calculator). A thin wrapper so the
 * numbers it shows are exactly the targets a BiteSync account would get from
 * the same stats — same equation, same protein table, same safety rules. Runs
 * in the browser; nothing is sent anywhere.
 */

const KG_PER_LB = 0.45359237;
const CM_PER_INCH = 2.54;

export function lbToKg(lb: number): number {
  return lb * KG_PER_LB;
}

export function ftInToCm(feet: number, inches: number): number {
  return (feet * 12 + inches) * CM_PER_INCH;
}

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB;
}

/** Whole feet and inches, rounding 11.6 in up to the next foot rather than "5 ft 12 in". */
export function cmToFtIn(cm: number): { feet: number; inches: number } {
  const totalInches = Math.round(cm / CM_PER_INCH);
  return { feet: Math.floor(totalInches / 12), inches: totalInches % 12 };
}

export type MacroResult = {
  /** Daily calorie target for the goal, after safety limits. */
  calories: number;
  /** Calories to maintain current weight (TDEE). */
  maintenance: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  bmi: number;
  /** Set when a safety rule changed the result. */
  adjustedFor: NutritionSafetyOverrideReason | null;
  /** The goal the targets were calculated for (weight loss is withheld when underweight). */
  effectiveGoal: Goal;
};

/** Validated calculator input, or null when a field is missing or out of range. */
export function parseCalculatorInput(raw: Partial<Record<keyof TDEEFormValues, unknown>>): TDEEFormValues | null {
  const parsed = tdeeSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function calculateMacros(values: TDEEFormValues): MacroResult {
  const safe = calculateNutritionTargetsWithSafety(values);
  const targets = computeNutritionTargetsFromProfile({
    weight_kg: values.weightKg,
    height_cm: values.heightCm,
    age: values.age,
    sex: values.sex,
    activity_level: values.activityLevel,
    goal: values.goal,
  });
  if (!targets) throw new Error("calculateMacros: incomplete input");
  return {
    calories: targets.kcal,
    maintenance: safe.result.tdee,
    protein: targets.protein,
    carbs: targets.carbs,
    fat: targets.fat,
    fibre: targets.fibre,
    bmi: safe.bmi,
    adjustedFor: safe.overrideReason,
    effectiveGoal: safe.storedGoal,
  };
}
