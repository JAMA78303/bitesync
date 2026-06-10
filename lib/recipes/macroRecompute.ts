import type { SupabaseClient } from "@supabase/supabase-js";
import type { IngredientCofidMeta } from "@/lib/nutrition/asyncTotals";
import { calculateRecipeNutritionWithMeta } from "@/lib/nutrition/asyncTotals";
import type { RecipeIngredientInput } from "@/lib/nutrition/calculate";
import {
  parseIngredientLine,
  parsedIngredientToInput,
} from "@/lib/recipes/parseIngredient";

export const DEFAULT_OUTLIER_THRESHOLD = 0.4;

export type StoredIngredientRow = {
  id: string;
  name: string;
  quantity: number;
  unit: string | null;
  cofid_food_name?: string | null;
  cofid_matched_by?: string | null;
};

export type StoredNutritionRow = {
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fibre_g: number | null;
  sugar_g: number | null;
  sodium_mg: number | null;
  saturated_fat_g: number | null;
  coverage_pct: number | null;
};

export type RecipeRecord = {
  id: string;
  user_id: string;
  name: string;
  ingredients: StoredIngredientRow[];
  nutrition: StoredNutritionRow | null;
};

export type IngredientRepairDetail = {
  before: RecipeIngredientInput;
  after: RecipeIngredientInput;
  repaired: boolean;
};

export type RecipeRecomputeResult = {
  recipeId: string;
  recipeName: string;
  userId: string;
  oldCalories: number | null;
  newCalories: number;
  oldProteinG: number | null;
  newProteinG: number;
  caloriesDeltaPct: number | null;
  significantChange: boolean;
  ingredientsChanged: boolean;
  ingredientRepairs: IngredientRepairDetail[];
  cofidMatchesChanged: boolean;
  nutrition: StoredNutritionRow;
  ingredients: RecipeIngredientInput[];
  estimatedFlags: boolean[];
  cofidMeta: IngredientCofidMeta[];
};

export type PlannerSlotReport = {
  entryId: string;
  mealPlanId: string;
  userId: string;
  dayOfWeek: number;
  mealType: string;
  recipeId: string;
  recipeName: string;
  oldCalories: number | null;
  newCalories: number;
};

export type MacroRecomputeReport = {
  dryRun: boolean;
  aiEnabled: boolean;
  outlierThreshold: number;
  totalRecipes: number;
  recomputed: number;
  unchanged: number;
  significantChanges: RecipeRecomputeResult[];
  plannerSlotsAffected: PlannerSlotReport[];
  highCaloriePlannerSlotsAfter: PlannerSlotReport[];
  errors: { recipeId: string; message: string }[];
};

/** Small batches — each recipe triggers many parallel CoFID lookups (Vercel 60s limit). */
export const MACRO_RECOMPUTE_BATCH_SIZE = 5;

export type MacroRecomputeBatchResult = MacroRecomputeReport & {
  batchOffset: number;
  batchProcessed: number;
  hasMore: boolean;
  nextOffset: number;
};

function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function inputsEqual(a: RecipeIngredientInput, b: RecipeIngredientInput): boolean {
  return (
    a.name.trim().toLowerCase() === b.name.trim().toLowerCase() &&
    Math.round(a.quantity * 1000) === Math.round(b.quantity * 1000) &&
    (a.unit ?? "").trim().toLowerCase() === (b.unit ?? "").trim().toLowerCase()
  );
}

