"use client";

import { useRef, useState, useTransition } from "react";
import { Check, Trash2 } from "lucide-react";
import { formatGroceryItem } from "@/lib/grocery/storeUnits";
import { deleteGroceryItem, toggleGroceryItem } from "@/lib/supabase/grocery";
import { useToast } from "@/components/ui/use-toast";
import { STORE_COLORS } from "@/lib/ui/dietTagStyles";

type Props = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  is_checked: boolean;
  cheapestStore?: string | null;
  price?: string | null;
};

export function GroceryItem({
  id,
  name,
  quantity,
  unit,
  is_checked,
  cheapestStore,
  price,
}: Props) {
  const [checked, setChecked] = useState(is_checked);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();

  function handleToggle() {
    const newChecked = !checked;
    setChecked(newChecked);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const result = await toggleGroceryItem(id, newChecked);
        if (result && "error" in result) {
          setChecked(!newChecked);
          toast({
            title: "Failed to save",
            description: "Check your connection and try again.",
            variant: "destructive",
          });
        }
      });
    }, 300);
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteGroceryItem(id);
      if (result && "error" in result) {
        toast({
          title: "Failed to delete",
          description: "Check your connection and try again.",
          variant: "destructive",
        });
      }
    });
  }

  const storeColor = cheapestStore ? STORE_COLORS[cheapestStore] : undefined;

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm transition-opacity dark:border-gray-800 dark:bg-gray-900 ${
        checked ? "opacity-40" : ""
      } ${isPending ? "opacity-50" : ""}`}
    >
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        aria-pressed={checked}
        aria-label={`${checked ? "Uncheck" : "Check"} ${name}`}
        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all ${
          checked ? "border-[#3a5a40] bg-[#3a5a40]" : "border-gray-300 dark:border-gray-600"
        }`}
      >
        {checked ? <Check className="h-3 w-3 text-white" strokeWidth={3} /> : null}
      </button>

      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        className="min-w-0 flex-1 text-left"
      >
        <p
          className={`truncate text-sm font-medium ${
            checked ? "line-through text-gray-400" : "text-gray-900 dark:text-white"
          }`}
        >
          {formatGroceryItem(name, quantity, unit)}
        </p>
      </button>

      {cheapestStore ? (
        <div className="flex flex-shrink-0 items-center gap-1.5">
          <span
            className="rounded-lg px-2 py-0.5 text-[10px] font-bold text-white"
            style={{ backgroundColor: storeColor ?? "#3a5a40" }}
          >
            {cheapestStore}
          </span>
          {price ? (
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{price}</span>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        aria-label={`Delete ${name}`}
        className="flex-shrink-0 rounded-md p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
