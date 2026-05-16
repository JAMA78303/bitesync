export const DIETARY_PREFERENCE_OPTIONS = [
  { key: "no_preference", label: "No specific preferences", icon: "✕" },
  { key: "vegetarian", label: "I'm vegetarian", icon: "🌿" },
  { key: "vegan", label: "I'm vegan", icon: "🌱" },
  { key: "pescatarian", label: "I'm pescatarian", icon: "🐟" },
  { key: "meat_eater", label: "I eat meat", icon: "🥩" },
  { key: "gluten_free", label: "I'm gluten free", icon: "🌾" },
  { key: "dairy_free", label: "I'm dairy free", icon: "🥛" },
  { key: "halal", label: "I eat halal", icon: "☪️" },
] as const;

export type DietaryPreferenceKey = (typeof DIETARY_PREFERENCE_OPTIONS)[number]["key"];

export function toggleDietarySelection(prev: string[], key: string): string[] {
  if (key === "no_preference") {
    return ["no_preference"];
  }
  const without = prev.filter((k) => k !== "no_preference");
  return without.includes(key) ? without.filter((k) => k !== key) : [...without, key];
}

export function normalizeDietaryPreferencesForSave(selected: string[]): string[] {
  return selected.length ? selected : ["no_preference"];
}
