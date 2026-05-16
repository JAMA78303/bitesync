/** Pill colours for auto diet tags — import from here, never duplicate inline. */
export function getDietTagStyle(tag: string): string {
  const styles: Record<string, string> = {
    "High Protein": "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
    "Low Calorie": "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400",
    "High Calorie": "bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400",
    "Low Carb": "bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400",
    Vegan: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
    Vegetarian: "bg-lime-50 text-lime-600 dark:bg-lime-950/30 dark:text-lime-400",
    "Low Fat": "bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-400",
  };
  return styles[tag] ?? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
}

export const STORE_COLORS: Record<string, string> = {
  Tesco: "#00539f",
  Asda: "#68a51c",
  Aldi: "#00005f",
};
