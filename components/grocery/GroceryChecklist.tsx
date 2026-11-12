"use client";

import { useState } from "react";
import { GroceryDoneState } from "@/components/grocery/GroceryDoneState";
import { GroceryItem } from "@/components/grocery/GroceryItem";
import { useGroceryTicks } from "@/components/grocery/GroceryTicks";
import { LeftoverSuggestionsPanel } from "@/components/grocery/LeftoverSuggestionsPanel";
import { groupByAisle } from "@/lib/grocery/aisles";
import { ds } from "@/lib/ui/classes";

type Item = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  is_checked: boolean;
};

type Props = {
  items: Item[];
  mealPlanId: string;
};

/**
 * The list: what's still to buy, grouped by aisle, then "In your basket".
 *
 * A row stays where it was when the list opened. Ticking strikes it through in
 * place rather than moving it to the basket, so the rows don't shift under a
 * finger mid-shop and a mistaken tick is undone where it happened. Ticked rows
 * join the basket the next time the list opens. Rows added since (by hand) go
 * where the server puts them.
 */
export function GroceryChecklist({ items, mealPlanId }: Props) {
  const { checked, isChecked } = useGroceryTicks();
  // Each row's section and order when first shown. The server's refreshes sort
  // ticked rows last, which would move them within their aisle.
  const [shownAs] = useState(
    () => new Map(items.map((item, index) => [item.id, { inBasket: item.is_checked, index }])),
  );
  const place = (item: Item) => shownAs.get(item.id) ?? { inBasket: item.is_checked, index: Number.MAX_SAFE_INTEGER };
  const rows = [...items].sort((a, b) => place(a).index - place(b).index);
  const toBuy = rows.filter((item) => !place(item).inBasket);
  const basket = rows.filter((item) => place(item).inBasket);
  const inBasketCount = basket.filter((item) => isChecked(item.id)).length;

  return (
    <>
      {toBuy.length > 0 ? (
        <div className={`${ds.card} overflow-hidden`}>
          {/* Grouped by food group, which is also roughly how a supermarket is laid out. */}
          {groupByAisle(toBuy).map((group) => {
            const left = group.items.filter((item) => !isChecked(item.id)).length;
            return (
              <section key={group.id} aria-label={group.label} className="border-t border-[var(--border-subtle)] first:border-t-0">
                <h2 className="flex items-baseline justify-between px-4 pb-1.5 pt-4 font-display text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--brand-primary)] md:px-5">
                  {group.label}
                  <span className="font-sans text-[11px] font-semibold normal-case tracking-normal text-[var(--text-muted)]">
                    {left} {left === 1 ? "item" : "items"}
                  </span>
                </h2>
                <div className="divide-y divide-[var(--border-subtle)]">
                  {group.items.map((item) => (
                    <GroceryItem key={item.id} id={item.id} name={item.name} quantity={item.quantity} unit={item.unit} inList />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : null}
      {basket.length > 0 ? (
        <div className={`${ds.card} mt-4 divide-y divide-[var(--border-subtle)] overflow-hidden`}>
          <p className="px-4 pb-2 pt-4 font-display text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--text-muted)] md:px-5">
            In your basket ({inBasketCount})
          </p>
          {basket.map((item) => (
            <GroceryItem key={item.id} id={item.id} name={item.name} quantity={item.quantity} unit={item.unit} inList />
          ))}
        </div>
      ) : null}
      <LeftoverSuggestionsPanel mealPlanId={mealPlanId} checkedCount={checked} />
    </>
  );
}

/** "All done!" as soon as the last item is ticked. */
export function GroceryDoneBanner() {
  const { checked, total } = useGroceryTicks();
  if (total === 0 || checked < total) return null;
  return (
    <div className={`mb-3 ${ds.mobileGutter}`}>
      <GroceryDoneState />
    </div>
  );
}
