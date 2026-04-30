"use client";

import { useRef, useState, useTransition } from "react";
import { Check } from "lucide-react";
import { toggleGroceryItem } from "@/lib/supabase/grocery";
import { useToast } from "@/components/ui/use-toast";

type Props = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  is_checked: boolean;
};

export function GroceryItem({ id, name, quantity, unit, is_checked }: Props) {
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

  function formatQty(qty: number): string {
    return qty % 1 === 0 ? qty.toString() : qty.toFixed(1);
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      aria-pressed={checked}
      aria-label={`${checked ? "Uncheck" : "Check"} ${name}`}
      className={`min-h-[56px] w-full rounded-xl border p-4 text-left transition-all duration-200 ${
        checked
          ? "border-slate-100 bg-slate-50 opacity-60"
          : "border-slate-200 bg-white hover:border-[#6EE7B7] hover:bg-[#F0FDF4]"
      } ${isPending ? "opacity-50" : ""}`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
            checked ? "border-[#1A4731] bg-[#1A4731]" : "border-slate-300"
          }`}
        >
          {checked ? <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} /> : null}
        </div>

        <div className="min-w-0 flex-1">
          <span className={`block truncate text-[15px] font-medium ${checked ? "text-slate-400 line-through" : "text-slate-700"}`}>
            {name}
          </span>
          <span className="mt-0.5 block text-sm text-slate-400">
            {formatQty(quantity)} {unit}
          </span>
        </div>
      </div>
    </button>
  );
}
