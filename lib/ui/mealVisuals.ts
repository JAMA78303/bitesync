import type { LucideIcon } from "lucide-react";
import {
  Apple,
  Beef,
  ChefHat,
  Coffee,
  Cookie,
  Croissant,
  Egg,
  Fish,
  Pizza,
  Salad,
  Soup,
  Sparkles,
  UtensilsCrossed,
  Wheat,
} from "lucide-react";
import type { MealType } from "@/types";

export type MealVisualType = MealType | "default";

export type MealVisual = {
  Icon: LucideIcon;
  mealType: MealVisualType;
};

const INGREDIENT_ICONS: readonly [string, LucideIcon][] = [
  ["oats", Wheat],
  ["porridge", Wheat],
  ["bircher", Wheat],
  ["granola", Wheat],
  ["egg", Egg],
  ["omelette", Egg],
  ["toast", Croissant],
  ["pancake", Croissant],
  ["waffle", Croissant],
  ["coffee", Coffee],
  ["smoothie", Coffee],
  ["yoghurt", Cookie],
  ["yogurt", Cookie],
  ["salad", Salad],
  ["sandwich", Croissant],
  ["soup", Soup],
  ["wrap", Croissant],
  ["chicken", Beef],
  ["beef", Beef],
  ["steak", Beef],
  ["burger", Beef],
  ["pasta", UtensilsCrossed],
  ["spaghetti", UtensilsCrossed],
  ["rice", Wheat],
  ["curry", Soup],
  ["fish", Fish],
  ["salmon", Fish],
  ["cod", Fish],
  ["pizza", Pizza],
  ["fruit", Apple],
  ["apple", Apple],
  ["berry", Apple],
  ["berries", Apple],
  ["nut", Cookie],
  ["nuts", Cookie],
];

const DEFAULT_BY_MEAL: Record<MealVisualType, LucideIcon> = {
  breakfast: Coffee,
  lunch: Salad,
  dinner: UtensilsCrossed,
  snack: Apple,
  default: ChefHat,
};

function normalizeMealType(mealType: string): MealVisualType {
  if (mealType === "breakfast" || mealType === "lunch" || mealType === "dinner" || mealType === "snack") {
    return mealType;
  }
  return "default";
}

export function resolveMealVisual(recipeName: string, mealType: string): MealVisual {
  const name = recipeName.toLowerCase();
  for (const [key, Icon] of INGREDIENT_ICONS) {
    if (name.includes(key)) {
      return { Icon, mealType: normalizeMealType(mealType) };
    }
  }
  const normalized = normalizeMealType(mealType);
  return { Icon: DEFAULT_BY_MEAL[normalized], mealType: normalized };
}

export const QUICK_ADD_VISUAL: MealVisual = { Icon: Sparkles, mealType: "snack" };

export function mealTintClasses(mealType: MealVisualType): string {
  switch (mealType) {
    case "breakfast":
      return "bg-[var(--meal-tint-breakfast-bg)] text-[var(--meal-tint-breakfast-icon)]";
    case "lunch":
      return "bg-[var(--meal-tint-lunch-bg)] text-[var(--meal-tint-lunch-icon)]";
    case "dinner":
      return "bg-[var(--meal-tint-dinner-bg)] text-[var(--meal-tint-dinner-icon)]";
    case "snack":
      return "bg-[var(--meal-tint-snack-bg)] text-[var(--meal-tint-snack-icon)]";
    default:
      return "bg-[var(--meal-tint-default-bg)] text-[var(--meal-tint-default-icon)]";
  }
}
