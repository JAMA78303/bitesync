import { createClient } from "@/lib/supabase/server";
import { getMonday, toLocalISO, formatWeekLabel } from "@/lib/utils/dates";
import { formatGrocerySubtitle } from "@/lib/utils/grocery-display";
import { getMealPlanIdForWeek, getGroceryItems } from "@/lib/supabase/grocery";
import { LeftoverSuggestionsPanel } from "@/components/grocery/LeftoverSuggestionsPanel";
import { GroceryHeader } from "@/components/grocery/GroceryHeader";
import { GroceryItem } from "@/components/grocery/GroceryItem";
import { GroceryEmptyState } from "@/components/grocery/GroceryEmptyState";
import { GroceryDoneState } from "@/components/grocery/GroceryDoneState";
import { ManualGroceryAdd } from "@/components/grocery/ManualGroceryAdd";
import { GroceryListActions } from "@/components/grocery/GroceryListActions";
import { MEAL_TYPES } from "@/types";
import { ds } from "@/lib/ui/classes";
import { groupByAisle } from "@/lib/grocery/aisles";
import { groceryShareText } from "@/lib/grocery/shareText";
import { WeeklyHabitCard } from "@/components/habit/WeeklyHabitCard";
import { UpgradeCard } from "@/components/billing/UpgradeCard";
import { getAccess } from "@/lib/subscription";
import { isNativeAppRequest } from "@/lib/native/server";

type Props = {
 /** `welcome=1` is the end of setup: the first planned week's list. */
 searchParams: Promise<{ week?: string; plan?: string; welcome?: string }>;
};

export const dynamic = "force-dynamic";

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
 const [mealPlanId, access, native] = await Promise.all([
 params.plan ?? getMealPlanIdForWeek(weekStartISO),
 getAccess(),
 isNativeAppRequest(),
 ]);
 // Once a 7-day trial has ended (lib/billing/access.ts), lists can't be made
 // from the plan any more, but the one they have can still be ticked, added
 // to by hand, shared and deleted. The actions check this themselves.
 const canGenerate = access?.canPlan !== false;
 const trialEndedCard = (
 <UpgradeCard
 placement="grocery"
 title="Your 7-day Pro trial has ended"
 body={
 native
 ? "Making grocery lists from your plan needs BiteSync Pro. You can still tick off, add and remove items on a list you have."
 : "Upgrade to BiteSync Pro to make grocery lists from your plan. You can still tick off, add and remove items on a list you have."
 }
 native={native}
 />
 );

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

 if (!mealPlanId) {
 const fallbackSubtitle = formatWeekLabel(weekStart);
 return (
 <div className={`${ds.mobilePage} ${ds.pageContent}`}>
 <GroceryHeader subtitle={fallbackSubtitle} total={0} checked={0} />
 <div className={`${ds.mobileGutter} ${ds.overlap}`}>
 {canGenerate ? <GroceryEmptyState /> : trialEndedCard}
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
 const toBuy = groceryItems.filter((item) => !item.is_checked);
 const headerActions = (
 <GroceryListActions
 mealPlanId={mealPlanId}
 weekStart={weekStartISO}
 filledDays={filledDays}
 filledMealTypes={filledMealTypes}
 shareText={toBuy.length ? groceryShareText(subtitle, toBuy) : null}
 itemCount={total}
 canGenerate={canGenerate}
 />
 );

 if (total === 0) {
 return (
 <div className={`${ds.mobilePage} ${ds.pageContent}`}>
 {/* With no list and no way to make one, Delete list is all that would be left. */}
 <GroceryHeader subtitle={subtitle} total={0} checked={0} actions={canGenerate ? headerActions : undefined} />
 <div className={`${ds.mobileGutter} ${ds.overlap} space-y-4`}>
 {canGenerate ? <GroceryEmptyState /> : trialEndedCard}
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
 <div className={`mb-3 ${ds.mobileGutter}`}>
 <GroceryDoneState />
 </div>
 ) : null}
 <div className={`${ds.mobileGutter} ${ds.overlap} space-y-2`}>
 {/* The moment someone has just planned their first week is when a
 reminder for the next one makes most sense. */}
 {params.welcome === "1" ? <WeeklyHabitCard placement="welcome" /> : null}
 {uncheckedItems.length > 0 ? (
 <div className={`${ds.card} overflow-hidden`}>
 {/* Grouped by food group, which is also roughly how a supermarket is laid out. */}
 {groupByAisle(uncheckedItems).map((group) => (
 <section key={group.id} aria-label={group.label} className="border-t border-[var(--border-subtle)] first:border-t-0">
 <h2 className="flex items-baseline justify-between px-4 pb-1.5 pt-4 font-display text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--brand-primary)] md:px-5">
 {group.label}
 <span className="font-sans text-[11px] font-semibold normal-case tracking-normal text-[var(--text-muted)]">
 {group.items.length} {group.items.length === 1 ? "item" : "items"}
 </span>
 </h2>
 <div className="divide-y divide-[var(--border-subtle)]">
 {group.items.map((item) => (
 <GroceryItem
 key={item.id}
 id={item.id}
 name={item.name}
 quantity={item.quantity}
 unit={item.unit}
 is_checked={false}
 inList
 />
 ))}
 </div>
 </section>
 ))}
 </div>
 ) : null}
 {checkedItems.length > 0 ? (
 <>
 <div className={`${ds.card} mt-4 divide-y divide-[var(--border-subtle)] overflow-hidden`}>
 <p className="px-4 pb-2 pt-4 font-display text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--text-muted)] md:px-5">
 In your basket ({checkedItems.length})
 </p>
 {checkedItems.map((item) => (
 <GroceryItem
 key={item.id}
 id={item.id}
 name={item.name}
 quantity={item.quantity}
 unit={item.unit}
 is_checked={true}
 inList
 />
 ))}
 </div>
            <LeftoverSuggestionsPanel mealPlanId={mealPlanId} checkedCount={checkedItems.length} />
 </>
 ) : null}
 {mealPlanId ? (
 <div className="pt-4">
 <ManualGroceryAdd mealPlanId={mealPlanId} />
 </div>
 ) : null}
 </div>
 </div>
 );
}
