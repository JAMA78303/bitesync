import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  cofidQueryVariants,
  normalizeCofidQuery,
  pickBestCofidCandidate,
  type CofidCandidate,
  type CoFIDMatchKind,
} from "@/lib/nutrition/cofidMatch";

export type { CoFIDMatchKind };

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
let injectedSupabase: SupabaseClient | null = null;

/** Allows scripts to run CoFID lookups with a service-role client. */
export function setCofidLookupSupabase(client: SupabaseClient | null): void {
  injectedSupabase = client;
  overrideCache = null;
  lookupCache.clear();
}

async function resolveSupabase(): Promise<SupabaseClient> {
  if (injectedSupabase) return injectedSupabase;
  return createClient();
}

function cacheKey(name: string): string {
  return normalizeCofidQuery(name);
}

/** Keys used for cofid_overrides lookup (normalised name + singular/plural). */
function overrideLookupKeys(name: string): string[] {
  const keys = cofidQueryVariants(name);
  return keys;
}

function rowToNutrition(row: CofidDbRow, matched_by: CoFIDMatchKind): CoFIDNutrition {
  return { ...row, matched_by };
}

async function getOverrideFoodCode(normalised: string): Promise<string | null> {
  const now = Date.now();
  if (!overrideCache || now - overrideCache.loadedAt > OVERRIDE_TTL_MS) {
    const supabase = await resolveSupabase();
    const { data } = await supabase.from("cofid_overrides").select("ingredient_name, food_code");
    const map = new Map<string, string>();
    for (const row of data ?? []) {
      map.set(normalizeCofidQuery(row.ingredient_name), row.food_code);
    }
    overrideCache = { map, loadedAt: now };
  }
  for (const key of overrideLookupKeys(normalised)) {
    const code = overrideCache.map.get(key);
    if (code) return code;
  }
  return null;
}

/** Call after admin edits overrides so lookups pick up changes within TTL. */
export function invalidateCofidOverrideCache(): void {
  overrideCache = null;
}

const COFID_SELECT =
  "food_code,food_name,food_group,kcal,protein_g,fat_g,carbs_g,sugars_g,fibre_g,sodium_mg,salt_g,vitamin_a_ug,vitamin_d_ug,vitamin_e_mg,vitamin_k_ug,vitamin_c_mg,thiamin_mg,riboflavin_mg,niacin_mg,vitamin_b6_mg,vitamin_b12_ug,folate_ug,calcium_mg,iron_mg,zinc_mg,magnesium_mg,potassium_mg,phosphorus_mg,selenium_ug,iodine_ug";

function addCandidates(
  target: CofidCandidate[],
  seen: Set<string>,
  rows: Pick<CofidDbRow, "food_code" | "food_name" | "food_group">[] | null | undefined,
  matchKind: CoFIDMatchKind,
): void {
  for (const row of rows ?? []) {
    if (seen.has(row.food_code)) continue;
    seen.add(row.food_code);
    target.push({
      food_code: row.food_code,
      food_name: row.food_name,
      food_group: row.food_group,
      matchKind,
    });
  }
}

type CofidCandidateRow = Pick<CofidDbRow, "food_code" | "food_name" | "food_group">;

const COFID_CANDIDATE_SELECT = "food_code,food_name,food_group";

async function collectCofidCandidates(
  supabase: SupabaseClient,
  normalised: string,
): Promise<CofidCandidate[]> {
  const candidates: CofidCandidate[] = [];
  const seen = new Set<string>();
  const variants = cofidQueryVariants(normalised);

  type TaggedFetch = { kind: CoFIDMatchKind; data: CofidCandidateRow[] | null };
  const pending: Promise<TaggedFetch>[] = [];

  pending.push(
    Promise.resolve(
      supabase
        .from("cofid_foods")
        .select(COFID_CANDIDATE_SELECT)
        .ilike("food_name", `%${normalised}%`)
        .limit(35)
        .then(({ data }) => ({ kind: "partial" as const, data })),
    ),
  );

  for (const variant of variants) {
    pending.push(
      Promise.resolve(
        supabase
          .from("cofid_foods")
          .select(COFID_CANDIDATE_SELECT)
          .ilike("food_name", `${variant},%`)
          .limit(20)
          .then(({ data }) => ({ kind: "partial" as const, data })),
      ),
    );
  }

  const ftsQuery = normalised.replace(/\s+/g, " & ");
  if (ftsQuery.length >= 2) {
    pending.push(
      Promise.resolve(
        supabase
          .from("cofid_foods")
          .select(COFID_CANDIDATE_SELECT)
          .textSearch("search_vector", ftsQuery, { type: "websearch", config: "english" })
          .limit(20)
          .then(({ data }) => ({ kind: "fulltext" as const, data })),
      ),
    );
  }

  const words = normalised.split(/\s+/).filter((w) => w.length > 2);
  if (words.length > 1) {
    for (const word of words.slice(0, 3)) {
      for (const variant of cofidQueryVariants(word)) {
        pending.push(
          Promise.resolve(
            supabase
              .from("cofid_foods")
              .select(COFID_CANDIDATE_SELECT)
              .ilike("food_name", `${variant},%`)
              .limit(10)
              .then(({ data }) => ({ kind: "partial" as const, data })),
          ),
        );
      }
    }
  }

  const results = await Promise.all(pending);
  for (const { kind, data } of results) {
    addCandidates(candidates, seen, data, kind);
  }

  return candidates;
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

  const supabase = await resolveSupabase();
  const normalised = key;

  const overrideCode = await getOverrideFoodCode(normalised);
  if (overrideCode) {
    const { data: food } = await supabase
      .from("cofid_foods")
      .select(COFID_SELECT)
      .eq("food_code", overrideCode)
      .maybeSingle();

    if (food) {
      const hit = rowToNutrition(food as CofidDbRow, "exact");
      lookupCache.set(key, hit);
      return hit;
    }
  }

  const candidates = await collectCofidCandidates(supabase, normalised);
  const best = pickBestCofidCandidate(normalised, candidates);

  if (best) {
    const { data: food } = await supabase
      .from("cofid_foods")
      .select(COFID_SELECT)
      .eq("food_code", best.food_code)
      .maybeSingle();

    if (food) {
      const hit = rowToNutrition(food as CofidDbRow, best.matchKind);
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
