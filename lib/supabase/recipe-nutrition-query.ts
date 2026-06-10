import type { SupabaseClient } from "@supabase/supabase-js";
import type { NutritionTotals, RecipeIngredientInput } from "@/lib/nutrition/calculate";
import { getRecipeNutritionTotals } from "@/lib/nutrition/recipeNutritionTotals";
import type { RecipeNutritionSummary } from "@/lib/utils/recipe-nutrition";

export function totalsToNutritionSummary(totals: NutritionTotals): RecipeNutritionSummary {
  return {
    calories: totals.calories,
    protein_g: totals.protein_g,
    carbs_g: totals.carbs_g,
    fat_g: totals.fat_g,
    fibre_g: totals.fibre_g,
    sugar_g: totals.sugar_g,
    sodium_mg: totals.sodium_mg,
    saturated_fat_g: totals.saturated_fat_g,
    coverage_pct: totals.coverage_pct,
  };
}

/** Coerces Postgres/JSON numeric strings and drops unusable rows. */
export function sanitizeRecipeNutritionRow(raw: Record<string, unknown> | null): RecipeNutritionSummary | null {
  if (!raw) return null;
  const n = (v: unknown): number | null => {
    if (v == null) return null;
    const x = typeof v === "number" ? v : Number.parseFloat(String(v));
    return Number.isFinite(x) ? x : null;
  };

  const calories = n(raw.calories);
  const protein_g = n(raw.protein_g);
  const carbs_g = n(raw.carbs_g);
  const fat_g = n(raw.fat_g);
  const fibre_g = n(raw.fibre_g);
  const sugar_g = n(raw.sugar_g);
  const sodium_mg = n(raw.sodium_mg);
  const saturated_fat_g = n(raw.saturated_fat_g);
  const coverage_pct = n(raw.coverage_pct);

  if (
    calories == null &&
    protein_g == null &&
    carbs_g == null &&
    fat_g == null
  ) {
    return null;
  }

  return {
    calories,
    protein_g,
    carbs_g,
    fat_g,
    fibre_g,
    sugar_g,
    sodium_mg,
    saturated_fat_g,
    coverage_pct,
  };
}

export type FetchRecipeNutritionOptions = {
  /** When false, skip deriving missing rows from ingredients (fast list views). Default true. */
  fillMissing?: boolean;
  /** Used when fillMissing is true. Default false — avoid AI on bulk reads. */
  aiEnabled?: boolean;
};

async function fillNutritionFromIngredients(
  supabase: SupabaseClient,
  recipeIds: string[],
  map: Map<string, RecipeNutritionSummary>,
  aiEnabled: boolean,
): Promise<void> {
  const missing = recipeIds.filter((id) => !map.has(id));
  if (!missing.length) return;

  const { data: ingredientRows, error: ingError } = await supabase
    .from("recipe_ingredients")
    .select("recipe_id,name,quantity,unit")
    .in("recipe_id", missing);

  if (ingError) return;

  const byRecipe = new Map<string, RecipeIngredientInput[]>();
  for (const row of ingredientRows ?? []) {
    const rid = row.recipe_id as string;
    const qty = typeof row.quantity === "number" ? row.quantity : Number.parseFloat(String(row.quantity));
    const list = byRecipe.get(rid) ?? [];
    list.push({
      name: String(row.name ?? ""),
      quantity: Number.isFinite(qty) ? qty : 0,
      unit: String(row.unit ?? ""),
    });
    byRecipe.set(rid, list);
  }

  const computed = await Promise.all(
    missing.map(async (rid) => {
      try {
        const inputs = byRecipe.get(rid) ?? [];
        const { totals } = await getRecipeNutritionTotals(inputs, { aiEnabled });
        return { rid, totals, summary: totalsToNutritionSummary(totals) };
      } catch (err) {
        console.warn(`[fetchRecipeNutritionMap] failed to derive nutrition for ${rid}:`, err);
        const totals: NutritionTotals = {
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
        return {
          rid,
          totals,
          summary: totalsToNutritionSummary(totals),
        };
      }
    }),
  );

  const upsertRows: Array<{
    recipe_id: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fibre_g: number;
    sugar_g: number;
    sodium_mg: number;
    saturated_fat_g: number;
    coverage_pct: number;
  }> = [];

  for (const { rid, totals, summary } of computed) {
    map.set(rid, summary);
    upsertRows.push({
      recipe_id: rid,
      calories: totals.calories,
      protein_g: totals.protein_g,
      carbs_g: totals.carbs_g,
      fat_g: totals.fat_g,
      fibre_g: totals.fibre_g,
      sugar_g: totals.sugar_g,
      sodium_mg: totals.sodium_mg,
      saturated_fat_g: totals.saturated_fat_g,
      coverage_pct: totals.coverage_pct,
    });
  }

  if (upsertRows.length) {
    await supabase.from("recipe_nutrition").upsert(upsertRows, { onConflict: "recipe_id" });
  }
}

export async function fetchRecipeNutritionMap(
  supabase: SupabaseClient,
  recipeIds: string[],
  opts?: FetchRecipeNutritionOptions,
): Promise<Map<string, RecipeNutritionSummary>> {
  const fillMissing = opts?.fillMissing ?? true;
  const aiEnabled = opts?.aiEnabled ?? false;
  const map = new Map<string, RecipeNutritionSummary>();
  const ids = [...new Set(recipeIds)].filter(Boolean);
  if (!ids.length) return map;

  const { data, error } = await supabase
    .from("recipe_nutrition")
    .select(
      "recipe_id, calories, protein_g, carbs_g, fat_g, fibre_g, sugar_g, sodium_mg, saturated_fat_g, coverage_pct",
    )
    .in("recipe_id", ids);

  if (!error && data?.length) {
    for (const row of data) {
      const rid = row.recipe_id as string;
      const cleaned = sanitizeRecipeNutritionRow(row as Record<string, unknown>);
      if (cleaned) map.set(rid, cleaned);
    }
  }

  if (fillMissing) {
    /* When table rows are missing, RLS blocked the read, or rows failed sanitization — derive from ingredients. */
    await fillNutritionFromIngredients(supabase, ids, map, aiEnabled);
  }

  return map;
}

export async function fetchRecipeNutritionForRecipe(
  supabase: SupabaseClient,
  recipeId: string,
): Promise<RecipeNutritionSummary | null> {
  const m = await fetchRecipeNutritionMap(supabase, [recipeId]);
  return m.get(recipeId) ?? null;
}
