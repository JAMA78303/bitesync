import { createClient } from "@/lib/supabase/server";

export type CoFIDMatchKind = "exact" | "fulltext" | "partial";

export interface CoFIDNutrition {
  kcal: number | null;
  protein_g: number | null;
  fat_g: number | null;
  carbs_g: number | null;
  sugars_g: number | null;
  fibre_g: number | null;
  sodium_mg: number | null;
  salt_g: number | null;
  vitamin_a_ug: number | null;
  vitamin_d_ug: number | null;
  vitamin_e_mg: number | null;
  vitamin_k_ug: number | null;
  vitamin_c_mg: number | null;
  thiamin_mg: number | null;
  riboflavin_mg: number | null;
  niacin_mg: number | null;
  vitamin_b6_mg: number | null;
  vitamin_b12_ug: number | null;
  folate_ug: number | null;
  calcium_mg: number | null;
  iron_mg: number | null;
  zinc_mg: number | null;
  magnesium_mg: number | null;
  potassium_mg: number | null;
  phosphorus_mg: number | null;
  selenium_ug: number | null;
  iodine_ug: number | null;
  food_name: string;
  food_code: string;
  matched_by: CoFIDMatchKind;
}

type CofidDbRow = {
  food_code: string;
  food_name: string;
  food_group: string | null;
  kcal: number | null;
  protein_g: number | null;
  fat_g: number | null;
  carbs_g: number | null;
  sugars_g: number | null;
  fibre_g: number | null;
  sodium_mg: number | null;
  salt_g: number | null;
  vitamin_a_ug: number | null;
  vitamin_d_ug: number | null;
  vitamin_e_mg: number | null;
  vitamin_k_ug: number | null;
  vitamin_c_mg: number | null;
  thiamin_mg: number | null;
  riboflavin_mg: number | null;
  niacin_mg: number | null;
  vitamin_b6_mg: number | null;
  vitamin_b12_ug: number | null;
  folate_ug: number | null;
  calcium_mg: number | null;
  iron_mg: number | null;
  zinc_mg: number | null;
  magnesium_mg: number | null;
  potassium_mg: number | null;
  phosphorus_mg: number | null;
  selenium_ug: number | null;
  iodine_ug: number | null;
};

const CACHE_MAX = 500;
const OVERRIDE_TTL_MS = 5 * 60 * 1000;
const lookupCache = new Map<string, CoFIDNutrition | null>();

let overrideCache: { map: Map<string, string>; loadedAt: number } | null = null;

function cacheKey(name: string): string {
  return name.toLowerCase().trim();
}

function rowToNutrition(row: CofidDbRow, matched_by: CoFIDMatchKind): CoFIDNutrition {
  return { ...row, matched_by };
}

async function getOverrideFoodCode(normalised: string): Promise<string | null> {
  const now = Date.now();
  if (!overrideCache || now - overrideCache.loadedAt > OVERRIDE_TTL_MS) {
    const supabase = await createClient();
    const { data } = await supabase.from("cofid_overrides").select("ingredient_name, food_code");
    const map = new Map<string, string>();
    for (const row of data ?? []) {
      map.set(row.ingredient_name, row.food_code);
    }
    overrideCache = { map, loadedAt: now };
  }
  return overrideCache.map.get(normalised) ?? null;
}

/** Call after admin edits overrides so lookups pick up changes within TTL. */
export function invalidateCofidOverrideCache(): void {
  overrideCache = null;
}

/**
 * Look up a food by name in the CoFID database.
 * Returns nutrition per 100g, or null if not found.
 */
