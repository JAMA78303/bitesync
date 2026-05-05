import { AlertTriangle, TrendingUp } from "lucide-react";
import type { NutrientResult } from "@/lib/supabase/nutrition";

const RICH_FOODS: Record<string, string[]> = {
  vitamin_a_mcg: ["sweet potato", "spinach", "carrots", "eggs"],
  vitamin_c_mg: ["peppers", "broccoli", "strawberries", "orange"],
  vitamin_d_mcg: ["salmon", "mackerel", "eggs", "tuna canned"],
  vitamin_b12_mcg: ["salmon", "tuna canned", "eggs", "greek yoghurt"],
  folate_mcg: ["spinach", "broccoli", "lentils", "chickpeas"],
  iron_mg: ["lentils", "spinach", "oats", "tofu"],
  calcium_mg: ["greek yoghurt", "milk", "almonds", "broccoli"],
  zinc_mg: ["almonds", "oats", "chicken breast", "lentils"],
  magnesium_mg: ["almonds", "oats", "spinach", "lentils"],
  potassium_mg: ["banana", "sweet potato", "salmon", "spinach"],
  selenium_mcg: ["tuna canned", "salmon", "eggs", "oats"],
  iodine_mcg: ["milk", "greek yoghurt", "eggs", "salmon"],
};

const LIMIT_TIPS: Record<string, string> = {
  saturated_fat_g: "Try swapping butter for olive oil and choosing leaner cuts of meat.",
  salt_g: "Check stock cubes, soy sauce, and processed foods — these are the biggest sources.",
  sugar_g: "Watch yoghurts, sauces, and fruit juices — sugar hides in many packaged foods.",
};

type Props = {
  deficiencies: NutrientResult[];
  excesses: NutrientResult[];
};

export function DeficiencyRecommendations({ deficiencies, excesses }: Props) {
  if (!deficiencies.length && !excesses.length) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-[#6EE7B7] bg-[#D1FAE5] p-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1A4731]">
          <TrendingUp className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#1A4731]">Great nutrition this week</p>
          <p className="text-xs text-[#1A4731] opacity-70">All nutrients within healthy ranges</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {deficiencies.map((nutrient) => {
        const richFoods = RICH_FOODS[nutrient.key] ?? [];
        return (
          <div key={nutrient.key} className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="mb-2 flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
              <div>
                <p className="text-sm font-semibold text-red-700">Low {nutrient.label}</p>
                <p className="mt-0.5 text-xs text-red-600">{nutrient.pct_label} — below 70% of daily target</p>
              </div>
            </div>
            {richFoods.length > 0 ? (
              <p className="ml-6 text-xs text-red-600">
                Add more: <span className="font-medium">{richFoods.slice(0, 3).join(", ")}</span>
              </p>
            ) : null}
          </div>
        );
      })}

      {excesses.map((nutrient) => {
        const tip = LIMIT_TIPS[nutrient.key];
        return (
          <div key={nutrient.key} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="mb-2 flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-700">High {nutrient.label}</p>
                <p className="mt-0.5 text-xs text-amber-600">{nutrient.pct_label} — exceeding daily limit</p>
              </div>
            </div>
            {tip ? <p className="ml-6 text-xs text-amber-600">{tip}</p> : null}
          </div>
        );
      })}
    </div>
  );
}
