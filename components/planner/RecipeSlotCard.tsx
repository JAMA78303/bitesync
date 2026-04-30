"use client";

import { X } from "lucide-react";
import { useState, useTransition } from "react";
import { removeSlotEntry } from "@/lib/supabase/meal-plans";
import { useToast } from "@/components/ui/use-toast";
import type { MealPlanEntry } from "@/types";

type Props = { entry: MealPlanEntry };

export function RecipeSlotCard({ entry }: Props) {
  const [isPending, startTransition] = useTransition();
  const [removed, setRemoved] = useState(false);
  const { toast } = useToast();
  if (removed) return null;

  const calories = entry.recipe?.recipe_nutrition?.calories;
  const hasNutrition = calories !== null && calories !== undefined;

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
    <div className="group relative w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-left shadow-sm">
      <p className="truncate text-sm font-medium text-gray-900">{entry.recipe?.name ?? "Recipe"}</p>
      {hasNutrition && <p className="mt-1 text-xs text-gray-500">{Math.round(calories)} kcal</p>}
      <button
        type="button"
        onClick={handleRemove}
        disabled={isPending}
        className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 md:opacity-0 md:group-hover:opacity-100"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
