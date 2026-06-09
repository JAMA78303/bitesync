"use client";

import { useEffect, useMemo, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import type { NutritionTotals } from "@/lib/nutrition/calculate";
import type { RecipeIngredientInput } from "@/lib/nutrition/calculate";
import {
  lookupNutritionClient,
  type ClientNutritionResult,
} from "@/lib/nutrition/clientLookup";

export type IngredientLineMeta = {
  lookingUp: boolean;
  matchHint: string | null;
  unknown: boolean;
};

const EMPTY_TOTALS: NutritionTotals = {
  calories: 0,
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0,
  fibre_g: 0,
  sugar_g: 0,
  sodium_mg: 0,
  saturated_fat_g: 0,
  coverage_pct: 0,
};

function isValidLine(ing: RecipeIngredientInput): boolean {
  return Boolean(ing.name.trim()) && Number.isFinite(ing.quantity) && ing.quantity > 0;
}

function totalsFromLines(
  ingredients: RecipeIngredientInput[],
  byIndex: Map<number, ClientNutritionResult | null>,
): NutritionTotals {
  const valid = ingredients.filter(isValidLine);
  if (!valid.length) return { ...EMPTY_TOTALS };

  const totals = { ...EMPTY_TOTALS };
  let matched = 0;

  let idx = 0;
  for (const ing of ingredients) {
    if (!isValidLine(ing)) continue;
    const line = byIndex.get(idx);
    idx += 1;
    if (!line) continue;
    matched += 1;
    totals.calories += line.kcal;
    totals.protein_g += line.protein;
    totals.carbs_g += line.carbs;
    totals.fat_g += line.fat;
    totals.fibre_g += line.fibre;
    totals.sugar_g += line.sugar_g;
    totals.sodium_mg += line.sodium_mg;
    totals.saturated_fat_g += line.saturated_fat_g;
  }

  totals.coverage_pct = Math.round((matched / valid.length) * 100);
  return totals;
}

/**
 * Debounced CoFID/local nutrition preview for recipe forms (matches server save path).
 */
export function useLiveRecipeNutrition(ingredients: RecipeIngredientInput[]) {
  const [lineResults, setLineResults] = useState<Map<number, ClientNutritionResult | null>>(
    () => new Map(),
  );
  const [lookingUp, setLookingUp] = useState(false);

  const validSignature = useMemo(
    () =>
      ingredients
        .map((ing) =>
          isValidLine(ing)
            ? `${ing.name.trim().toLowerCase()}|${ing.quantity}|${ing.unit}`
            : "",
        )
        .join(";"),
    [ingredients],
  );

  const runLookup = useDebouncedCallback(async (rows: RecipeIngredientInput[]) => {
    const valid = rows.filter(isValidLine);
    if (!valid.length) {
      setLineResults(new Map());
      setLookingUp(false);
      return;
    }

    setLookingUp(true);
    try {
      const results = await Promise.all(
        valid.map((ing) => lookupNutritionClient(ing.name.trim(), ing.quantity, ing.unit)),
      );
      const next = new Map<number, ClientNutritionResult | null>();
      results.forEach((r, i) => next.set(i, r));
      setLineResults(next);
    } finally {
      setLookingUp(false);
    }
  }, 600);

  useEffect(() => {
    void runLookup(ingredients);
  }, [validSignature, ingredients, runLookup]);

  const totals = useMemo(
    () => totalsFromLines(ingredients, lineResults),
    [ingredients, lineResults],
  );

  const lineMetaByIngredientIndex = useMemo(() => {
    const meta: IngredientLineMeta[] = ingredients.map(() => ({
      lookingUp: false,
      matchHint: null,
      unknown: false,
    }));

    let validIdx = 0;
    for (let i = 0; i < ingredients.length; i += 1) {
      if (!isValidLine(ingredients[i])) continue;
      const result = lineResults.get(validIdx);
      validIdx += 1;

      if (lookingUp && !result) {
        meta[i] = { lookingUp: true, matchHint: null, unknown: false };
        continue;
      }

      if (!result) {
        meta[i] = { lookingUp: false, matchHint: null, unknown: true };
        continue;
      }

      const hint = result.cofid_food_name ? `Matched to: ${result.cofid_food_name}` : null;

      meta[i] = { lookingUp: false, matchHint: hint, unknown: false };
    }

    return meta;
  }, [ingredients, lineResults, lookingUp]);

  return { totals, lookingUp, lineMetaByIngredientIndex };
}
