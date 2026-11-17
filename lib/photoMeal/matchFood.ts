import { cofidNutritionByCode, loadCofidIndex } from "@/lib/nutrition/cofidLookup";
import { lookupNutrition } from "@/lib/nutrition/lookup";
import { lookupMicros } from "@/lib/nutrition/micros";
import {
  fallbackFoods,
  parseFoodName,
  pickCofidRow,
  singular,
  type CookingMethod,
  type ParsedFood,
} from "@/lib/photoMeal/platedMatch";
import type { FoodMatch } from "@/lib/photoMeal/types";

/** Grains and pulses eaten cooked: the local list's plain rows for them are the dry weight. */
const COOKED_STAPLE = /\b(rice|pasta|spaghetti|penne|fusilli|macaroni|couscous|quinoa|bulgu?r|millet|barley|buckwheat|noodles?|lentils?)\b/;

/**
 * BiteSync's own food list, when CoFID has no acceptable row. Every word that
 * names the food must be in the list's name too, so "beef steak" never
 * becomes plain "beef" and "sweet potato" never "sweets".
 */
function localMatch(food: ParsedFood) {
  // "Millet" in the list is dry grain, about 2.5 times cooked: only a cooked row will do.
  const staple = food.method !== "raw" && COOKED_STAPLE.test(food.phrase);
  const entry = lookupNutrition(staple ? `cooked ${food.phrase}` : food.phrase);
  if (!entry) return null;
  const entryWords = new Set(entry.name.toLowerCase().split(/[^a-z]+/).filter(Boolean).map(singular));
  if (!food.required.every((w) => entryWords.has(w))) return null;
  if (staple && !/\b(cooked|boiled)\b/.test(entry.name.toLowerCase())) return null;
  return entry;
}

/**
 * Per-100 g nutrition for a food seen on a plate, by name (and cooking method
 * when the AI gave one separately). Built for food as served: see
 * platedMatch.ts for why photos don't use the recipe lookup.
 *
 * CoFID first, then BiteSync's own food list. Never an AI estimate: the AI
 * only names foods and guesses weights. Null when nothing acceptable
 * matched, which the review screen shows as "couldn't match" and leaves out
 * of the totals (DEC-005).
 */
export async function matchFood(name: string, method: CookingMethod | null = null): Promise<FoodMatch | null> {
  const trimmed = name.trim();
  if (trimmed.length < 2) return null;
  const food = parseFoodName(trimmed, method);
  if (!food.required.length) return null;

  let index: Awaited<ReturnType<typeof loadCofidIndex>> = [];
  try {
    index = await loadCofidIndex();
  } catch (err) {
    console.warn("[photo-meal] CoFID index:", err instanceof Error ? err.message : err);
  }
  // The full name first; then simpler ones ("chicken in tomato sauce" → chicken).
  for (const candidate of [food, ...fallbackFoods(trimmed, method)]) {
    const match = await matchParsed(candidate, index, lookupMicros(candidate.phrase) ?? lookupMicros(trimmed));
    if (match) return match;
  }
  return null;
}

async function matchParsed(
  food: ParsedFood,
  index: Awaited<ReturnType<typeof loadCofidIndex>>,
  micros100: FoodMatch["micros100"],
): Promise<FoodMatch | null> {
  const pick = pickCofidRow(food, index);
  if (pick) {
    const row = await cofidNutritionByCode(pick.row.food_code);
    if (row && row.kcal != null) {
      return {
        per100: {
          kcal: row.kcal,
          protein: row.protein_g ?? 0,
          carbs: row.carbs_g ?? 0,
          fat: row.fat_g ?? 0,
          fibre: row.fibre_g ?? 0,
        },
        more100: { sugar: row.sugars_g, sodiumMg: row.sodium_mg, saturatedFat: row.saturated_fat_g },
        micros100,
        source: `CoFID: ${row.food_name}`,
        cofid: { name: row.food_name, code: row.food_code },
      };
    }
  }

  const local = localMatch(food);
  if (!local) return null;
  const p = local.per_100g;
  return {
    per100: { kcal: p.calories, protein: p.protein_g, carbs: p.carbs_g, fat: p.fat_g, fibre: p.fibre_g },
    more100: { sugar: p.sugar_g, sodiumMg: p.sodium_mg, saturatedFat: p.saturated_fat_g ?? null },
    micros100,
    source: "BiteSync food list",
    cofid: null,
  };
}
