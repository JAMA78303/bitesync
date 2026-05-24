import type { CoFIDMatchKind } from "@/lib/nutrition/cofidLookup";
import { lookupNutritionAsync } from "@/lib/nutrition/lookupAsync";
import type { NutritionTotals, RecipeIngredientInput } from "@/lib/nutrition/calculate";

export type IngredientCofidMeta = {
  cofid_food_name?: string;
  cofid_matched_by?: CoFIDMatchKind;
};

function emptyLine(): Pick<
  NutritionTotals,
  | "calories"
  | "protein_g"
  | "carbs_g"
  | "fat_g"
  | "fibre_g"
  | "sugar_g"
  | "sodium_mg"
  | "saturated_fat_g"
> {
  return {
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    fibre_g: 0,
    sugar_g: 0,
    sodium_mg: 0,
    saturated_fat_g: 0,
  };
}

function sumPartial(a: ReturnType<typeof emptyLine>, b: Partial<ReturnType<typeof emptyLine>>): void {
  a.calories += b.calories ?? 0;
  a.protein_g += b.protein_g ?? 0;
  a.carbs_g += b.carbs_g ?? 0;
  a.fat_g += b.fat_g ?? 0;
  a.fibre_g += b.fibre_g ?? 0;
  a.sugar_g += b.sugar_g ?? 0;
  a.sodium_mg += b.sodium_mg ?? 0;
  a.saturated_fat_g += b.saturated_fat_g ?? 0;
}

export async function resolveIngredientLineAsync(
  ing: RecipeIngredientInput,
  aiEnabled: boolean,
): Promise<{
  contribution: ReturnType<typeof emptyLine>;
  estimated: boolean;
  cofid?: IngredientCofidMeta;
}> {
  const base = emptyLine();
  const resolved = await lookupNutritionAsync(ing.name, ing.quantity, ing.unit, {
    skipAI: !aiEnabled,
  });

  if (!resolved) {
    return { contribution: base, estimated: false };
  }

  sumPartial(base, {
    calories: resolved.kcal,
    protein_g: resolved.protein,
    carbs_g: resolved.carbs,
    fat_g: resolved.fat,
    fibre_g: resolved.fibre,
    sugar_g: resolved.sugar_g,
    sodium_mg: resolved.sodium_mg,
    saturated_fat_g: resolved.saturated_fat_g,
  });

  const cofid: IngredientCofidMeta | undefined =
    resolved.source === "cofid"
      ? {
          cofid_food_name: resolved.cofid_food_name,
          cofid_matched_by: resolved.cofid_matched_by,
        }
      : undefined;

  return {
    contribution: base,
    estimated: resolved.estimated,
    cofid,
  };
}

export async function calculateRecipeNutritionWithMeta(
  ingredients: RecipeIngredientInput[],
  opts?: { aiEnabled?: boolean },
): Promise<{
  totals: NutritionTotals;
  estimatedFlags: boolean[];
  cofidMeta: IngredientCofidMeta[];
}> {
  const valid = ingredients.filter(
    (i) => i.name.trim() && Number.isFinite(i.quantity) && i.quantity > 0,
  );

  const EMPTY: NutritionTotals = {
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

  if (!valid.length) {
    return {
      totals: EMPTY,
      estimatedFlags: ingredients.map(() => false),
      cofidMeta: ingredients.map(() => ({})),
    };
  }

  const aiEnabled = opts?.aiEnabled ?? true;
  const rows = await Promise.all(valid.map((ing) => resolveIngredientLineAsync(ing, aiEnabled)));

  let matched = 0;
  const totals = emptyLine();
  const estimatedFlags = rows.map((row) => row.estimated);
  const cofidMeta = rows.map((row) => row.cofid ?? {});
  for (const row of rows) {
    const hasData =
      row.contribution.calories > 0 ||
      row.contribution.protein_g > 0 ||
      row.contribution.carbs_g > 0 ||
      row.contribution.fat_g > 0;
    if (hasData) matched += 1;
    sumPartial(totals, row.contribution);
  }

  const fullCofidMeta: IngredientCofidMeta[] = [];
  let validIdx = 0;
  for (const ing of ingredients) {
    const isValid = ing.name.trim() && Number.isFinite(ing.quantity) && ing.quantity > 0;
    if (isValid) {
      fullCofidMeta.push(cofidMeta[validIdx] ?? {});
      validIdx += 1;
    } else {
      fullCofidMeta.push({});
    }
  }

  const fullEstimatedFlags: boolean[] = [];
  validIdx = 0;
  for (const ing of ingredients) {
    const isValid = ing.name.trim() && Number.isFinite(ing.quantity) && ing.quantity > 0;
    if (isValid) {
      fullEstimatedFlags.push(estimatedFlags[validIdx] ?? false);
      validIdx += 1;
    } else {
      fullEstimatedFlags.push(false);
    }
  }

  return {
    totals: {
      ...totals,
      coverage_pct: Math.round((matched / valid.length) * 100),
    },
    estimatedFlags: fullEstimatedFlags,
    cofidMeta: fullCofidMeta,
  };
}

/** @deprecated Prefer calculateRecipeNutritionWithMeta when you need both totals and flags. */
export async function calculateRecipeNutritionAsync(
  ingredients: RecipeIngredientInput[],
  opts?: { aiEnabled?: boolean },
): Promise<NutritionTotals> {
  const { totals } = await calculateRecipeNutritionWithMeta(ingredients, opts);
  return totals;
}
