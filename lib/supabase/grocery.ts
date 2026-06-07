"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { applyPantryToShoppingList } from "@/lib/grocery/applyPantryToShoppingList";
import { getMonday, toLocalISO } from "@/lib/utils/dates";
import { getPantryItems, pantryRowToAvailable } from "@/lib/supabase/pantry";
import {
  mealPlanRecipeServings,
  mergeScaledRecipeIngredients,
  normalizeIngredientsForShopping,
} from "@/lib/utils/merge";
import type { MealType } from "@/types";

type GroceryReplaceItem = {
  name: string;
  quantity: number;
  unit: string;
};

function isMissingArchivedAtColumn(message?: string | null): boolean {
  if (!message) return false;
  return message.toLowerCase().includes("archived_at");
}

function schemaMissingColumn(message: string | null | undefined, column: string): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  const c = column.toLowerCase();
  if (!m.includes(c)) return false;
  return (
    m.includes("does not exist") ||
    m.includes("unknown column") ||
    m.includes("undefined column") ||
    m.includes("could not find") /* PostgREST */
  );
}

function normalizeGroceryScopeDaysForStorage(selectedDays?: number[]): number[] | null {
  if (!selectedDays?.length) return null;
  const sorted = [...new Set(selectedDays)].sort((a, b) => a - b);
  if (sorted.length >= 7) return null;
  return sorted;
}

async function persistGroceryScopeDays(
  supabase: Awaited<ReturnType<typeof createClient>>,
  meal_plan_id: string,
  selectedDays?: number[],
): Promise<void> {
  const scope = normalizeGroceryScopeDaysForStorage(selectedDays);
  const { error } = await supabase
    .from("meal_plans")
    .update({ grocery_scope_days: scope })
    .eq("id", meal_plan_id);
  if (error && schemaMissingColumn(error.message, "grocery_scope_days")) return;
}

async function restoreManualGrocerySnapshot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  meal_plan_id: string,
  manualRows: { name: string; quantity: number; unit: string; is_checked: boolean | null }[] | null | undefined,
  archivedRecipeDerivedOnly: boolean,
): Promise<{ error: string | null }> {
  if (archivedRecipeDerivedOnly || !manualRows?.length) return { error: null };

  const payload = manualRows.map((row) => ({
    meal_plan_id,
    name: row.name,
    quantity: row.quantity,
    unit: row.unit,
    is_checked: row.is_checked ?? false,
    archived_at: null as string | null,
    is_manual: true,
  }));

  const { error } = await supabase.from("grocery_items").insert(payload);
  if (!error) return { error: null };

  if (error.message.toLowerCase().includes("is_manual")) {
    const legacyPayload = payload.map(({ is_manual: _, ...rest }) => rest);
    const { error: legacyError } = await supabase.from("grocery_items").insert(legacyPayload);
    return { error: legacyError?.message ?? null };
  }

  return { error: error.message };
}

