import { ingredientGrams } from "@/lib/nutrition/convert";
import {
  cofidMacrosFromScaled,
  lookupCoFID,
  scaleNutrition,
  type CoFIDMatchKind,
  type CoFIDNutrition,
} from "@/lib/nutrition/cofidLookup";
import {
  isRawDryStapleForm,
  isStapleGrainPulseQuery,
  isBreadcrumbCompositeMismatch,
  isFatAddedPrepMismatch,
  isMinceMismatch,
  isPlantMilkMismatch,
  isRawStapleMismatch,
  isSpaghettiSquashMismatch,
  queryRequestsRawDry,
} from "@/lib/nutrition/cofidMatch";
import { lookupNutrition } from "@/lib/nutrition/lookup";
import type { NutritionLookupEntry } from "@/types";
import { estimateNutritionWithAI } from "@/lib/nutrition/estimateWithAI";

export type NutritionLookupSource = "cofid" | "local" | "ai_estimated";

export type ResolvedNutrition = {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  sugar_g: number;
  sodium_mg: number;
  /** null = no saturated-fat data for this food (unknown). Never a fabricated 0. */
  saturated_fat_g: number | null;
  source: NutritionLookupSource;
  estimated: boolean;
  cofid_food_name?: string;
  cofid_matched_by?: CoFIDMatchKind;
};

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function isIncomplete(entry: NutritionLookupEntry): boolean {
  const p = entry.per_100g;
  return p.calories > 0 && p.protein_g === 0 && p.carbs_g === 0 && p.fat_g === 0;
}

function fromLocal(entry: NutritionLookupEntry, grams: number): ResolvedNutrition {
  const r = grams / 100;
  const p = entry.per_100g;
  return {
    kcal: Math.round(p.calories * r),
    protein: round1(p.protein_g * r),
    carbs: round1(p.carbs_g * r),
    fat: round1(p.fat_g * r),
    fibre: round1(p.fibre_g * r),
    sugar_g: round1(p.sugar_g * r),
    sodium_mg: round1(p.sodium_mg * r),
    saturated_fat_g: round1(p.saturated_fat_g * r),
    source: "local",
    estimated: false,
  };
}

function fromCofid(
  scaled: ReturnType<typeof scaleNutrition>,
  matched_by: CoFIDMatchKind,
): ResolvedNutrition {
  const macros = cofidMacrosFromScaled(scaled);
  return {
    kcal: Math.round(macros.calories),
    protein: round1(macros.protein_g),
    carbs: round1(macros.carbs_g),
    fat: round1(macros.fat_g),
    fibre: round1(macros.fibre_g),
    sugar_g: round1(macros.sugar_g),
    sodium_mg: round1(macros.sodium_mg),
    saturated_fat_g: macros.saturated_fat_g == null ? null : round1(macros.saturated_fat_g),
    source: "cofid",
    estimated: false,
    cofid_food_name: scaled.food_name,
    cofid_matched_by: matched_by,
  };
}

/**
 * CoFID matched a raw/dry staple but our local DB has a much less dense cooked
 * equivalent (e.g. CoFID only has "Quinoa, raw"; local has cooked quinoa).
 * Prefer local so bare "quinoa" / "bulgur" don't inherit dry weights.
 */
function shouldPreferLocalCookedStaple(
  cofid: CoFIDNutrition,
  query: string,
  localEntry: NutritionLookupEntry | null,
): boolean {
  if (!localEntry || isIncomplete(localEntry)) return false;
  if (queryRequestsRawDry(query)) return false;
  if (!isStapleGrainPulseQuery(query)) return false;
  if (!isRawDryStapleForm(cofid.food_name)) return false;

  const localCarbs = localEntry.per_100g.carbs_g;
  const cofidCarbs = cofid.carbs_g ?? 0;
  const localKcal = localEntry.per_100g.calories;
  const cofidKcal = cofid.kcal ?? 0;

  if (localCarbs <= 0 || cofidCarbs <= 0) {
    return localKcal > 0 && cofidKcal > localKcal * 1.5;
  }
  return cofidCarbs > localCarbs * 1.5 || cofidKcal > localKcal * 1.5;
}

function localNameMatchesQuery(localName: string, query: string): boolean {
  const q = query.toLowerCase().trim();
  const n = localName.toLowerCase().trim();
  return n === q || q.includes(n) || n.includes(q);
}

