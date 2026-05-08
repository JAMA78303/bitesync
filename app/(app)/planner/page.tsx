import Link from "next/link";
import { Activity, ShoppingCart } from "lucide-react";
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

  const [{ data: recipes }, mealPlanResult, profile, userTier] = await Promise.all([
    supabase
      .from("recipes")
      .select("id,name,fits_vegetarian,fits_vegan,fits_gluten_free")
      .is("archived_at", null)
      .order("name"),
    getOrCreateMealPlan(weekStartISO),
    getProfile(),
    getUserTier(),
  ]);
  const { data: mealPlan, error } = mealPlanResult;

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

  const recipeIds = (recipes ?? []).map((r) => r.id);
  const [nutritionMap, { data: entries }, ingResult] = await Promise.all([
    recipes && recipes.length > 0 ? fetchRecipeNutritionMap(supabase, recipeIds) : new Map(),
    getMealPlanEntries(mealPlan.id),
    recipeIds.length
      ? supabase.from("recipe_ingredients").select("recipe_id,name").in("recipe_id", recipeIds)
      : Promise.resolve({ data: [] as { recipe_id: string; name: string }[] | null }),
  ]);

  const ingredientNamesByRecipe = new Map<string, string[]>();
  for (const row of ingResult.data ?? []) {
    const rid = String(row.recipe_id ?? "");
    if (!rid) continue;
    const cur = ingredientNamesByRecipe.get(rid) ?? [];
    cur.push(String(row.name ?? ""));
    ingredientNamesByRecipe.set(rid, cur);
  }

  const formattedRecipes = (recipes ?? []).map((r) => {
    const n = nutritionMap.get(r.id);
    return {
      id: r.id,
      name: r.name,
      calories: n?.calories ?? null,
      fits_vegetarian: r.fits_vegetarian,
      fits_vegan: r.fits_vegan,
      fits_gluten_free: r.fits_gluten_free,
      ingredientNames: ingredientNamesByRecipe.get(r.id) ?? [],
    };
  });
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

      {microAnalysis ? (
        <Link
          href={`/nutrition?week=${weekStartISO}`}
          className="group mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 transition-all hover:border-[#6EE7B7] hover:bg-[#F0FDF4]"
        >
          <div className="flex items-center gap-3">
            <Activity className="h-4 w-4 text-[#1A4731]" />
            <div>
              <p className="text-sm font-semibold text-slate-800">Weekly nutrition</p>
              <p className="text-xs text-slate-500">
                {(() => {
                  const reds = [
                    ...microAnalysis.must_hit.filter((n) => n.traffic === "red"),
                    ...microAnalysis.must_limit.filter((n) => n.traffic === "red"),
                  ];
                  if (reds.length === 0) return "All nutrients on track this week";
                  const names = reds
                    .slice(0, 2)
                    .map((n) => n.label)
                    .join(" and ");
                  return `${names} need${reds.length === 1 ? "s" : ""} attention`;
                })()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            {[...microAnalysis.must_hit, ...microAnalysis.must_limit].slice(0, 6).map((n) => (
              <div
                key={n.key}
                className={`h-2 w-2 rounded-full ${
                  n.traffic === "green" ? "bg-green-500" : n.traffic === "amber" ? "bg-amber-400" : "bg-red-500"
                }`}
              />
            ))}
            →
          </div>
        </Link>
      ) : null}

      {!microAnalysis && userTier === "pro" ? (
        <Link href={`/nutrition?week=${weekStartISO}`} className="mt-4 block text-sm font-medium text-[#1A4731]">
          Add meals to see nutrition analysis →
        </Link>
      ) : null}
    </section>
  );
}
