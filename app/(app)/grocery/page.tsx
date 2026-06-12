import { createClient } from "@/lib/supabase/server";
import { getMonday, toLocalISO, formatWeekLabel } from "@/lib/utils/dates";
import { formatGrocerySubtitle } from "@/lib/utils/grocery-display";
import { getMealPlanIdForWeek, getGroceryItems } from "@/lib/supabase/grocery";
import {
 getLiveStorePricingForMealPlan,
} from "@/app/(app)/planner/ai-actions";
import { LeftoverSuggestionsPanel } from "@/components/grocery/LeftoverSuggestionsPanel";
import { GroceryHeader } from "@/components/grocery/GroceryHeader";
import { GroceryItem } from "@/components/grocery/GroceryItem";
import { GroceryEmptyState } from "@/components/grocery/GroceryEmptyState";
import { GroceryDoneState } from "@/components/grocery/GroceryDoneState";
import { ManualGroceryAdd } from "@/components/grocery/ManualGroceryAdd";
import { GroceryListActions } from "@/components/grocery/GroceryListActions";
import { GroceryBasketSnapshotSection } from "@/components/grocery/GroceryBasketSnapshotSection";
import type { StoreItemEstimate, StoreTotal } from "@/lib/pricing/types";
import { MEAL_TYPES } from "@/types";
import { ds } from "@/lib/ui/classes";

type Props = {
 searchParams: Promise<{ week?: string; plan?: string }>;
};

