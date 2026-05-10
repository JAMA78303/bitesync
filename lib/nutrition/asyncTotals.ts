import { ingredientGrams } from "@/lib/nutrition/convert";
import { lookupNutrition } from "@/lib/nutrition/lookup";
import type { NutritionLookupEntry } from "@/types";
import { estimateNutritionWithAI } from "@/lib/nutrition/estimateWithAI";
import type { NutritionTotals, RecipeIngredientInput } from "@/lib/nutrition/calculate";

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

function isIncomplete(entry: NutritionLookupEntry): boolean {
  const p = entry.per_100g;
  return (
    p.calories > 0 &&
    p.protein_g === 0 &&
    p.carbs_g === 0 &&
    p.fat_g === 0
  );
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
): Promise<{ contribution: ReturnType<typeof emptyLine>; estimated: boolean }> {
  const base = emptyLine();
  const entry = lookupNutrition(ing.name);
  const grams = ingredientGrams(ing.quantity, ing.unit, entry, ing.name);

  const tryAi = aiEnabled && Boolean(process.env.ANTHROPIC_API_KEY);

  if (entry && grams != null && grams > 0 && !isIncomplete(entry)) {
    const r = grams / 100;
    const p = entry.per_100g;
    sumPartial(base, {
      calories: p.calories * r,
      protein_g: p.protein_g * r,
      carbs_g: p.carbs_g * r,
      fat_g: p.fat_g * r,
      fibre_g: p.fibre_g * r,
      sugar_g: p.sugar_g * r,
      sodium_mg: p.sodium_mg * r,
      saturated_fat_g: p.saturated_fat_g * r,
    });
    return { contribution: base, estimated: false };
  }

  if (entry && grams != null && grams > 0 && isIncomplete(entry) && tryAi) {
    const ai = await estimateNutritionWithAI(ing.name, ing.quantity, ing.unit);
    const r = grams / 100;
    const dbKcal = entry.per_100g.calories * r;
    if (ai && ai.kcal > 0) {
      const scale = dbKcal / ai.kcal;
      sumPartial(base, {
        calories: dbKcal,
        protein_g: ai.protein * scale,
        carbs_g: ai.carbs * scale,
        fat_g: ai.fat * scale,
        fibre_g: ai.fibre * scale,
        sugar_g: entry.per_100g.sugar_g * r,
        sodium_mg: entry.per_100g.sodium_mg * r,
        saturated_fat_g: entry.per_100g.saturated_fat_g * r,
      });
      return { contribution: base, estimated: true };
    }
    const p = entry.per_100g;
    sumPartial(base, {
      calories: dbKcal,
      protein_g: p.protein_g * r,
      carbs_g: p.carbs_g * r,
      fat_g: p.fat_g * r,
      fibre_g: p.fibre_g * r,
      sugar_g: p.sugar_g * r,
      sodium_mg: p.sodium_mg * r,
      saturated_fat_g: p.saturated_fat_g * r,
    });
    return { contribution: base, estimated: false };
  }

  if (tryAi) {
    const ai = await estimateNutritionWithAI(ing.name, ing.quantity, ing.unit);
    if (ai && (ai.kcal > 0 || ai.protein > 0)) {
      sumPartial(base, {
        calories: ai.kcal,
        protein_g: ai.protein,
        carbs_g: ai.carbs,
        fat_g: ai.fat,
        fibre_g: ai.fibre,
      });
      return { contribution: base, estimated: true };
    }
  }

  return { contribution: base, estimated: false };
}

export async function calculateRecipeNutritionWithMeta(
  ingredients: RecipeIngredientInput[],
  opts?: { aiEnabled?: boolean },
): Promise<{ totals: NutritionTotals; estimatedFlags: boolean[] }> {
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
    return { totals: EMPTY, estimatedFlags: ingredients.map(() => false) };
  }

  const aiEnabled = opts?.aiEnabled ?? true;
  const rows = await Promise.all(valid.map((ing) => resolveIngredientLineAsync(ing, aiEnabled)));

  let matched = 0;
  const totals = emptyLine();
  const estimatedFlags = rows.map((row) => row.estimated);
  for (const row of rows) {
    const hasData =
      row.contribution.calories > 0 ||
      row.contribution.protein_g > 0 ||
      row.contribution.carbs_g > 0 ||
      row.contribution.fat_g > 0;
    if (hasData) matched += 1;
    sumPartial(totals, row.contribution);
  }

  return {
    totals: {
      ...totals,
      coverage_pct: Math.round((matched / valid.length) * 100),
    },
    estimatedFlags,
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
