import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMonday, toLocalISO, addDays, isCurrentWeek } from "@/lib/utils/dates";
import { fetchRecipeNutritionMap } from "@/lib/supabase/recipe-nutrition-query";
import { getOrCreateMealPlan, getMealPlanEntries, buildGrid } from "@/lib/supabase/meal-plans";
import { initialDietaryPreferencesFromProfile } from "@/lib/dietary/constraints";
import { getProfile } from "@/lib/supabase/profile";
import { getDailyCalorieTarget, getDailyProteinTarget } from "@/lib/utils/nutrition-targets";
import { getUserTier } from "@/lib/subscription";
import { PlannerGrid } from "@/components/planner/PlannerGrid";
import { WeekNav } from "@/components/planner/WeekNav";
import { GenerateListButton } from "@/components/planner/GenerateListButton";
import { GenerateAIBasketButton } from "@/components/planner/GenerateAIBasketButton";
import { PlannerMicroSummary } from "@/components/planner/PlannerMicroSummary";
import { getWeeklyMicroAnalysis } from "@/lib/supabase/nutrition";
import { ds } from "@/lib/ui/classes";
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
 <div className={ds.mobilePage}>
 <div className={ds.gradientHeader}>
 <h1 className={ds.pageTitle}>Weekly Plan</h1>
 </div>
 <div className={`${ds.mobileGutter} ${ds.overlap} space-y-3 ${ds.pageContent}`}>
 <p className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
 Could not load your planner yet. Check that the database schema and RLS policies are applied, then
 refresh.
 </p>
 {error ? (
 <pre className="overflow-x-auto rounded-md bg-[var(--surface-elevated)] p-3 text-xs text-[var(--text-primary)]">{error}</pre>
 ) : null}
 </div>
 </div>
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
 const rid = String(row.recipe_id ??"");
 if (!rid) continue;
 const cur = ingredientNamesByRecipe.get(rid) ?? [];
 cur.push(String(row.name ??""));
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
 const dailyCalorieTarget = getDailyCalorieTarget(profile);
 const dailyProteinTarget = getDailyProteinTarget(profile);
 const dietPrefs = profile
 ? {
 follows_vegetarian: Boolean(profile.follows_vegetarian),
 follows_vegan: Boolean(profile.follows_vegan),
 follows_gluten_free: Boolean(profile.follows_gluten_free),
 }
 : null;
 const dietaryPreferences = initialDietaryPreferencesFromProfile(profile);
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
 if (userTier ==="pro") {
 try {
 const sex = profile?.sex ==="female" ?"female" :"male";
 microAnalysis = await getWeeklyMicroAnalysis(mealPlan.id, weekStartISO, sex);
 } catch (err) {
 console.error("Micro analysis failed:", err);
 }
 }

 return (
 <div className={ds.mobilePage}>
 <div className={ds.gradientHeader}>
 <h1 className={`mb-1 ${ds.pageTitle}`}>Weekly Plan</h1>
 <p className={ds.pageSubtitle}>Plan your meals, generate your list</p>
 <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
 <WeekNav weekStart={weekStart} onGradient />
 <GenerateListButton
 mealPlanId={mealPlan.id}
 weekStart={weekStartISO}
 filledDays={filledDays}
 filledMealTypes={filledMealTypes}
 onGradient
 />
 </div>
 </div>

 <div className={`${ds.mobileGutter} ${ds.overlap} space-y-4 ${ds.pageContent}`}>
 <GenerateAIBasketButton
 isPro={userTier ==="pro"}
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
 dietaryPreferences={dietaryPreferences}
 />

 {microAnalysis ? (
 <PlannerMicroSummary analysis={microAnalysis} weekStartISO={weekStartISO} />
 ) : null}

 {!microAnalysis && userTier ==="pro" ? (
 <Link href={`/nutrition?week=${weekStartISO}`} className="block text-sm font-medium text-[var(--brand-primary)]">
 Add meals to see nutrition analysis →
 </Link>
 ) : null}
 </div>
 </div>
 );
}
