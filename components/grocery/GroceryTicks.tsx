"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { toggleGroceryItem } from "@/lib/supabase/grocery-actions";
import { useToast } from "@/components/ui/use-toast";

type TickableItem = { id: string; is_checked: boolean };

type GroceryTicks = {
  checked: number;
  total: number;
  isChecked: (id: string) => boolean;
  toggle: (id: string) => void;
};

const GroceryTicksContext = createContext<GroceryTicks | null>(null);

// Taps since the site was opened, by item id. Kept outside React so they
// outlive the page: the back button brings /grocery back from Next's cache as
// it was before them, because a tick doesn't refresh the page.
const tapsSinceOpen = new Map<string, boolean>();

/**
 * Which items on the grocery page are ticked, as the person taps them.
 *
 * A tick only saves; it doesn't re-render the page. That reply would be the
 * whole page, and a connection that drops halfway through it (common in a
 * shop) left a half-received page that showed "Load failed" in place of the
 * list. Everything that shows ticks reads them from here instead: the header's
 * count and progress bar, the basket count, "All done", and the share text and
 * offline copy.
 */
export function GroceryTicksProvider({ items, children }: { items: TickableItem[]; children: ReactNode }) {
  // They win over `items`, the server's copy as of when the page was rendered.
  const [taps, setTaps] = useState<Record<string, boolean>>(() => Object.fromEntries(tapsSinceOpen));
  // A fresh copy from the server (after adding or deleting an item) drops the
  // taps that failed to save, so it shows what the server has now.
  const [itemsShown, setItemsShown] = useState(items);
  if (items !== itemsShown) {
    setItemsShown(items);
    setTaps(Object.fromEntries(tapsSinceOpen));
  }
  const saveTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const { toast } = useToast();

  const fromServer = new Map(items.map((item) => [item.id, item.is_checked]));
  const isChecked = (id: string) => taps[id] ?? fromServer.get(id) ?? false;

  function setTap(id: string, value: boolean) {
    tapsSinceOpen.set(id, value);
    setTaps((current) => ({ ...current, [id]: value }));
  }

  function failed(id: string, value: boolean) {
    // Put it back, unless it has been tapped again since. The tap is forgotten
    // rather than kept as "not ticked": if only the reply was lost, the save
    // went through, and the next fresh copy of the page should show that.
    if (tapsSinceOpen.get(id) === value) tapsSinceOpen.delete(id);
    setTaps((current) => (current[id] === value ? { ...current, [id]: !value } : current));
    toast({
      title: "Failed to save",
      description: "Check your connection and try again.",
      variant: "destructive",
    });
  }

  function toggle(id: string) {
    const value = !isChecked(id);
    setTap(id, value);

    // A quick double tap saves once. Not in a transition: an async transition
    // would hold back every other update on the page until it settles.
    const timers = saveTimers.current;
    clearTimeout(timers.get(id));
    timers.set(
      id,
      setTimeout(() => {
        timers.delete(id);
        toggleGroceryItem(id, value).then(
          (result) => {
            if (result && "error" in result) failed(id, value);
          },
          () => failed(id, value),
        );
      }, 300),
    );
  }

  const ticks: GroceryTicks = {
    checked: items.filter((item) => isChecked(item.id)).length,
    total: items.length,
    isChecked,
    toggle,
  };

  return <GroceryTicksContext.Provider value={ticks}>{children}</GroceryTicksContext.Provider>;
}

/** For the rows of a list, which always sit inside GroceryTicksProvider. */
export function useGroceryTicks(): GroceryTicks {
  const ticks = useContext(GroceryTicksContext);
  if (!ticks) throw new Error("useGroceryTicks needs a GroceryTicksProvider above it");
  return ticks;
}

/**
 * For the header, which also shows on a page with no list. There it keeps the
 * counts it was given; above a list it follows the ticks.
 */
export function useGroceryCounts(fallback: { checked: number; total: number }) {
  const ticks = useContext(GroceryTicksContext);
  return ticks ? { checked: ticks.checked, total: ticks.total } : fallback;
}
