import { createClient } from "@/lib/supabase/server";
import {
  computeNutritionTargetsFromProfile,
  storedTargetsAreStale,
} from "@/lib/utils/nutrition-targets";

export type DietPreferencesInput = {
  followsVegetarian: boolean;
  followsVegan: boolean;
  followsGlutenFree: boolean;
};

/** Read the signed-in user's profile. Not a Server Action — safe to call during RSC render. */
export async function getProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
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

  if (error) {
    console.error("[getProfile]", error.message);
    return null;
  }

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
