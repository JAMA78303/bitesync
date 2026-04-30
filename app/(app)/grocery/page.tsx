import { createClient } from "@/lib/supabase/server";
import { getMonday, toLocalISO, formatWeekLabel } from "@/lib/utils/dates";
import { getMealPlanIdForWeek, getGroceryItems } from "@/lib/supabase/grocery";
import { GroceryHeader } from "@/components/grocery/GroceryHeader";
import { GroceryItem } from "@/components/grocery/GroceryItem";
import { GroceryEmptyState } from "@/components/grocery/GroceryEmptyState";
import { GroceryDoneState } from "@/components/grocery/GroceryDoneState";

type Props = {
  searchParams: Promise<{ week?: string }>;
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
  const weekLabel = formatWeekLabel(weekStart);
  const mealPlanId = await getMealPlanIdForWeek(weekStartISO);

  if (!mealPlanId) {
    return (
      <div className="pb-20">
        <div className="border-b border-slate-100 px-4 pb-3 pt-4">
          <h1 className="text-lg font-semibold text-slate-800">Grocery List</h1>
          <p className="mt-0.5 text-xs text-slate-400">{weekLabel}</p>
        </div>
        <GroceryEmptyState />
      </div>
    );
  }

  const { data } = await getGroceryItems(mealPlanId);
  const groceryItems = data ?? [];
  const total = groceryItems.length;
  const checked = groceryItems.filter((item) => item.is_checked).length;
  const allDone = total > 0 && checked === total;

  if (total === 0) {
    return (
      <div className="pb-20">
        <div className="border-b border-slate-100 px-4 pb-3 pt-4">
          <h1 className="text-lg font-semibold text-slate-800">Grocery List</h1>
          <p className="mt-0.5 text-xs text-slate-400">{weekLabel}</p>
        </div>
        <GroceryEmptyState />
      </div>
    );
  }

  const uncheckedItems = groceryItems.filter((item) => !item.is_checked);
  const checkedItems = groceryItems.filter((item) => item.is_checked);

  return (
    <div className="pb-20">
      <GroceryHeader weekLabel={weekLabel} total={total} checked={checked} />
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
      </div>
    </div>
  );
}
