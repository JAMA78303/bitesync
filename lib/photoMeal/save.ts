import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { lookupNutritionAsync } from "@/lib/nutrition/lookupAsync";
import { todayDayOfWeek } from "@/lib/planner/today";
import { getMonday, toLocalISO } from "@/lib/utils/dates";
import { MEAL_TYPES, type MealType } from "@/types";

export const saveLoggedMealInput = z.object({
  title: z.string().trim().min(1).max(60),
  mealType: z.enum(MEAL_TYPES as [MealType, ...MealType[]]),
  /** "Ate something else": the planned entry this replaces, which is marked skipped. */
  replaceEntryId: z.string().uuid().nullable(),
  items: z
    .array(
      z.object({
        name: z.string().trim().min(2).max(80),
        grams: z.number().finite().min(1).max(2000),
      }),
    )
    .min(1)
    .max(16),
});

export type SaveLoggedMealInput = z.infer<typeof saveLoggedMealInput>;

type Line = { name: string; quantity: number; unit: string };

export type LoggedMealTotals = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fibre_g: number;
  sugar_g: number;
  sodium_mg: number;
  saturated_fat_g: number;
  coverage_pct: number;
  matched: boolean[];
  cofid: { name: string | null; matchedBy: string | null }[];
};

/**
 * Nutrition for the foods as saved, from the same chain recipes use (CoFID,
 * then BiteSync's food list, never an AI estimate). A food that doesn't match
 * adds nothing and lowers coverage_pct (DEC-005).
 */
