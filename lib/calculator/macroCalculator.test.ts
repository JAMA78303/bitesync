import { computeNutritionTargetsFromProfile, macroTargetsKcalSum } from "@/lib/utils/nutrition-targets";
import { calculateMacros, cmToFtIn, ftInToCm, kgToLb, lbToKg, parseCalculatorInput } from "./macroCalculator";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

// Unit conversions
assert(Math.abs(lbToKg(154) - 69.85) < 0.01, `154 lb → ${lbToKg(154)} kg`);
assert(Math.abs(ftInToCm(5, 10) - 177.8) < 0.001, `5ft10 → ${ftInToCm(5, 10)} cm`);
assert(Math.round(kgToLb(70)) === 154, `70 kg → ${kgToLb(70)} lb`);
assert(JSON.stringify(cmToFtIn(178)) === JSON.stringify({ feet: 5, inches: 10 }), `178 cm → ${JSON.stringify(cmToFtIn(178))}`);
assert(JSON.stringify(cmToFtIn(182.5)) === JSON.stringify({ feet: 6, inches: 0 }), `182.5 cm → ${JSON.stringify(cmToFtIn(182.5))}`);

// Same numbers as an account with the same stats
const values = parseCalculatorInput({
  weightKg: 70,
  heightCm: 175,
  age: 30,
  sex: "male",
  activityLevel: "moderate",
  goal: "lose",
});
assert(values !== null, "valid input parses");
const result = calculateMacros(values!);
const account = computeNutritionTargetsFromProfile({
  weight_kg: 70,
  height_cm: 175,
  age: 30,
  sex: "male",
  activity_level: "moderate",
  goal: "lose",
})!;
assert(result.calories === account.kcal, `calories ${result.calories} vs account ${account.kcal}`);
assert(result.protein === account.protein, `protein ${result.protein} vs account ${account.protein}`);
assert(result.carbs === account.carbs && result.fat === account.fat, "carbs/fat match the account");
assert(result.maintenance > result.calories, "weight loss sits below maintenance");
assert(result.adjustedFor === null, "no safety adjustment for a typical adult");
const sum = macroTargetsKcalSum(result);
assert(Math.abs(sum - result.calories) / result.calories <= 0.02, `macros sum ${sum} vs ${result.calories}`);

// Underweight + weight loss → maintenance targets, flagged
const under = calculateMacros(
  parseCalculatorInput({ weightKg: 48, heightCm: 172, age: 25, sex: "female", activityLevel: "light", goal: "lose" })!,
);
assert(under.adjustedFor === "underweight", `underweight flag, got ${under.adjustedFor}`);
assert(under.effectiveGoal === "maintain", "weight loss withheld when underweight");

// Calorie floor
const floor = calculateMacros(
  parseCalculatorInput({ weightKg: 50, heightCm: 152, age: 70, sex: "female", activityLevel: "sedentary", goal: "lose" })!,
);
assert(floor.calories === 1200, `floor at 1200 kcal, got ${floor.calories}`);
assert(floor.adjustedFor === "minimum_calories", `minimum_calories flag, got ${floor.adjustedFor}`);

// Out-of-range and missing input is rejected, not guessed
assert(parseCalculatorInput({ weightKg: 70, heightCm: 175, age: 15, sex: "male", activityLevel: "moderate", goal: "lose" }) === null, "age 15 rejected");
assert(parseCalculatorInput({ weightKg: 25, heightCm: 175, age: 30, sex: "male", activityLevel: "moderate", goal: "lose" }) === null, "25 kg rejected");
assert(parseCalculatorInput({ weightKg: 70, heightCm: 175, age: 30, activityLevel: "moderate", goal: "lose" }) === null, "missing sex rejected");

console.log("macroCalculator tests passed");
