"use server";

import { revalidatePath } from "next/cache";
import { toUserFacingError } from "@/lib/errors/userFacing";
import { createClient } from "@/lib/supabase/server";
import { dietaryPreferencesToLegacyFlags } from "@/lib/dietary/constraints";
import { normalizeDietaryPreferencesForSave } from "@/lib/dietary/constants";
import { calculateNutritionTargetsWithSafety, type TDEEFormValues } from "@/lib/utils/tdee";
import type { DietPreferencesInput } from "@/lib/supabase/profile";

/** @deprecated Use saveDietaryPreferenceKeys */
export async function saveDietaryPreferences(values: DietPreferencesInput) {
  const keys: string[] = [];
  if (values.followsVegan) keys.push("vegan");
  else if (values.followsVegetarian) keys.push("vegetarian");
  if (values.followsGlutenFree) keys.push("gluten_free");
  if (!keys.length) keys.push("no_preference");
  return saveDietaryPreferenceKeys(keys);
}

export async function saveDietaryPreferenceKeys(
  selected: string[],
  options?: { completeOnboarding?: boolean; advanceFirstRunStep?: boolean },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const dietary_preferences = normalizeDietaryPreferencesForSave(selected);
  const legacy = dietaryPreferencesToLegacyFlags(dietary_preferences);

  const update: Record<string, unknown> = {
    dietary_preferences,
    follows_vegetarian: legacy.followsVegetarian,
    follows_vegan: legacy.followsVegan,
    follows_gluten_free: legacy.followsGlutenFree,
  };
  if (options?.completeOnboarding) {
    update.has_completed_onboarding = true;
    update.onboarding_step = 4;
    update.first_run_completed = true;
  }

  const { error } = await supabase.from("profiles").update(update).eq("id", user.id);

  if (error) return { error: toUserFacingError(error, "profile", "updateProfile") };

  revalidatePath("/settings");
  revalidatePath("/goals");
  revalidatePath("/planner");
  revalidatePath("/recipes");
  revalidatePath("/onboarding");
  return { success: true as const };
}

/**
 * Targets are free-tier. They used to be Pro after the first run: a free user
 * could set them once during onboarding and never touch them again. With the
 * wizard asking for body stats on its first screen, that made a mistyped
 * weight permanent, and it gated the one number the free tier is built around
 * — you cannot hit a protein target you are not allowed to correct. Macros
 * beyond protein and the micronutrient analysis remain Pro; the inputs do not.
 */
export async function saveTDEEProfile(values: TDEEFormValues) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const safe = calculateNutritionTargetsWithSafety(values);
  const { result } = safe;

  const { error } = await supabase
    .from("profiles")
    .update({
      weight_kg: values.weightKg,
      height_cm: values.heightCm,
      age: values.age,
      sex: values.sex,
      activity_level: values.activityLevel,
      goal: safe.storedGoal,
      daily_calorie_target: result.dailyCalories,
      daily_protein_target: result.dailyProtein,
    })
    .eq("id", user.id);

  if (error) return { error: toUserFacingError(error, "profile", "updateProfile") };

  revalidatePath("/settings");
  revalidatePath("/goals");
  revalidatePath("/billing");
  revalidatePath("/planner");
  revalidatePath("/nutrition");
  revalidatePath("/today");
  revalidatePath("/onboarding");
  revalidatePath("/recipes");
  return {
    success: true,
    overrideApplied: safe.overrideApplied,
    overrideReason: safe.overrideReason,
    targets: {
      bmr: result.bmr,
      tdee: result.tdee,
      dailyCalories: result.dailyCalories,
      dailyProtein: result.dailyProtein,
      bmi: safe.bmi,
    },
  };
}

/** Snacks per day — 1 or 2. See lib/planner/snack-preference for the fallback rule. */
export async function saveSnacksPerDay(value: 1 | 2) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };
  if (value !== 1 && value !== 2) return { error: "Choose 1 or 2 snacks a day." };

  const { error } = await supabase.from("profiles").update({ snacks_per_day: value }).eq("id", user.id);
  if (error) {
    if (error.message.includes("snacks_per_day")) {
      return { error: "Snack preference needs the latest migration. Run sql/2026-09-14_snacks_per_day.sql, then try again." };
    }
    return { error: toUserFacingError(error, "profile", "saveSnacksPerDay") };
  }

  revalidatePath("/goals/targets");
  revalidatePath("/planner");
  return { success: true as const };
}
