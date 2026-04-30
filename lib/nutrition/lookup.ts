import type { NutritionLookupEntry } from "@/types";

// Starter seed list. Expand incrementally with normalized ingredient names.
const NUTRITION_DB: NutritionLookupEntry[] = [
  {
    name: "chicken breast",
    per_100g: {
      calories: 165,
      protein_g: 31,
      carbs_g: 0,
      fat_g: 3.6,
      fibre_g: 0,
      sugar_g: 0,
      sodium_mg: 74,
      saturated_fat_g: 1.0,
    },
  },
  {
    name: "salmon",
    per_100g: {
      calories: 208,
      protein_g: 20,
      carbs_g: 0,
      fat_g: 13,
      fibre_g: 0,
      sugar_g: 0,
      sodium_mg: 59,
      saturated_fat_g: 3.1,
    },
  },
  {
    name: "egg",
    per_100g: {
      calories: 143,
      protein_g: 12.6,
      carbs_g: 0.7,
      fat_g: 9.5,
      fibre_g: 0,
      sugar_g: 0.4,
      sodium_mg: 142,
      saturated_fat_g: 3.1,
    },
  },
  {
    name: "rice",
    per_100g: {
      calories: 130,
      protein_g: 2.7,
      carbs_g: 28.2,
      fat_g: 0.3,
      fibre_g: 0.4,
      sugar_g: 0.1,
      sodium_mg: 1,
      saturated_fat_g: 0.1,
    },
  },
  {
    name: "oats",
    per_100g: {
      calories: 389,
      protein_g: 16.9,
      carbs_g: 66.3,
      fat_g: 6.9,
      fibre_g: 10.6,
      sugar_g: 0.9,
      sodium_mg: 2,
      saturated_fat_g: 1.2,
    },
  },
  {
    name: "broccoli",
    per_100g: {
      calories: 34,
      protein_g: 2.8,
      carbs_g: 6.6,
      fat_g: 0.4,
      fibre_g: 2.6,
      sugar_g: 1.7,
      sodium_mg: 33,
      saturated_fat_g: 0.0,
    },
  },
  {
    name: "spinach",
    per_100g: {
      calories: 23,
      protein_g: 2.9,
      carbs_g: 3.6,
      fat_g: 0.4,
      fibre_g: 2.2,
      sugar_g: 0.4,
      sodium_mg: 79,
      saturated_fat_g: 0.1,
    },
  },
  {
    name: "banana",
    per_100g: {
      calories: 89,
      protein_g: 1.1,
      carbs_g: 22.8,
      fat_g: 0.3,
      fibre_g: 2.6,
      sugar_g: 12.2,
      sodium_mg: 1,
      saturated_fat_g: 0.1,
    },
  },
  {
    name: "apple",
    per_100g: {
      calories: 52,
      protein_g: 0.3,
      carbs_g: 13.8,
      fat_g: 0.2,
      fibre_g: 2.4,
      sugar_g: 10.4,
      sodium_mg: 1,
      saturated_fat_g: 0.0,
    },
  },
  {
    name: "avocado",
    per_100g: {
      calories: 160,
      protein_g: 2,
      carbs_g: 8.5,
      fat_g: 14.7,
      fibre_g: 6.7,
      sugar_g: 0.7,
      sodium_mg: 7,
      saturated_fat_g: 2.1,
    },
  },
  {
    name: "olive oil",
    per_100g: {
      calories: 884,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 100,
      fibre_g: 0,
      sugar_g: 0,
      sodium_mg: 2,
      saturated_fat_g: 13.8,
    },
  },
  {
    name: "milk",
    per_100g: {
      calories: 61,
      protein_g: 3.2,
      carbs_g: 4.8,
      fat_g: 3.3,
      fibre_g: 0,
      sugar_g: 5.1,
      sodium_mg: 43,
      saturated_fat_g: 1.9,
    },
  },
  {
    name: "pasta",
    per_100g: {
      calories: 158,
      protein_g: 5.8,
      carbs_g: 30.9,
      fat_g: 0.9,
      fibre_g: 1.8,
      sugar_g: 0.6,
      sodium_mg: 1,
      saturated_fat_g: 0.2,
    },
  },
  {
    name: "parmesan",
    per_100g: {
      calories: 431,
      protein_g: 38,
      carbs_g: 4.1,
      fat_g: 29,
      fibre_g: 0,
      sugar_g: 0.9,
      sodium_mg: 1529,
      saturated_fat_g: 19,
    },
  },
  {
    name: "cream",
    per_100g: {
      calories: 340,
      protein_g: 2.1,
      carbs_g: 3,
      fat_g: 36.1,
      fibre_g: 0,
      sugar_g: 3,
      sodium_mg: 25,
      saturated_fat_g: 22.5,
    },
  },
  {
    name: "butter",
    per_100g: {
      calories: 717,
      protein_g: 0.9,
      carbs_g: 0.1,
      fat_g: 81.1,
      fibre_g: 0,
      sugar_g: 0.1,
      sodium_mg: 11,
      saturated_fat_g: 51.4,
    },
  },
  {
    name: "garlic",
    per_100g: {
      calories: 149,
      protein_g: 6.4,
      carbs_g: 33.1,
      fat_g: 0.5,
      fibre_g: 2.1,
      sugar_g: 1,
      sodium_mg: 17,
      saturated_fat_g: 0.1,
    },
  },
  {
    name: "greek yogurt",
    per_100g: {
      calories: 59,
      protein_g: 10.3,
      carbs_g: 3.6,
      fat_g: 0.4,
      fibre_g: 0,
      sugar_g: 3.2,
      sodium_mg: 36,
      saturated_fat_g: 0.1,
    },
  },
  {
    name: "cheddar cheese",
    per_100g: {
      calories: 402,
      protein_g: 25,
      carbs_g: 1.3,
      fat_g: 33.1,
      fibre_g: 0,
      sugar_g: 0.5,
      sodium_mg: 621,
      saturated_fat_g: 21.1,
    },
  },
  {
    name: "tomato",
    per_100g: {
      calories: 18,
      protein_g: 0.9,
      carbs_g: 3.9,
      fat_g: 0.2,
      fibre_g: 1.2,
      sugar_g: 2.6,
      sodium_mg: 5,
      saturated_fat_g: 0.0,
    },
  },
  {
    name: "onion",
    per_100g: {
      calories: 40,
      protein_g: 1.1,
      carbs_g: 9.3,
      fat_g: 0.1,
      fibre_g: 1.7,
      sugar_g: 4.2,
      sodium_mg: 4,
      saturated_fat_g: 0.0,
    },
  },
  {
    name: "potato",
    per_100g: {
      calories: 77,
      protein_g: 2,
      carbs_g: 17.6,
      fat_g: 0.1,
      fibre_g: 2.2,
      sugar_g: 0.8,
      sodium_mg: 6,
      saturated_fat_g: 0.0,
    },
  },
  {
    name: "sweet potato",
    per_100g: {
      calories: 86,
      protein_g: 1.6,
      carbs_g: 20.1,
      fat_g: 0.1,
      fibre_g: 3,
      sugar_g: 4.2,
      sodium_mg: 55,
      saturated_fat_g: 0.0,
    },
  },
  {
    name: "lentils",
    per_100g: {
      calories: 116,
      protein_g: 9,
      carbs_g: 20.1,
      fat_g: 0.4,
      fibre_g: 7.9,
      sugar_g: 1.8,
      sodium_mg: 2,
      saturated_fat_g: 0.1,
    },
  },
  {
    name: "chickpeas",
    per_100g: {
      calories: 164,
      protein_g: 8.9,
      carbs_g: 27.4,
      fat_g: 2.6,
      fibre_g: 7.6,
      sugar_g: 4.8,
      sodium_mg: 7,
      saturated_fat_g: 0.3,
    },
  },
];

function normalizeName(value: string): string {
  return value.toLowerCase().trim();
}

export function lookupNutrition(name: string): NutritionLookupEntry | null {
  const normalized = normalizeName(name);
  const exact = NUTRITION_DB.find((item) => normalizeName(item.name) === normalized);
  if (exact) return exact;

  // Fallback matching for user-entered variations (e.g. "alfredo sauce", "grated parmesan")
  const partial = NUTRITION_DB.find((item) => {
    const dbName = normalizeName(item.name);
    return normalized.includes(dbName) || dbName.includes(normalized);
  });
  const entry = partial;
  return entry ?? null;
}

export function getNutritionSeedSize(): number {
  return NUTRITION_DB.length;
}

export function getNutritionIngredientNames(): string[] {
  return NUTRITION_DB.map((entry) => entry.name).sort((a, b) => a.localeCompare(b));
}
