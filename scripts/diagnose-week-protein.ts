import { loadEnvFiles } from "@/lib/supabase/loadEnv";
import { createServiceClient } from "@/lib/supabase/service";
import { fetchRecipeNutritionMap } from "@/lib/supabase/recipe-nutrition-query";
import { computeWeeklyMacrosFromEntries } from "@/lib/planner/weekly-macros";
import { deriveNutritionTargets } from "@/lib/utils/nutrition-targets";
import type { MealPlanEntry } from "@/types";

loadEnvFiles();
const supabase = createServiceClient();

async function main() {
  const week = process.argv[2] ?? "2026-06-08";
  const { data: plan } = await supabase
    .from("meal_plans")
    .select("id,user_id,week_start_date")
    .eq("week_start_date", week)
    .maybeSingle();
  if (!plan) {
    console.log("No plan for", week);
    return;
  }

  const { data: raw } = await supabase
    .from("meal_plan_entries")
    .select(
      "id, day_of_week, meal_type, slot_index, recipe_id, quick_add_name, quick_add_calories, recipe:recipes(id,name)",
    )
    .eq("meal_plan_id", plan.id);

  const ids = [...new Set((raw ?? []).map((r) => r.recipe_id).filter(Boolean))] as string[];
  const nmap = await fetchRecipeNutritionMap(supabase, ids, { fillMissing: true });
  const entries = (raw ?? []).map((r) => ({
    ...r,
    recipe: r.recipe
      ? { ...r.recipe, recipe_nutrition: r.recipe_id ? nmap.get(r.recipe_id) : null }
      : undefined,
  })) as MealPlanEntry[];

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", plan.user_id).single();
  const targets = deriveNutritionTargets(profile);
  const { weekAvg, days } = computeWeeklyMacrosFromEntries(
    entries,
    new Date(`${plan.week_start_date}T12:00:00`),
  );

  console.log("Week:", plan.week_start_date);
  console.log("Profile:", profile?.weight_kg, "kg", profile?.goal);
  console.log("Target:", targets.protein, "g P,", targets.kcal, "kcal");
  console.log("Week avg:", Math.round(weekAvg.protein), "g P,", Math.round(weekAvg.kcal), "kcal");
  console.log("Gap:", Math.round(targets.protein - weekAvg.protein), "g P/day\n");

  for (const d of days) {
    if (d.kcal <= 0) continue;
    const dayEntries = entries.filter((e) => e.day_of_week === d.dayOfWeek);
    console.log(
      `${d.short} ${d.num}: ${Math.round(d.protein)}g P / ${Math.round(d.kcal)} kcal (${dayEntries.length} slots)`,
    );
    for (const e of dayEntries) {
      const n = nmap.get(e.recipe_id ?? "");
      console.log(
        `  ${e.meal_type}#${e.slot_index ?? 0} ${e.recipe?.name?.slice(0, 40) ?? e.quick_add_name} — ${Math.round(n?.protein_g ?? 0)}g P, ${Math.round(n?.calories ?? e.quick_add_calories ?? 0)} kcal`,
      );
    }
  }

  const { data: recipes } = await supabase.from("recipes").select("id,name").eq("user_id", plan.user_id);
  const rids = (recipes ?? []).map((r) => r.id);
  const allN = await fetchRecipeNutritionMap(supabase, rids, { fillMissing: true });
  const ranked = (recipes ?? [])
    .map((r) => ({ name: r.name, p: allN.get(r.id)?.protein_g ?? 0, kcal: allN.get(r.id)?.calories ?? 0 }))
    .sort((a, b) => b.p - a.p);
  console.log("\nLibrary:", ranked.length, "recipes");
  console.log("Top protein:", ranked.slice(0, 6).map((r) => `${Math.round(r.p)}g ${r.name.slice(0, 30)}`).join(" | "));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
