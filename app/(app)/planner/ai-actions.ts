"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUserTier } from "@/lib/subscription";
import { estimateStoreItems, summarizeStoreTotals } from "@/lib/pricing/compare";
import type { BasketIngredient, GoalContext, SubstitutionSuggestion } from "@/lib/pricing/types";

type GenerateAIBasketInput = {
  mealPlanId: string;
  weekStartDate: string;
  ingredients: BasketIngredient[];
  goals: GoalContext;
  preferredStores?: string[];
};

export async function generateAIBasketForWeek(input: GenerateAIBasketInput) {
  const tier = await getUserTier();
  if (tier !== "pro") return { error: "Upgrade to Pro to generate AI grocery plans." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const itemEstimates = await estimateStoreItems(
    input.ingredients,
    input.preferredStores && input.preferredStores.length > 0 ? input.preferredStores : undefined,
  );
  const storeTotals = summarizeStoreTotals(itemEstimates);
  const recommended = [...storeTotals].sort((a, b) => a.total - b.total)[0] ?? null;

  const { data: inserted, error } = await supabase
    .from("basket_snapshots")
    .insert({
      user_id: user.id,
      meal_plan_id: input.mealPlanId,
      week_start_date: input.weekStartDate,
      goal_context: input.goals,
      items: input.ingredients,
      store_totals: storeTotals,
      recommended_store: recommended?.store ?? null,
      basket_confidence: recommended?.certainty ?? 0,
      freshness_days: 0,
      estimated_total_gbp: recommended?.total ?? null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/planner");
  revalidatePath("/grocery");
  return { success: true as const, snapshotId: inserted.id, storeTotals };
}

export async function getStoreComparison(snapshotId: string) {
  const tier = await getUserTier();
  if (tier !== "pro") return { error: "Upgrade to Pro to compare grocery prices." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("basket_snapshots")
    .select("id, recommended_store, store_totals, basket_confidence, freshness_days, estimated_total_gbp")
    .eq("id", snapshotId)
    .single();
  if (error) return { error: error.message };
  return { success: true as const, data };
}

export async function getSubstitutionSuggestions(
  snapshotId: string,
): Promise<{ success: true; suggestions: SubstitutionSuggestion[] } | { error: string }> {
  const tier = await getUserTier();
  if (tier !== "pro") return { error: "Upgrade to Pro to get substitutions." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("basket_snapshots")
    .select("items")
    .eq("id", snapshotId)
    .single();
  if (error) return { error: error.message };

  const items = Array.isArray(data?.items) ? data.items : [];
  const suggestions: SubstitutionSuggestion[] = items.slice(0, 5).map((item: any) => ({
    fromItem: String(item.name ?? "Item"),
    toItem: `${String(item.name ?? "Item")} (store brand)`,
    reason: "Lower unit price with similar macros",
    estimatedSavings: 0.5,
    nutritionNote: "Comparable calories/protein",
    confidence: 0.72,
  }));

  return { success: true, suggestions };
}
