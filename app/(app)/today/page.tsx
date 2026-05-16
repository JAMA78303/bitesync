import { redirect } from "next/navigation";
import { TodayDashboard } from "@/components/today/TodayDashboard";
import { initialDietaryPreferencesFromProfile } from "@/lib/dietary/constraints";
import { getTodaysMeals, sumTodayTotals } from "@/lib/planner/today";
import { getProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import { deriveNutritionTargets } from "@/lib/utils/nutrition-targets";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [meals, profile] = await Promise.all([getTodaysMeals(user.id), getProfile()]);
  const targets = deriveNutritionTargets(profile);
  const totals = sumTodayTotals(meals);
  const dietaryPreferences = initialDietaryPreferencesFromProfile(profile);

  return (
    <TodayDashboard
      meals={meals}
      totals={totals}
      targets={targets}
      dietaryPreferences={dietaryPreferences}
    />
  );
}