export async function lookupCoFID(foodName: string): Promise<CoFIDNutrition | null> {
  const key = cacheKey(foodName);
  if (lookupCache.has(key)) {
    return lookupCache.get(key) ?? null;
  }

  const supabase = await createClient();
  const normalised = key;

  const overrideCode = await getOverrideFoodCode(normalised);
  if (overrideCode) {
    const { data: food } = await supabase
      .from("cofid_foods")
      .select("*")
      .eq("food_code", overrideCode)
      .maybeSingle();

    if (food) {
      const hit = rowToNutrition(food as CofidDbRow, "exact");
      lookupCache.set(key, hit);
      return hit;
    }
  }

  const { data: exact } = await supabase
    .from("cofid_foods")
    .select("*")
    .ilike("food_name", normalised)
    .limit(1)
    .maybeSingle();

  if (exact) {
    const hit = rowToNutrition(exact as CofidDbRow, "exact");
    lookupCache.set(key, hit);
    return hit;
  }

  const { data: fts } = await supabase
    .from("cofid_foods")
    .select("*")
    .textSearch("search_vector", normalised.replace(/\s+/g, " & "), {
      type: "websearch",
      config: "english",
    })
    .limit(1);

  if (fts?.[0]) {
    const hit = rowToNutrition(fts[0] as CofidDbRow, "fulltext");
    lookupCache.set(key, hit);
    return hit;
  }

  const words = normalised.split(/\s+/).filter((w) => w.length > 3);
  if (words.length > 0) {
    const { data: partial } = await supabase
      .from("cofid_foods")
      .select("*")
      .ilike("food_name", `%${words[0]}%`)
      .limit(1);

    if (partial?.[0]) {
      const hit = rowToNutrition(partial[0] as CofidDbRow, "partial");
      lookupCache.set(key, hit);
      return hit;
    }
  }

  if (lookupCache.size >= CACHE_MAX) {
    const first = lookupCache.keys().next().value;
    if (first) lookupCache.delete(first);
  }
  lookupCache.set(key, null);
  return null;
}

function num(v: number | null | undefined): number {
  return v ?? 0;
}

/**
 * Scale CoFID nutrition (per 100g) to actual grams used.
 */
export function scaleNutrition(nutrition: CoFIDNutrition, grams: number): CoFIDNutrition {
  const factor = grams / 100;
  const scale = (v: number | null) => (v == null ? null : v * factor);
  return {
    ...nutrition,
    kcal: scale(nutrition.kcal),
    protein_g: scale(nutrition.protein_g),
    fat_g: scale(nutrition.fat_g),
    carbs_g: scale(nutrition.carbs_g),
    sugars_g: scale(nutrition.sugars_g),
    fibre_g: scale(nutrition.fibre_g),
    sodium_mg: scale(nutrition.sodium_mg),
    salt_g: scale(nutrition.salt_g),
    vitamin_a_ug: scale(nutrition.vitamin_a_ug),
    vitamin_d_ug: scale(nutrition.vitamin_d_ug),
    vitamin_e_mg: scale(nutrition.vitamin_e_mg),
    vitamin_k_ug: scale(nutrition.vitamin_k_ug),
    vitamin_c_mg: scale(nutrition.vitamin_c_mg),
    thiamin_mg: scale(nutrition.thiamin_mg),
    riboflavin_mg: scale(nutrition.riboflavin_mg),
    niacin_mg: scale(nutrition.niacin_mg),
    vitamin_b6_mg: scale(nutrition.vitamin_b6_mg),
    vitamin_b12_ug: scale(nutrition.vitamin_b12_ug),
    folate_ug: scale(nutrition.folate_ug),
    calcium_mg: scale(nutrition.calcium_mg),
    iron_mg: scale(nutrition.iron_mg),
    zinc_mg: scale(nutrition.zinc_mg),
    magnesium_mg: scale(nutrition.magnesium_mg),
    potassium_mg: scale(nutrition.potassium_mg),
    phosphorus_mg: scale(nutrition.phosphorus_mg),
    selenium_ug: scale(nutrition.selenium_ug),
    iodine_ug: scale(nutrition.iodine_ug),
  };
}

export type CoFIDMacroContribution = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fibre_g: number;
  sugar_g: number;
  sodium_mg: number;
  saturated_fat_g: number;
};

/** Map scaled CoFID values into recipe macro totals. */
export function cofidMacrosFromScaled(scaled: CoFIDNutrition): CoFIDMacroContribution {
  return {
    calories: num(scaled.kcal),
    protein_g: num(scaled.protein_g),
    carbs_g: num(scaled.carbs_g),
    fat_g: num(scaled.fat_g),
    fibre_g: num(scaled.fibre_g),
    sugar_g: num(scaled.sugars_g),
    sodium_mg: num(scaled.sodium_mg),
    saturated_fat_g: 0,
  };
}
