"use server";

import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { isProSubscriptionStatus } from "@/lib/subscription";
import { createClient } from "@/lib/supabase/server";
import { calculateNutritionTargets, type TDEEFormValues } from "@/lib/utils/tdee";

export async function saveTDEEProfile(values: TDEEFormValues) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", user.id)
    .maybeSingle();

  if (!isProSubscriptionStatus(profile?.subscription_status)) {
    return { error: "Upgrade to Pro to set TDEE targets." };
  }

  const result = calculateNutritionTargets(values);

  const { error } = await supabase
    .from("profiles")
    .update({
      weight_kg: values.weightKg,
      height_cm: values.heightCm,
      age: values.age,
      sex: values.sex,
      activity_level: values.activityLevel,
      goal: values.goal,
      daily_calorie_target: result.dailyCalories,
      daily_protein_target: result.dailyProtein,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/billing");
  revalidatePath("/planner");
  return { success: true, targets: result };
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
      weight_kg,
      height_cm,
      age,
      sex,
      activity_level,
      goal,
      daily_calorie_target,
      daily_protein_target
    `,
    )
    .eq("id", user.id)
    .maybeSingle();

  return data;
}
