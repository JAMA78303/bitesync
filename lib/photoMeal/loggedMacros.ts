import type { SupabaseClient } from "@supabase/supabase-js";

/** A photo-logged meal's stored totals (logged_meals), per plan entry. */
export type LoggedMealMacros = {
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fibre_g: number;
  sugar_g: number;
  coverage_pct: number;
};

type Row = {
  meal_plan_entry_id: string | number;
  protein_g: number | string | null;
  carbs_g: number | string | null;
  fat_g: number | string | null;
  fibre_g: number | string | null;
  sugar_g: number | string | null;
  coverage_pct: number | string | null;
};

/**
 * Macros of the photo-logged meals behind these quick-add entries, keyed by
 * entry id. A typed quick-add has no logged_meals row and stays calories-only.
 * If the logged_meals migration hasn't run, or the query fails for any other
 * reason, this returns an empty map and every total is what it was before.
 */
export async function fetchLoggedMealMacros(
  supabase: SupabaseClient,
  entryIds: string[],
): Promise<Map<string, LoggedMealMacros>> {
  const map = new Map<string, LoggedMealMacros>();
  if (!entryIds.length) return map;
  const { data, error } = await supabase
    .from("logged_meals")
    .select("meal_plan_entry_id, protein_g, carbs_g, fat_g, fibre_g, sugar_g, coverage_pct")
    .in("meal_plan_entry_id", entryIds);
  if (error || !data) return map;
  for (const row of data as Row[]) {
    map.set(String(row.meal_plan_entry_id), {
      protein_g: Number(row.protein_g ?? 0),
      carbs_g: Number(row.carbs_g ?? 0),
      fat_g: Number(row.fat_g ?? 0),
      fibre_g: Number(row.fibre_g ?? 0),
      sugar_g: Number(row.sugar_g ?? 0),
      coverage_pct: Number(row.coverage_pct ?? 0),
    });
  }
  return map;
}
