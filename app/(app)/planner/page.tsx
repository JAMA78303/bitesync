import { Suspense } from "react";
import { ShoppingCart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getMonday, toLocalISO, addDays, isCurrentWeek } from "@/lib/utils/dates";
import { fetchRecipeNutritionMap } from "@/lib/supabase/recipe-nutrition-query";
import { getOrCreateMealPlan, getMealPlanEntries, buildGrid } from "@/lib/supabase/meal-plans";
import { getProfile } from "@/lib/supabase/profile";
import { getUserTier } from "@/lib/subscription";
import { PlannerGrid } from "@/components/planner/PlannerGrid";
import { WeekNav } from "@/components/planner/WeekNav";
import { GenerateListButton } from "@/components/planner/GenerateListButton";
import { GenerateAIBasketButton } from "@/components/planner/GenerateAIBasketButton";
import { getLiveStorePricingForMealPlan } from "@/app/(app)/planner/ai-actions";
import { PlannerSkeleton } from "@/components/shared/skeletons";
import { MEAL_TYPES } from "@/types";

type Props = { searchParams: Promise<{ week?: string }> };

export default async function PlannerPage({ searchParams }: Props) {
  const supabase = await createClient();
  const params = await searchParams;

  let weekStart: Date;
  if (params.week) {
    const parsed = new Date(`${params.week}T00:00:00`);
    weekStart = getMonday(parsed);
  } else {
    weekStart = getMonday(new Date());
  }

  const weekStartISO = toLocalISO(weekStart);
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();
  const currentWeek = isCurrentWeek(weekStart);
  const initialActiveDay = currentWeek ? (today.getDay() === 0 ? 6 : today.getDay() - 1) : 0;

  const { data: recipes } = await supabase
    .from("recipes")
    .select("id,name,fits_vegetarian,fits_vegan,fits_gluten_free")
    .is("archived_at", null)
    .order("name");

  const nutritionMap =
    recipes && recipes.length > 0 ? await fetchRecipeNutritionMap(supabase, recipes.map((r) => r.id)) : new Map();

  const formattedRecipes = (recipes ?? []).map((r) => {
    const n = nutritionMap.get(r.id);
    return {
      id: r.id,
      name: r.name,
      calories: n?.calories ?? null,
      fits_vegetarian: r.fits_vegetarian,
      fits_vegan: r.fits_vegan,
      fits_gluten_free: r.fits_gluten_free,
    };
  });

  const { data: mealPlan, error } = await getOrCreateMealPlan(weekStartISO);
  if (error || !mealPlan) {
    return (
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold text-gray-900">Weekly Planner</h1>
        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Could not load your planner yet. Check that the database schema and RLS policies are applied, then refresh.
        </p>
        {error ? (
          <pre className="overflow-x-auto rounded-md bg-gray-900 p-3 text-xs text-gray-100">{error}</pre>
        ) : null}
      </section>
    );
  }

  const { data: entries } = await getMealPlanEntries(mealPlan.id);
  const profile = await getProfile();
  const userTier = await getUserTier();
  const dailyCalorieTarget = profile?.daily_calorie_target ?? null;
  const dailyProteinTarget = profile?.daily_protein_target ?? null;
  const dietPrefs = profile
    ? {
        follows_vegetarian: Boolean(profile.follows_vegetarian),
        follows_vegan: Boolean(profile.follows_vegan),
        follows_gluten_free: Boolean(profile.follows_gluten_free),
      }
    : null;
  const grid = await buildGrid(entries ?? []);
  const plannerEntries = entries ?? [];
  const filledDays = Array.from({ length: 7 }, (_, day) => {
    const hasEntry = plannerEntries.some(
      (entry) => entry.day_of_week === day && (entry.recipe_id != null || !!entry.quick_add_name),
    );
    return hasEntry ? day : -1;
  }).filter((d) => d !== -1);
  const filledMealTypes = MEAL_TYPES.filter((mealType) =>
    plannerEntries.some(
      (entry) => entry.meal_type === mealType && (entry.recipe_id != null || !!entry.quick_add_name),
    ),
  );

  const livePricing = await getLiveStorePricingForMealPlan({
    mealPlanId: mealPlan.id,
    selectedDays: [0, 1, 2, 3, 4, 5, 6],
  });
  const initialLivePricing =
    "success" in livePricing && livePricing.success
      ? {
          storeTotals: livePricing.storeTotals,
          estimates: livePricing.estimates,
          priceMatchSummary: livePricing.priceMatchSummary,
        }
      : null;

  return (
    <section className="space-y-4">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Weekly Planner</h1>
          <p className="text-sm text-gray-600">Plan your meals, generate your list</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <WeekNav weekStart={weekStart} />
          <GenerateListButton
            mealPlanId={mealPlan.id}
            weekStart={weekStartISO}
            filledDays={filledDays}
            filledMealTypes={filledMealTypes}
          />
          <ShoppingCart className="hidden h-5 w-5 text-gray-400 md:block" />
        </div>
      </div>

      <GenerateAIBasketButton
        isPro={userTier === "pro"}
        mealPlanId={mealPlan.id}
        weekStartDate={weekStartISO}
        goals={{
          calorieTarget: dailyCalorieTarget,
          proteinTarget: dailyProteinTarget,
          followsVegetarian: Boolean(profile?.follows_vegetarian),
          followsVegan: Boolean(profile?.follows_vegan),
          followsGlutenFree: Boolean(profile?.follows_gluten_free),
        }}
        initialLivePricing={initialLivePricing}
      />

      <Suspense fallback={<PlannerSkeleton />}>
        <PlannerGrid
          grid={grid}
          entries={plannerEntries}
          mealPlanId={mealPlan.id}
          recipes={formattedRecipes}
          weekDates={weekDates}
          initialActiveDay={initialActiveDay}
          dailyCalorieTarget={dailyCalorieTarget}
          dailyProteinTarget={dailyProteinTarget}
          dietPrefs={dietPrefs}
        />
      </Suspense>
    </section>
  );
}
