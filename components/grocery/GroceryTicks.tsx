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

/**
 * Which items on the grocery page are ticked, as the person taps them.
 *
 * The page itself is rendered on the server, and a save only reaches it once
 * Next.js has re-rendered the whole page in reply. Server actions run one at a
 * time, so while someone ticks their way round a shop the server's copy lags
 * by several seconds. Taps made here count straight away instead: the
 * header's count and progress bar, the basket count and "All done" read them.
 */
export function GroceryTicksProvider({ items, children }: { items: TickableItem[]; children: ReactNode }) {
  // Taps on this page, by item id. They win over `items`, which only catches up later.
  const [taps, setTaps] = useState<Record<string, boolean>>({});
  const saveTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const { toast } = useToast();

  const fromServer = new Map(items.map((item) => [item.id, item.is_checked]));
  const isChecked = (id: string) => taps[id] ?? fromServer.get(id) ?? false;

  function setTap(id: string, value: boolean) {
    setTaps((current) => ({ ...current, [id]: value }));
  }

  function failed(id: string, value: boolean) {
    // Put it back, unless it has been tapped again since.
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
