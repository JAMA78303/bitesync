"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { removeSlotEntry } from "@/lib/supabase/meal-plans";
import { useToast } from "@/components/ui/use-toast";
import { recipeDietWarnings, type ProfileDietPrefs } from "@/lib/utils/diet";
import { getEntryCalories, getEntryName } from "@/types";
import type { MealPlanEntry } from "@/types";

type Props = { entry: MealPlanEntry; dietPrefs?: ProfileDietPrefs | null };

export function RecipeSlotCard({ entry, dietPrefs }: Props) {
  const [isPending, startTransition] = useTransition();
  const [removed, setRemoved] = useState(false);
  const { toast } = useToast();
  if (removed) return null;

  const name = getEntryName(entry);
  const calories = getEntryCalories(entry);
  const isQuickAdd = !entry.recipe_id;
  const recipe = entry.recipe;
  const dietWarnings =
    dietPrefs && recipe
      ? recipeDietWarnings(dietPrefs, {
          fits_vegetarian: recipe.fits_vegetarian ?? null,
          fits_vegan: recipe.fits_vegan ?? null,
          fits_gluten_free: recipe.fits_gluten_free ?? null,
        })
      : [];

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

  const shellClass = `group relative flex min-h-[64px] w-full flex-col justify-between rounded-lg border border-slate-200 bg-slate-50 p-2 text-left transition-opacity duration-150 ${
    isPending ? "opacity-50" : "opacity-100"
  }`;

  const body = (
    <>
      <p className={`line-clamp-2 pr-5 text-xs font-semibold leading-tight ${isQuickAdd ? "text-slate-600" : "text-slate-700"}`}>
        {name}
      </p>
      {calories != null ? (
        <p className={`mt-1 text-[10px] ${isQuickAdd ? "text-slate-400" : "text-slate-500"}`}>
          {Math.round(calories)} kcal
          {isQuickAdd ? <span className="ml-1 text-slate-300">· quick add</span> : null}
        </p>
      ) : null}
      {!isQuickAdd ? (
        <p className="mt-1 text-[9px] font-medium text-[#1A4731]/90">View recipe & ingredients →</p>
      ) : null}
      {dietWarnings.length > 0 ? (
        <p className="mt-1 line-clamp-2 text-[9px] font-medium text-amber-700" title={dietWarnings.join(" · ")}>
          {dietWarnings.join(" · ")}
        </p>
      ) : null}
    </>
  );

  return (
    <div className={shellClass}>
      {entry.recipe_id && !isQuickAdd ? (
        <Link
          href={`/recipes/${entry.recipe_id}`}
          className="block min-h-[44px] outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[#1A4731]"
          aria-label={`Open recipe ${name} to see ingredients`}
        >
          {body}
        </Link>
      ) : (
        body
      )}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleRemove();
        }}
        disabled={isPending}
        aria-label={`Remove ${name}`}
        className="absolute right-1.5 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded bg-white/90 text-slate-500 opacity-80 transition-all duration-150 hover:bg-white hover:text-red-500 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
