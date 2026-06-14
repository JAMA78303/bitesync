import { ingredientGrams } from "@/lib/nutrition/convert";
import {
  cofidMacrosFromScaled,
  lookupCoFID,
  scaleNutrition,
  type CoFIDMatchKind,
} from "@/lib/nutrition/cofidLookup";
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
