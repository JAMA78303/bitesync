"use server";

import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { isProSubscriptionStatus } from "@/lib/subscription";
import { toUserFacingError } from "@/lib/errors/userFacing";
import { createClient } from "@/lib/supabase/server";
import { dietaryPreferencesToLegacyFlags } from "@/lib/dietary/constraints";
import { normalizeDietaryPreferencesForSave } from "@/lib/dietary/constants";
import {
  computeNutritionTargetsFromProfile,
  storedTargetsAreStale,
} from "@/lib/utils/nutrition-targets";
import { calculateNutritionTargetsWithSafety, type TDEEFormValues } from "@/lib/utils/tdee";

export type DietPreferencesInput = {
  followsVegetarian: boolean;
  followsVegan: boolean;
  followsGlutenFree: boolean;
};

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

export async function saveTDEEProfile(
  values: TDEEFormValues,
  options?: { allowFreeFirstRun?: boolean },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status, first_run_completed")
    .eq("id", user.id)
    .maybeSingle();

  const allowFree =
    options?.allowFreeFirstRun === true && profile?.first_run_completed !== true;

  if (!isProSubscriptionStatus(profile?.subscription_status) && !allowFree) {
    return { error: "Upgrade to Pro to set TDEE targets." };
  }

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

export async function getProfile() {
  noStore();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select(
      `
      subscription_status,
      stripe_customer_id,
      stripe_subscription_id,
      weight_kg,
      height_cm,
      age,
      sex,
      activity_level,
      goal,
      daily_calorie_target,
      daily_protein_target,
      follows_vegetarian,
      follows_vegan,
      follows_gluten_free,
      dietary_preferences,
      has_completed_onboarding,
      onboarding_step,
      first_run_completed,
      first_run_skipped
    `,
    )
    .eq("id", user.id)
    .maybeSingle();

  if (data && storedTargetsAreStale(data)) {
    const computed = computeNutritionTargetsFromProfile(data);
    if (computed) {
      await supabase
        .from("profiles")
        .update({
          daily_calorie_target: computed.kcal,
          daily_protein_target: computed.protein,
        })
        .eq("id", user.id);
      return {
        ...data,
        daily_calorie_target: computed.kcal,
        daily_protein_target: computed.protein,
      };
    }
  }

  return data;
}