/** Fall back to local DB when CoFID matched the wrong food class entirely. */
function shouldPreferLocalOverCofidMismatch(
  cofid: CoFIDNutrition,
  query: string,
  localEntry: NutritionLookupEntry | null,
): boolean {
  if (!localEntry || isIncomplete(localEntry)) return false;
  const name = cofid.food_name;

  if (isMinceMismatch(query, name) && localNameMatchesQuery(localEntry.name, query)) {
    return true;
  }
  if (isSpaghettiSquashMismatch(query, name) && /\b(spaghetti|pasta|penne|macaroni)\b/.test(localEntry.name)) {
    return true;
  }
  if (isBreadcrumbCompositeMismatch(query, name) && localEntry.name === "bread") {
    return true;
  }
  // Plant drinks must never take dairy milk's numbers — wrong macros, and it
  // models a vegan ingredient as an animal product.
  if (isPlantMilkMismatch(query, name)) {
    return true;
  }
  // A plain staple must not take a chip/roast row's cooking fat, nor a raw
  // grain's density, when the local DB holds the as-eaten cooked figure.
  if (isFatAddedPrepMismatch(query, name) && localNameMatchesQuery(localEntry.name, query)) {
    return true;
  }
  if (isRawStapleMismatch(query, name) && localNameMatchesQuery(localEntry.name, query)) {
    return true;
  }
  return false;
}

/**
 * Full nutrition lookup chain: CoFID → local DB → optional AI.
 * Used by recipe save, API preview, and async totals.
 */
export async function lookupNutritionAsync(
  name: string,
  quantity: number,
  unit: string,
  opts?: { skipAI?: boolean },
): Promise<ResolvedNutrition | null> {
  const trimmed = name.trim();
  if (trimmed.length < 2) return null;

  const entry = lookupNutrition(trimmed);
  const grams = ingredientGrams(quantity, unit, entry, trimmed);
  if (grams == null || grams <= 0) return null;

  const cofid = await lookupCoFID(trimmed);
  if (cofid) {
    const scaled = scaleNutrition(cofid, grams);
    const macros = cofidMacrosFromScaled(scaled);
    if (
      macros.calories > 0 ||
      macros.protein_g > 0 ||
      macros.carbs_g > 0 ||
      macros.fat_g > 0
    ) {
      const resolved = fromCofid(scaled, cofid.matched_by);
      // CoFID may lack a saturated-fat figure (older import / sparse row). Stay within
      // the CoFID-coherent pipeline by borrowing the value from our own local DB before
      // giving up — only report null (unknown) when neither source has it.
      if (resolved.saturated_fat_g == null && entry && entry.per_100g.saturated_fat_g != null) {
        resolved.saturated_fat_g = round1(entry.per_100g.saturated_fat_g * (grams / 100));
      }
      if (shouldPreferLocalCookedStaple(cofid, trimmed, entry)) {
        return fromLocal(entry!, grams);
      }
      if (shouldPreferLocalOverCofidMismatch(cofid, trimmed, entry)) {
        return fromLocal(entry!, grams);
      }
      return resolved;
    }
  }

  if (entry && !isIncomplete(entry)) {
    return fromLocal(entry, grams);
  }

  if (!opts?.skipAI && process.env.ANTHROPIC_API_KEY) {
    const ai = await estimateNutritionWithAI(trimmed, quantity, unit);
    if (ai && (ai.kcal > 0 || ai.protein > 0)) {
      return {
        kcal: Math.round(ai.kcal),
        protein: round1(ai.protein),
        carbs: round1(ai.carbs),
        fat: round1(ai.fat),
        fibre: round1(ai.fibre),
        sugar_g: entry ? round1(entry.per_100g.sugar_g * (grams / 100)) : 0,
        sodium_mg: entry ? round1(entry.per_100g.sodium_mg * (grams / 100)) : 0,
        saturated_fat_g: entry ? round1(entry.per_100g.saturated_fat_g * (grams / 100)) : null,
        source: "ai_estimated",
        estimated: true,
      };
    }
  }

  if (entry && isIncomplete(entry)) {
    const partial = fromLocal(entry, grams);
    if (partial.kcal > 0) return partial;
  }

  return null;
}
