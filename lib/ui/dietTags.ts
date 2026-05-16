export function getDietTag(
  kcal: number,
  protein: number,
  carbs: number,
  fat: number,
  preferences: string[] = [],
): string | null {
  if (preferences.includes("vegan")) return "Vegan";
  if (preferences.includes("vegetarian")) return "Vegetarian";
  if (protein >= 30) return "High Protein";
  if (kcal <= 350) return "Low Calorie";
  if (kcal >= 600) return "High Calorie";
  if (carbs <= 20) return "Low Carb";
  if (fat <= 5) return "Low Fat";
  return null;
}
