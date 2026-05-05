import Link from "next/link";
import { Lock, ShoppingCart } from "lucide-react";
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
import { DeficiencyRecommendations } from "@/components/planner/DeficiencyRecommendations";
import { MicronutrientPanel } from "@/components/planner/MicronutrientPanel";
import { getWeeklyMicroAnalysis } from "@/lib/supabase/nutrition";
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

  const profile = await getProfile();
  const userTier = await getUserTier();
  const { data: entries } = await getMealPlanEntries(mealPlan.id);
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
  let microAnalysis: Awaited<ReturnType<typeof getWeeklyMicroAnalysis>> = null;
  if (userTier === "pro") {
    try {
      const sex = profile?.sex === "female" ? "female" : "male";
      microAnalysis = await getWeeklyMicroAnalysis(mealPlan.id, weekStartISO, sex);
    } catch (err) {
      console.error("Micro analysis failed:", err);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Weekly Planner</h1>
          <p className="text-sm text-gray-600">Plan your meals, generate your list</p>
        </div>
        <div className="relative z-20 flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
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
      />

      <PlannerGrid
        grid={grid}
        entries={plannerEntries}
        mealPlanId={mealPlan.id}
        recipes={formattedRecipes}
        weekDates={weekDates}
        weekStartIso={weekStartISO}
        initialActiveDay={initialActiveDay}
        dailyCalorieTarget={dailyCalorieTarget}
        dailyProteinTarget={dailyProteinTarget}
        dietPrefs={dietPrefs}
      />

      {userTier === "free" ? (
        <div className="relative mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white p-6 text-center">
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/80 backdrop-blur-sm">
            <Lock className="h-6 w-6 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">Pro feature</p>
            <p className="max-w-xs text-xs text-slate-400">
              Upgrade to Pro to see your weekly micronutrient analysis vs UK government dietary reference values
            </p>
            <Link href="/settings/billing" className="rounded-lg bg-[#1A4731] px-4 py-2 text-xs text-white">
              Upgrade to Pro
            </Link>
          </div>
          <div className="pointer-events-none blur-sm">
            <p className="mb-2 text-sm font-semibold">Weekly nutrition analysis</p>
            <div className="space-y-2">
              {["Vitamin D", "Iron", "Calcium", "Vitamin B12"].map((n) => (
                <div key={n} className="flex items-center gap-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                  <span className="w-28 text-sm text-slate-300">{n}</span>
                  <div className="h-1.5 flex-1 rounded-full bg-slate-100">
                    <div className="h-1.5 w-3/4 rounded-full bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {userTier === "pro" && microAnalysis ? (
        <div className="mt-6 space-y-4">
          <MicronutrientPanel analysis={microAnalysis} />
          <DeficiencyRecommendations
            deficiencies={microAnalysis.must_hit.filter((n) => n.traffic === "red")}
            excesses={microAnalysis.must_limit.filter((n) => n.traffic === "red")}
          />
        </div>
      ) : null}

      {userTier === "pro" && !microAnalysis ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
          <p className="text-sm text-slate-400">Add meals to your planner to see your weekly nutrition analysis</p>
        </div>
      ) : null}
    </section>
  );
}