export async function replaceGroceryItemsWithMerged(
  meal_plan_id: string,
  merged: GroceryReplaceItem[],
  selectedDays?: number[],
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.rpc("replace_grocery_items", {
    p_meal_plan_id: meal_plan_id,
    p_items: merged,
  });

  const finishGenerate = async () => {
    await persistGroceryScopeDays(supabase, meal_plan_id, selectedDays);
    revalidatePath("/grocery");
  };

  if (error) {
    const shouldFallback =
      error.message.toLowerCase().includes("replace_grocery_items") ||
      isMissingArchivedAtColumn(error.message) ||
      schemaMissingColumn(error.message, "is_manual");

    if (!shouldFallback) return { error: error.message };

    const now = new Date().toISOString();

    const { data: manualRowsToRestore } = await supabase
      .from("grocery_items")
      .select("name, quantity, unit, is_checked")
      .eq("meal_plan_id", meal_plan_id)
      .eq("is_manual", true)
      .is("archived_at", null);

    const msgIsManualMissing = (message: string) => message.toLowerCase().includes("is_manual");

    let archivedRecipeDerivedOnly = false;
    const { error: softManualFiltered } = await supabase
      .from("grocery_items")
      .update({ archived_at: now })
      .eq("meal_plan_id", meal_plan_id)
      .eq("is_manual", false);

    if (!softManualFiltered) {
      archivedRecipeDerivedOnly = true;
    } else if (!msgIsManualMissing(softManualFiltered.message)) {
      if (!isMissingArchivedAtColumn(softManualFiltered.message)) return { error: softManualFiltered.message };

      const { error: hardDeleteError } = await supabase.from("grocery_items").delete().eq("meal_plan_id", meal_plan_id);
      if (hardDeleteError) return { error: hardDeleteError.message };
      archivedRecipeDerivedOnly = false;
    } else {
      const { error: legacySoft } = await supabase
        .from("grocery_items")
        .update({ archived_at: now })
        .eq("meal_plan_id", meal_plan_id);
      if (legacySoft && !isMissingArchivedAtColumn(legacySoft.message)) return { error: legacySoft.message };
      if (legacySoft && isMissingArchivedAtColumn(legacySoft.message)) {
        const { error: hardDeleteError } = await supabase.from("grocery_items").delete().eq("meal_plan_id", meal_plan_id);
        if (hardDeleteError) return { error: hardDeleteError.message };
      }
      archivedRecipeDerivedOnly = false;
    }

    const rows = merged.map((item) => ({
      meal_plan_id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      is_checked: false,
      archived_at: null as string | null,
      is_manual: false,
    }));

    const { error: insertError } = await supabase.from("grocery_items").insert(rows);
    if (!insertError) {
      const restore = await restoreManualGrocerySnapshot(supabase, meal_plan_id, manualRowsToRestore, archivedRecipeDerivedOnly);
      if (restore.error) return { error: restore.error };
      await finishGenerate();
      return { success: true as const };
    }

    // Legacy fallback if archived_at / is_manual columns do not exist yet.
    const legacyRows = merged.map((item) => ({
      meal_plan_id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      is_checked: false,
    }));

    const { error: legacyInsertError } = await supabase.from("grocery_items").insert(legacyRows);
    if (legacyInsertError) return { error: legacyInsertError.message };

    const restoreLegacy = await restoreManualGrocerySnapshot(supabase, meal_plan_id, manualRowsToRestore, archivedRecipeDerivedOnly);
    if (restoreLegacy.error) return { error: restoreLegacy.error };
  }

  await finishGenerate();
  return { success: true as const };
}

export async function getGroceryItems(meal_plan_id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grocery_items")
    .select("id, name, quantity, unit, is_checked, is_manual, created_at")
    .eq("meal_plan_id", meal_plan_id)
    .is("archived_at", null)
    .order("is_checked", { ascending: true })
    .order("name", { ascending: true });

  if (!error) return { data, error };

  if (isMissingArchivedAtColumn(error.message)) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("grocery_items")
      .select("id, name, quantity, unit, is_checked, created_at")
      .eq("meal_plan_id", meal_plan_id)
      .order("is_checked", { ascending: true })
      .order("name", { ascending: true });
    return { data: fallbackData, error: fallbackError };
  }

  if (schemaMissingColumn(error.message, "is_manual")) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("grocery_items")
      .select("id, name, quantity, unit, is_checked, created_at")
      .eq("meal_plan_id", meal_plan_id)
      .is("archived_at", null)
      .order("is_checked", { ascending: true })
      .order("name", { ascending: true });
    return { data: fallbackData, error: fallbackError };
  }

  return { data: null, error };
}

export async function toggleGroceryItem(item_id: string, is_checked: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("grocery_items").update({ is_checked }).eq("id", item_id);
  if (error) return { error: error.message };
  revalidatePath("/grocery");
  return { success: true };
}

export async function deleteGroceryItem(item_id: string) {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { error } = await supabase.from("grocery_items").update({ archived_at: now }).eq("id", item_id);

  if (error && error.message.toLowerCase().includes("archived_at")) {
    const { error: fallbackError } = await supabase.from("grocery_items").delete().eq("id", item_id);
    if (fallbackError) return { error: fallbackError.message };
  } else if (error) {
    return { error: error.message };
  }

  revalidatePath("/grocery");
  return { success: true };
}

export async function getMealPlanIdForWeek(weekStartDate?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const week = weekStartDate ?? toLocalISO(getMonday(new Date()));
  const { data } = await supabase
    .from("meal_plans")
    .select("id")
    .eq("user_id", user.id)
    .eq("week_start_date", week)
    .order("created_at", { ascending: false })
    .limit(1);
  return data?.[0]?.id ?? null;
}

