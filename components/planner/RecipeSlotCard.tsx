"use client";

import { X } from "lucide-react";
import { useState, useTransition } from "react";
import { removeSlotEntry } from "@/lib/supabase/meal-plans";
import { useToast } from "@/components/ui/use-toast";
import { getEntryCalories, getEntryName } from "@/types";
import type { MealPlanEntry } from "@/types";

type Props = { entry: MealPlanEntry };

export function RecipeSlotCard({ entry }: Props) {
  const [isPending, startTransition] = useTransition();
  const [removed, setRemoved] = useState(false);
  const { toast } = useToast();
  if (removed) return null;

  const name = getEntryName(entry);
  const calories = getEntryCalories(entry);
  const isQuickAdd = !entry.recipe_id;

  function handleRemove() {
    setRemoved(true);
    startTransition(async () => {
      const result = await removeSlotEntry(entry.id);
      if (result?.error) {
        setRemoved(false);
        toast({ title: "Failed to remove", variant: "destructive" });
      }
    });
  }

  return (
    <div
      className={`group relative flex min-h-[64px] w-full flex-col justify-between rounded-lg p-2 text-left transition-opacity duration-150 ${
        isQuickAdd ? "border border-slate-200 bg-slate-50" : "border border-[#6EE7B7] bg-[#D1FAE5]"
      } ${isPending ? "opacity-50" : "opacity-100"}`}
    >
      <p className={`line-clamp-2 pr-5 text-xs font-semibold leading-tight ${isQuickAdd ? "text-slate-600" : "text-[#1A4731]"}`}>
        {name}
      </p>
      {calories != null ? (
        <p className={`mt-1 text-[10px] ${isQuickAdd ? "text-slate-400" : "text-[#059669]"}`}>
          {Math.round(calories)} kcal
          {isQuickAdd ? <span className="ml-1 text-slate-300">· quick add</span> : null}
        </p>
      ) : null}
      <button
        type="button"
        onClick={handleRemove}
        disabled={isPending}
        aria-label={`Remove ${name}`}
        className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded text-slate-300 opacity-0 transition-all duration-150 hover:bg-white hover:text-red-400 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