function reconstructRawText(row: StoredIngredientRow): string {
  const qty = Number(row.quantity);
  const unit = (row.unit ?? "").trim();
  const name = row.name.trim();
  const parts: string[] = [];
  if (Number.isFinite(qty) && qty > 0) parts.push(String(qty));
  if (unit && unit.toLowerCase() !== "piece" && unit.toLowerCase() !== "pieces") {
    parts.push(unit);
  }
  parts.push(name);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function looksMangledIngredient(name: string, unit: string): boolean {
  return (
    unit === "piece" ||
    unit === "pieces" ||
    /\b(?:tbsp|tsp|tablespoon|teaspoon)\b/i.test(name) ||
    /\b\d+\s*[-–]\s*\d+\b/.test(name) ||
    /\(\s*(?:about\s*)?~?\d+(?:\.\d+)?\s*(?:g|kg)\s*\)/i.test(name) ||
    /^\d+(?:\.\d+)?\s+(?:piece|pieces)\b/i.test(name)
  );
}

/** Re-parse stored ingredient rows using the corrected parser where possible. */
export function repairStoredIngredient(row: StoredIngredientRow): IngredientRepairDetail {
  const before: RecipeIngredientInput = {
    name: row.name.trim(),
    quantity: Number(row.quantity),
    unit: (row.unit ?? "").trim(),
  };

  if (!looksMangledIngredient(before.name, before.unit.toLowerCase())) {
    const unit = before.unit.toLowerCase();
    const after: RecipeIngredientInput = {
      ...before,
      unit: unit === "piece" || unit === "pieces" ? "" : before.unit,
    };
    return { before, after, repaired: !inputsEqual(before, after) };
  }

  const candidates = [reconstructRawText(row), row.name.trim()].filter(Boolean);
  for (const raw of candidates) {
    const parsed = parseIngredientLine(raw);
    const after = parsedIngredientToInput(parsed);
    if (after.name.trim() && after.quantity > 0) {
      return { before, after, repaired: !inputsEqual(before, after) };
    }
  }

  const unit = before.unit.toLowerCase();
  const after: RecipeIngredientInput = {
    name: before.name,
    quantity: before.quantity,
    unit: unit === "piece" || unit === "pieces" ? "" : before.unit,
  };
  return { before, after, repaired: !inputsEqual(before, after) };
}

export function buildIngredientInsertRows(
  recipeId: string,
  ingredients: RecipeIngredientInput[],
  estimatedFlags: boolean[],
  cofidMeta: IngredientCofidMeta[],
) {
  return ingredients.map((ingredient, i) => ({
    recipe_id: recipeId,
    name: toTitleCase(ingredient.name.trim()),
    quantity: ingredient.quantity,
    unit: (ingredient.unit ?? "").trim(),
    nutrition_estimated: estimatedFlags[i] ?? false,
    cofid_food_name: cofidMeta[i]?.cofid_food_name ?? null,
    cofid_matched_by: cofidMeta[i]?.cofid_matched_by ?? null,
  }));
}

function caloriesDeltaPct(oldCalories: number | null, newCalories: number): number | null {
  if (oldCalories == null || oldCalories <= 0) return newCalories > 0 ? 1 : 0;
  return Math.abs(newCalories - oldCalories) / oldCalories;
}

export function isSignificantMacroChange(
  oldCalories: number | null,
  newCalories: number,
  threshold = DEFAULT_OUTLIER_THRESHOLD,
): boolean {
  if (oldCalories == null) return newCalories > 0;
  if (oldCalories === 0 && newCalories === 0) return false;
  const pct = caloriesDeltaPct(oldCalories, newCalories);
  return pct != null && pct > threshold;
}

export async function recomputeRecipeMacros(
  recipe: RecipeRecord,
  opts?: { aiEnabled?: boolean; outlierThreshold?: number },
): Promise<RecipeRecomputeResult> {
  const repairs = recipe.ingredients.map(repairStoredIngredient);
  const ingredients = repairs.map((r) => r.after);
  const ingredientsChanged = repairs.some((r) => r.repaired);

  const { totals, estimatedFlags, cofidMeta } = await calculateRecipeNutritionWithMeta(ingredients, {
    aiEnabled: opts?.aiEnabled ?? false,
  });

  const oldCalories = recipe.nutrition?.calories ?? null;
  const newCalories = Math.round(totals.calories);
  const threshold = opts?.outlierThreshold ?? DEFAULT_OUTLIER_THRESHOLD;

  const oldCofid = recipe.ingredients.map((i) => i.cofid_food_name ?? null);
  const newCofid = cofidMeta.map((m) => m.cofid_food_name ?? null);
  const cofidMatchesChanged = oldCofid.some((v, idx) => v !== newCofid[idx]);

  return {
    recipeId: recipe.id,
    recipeName: recipe.name,
    userId: recipe.user_id,
    oldCalories,
    newCalories,
    oldProteinG: recipe.nutrition?.protein_g ?? null,
    newProteinG: Math.round(totals.protein_g * 10) / 10,
    caloriesDeltaPct: caloriesDeltaPct(oldCalories, newCalories),
    significantChange: isSignificantMacroChange(oldCalories, newCalories, threshold),
    ingredientsChanged,
    ingredientRepairs: repairs.filter((r) => r.repaired),
    cofidMatchesChanged,
    nutrition: {
      calories: newCalories,
      protein_g: Math.round(totals.protein_g * 10) / 10,
      carbs_g: Math.round(totals.carbs_g * 10) / 10,
      fat_g: Math.round(totals.fat_g * 10) / 10,
      fibre_g: Math.round(totals.fibre_g * 10) / 10,
      sugar_g: Math.round(totals.sugar_g * 10) / 10,
      sodium_mg: Math.round(totals.sodium_mg * 10) / 10,
      saturated_fat_g: Math.round(totals.saturated_fat_g * 10) / 10,
      coverage_pct: totals.coverage_pct,
    },
    ingredients,
    estimatedFlags,
    cofidMeta,
  };
}

export async function loadRecipesForRecompute(
  supabase: SupabaseClient,
  userId?: string,
): Promise<RecipeRecord[]> {
  let recipeQuery = supabase
    .from("recipes")
    .select("id,user_id,name")
    .is("archived_at", null)
    .order("created_at", { ascending: true });

  if (userId) recipeQuery = recipeQuery.eq("user_id", userId);

  const { data: recipes, error } = await recipeQuery;
  if (error) throw new Error(error.message);
  if (!recipes?.length) return [];

  const ids = recipes.map((r) => r.id);
  const [{ data: ingredientRows }, { data: nutritionRows }] = await Promise.all([
    supabase
      .from("recipe_ingredients")
      .select("id,recipe_id,name,quantity,unit,cofid_food_name,cofid_matched_by")
      .in("recipe_id", ids),
    supabase
      .from("recipe_nutrition")
      .select(
        "recipe_id,calories,protein_g,carbs_g,fat_g,fibre_g,sugar_g,sodium_mg,saturated_fat_g,coverage_pct",
      )
      .in("recipe_id", ids),
  ]);

  const ingredientsByRecipe = new Map<string, StoredIngredientRow[]>();
  for (const row of ingredientRows ?? []) {
    const list = ingredientsByRecipe.get(row.recipe_id) ?? [];
    list.push({
      id: row.id,
      name: row.name,
      quantity: Number(row.quantity),
      unit: row.unit,
      cofid_food_name: row.cofid_food_name,
      cofid_matched_by: row.cofid_matched_by,
    });
    ingredientsByRecipe.set(row.recipe_id, list);
  }

  const nutritionByRecipe = new Map<string, StoredNutritionRow>();
  for (const row of nutritionRows ?? []) {
    nutritionByRecipe.set(row.recipe_id, {
      calories: row.calories,
      protein_g: row.protein_g,
      carbs_g: row.carbs_g,
      fat_g: row.fat_g,
      fibre_g: row.fibre_g,
      sugar_g: row.sugar_g,
      sodium_mg: row.sodium_mg,
      saturated_fat_g: row.saturated_fat_g,
      coverage_pct: row.coverage_pct,
    });
  }

  return recipes
    .map((recipe) => ({
      id: recipe.id,
      user_id: recipe.user_id,
      name: recipe.name,
      ingredients: ingredientsByRecipe.get(recipe.id) ?? [],
      nutrition: nutritionByRecipe.get(recipe.id) ?? null,
    }))
    .filter((recipe) => recipe.ingredients.length > 0);
}

export type PlannerChangeSnapshot = {
  recipeId: string;
  recipeName: string;
  userId: string;
  oldCalories: number | null;
  newCalories: number;
};

async function loadPlannerImpact(
  supabase: SupabaseClient,
  changed: PlannerChangeSnapshot[],
): Promise<PlannerSlotReport[]> {
  if (!changed.length) return [];
  const recipeIds = changed.map((r) => r.recipeId);
  const newByRecipe = new Map(changed.map((r) => [r.recipeId, r]));

  const { data: entries, error } = await supabase
    .from("meal_plan_entries")
    .select("id,meal_plan_id,recipe_id,day_of_week,meal_type")
    .in("recipe_id", recipeIds);

  if (error || !entries?.length) return [];

  const planIds = [...new Set(entries.map((e) => e.meal_plan_id))];
  const { data: plans } = await supabase.from("meal_plans").select("id,user_id").in("id", planIds);
  const userByPlan = new Map((plans ?? []).map((p) => [p.id, p.user_id]));

  const recipeNames = new Map(changed.map((r) => [r.recipeId, r.recipeName]));

  return entries
    .filter((entry) => entry.recipe_id)
    .map((entry) => {
      const recipeId = entry.recipe_id as string;
      const result = newByRecipe.get(recipeId);
      if (!result) return null;
      return {
        entryId: entry.id,
        mealPlanId: entry.meal_plan_id,
        userId: userByPlan.get(entry.meal_plan_id) ?? result.userId,
        dayOfWeek: entry.day_of_week,
        mealType: entry.meal_type,
        recipeId,
        recipeName: recipeNames.get(recipeId) ?? result.recipeName,
        oldCalories: result.oldCalories,
        newCalories: result.newCalories,
      } satisfies PlannerSlotReport;
    })
    .filter((row): row is PlannerSlotReport => row != null);
}

export async function applyRecipeRecompute(
  supabase: SupabaseClient,
  result: RecipeRecomputeResult,
): Promise<void> {
  const rows = buildIngredientInsertRows(
    result.recipeId,
    result.ingredients,
    result.estimatedFlags,
    result.cofidMeta,
  );

  const { error: deleteError } = await supabase
    .from("recipe_ingredients")
    .delete()
    .eq("recipe_id", result.recipeId);
  if (deleteError) throw new Error(deleteError.message);

  const { error: insertError } = await supabase.from("recipe_ingredients").insert(rows);
  if (insertError) throw new Error(insertError.message);

  const { error: nutritionError } = await supabase.from("recipe_nutrition").upsert(
    {
      recipe_id: result.recipeId,
      ...result.nutrition,
    },
    { onConflict: "recipe_id" },
  );
  if (nutritionError) throw new Error(nutritionError.message);
}

function nutritionUnchanged(
  stored: StoredNutritionRow | null,
  next: StoredNutritionRow,
  ingredientsChanged: boolean,
): boolean {
  if (ingredientsChanged) return false;
  if (!stored) return false;
  return (
    Math.round(stored.calories ?? 0) === Math.round(next.calories ?? 0) &&
    Math.round((stored.protein_g ?? 0) * 10) === Math.round((next.protein_g ?? 0) * 10) &&
    Math.round((stored.carbs_g ?? 0) * 10) === Math.round((next.carbs_g ?? 0) * 10) &&
    Math.round((stored.fat_g ?? 0) * 10) === Math.round((next.fat_g ?? 0) * 10) &&
    (stored.coverage_pct ?? 0) === (next.coverage_pct ?? 0)
  );
}

export async function runMacroRecomputeMigration(opts: {
  supabase: SupabaseClient;
  dryRun: boolean;
  userId?: string;
  aiEnabled?: boolean;
  outlierThreshold?: number;
  offset?: number;
  limit?: number;
  /** Aggregated significant changes from prior batches (for planner report on final batch). */
  plannerSnapshots?: PlannerChangeSnapshot[];
}): Promise<MacroRecomputeBatchResult> {
  const allRecipes = await loadRecipesForRecompute(opts.supabase, opts.userId);
  const offset = Math.max(0, opts.offset ?? 0);
  const limit = Math.max(1, opts.limit ?? MACRO_RECOMPUTE_BATCH_SIZE);
  const recipes = allRecipes.slice(offset, offset + limit);
  const hasMore = offset + limit < allRecipes.length;

  const report: MacroRecomputeReport = {
    dryRun: opts.dryRun,
    aiEnabled: opts.aiEnabled ?? false,
    outlierThreshold: opts.outlierThreshold ?? DEFAULT_OUTLIER_THRESHOLD,
    totalRecipes: allRecipes.length,
    recomputed: 0,
    unchanged: 0,
    significantChanges: [],
    plannerSlotsAffected: [],
    highCaloriePlannerSlotsAfter: [],
    errors: [],
  };

  const changedResults: RecipeRecomputeResult[] = [];

  for (const recipe of recipes) {
    try {
      const result = await recomputeRecipeMacros(recipe, {
        aiEnabled: opts.aiEnabled,
        outlierThreshold: opts.outlierThreshold,
      });

      const unchanged = nutritionUnchanged(
        recipe.nutrition,
        result.nutrition,
        result.ingredientsChanged || result.cofidMatchesChanged,
      );

      if (unchanged) {
        report.unchanged += 1;
        continue;
      }

      report.recomputed += 1;
      if (result.significantChange) {
        report.significantChanges.push(result);
        changedResults.push(result);
      }

      if (!opts.dryRun) {
        await applyRecipeRecompute(opts.supabase, result);
      }
    } catch (err) {
      report.errors.push({
        recipeId: recipe.id,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (!hasMore) {
    const batchSnapshots: PlannerChangeSnapshot[] = changedResults
      .filter((r) => r.significantChange)
      .map((r) => ({
        recipeId: r.recipeId,
        recipeName: r.recipeName,
        userId: r.userId,
        oldCalories: r.oldCalories,
        newCalories: r.newCalories,
      }));
    const allSnapshots = [...(opts.plannerSnapshots ?? []), ...batchSnapshots];
    report.plannerSlotsAffected = await loadPlannerImpact(opts.supabase, allSnapshots);
    report.highCaloriePlannerSlotsAfter = report.plannerSlotsAffected.filter(
      (slot) => slot.newCalories >= 1000 || (slot.oldCalories != null && slot.oldCalories >= 1000),
    );
  }

  return {
    ...report,
    batchOffset: offset,
    batchProcessed: recipes.length,
    hasMore,
    nextOffset: offset + recipes.length,
  };
}

export function formatMacroRecomputeBatchReport(batch: MacroRecomputeBatchResult): string {
  const batchNum = Math.floor(batch.batchOffset / MACRO_RECOMPUTE_BATCH_SIZE) + 1;
  const totalBatches = Math.max(1, Math.ceil(batch.totalRecipes / MACRO_RECOMPUTE_BATCH_SIZE));
  const header = batch.hasMore
    ? `Batch ${batchNum}/${totalBatches} (recipes ${batch.batchOffset + 1}–${batch.batchOffset + batch.batchProcessed} of ${batch.totalRecipes})`
    : batch.totalRecipes > MACRO_RECOMPUTE_BATCH_SIZE
      ? `Final batch ${batchNum}/${totalBatches}`
      : "";
  const body = formatMacroRecomputeReport(batch);
  return header ? `${header}\n${body}` : body;
}

export function formatMacroRecomputeReport(report: MacroRecomputeReport): string {
  const lines: string[] = [
    `Macro recompute ${report.dryRun ? "(DRY RUN)" : "(APPLIED)"}`,
    `Recipes scanned: ${report.totalRecipes}`,
    `Would change / changed: ${report.recomputed}`,
    `Unchanged (idempotent skip): ${report.unchanged}`,
    `Significant calorie shifts (>${Math.round(report.outlierThreshold * 100)}%): ${report.significantChanges.length}`,
    `Planner slots tied to changed recipes: ${report.plannerSlotsAffected.length}`,
    `High-calorie planner slots after recompute: ${report.highCaloriePlannerSlotsAfter.length}`,
  ];

  if (report.significantChanges.length) {
    lines.push("", "Significant recipe changes (old → new kcal):");
    for (const row of report.significantChanges) {
      const pct =
        row.caloriesDeltaPct != null ? `${Math.round(row.caloriesDeltaPct * 100)}%` : "n/a";
      lines.push(
        `  • ${row.recipeName} (${row.recipeId.slice(0, 8)}…): ${row.oldCalories ?? "?"} → ${row.newCalories} kcal (${pct})`,
      );
      if (row.ingredientRepairs.length) {
        lines.push(`    ingredients repaired: ${row.ingredientRepairs.length}`);
      }
      if (row.cofidMatchesChanged) {
        lines.push("    CoFID matches updated");
      }
    }
  }

  if (report.highCaloriePlannerSlotsAfter.length) {
    lines.push("", "Planner slots with high calories after recompute:");
    for (const slot of report.highCaloriePlannerSlotsAfter) {
      lines.push(
        `  • ${slot.recipeName} — ${slot.mealType} day ${slot.dayOfWeek}: ${slot.oldCalories ?? "?"} → ${slot.newCalories} kcal (entry ${slot.entryId.slice(0, 8)}…)`,
      );
    }
  }

  if (report.errors.length) {
    lines.push("", `Errors (${report.errors.length}):`);
    for (const err of report.errors) {
      lines.push(`  • ${err.recipeId}: ${err.message}`);
    }
  }

  return lines.join("\n");
}