export async function groceryListExists(meal_plan_id: string): Promise<boolean> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("grocery_items")
    .select("*", { count: "exact", head: true })
    .eq("meal_plan_id", meal_plan_id)
    .is("archived_at", null);
  if (error && isMissingArchivedAtColumn(error.message)) {
    const { count: fallbackCount } = await supabase
      .from("grocery_items")
      .select("*", { count: "exact", head: true })
      .eq("meal_plan_id", meal_plan_id);
    return (fallbackCount ?? 0) > 0;
  }
  return (count ?? 0) > 0;
}

export async function generateGroceryList(meal_plan_id: string, selectedDays?: number[], selectedMealTypes?: MealType[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  let query = supabase
    .from("meal_plan_entries")
    .select("recipe_id")
    .eq("meal_plan_id", meal_plan_id)
    .not("recipe_id", "is", null);

  if (selectedDays && selectedDays.length > 0) {
    query = query.in("day_of_week", selectedDays);
  }
  if (selectedMealTypes?.length) {
    query = query.in("meal_type", selectedMealTypes);
  }

  const { data: entries } = await query;

  if (!entries?.length) {
    return { error: "No meals with recipes in selected days." };
  }
  const servingsByRecipe = mealPlanRecipeServings(entries);
  const recipeIds = Array.from(servingsByRecipe.keys());

  const { data: ingredients } = await supabase
    .from("recipe_ingredients")
    .select("recipe_id, name, quantity, unit")
    .in("recipe_id", recipeIds);

  if (!ingredients?.length) return { error: "Your recipes have no ingredients." };

  const mergedRaw = mergeScaledRecipeIngredients(
    ingredients as { recipe_id: string; name: string; quantity: number; unit: string }[],
    servingsByRecipe,
  );
  const merged = normalizeIngredientsForShopping(mergedRaw);
  const pantryRows = await getPantryItems();
  const { items: afterPantry, omittedCount, reducedCount } = applyPantryToShoppingList(
    merged,
    pantryRows.map(pantryRowToAvailable),
  );
  const result = await replaceGroceryItemsWithMerged(meal_plan_id, afterPantry, selectedDays);
  if ("success" in result && result.success) {
    return { success: true as const, pantryOmitted: omittedCount, pantryReduced: reducedCount };
  }
  return result;
}

export async function addManualGroceryItem(meal_plan_id: string, name: string, quantity: number, unit: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: plan } = await supabase
    .from("meal_plans")
    .select("id")
    .eq("id", meal_plan_id)
    .eq("user_id", user.id)
    .single();

  if (!plan) return { error: "Not found" };

  const payload = {
    meal_plan_id,
    name: name.trim(),
    quantity,
    unit,
    is_checked: false,
    archived_at: null as string | null,
  };

  const { error } = await supabase.from("grocery_items").insert({ ...payload, is_manual: true });

  if (error && error.message.toLowerCase().includes("is_manual")) {
    const { error: fallbackError } = await supabase.from("grocery_items").insert(payload);
    if (fallbackError) return { error: fallbackError.message };
  } else if (error) {
    return { error: error.message };
  }

  revalidatePath("/grocery");
  return { success: true };
}

export async function deleteGroceryList(meal_plan_id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: plan } = await supabase
    .from("meal_plans")
    .select("id")
    .eq("id", meal_plan_id)
    .eq("user_id", user.id)
    .single();

  if (!plan) return { error: "Not found" };

  const { data: mealPlanRow } = await supabase
    .from("meal_plans")
    .select("week_start_date")
    .eq("id", meal_plan_id)
    .eq("user_id", user.id)
    .maybeSingle();

  const now = new Date().toISOString();
  const { error } = await supabase.from("grocery_items").update({ archived_at: now }).eq("meal_plan_id", meal_plan_id);

  if (error && error.message.toLowerCase().includes("archived_at")) {
    const { error: fallbackError } = await supabase.from("grocery_items").delete().eq("meal_plan_id", meal_plan_id);
    if (fallbackError) return { error: fallbackError.message };
  } else if (error) {
    return { error: error.message };
  }

  await supabase.from("meal_plans").update({ grocery_scope_days: null }).eq("id", meal_plan_id);
  if (mealPlanRow?.week_start_date) {
    await supabase
      .from("basket_snapshots")
      .delete()
      .eq("user_id", user.id)
      .eq("week_start_date", mealPlanRow.week_start_date);
  }

  revalidatePath("/grocery");
  return { success: true };
}