export default async function GroceryPage({ searchParams }: Props) {
 const params = await searchParams;
 const supabase = await createClient();
 const {
 data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
 return (
 <section>
 <p className="text-sm text-[var(--text-secondary)]">Please log in to view your grocery list.</p>
 </section>
 );
 }

 const weekStart = params.week ? getMonday(new Date(`${params.week}T00:00:00`)) : getMonday(new Date());
 const weekStartISO = toLocalISO(weekStart);
 const mealPlanId = params.plan ?? (await getMealPlanIdForWeek(weekStartISO));

 let scopeDays: number[] | null = null;
 if (mealPlanId) {
 const { data: planScopeRow, error: scopeErr } = await supabase
 .from("meal_plans")
 .select("grocery_scope_days")
 .eq("id", mealPlanId)
 .maybeSingle();
 if (!scopeErr && planScopeRow) {
 scopeDays = (planScopeRow.grocery_scope_days ?? null) as number[] | null;
 }
 }

 const subtitle = formatGrocerySubtitle(weekStart, scopeDays);

 let basketSnap: {
 recommended_store: string | null;
 estimated_total_gbp: number | null;
 created_at: string;
 } | null = null;
 let liveStoreTotals: StoreTotal[] = [];
 let liveEstimates: StoreItemEstimate[] = [];

 if (mealPlanId) {
 const [{ data: snap }, livePricing] = await Promise.all([
 supabase
 .from("basket_snapshots")
 .select("recommended_store, estimated_total_gbp, created_at")
 .eq("user_id", user.id)
 .eq("week_start_date", weekStartISO)
 .order("created_at", { ascending: false })
 .limit(1)
 .maybeSingle(),
 getLiveStorePricingForMealPlan({
 mealPlanId,
 selectedDays: scopeDays?.length ? scopeDays : undefined,
 }),
 ]);
 basketSnap = snap ?? null;
 if ("success" in livePricing && livePricing.success) {
 liveStoreTotals = livePricing.storeTotals;
 liveEstimates = livePricing.estimates;
 }
 }

 const snapshotCreatedLabel = basketSnap?.created_at
 ? new Date(basketSnap.created_at).toLocaleString("en-GB", { dateStyle:"medium", timeStyle:"short" })
 :"";
 const lastSnapshot =
 basketSnap?.created_at && snapshotCreatedLabel
 ? {
 recommendedStore: basketSnap.recommended_store,
 estimatedTotalGbp:
 basketSnap.estimated_total_gbp != null ? Number(basketSnap.estimated_total_gbp) : null,
 createdLabel: snapshotCreatedLabel,
 }
 : null;

 if (!mealPlanId) {
 const fallbackSubtitle = formatWeekLabel(weekStart);
 return (
 <div className={`${ds.mobilePage} ${ds.pageContent}`}>
 <GroceryHeader subtitle={fallbackSubtitle} total={0} checked={0} />
 <div className={`${ds.mobileGutter} ${ds.overlap}`}>
 <GroceryEmptyState />
 </div>
 </div>
 );
 }

 const { data } = await getGroceryItems(mealPlanId);
 const groceryItems = data ?? [];
 const { data: entries } = await supabase
 .from("meal_plan_entries")
 .select("day_of_week, meal_type, recipe_id")
 .eq("meal_plan_id", mealPlanId)
 .not("recipe_id","is", null);
 const total = groceryItems.length;
 const checked = groceryItems.filter((item) => item.is_checked).length;
 const allDone = total > 0 && checked === total;
 const filledDays = Array.from(new Set((entries ?? []).map((entry) => entry.day_of_week))).sort((a, b) => a - b);
 const mealTypeSet = new Set((entries ?? []).map((entry) => entry.meal_type));
 const filledMealTypes = MEAL_TYPES.filter((mealType) => mealTypeSet.has(mealType));
 const headerActions = (
 <GroceryListActions
 mealPlanId={mealPlanId}
 weekStart={weekStartISO}
 filledDays={filledDays}
 filledMealTypes={filledMealTypes}
 />
 );

 if (total === 0) {
 return (
 <div className={`${ds.mobilePage} ${ds.pageContent}`}>
 <GroceryHeader subtitle={subtitle} total={0} checked={0} actions={headerActions} />
 <div className={`${ds.mobileGutter} ${ds.overlap} space-y-4`}>
 <GroceryEmptyState />
 <ManualGroceryAdd mealPlanId={mealPlanId} />
 </div>
 </div>
 );
 }

 const uncheckedItems = groceryItems.filter((item) => !item.is_checked);
 const checkedItems = groceryItems.filter((item) => item.is_checked);

 return (
 <div className={`${ds.mobilePage} ${ds.pageContent}`}>
 <GroceryHeader subtitle={subtitle} total={total} checked={checked} actions={headerActions} />
 {allDone ? (
 <div className={`-mt-2 ${ds.mobileGutter}`}>
 <GroceryDoneState />
 </div>
 ) : null}
 <div className={`${ds.mobileGutter} ${ds.overlap} space-y-2`}>
 {uncheckedItems.map((item) => (
 <GroceryItem
 key={item.id}
 id={item.id}
 name={item.name}
 quantity={item.quantity}
 unit={item.unit}
 is_checked={false}
 />
 ))}
 {checkedItems.length > 0 ? (
 <>
 <div className="pb-1 pt-4">
 <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
 In your basket ({checkedItems.length})
 </p>
 </div>
 {checkedItems.map((item) => (
 <GroceryItem
 key={item.id}
 id={item.id}
 name={item.name}
 quantity={item.quantity}
 unit={item.unit}
 is_checked={true}
 />
 ))}
 <LeftoverSuggestionsPanel mealPlanId={mealPlanId} checkedCount={checkedItems.length} />
 </>
 ) : null}
 {mealPlanId ? (
 <div className="pt-4">
 <ManualGroceryAdd mealPlanId={mealPlanId} />
 </div>
 ) : null}
 {total > 0 && liveStoreTotals.length > 0 ? (
 <>
 <GroceryBasketSnapshotSection
 liveStoreTotals={liveStoreTotals}
 liveEstimates={liveEstimates}
 lastSnapshot={lastSnapshot}
 />
 </>
 ) : null}
 </div>
 </div>
 );
}
