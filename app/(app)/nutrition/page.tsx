import Link from "next/link";
import { Lock } from "lucide-react";
import { redirect } from "next/navigation";
import { DeficiencyRecommendations } from "@/components/planner/DeficiencyRecommendations";
import { MicronutrientPanel } from "@/components/planner/MicronutrientPanel";
import { getUserTier } from "@/lib/subscription";
import { getMealPlanForWeek } from "@/lib/supabase/meal-plans";
import { getWeeklyMicroAnalysis } from "@/lib/supabase/nutrition";
import { createClient } from "@/lib/supabase/server";
import { getMonday, toLocalISO } from "@/lib/utils/dates";

export default async function NutritionPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const weekStart = params.week ? getMonday(new Date(`${params.week}T00:00:00`)) : getMonday(new Date());
  const weekStartISO = toLocalISO(weekStart);
  const prevWeekISO = toLocalISO(new Date(weekStart.getTime() - 7 * 86400000));
  const nextWeekISO = toLocalISO(new Date(weekStart.getTime() + 7 * 86400000));
  const [{ data: profile }, mealPlan, tier] = await Promise.all([
    supabase
      .from("profiles")
      .select("sex,daily_calorie_target,daily_protein_target")
      .eq("id", user.id)
      .single(),
    getMealPlanForWeek(weekStartISO),
    getUserTier(),
  ]);

  let microAnalysis: Awaited<ReturnType<typeof getWeeklyMicroAnalysis>> = null;
  if (tier === "pro" && mealPlan) {
    try {
      microAnalysis = await getWeeklyMicroAnalysis(
        mealPlan.id,
        weekStartISO,
        (profile?.sex as "male" | "female") ?? "male",
      );
    } catch (err) {
      console.error("Micro analysis failed:", err);
    }
  }

  const rangeLabel = `${weekStart.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  })} – ${new Date(weekStart.getTime() + 6 * 86400000).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;

  return (
    <section className="space-y-4 pb-20">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Weekly Nutrition</h1>
        <p className="text-sm text-slate-500">How your meals stack up this week</p>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
        <Link
          href={`/nutrition?week=${prevWeekISO}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-600"
        >
          ‹
        </Link>
        <p className="text-sm font-medium text-slate-700">{rangeLabel}</p>
        <Link
          href={`/nutrition?week=${nextWeekISO}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-600"
        >
          ›
        </Link>
      </div>

      {(profile?.daily_calorie_target || profile?.daily_protein_target) && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Daily macro targets</p>
          <div className="mt-2 flex gap-6">
            <div>
              <p className="text-xs text-slate-400">Calories</p>
              <p className="text-lg font-semibold text-slate-800">
                {profile?.daily_calorie_target ?? "—"} kcal
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Protein</p>
              <p className="text-lg font-semibold text-slate-800">
                {profile?.daily_protein_target ?? "—"} g
              </p>
            </div>
          </div>
        </div>
      )}

      {tier === "free" && (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">Full analysis is a Pro feature</p>
          </div>
          <p className="text-sm text-slate-500">
            Upgrade to see your weekly micronutrient breakdown vs UK government dietary reference values -
            including Vitamin D, Iron, Calcium and 9 more nutrients.
          </p>
          <Link
            href="/settings/billing"
            className="inline-block rounded-xl bg-[#1A4731] px-5 py-2.5 text-xs font-medium text-white"
          >
            Upgrade to Pro
          </Link>

          <div className="pointer-events-none rounded-lg border border-slate-100 bg-slate-50 p-4 blur-[1px]">
            {["Vitamin D", "Iron", "Calcium", "Vitamin B12", "Folate", "Zinc"].map((n) => (
              <div key={n} className="mb-2 flex items-center gap-3 last:mb-0">
                <div className="h-2 w-2 rounded-full bg-slate-300" />
                <span className="w-24 text-sm text-slate-400">{n}</span>
                <div className="h-1.5 flex-1 rounded-full bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
      )}

      {tier === "pro" && !microAnalysis && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
          <p className="text-sm text-slate-400">Add meals to your planner to see your weekly nutrition analysis</p>
          <Link href="/planner" className="mt-2 block text-xs font-medium text-[#1A4731]">
            Go to planner →
          </Link>
        </div>
      )}

      {tier === "pro" && microAnalysis && (
        <div className="space-y-4">
          <MicronutrientPanel analysis={microAnalysis} />
          <DeficiencyRecommendations
            deficiencies={microAnalysis.must_hit.filter((n) => n.traffic === "red")}
            excesses={microAnalysis.must_limit.filter((n) => n.traffic === "red")}
          />
          <p className="text-center text-xs text-slate-400">
            Source:{" "}
            <a
              href="https://www.gov.uk/government/publications/sacn-dietary-reference-values-for-energy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              UK SACN Dietary Reference Values
            </a>{" "}
            · NHS guidelines for sat fat, salt and sugar
          </p>
        </div>
      )}
    </section>
  );
}