export async function totalsForLines(lines: Line[]): Promise<LoggedMealTotals> {
  const resolved = await Promise.all(
    lines.map((l) => lookupNutritionAsync(l.name, l.quantity, l.unit, { skipAI: true })),
  );
  const t: LoggedMealTotals = {
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    fibre_g: 0,
    sugar_g: 0,
    sodium_mg: 0,
    saturated_fat_g: 0,
    coverage_pct: 0,
    matched: [],
    cofid: [],
  };
  let matchedCount = 0;
  for (const r of resolved) {
    const ok = Boolean(r && !r.estimated);
    t.matched.push(ok);
    t.cofid.push({
      name: ok && r?.source === "cofid" ? (r.cofid_food_name ?? null) : null,
      matchedBy: ok && r?.source === "cofid" ? (r.cofid_matched_by ?? null) : null,
    });
    if (!ok || !r) continue;
    matchedCount += 1;
    t.calories += r.kcal;
    t.protein_g += r.protein;
    t.carbs_g += r.carbs;
    t.fat_g += r.fat;
    t.fibre_g += r.fibre;
    t.sugar_g += r.sugar_g;
    t.sodium_mg += r.sodium_mg;
    t.saturated_fat_g += r.saturated_fat_g ?? 0;
  }
  t.coverage_pct = lines.length ? Math.round((matchedCount / lines.length) * 100) : 0;
  return t;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

function totalsRow(t: LoggedMealTotals) {
  return {
    calories: Math.round(t.calories),
    protein_g: round1(t.protein_g),
    carbs_g: round1(t.carbs_g),
    fat_g: round1(t.fat_g),
    fibre_g: round1(t.fibre_g),
    sugar_g: round1(t.sugar_g),
    sodium_mg: Math.round(t.sodium_mg),
    saturated_fat_g: round1(t.saturated_fat_g),
    coverage_pct: t.coverage_pct,
  };
}

const MIGRATION_MESSAGE =
  "Photo logging needs a database update first (sql/2026-11-16_logged_meals.sql).";

function isMissingTable(message?: string | null): boolean {
  return Boolean(message && /logged_meal/i.test(message) && /(does not exist|schema cache|not find)/i.test(message));
}

/**
 * Log a photographed meal on today's plan.
 *
 * The meal becomes a quick-add entry (name and calories) in the chosen meal,
 * so Today, the planner and the week's numbers all show it with no special
 * handling, and it never reaches the grocery list or recipe library. Its
 * foods and full nutrition go in logged_meals / logged_meal_ingredients.
 *
 * DEC-004: the stored nutrition is worked out from the ingredient rows that
 * actually landed, not from what the browser sent. If any step fails the
 * entry is removed and a replaced meal is put back, so the day is never left
 * half-changed.
 */
export async function saveLoggedMeal(
  supabase: SupabaseClient,
  userId: string,
  input: SaveLoggedMealInput,
): Promise<{ success: true; entryId: string; calories: number } | { error: string }> {
  const lines: Line[] = input.items.map((i) => ({ name: i.name, quantity: Math.round(i.grams), unit: "g" }));
  const draft = await totalsForLines(lines);

  // Where it goes: the replaced meal's day and slot, or today's.
  let mealPlanId: string;
  let dayOfWeek: number;
  let mealType: MealType = input.mealType;

  if (input.replaceEntryId) {
    const { data: entry } = await supabase
      .from("meal_plan_entries")
      .select("id, meal_plan_id, day_of_week, meal_type, meal_plan:meal_plans!inner(user_id)")
      .eq("id", input.replaceEntryId)
      .maybeSingle();
    const owner = entry?.meal_plan as { user_id?: string } | { user_id?: string }[] | null | undefined;
    const ownerId = Array.isArray(owner) ? owner[0]?.user_id : owner?.user_id;
    if (!entry || ownerId !== userId) return { error: "That meal isn't on your plan any more." };
    mealPlanId = String(entry.meal_plan_id);
    dayOfWeek = Number(entry.day_of_week);
    mealType = entry.meal_type as MealType;
  } else {
    const weekStart = toLocalISO(getMonday(new Date()));
    const { data: existing } = await supabase
      .from("meal_plans")
      .select("id")
      .eq("user_id", userId)
      .eq("week_start_date", weekStart)
      .maybeSingle();
    let planId = existing?.id as string | undefined;
    if (!planId) {
      const { data: created, error } = await supabase
        .from("meal_plans")
        .insert({ user_id: userId, week_start_date: weekStart })
        .select("id")
        .single();
      if (error && error.code === "23505") {
        const { data: again } = await supabase
          .from("meal_plans")
          .select("id")
          .eq("user_id", userId)
          .eq("week_start_date", weekStart)
          .maybeSingle();
        planId = again?.id as string | undefined;
      } else {
        planId = created?.id as string | undefined;
      }
    }
    if (!planId) return { error: "Couldn't open this week's plan. Try again." };
    mealPlanId = planId;
    dayOfWeek = todayDayOfWeek();
  }

  // Next free slot in that meal, so the photo meal sits beside what's there.
  const { data: siblings } = await supabase
    .from("meal_plan_entries")
    .select("slot_index")
    .eq("meal_plan_id", mealPlanId)
    .eq("day_of_week", dayOfWeek)
    .eq("meal_type", mealType);
  const slotIndex = (siblings ?? []).reduce((max, s) => Math.max(max, Number(s.slot_index ?? 0)), -1) + 1;

  const { data: entryRow, error: entryError } = await supabase
    .from("meal_plan_entries")
    .insert({
      meal_plan_id: mealPlanId,
      recipe_id: null,
      day_of_week: dayOfWeek,
      meal_type: mealType,
      slot_index: slotIndex,
      quick_add_name: input.title,
      quick_add_calories: Math.round(draft.calories),
    })
    .select("id")
    .single();
  if (entryError || !entryRow) {
    console.warn("[photo-meal] entry insert:", entryError?.message);
    return { error: "Couldn't add it to today. Try again." };
  }
  const entryId = String(entryRow.id);

  const undo = async (message: string) => {
    await supabase.from("meal_plan_entries").delete().eq("id", entryId);
    return { error: message };
  };

  const { data: mealRow, error: mealError } = await supabase
    .from("logged_meals")
    .insert({ user_id: userId, meal_plan_entry_id: entryId, name: input.title, source: "photo", ...totalsRow(draft) })
    .select("id")
    .single();
  if (mealError || !mealRow) {
    console.warn("[photo-meal] logged_meals insert:", mealError?.message);
    return undo(isMissingTable(mealError?.message) ? MIGRATION_MESSAGE : "Couldn't save the meal. Try again.");
  }
  const loggedMealId = String(mealRow.id);

  const { error: ingError } = await supabase.from("logged_meal_ingredients").insert(
    lines.map((l, i) => ({
      logged_meal_id: loggedMealId,
      position: i,
      name: l.name,
      quantity: l.quantity,
      unit: l.unit,
      matched: draft.matched[i] ?? false,
      cofid_food_name: draft.cofid[i]?.name ?? null,
      cofid_matched_by: draft.cofid[i]?.matchedBy ?? null,
    })),
  );
  if (ingError) {
    console.warn("[photo-meal] ingredients insert:", ingError.message);
    return undo("Couldn't save the meal. Try again.");
  }

  // DEC-004: cost what landed. Identical on every normal save; recompute and
  // correct only if the stored rows differ from what was costed.
  const { data: stored } = await supabase
    .from("logged_meal_ingredients")
    .select("name, quantity, unit")
    .eq("logged_meal_id", loggedMealId)
    .order("position");
  const storedLines: Line[] = (stored ?? []).map((r) => ({
    name: String(r.name),
    quantity: Number(r.quantity),
    unit: String(r.unit ?? "g"),
  }));
  const same =
    storedLines.length === lines.length &&
    storedLines.every((s, i) => s.name === lines[i]!.name && s.quantity === lines[i]!.quantity);
  let finalCalories = Math.round(draft.calories);
  if (!same) {
    if (!storedLines.length) return undo("Couldn't save the meal. Try again.");
    const fixed = await totalsForLines(storedLines);
    finalCalories = Math.round(fixed.calories);
    await supabase.from("logged_meals").update(totalsRow(fixed)).eq("id", loggedMealId);
    await supabase.from("meal_plan_entries").update({ quick_add_calories: finalCalories }).eq("id", entryId);
  }

  if (input.replaceEntryId) {
    const { error: skipError } = await supabase
      .from("meal_plan_entries")
      .update({ skipped_at: new Date().toISOString(), eaten_at: null })
      .eq("id", input.replaceEntryId);
    if (skipError) {
      console.warn("[photo-meal] skip replaced:", skipError.message);
      return undo("Couldn't swap the planned meal. Try again.");
    }
  }

  return { success: true, entryId, calories: finalCalories };
}
