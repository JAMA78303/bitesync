/** Maps preference keys to legacy profile booleans used for recipe tagging hints. */
export function dietaryPreferencesToLegacyFlags(prefs: string[]): {
  followsVegetarian: boolean;
  followsVegan: boolean;
  followsGlutenFree: boolean;
  dairyFree: boolean;
} {
  const set = new Set(prefs);
  return {
    followsVegetarian: set.has("vegetarian") || set.has("vegan"),
    followsVegan: set.has("vegan"),
    followsGlutenFree: set.has("gluten_free"),
    dairyFree: set.has("dairy_free"),
  };
}

export function buildDietaryConstraints(prefs: string[]): string {
  if (!prefs.length || prefs.includes("no_preference")) return "";

  const constraints: string[] = [];
  if (prefs.includes("vegetarian")) constraints.push("no meat or fish");
  if (prefs.includes("vegan")) constraints.push("no meat, fish, dairy, or eggs");
  if (prefs.includes("pescatarian")) constraints.push("no meat but fish is fine");
  if (prefs.includes("gluten_free")) constraints.push("no gluten — avoid wheat, barley, rye");
  if (prefs.includes("dairy_free")) constraints.push("no dairy products");
  if (prefs.includes("halal")) constraints.push("halal only — no pork or alcohol in ingredients");

  if (!constraints.length) return "";

  return `Dietary requirements (STRICT — never suggest meals that violate these): ${constraints.join(", ")}.`;
}

export function parseDietaryPreferences(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((k): k is string => typeof k === "string");
}

export function initialDietaryPreferencesFromProfile(profile: {
  dietary_preferences?: unknown;
  follows_vegetarian?: boolean | null;
  follows_vegan?: boolean | null;
  follows_gluten_free?: boolean | null;
} | null): string[] {
  const fromArray = parseDietaryPreferences(profile?.dietary_preferences);
  if (fromArray.length) return fromArray;

  const keys: string[] = [];
  if (profile?.follows_vegan) keys.push("vegan");
  else if (profile?.follows_vegetarian) keys.push("vegetarian");
  if (profile?.follows_gluten_free) keys.push("gluten_free");
  return keys;
}
