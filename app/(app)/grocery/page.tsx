import { createClient } from "@/lib/supabase/server";
import { getMonday, toLocalISO, formatWeekLabel } from "@/lib/utils/dates";
import { formatGrocerySubtitle } from "@/lib/utils/grocery-display";
import { getMealPlanIdForWeek, getGroceryItems } from "@/lib/supabase/grocery";
import { GroceryHeader } from "@/components/grocery/GroceryHeader";
import { GroceryItem } from "@/components/grocery/GroceryItem";
import { GroceryEmptyState } from "@/components/grocery/GroceryEmptyState";
import { GroceryDoneState } from "@/components/grocery/GroceryDoneState";
import { ManualGroceryAdd } from "@/components/grocery/ManualGroceryAdd";
import { GroceryListActions } from "@/components/grocery/GroceryListActions";
import { MEAL_TYPES } from "@/types";

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
        <p className="text-sm text-gray-600">Please log in to view your grocery list.</p>
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

  if (!mealPlanId) {
    const fallbackSubtitle = formatWeekLabel(weekStart);
    return (
      <div className="pb-20">
        <div className="border-b border-slate-100 px-4 pb-3 pt-4">
          <h1 className="text-lg font-semibold text-slate-800">Grocery List</h1>
          <p className="mt-0.5 text-xs text-slate-400">{fallbackSubtitle}</p>
        </div>
        <GroceryEmptyState />
      </div>
    );
  }

  const { data } = await getGroceryItems(mealPlanId);
  const groceryItems = data ?? [];
  const { data: entries } = await supabase
    .from("meal_plan_entries")
    .select("day_of_week, meal_type, recipe_id")
    .eq("meal_plan_id", mealPlanId)
    .not("recipe_id", "is", null);
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
      <div className="pb-20">
        <GroceryHeader subtitle={subtitle} total={0} checked={0} actions={headerActions} />
        <GroceryEmptyState />
        <div className="px-4 pt-4">
          <ManualGroceryAdd mealPlanId={mealPlanId} />
        </div>
      </div>
    );
  }

  const uncheckedItems = groceryItems.filter((item) => !item.is_checked);
  const checkedItems = groceryItems.filter((item) => item.is_checked);

  return (
    <div className="pb-20">
      <GroceryHeader subtitle={subtitle} total={total} checked={checked} actions={headerActions} />
      {allDone ? <GroceryDoneState /> : null}
      <div className="space-y-2 px-4 pt-4">
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
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
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
