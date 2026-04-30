"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { calculateNutritionTargets, type TDEEFormValues } from "@/lib/utils/tdee";

export async function saveTDEEProfile(values: TDEEFormValues) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

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
  revalidatePath("/planner");
  return { success: true, targets: result };
}

export async function getProfile() {
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
    .single();

  return data;
}
