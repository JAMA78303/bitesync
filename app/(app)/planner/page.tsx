import { Suspense } from "react";
import { ShoppingCart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getMonday, toLocalISO, addDays } from "@/lib/utils/dates";
import { getOrCreateMealPlan, getMealPlanEntries, buildGrid, groceryListExists } from "@/lib/supabase/meal-plans";
import { getProfile } from "@/lib/supabase/profile";
import { PlannerGrid } from "@/components/planner/PlannerGrid";
import { WeekNav } from "@/components/planner/WeekNav";
import { GenerateListButton } from "@/components/planner/GenerateListButton";
import { PlannerSkeleton } from "@/components/shared/skeletons";

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

  const { data: recipes } = await supabase
    .from("recipes")
    .select("id,name,recipe_nutrition(calories)")
    .is("archived_at", null)
    .order("name");

  const formattedRecipes = (recipes ?? []).map((r: { id: string; name: string; recipe_nutrition?: { calories: number | null }[] }) => ({
    id: r.id,
    name: r.name,
    calories: r.recipe_nutrition?.[0]?.calories ?? null,
  }));

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
  const dailyCalorieTarget = profile?.daily_calorie_target ?? null;
  const dailyProteinTarget = profile?.daily_protein_target ?? null;
  const grid = await buildGrid(entries ?? []);
  const hasGroceryList = await groceryListExists(mealPlan.id);

  return (
    <section className="space-y-4">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Weekly Planner</h1>
          <p className="text-sm text-gray-600">Plan your meals, generate your list</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <WeekNav weekStart={weekStart} />
          <GenerateListButton mealPlanId={mealPlan.id} weekStart={weekStartISO} hasExistingList={hasGroceryList} />
          <ShoppingCart className="hidden h-5 w-5 text-gray-400 md:block" />
        </div>
      </div>

      <Suspense fallback={<PlannerSkeleton />}>
        <PlannerGrid
          grid={grid}
          mealPlanId={mealPlan.id}
          recipes={formattedRecipes}
          weekDates={weekDates}
          dailyCalorieTarget={dailyCalorieTarget}
          dailyProteinTarget={dailyProteinTarget}
        />
      </Suspense>
    </section>
  );
}
