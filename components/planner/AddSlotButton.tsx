"use client";

import { useState } from "react";
import { Plus, BookOpen, PenLine } from "lucide-react";
import { QuickAddForm } from "@/components/planner/QuickAddForm";
import type { MealType } from "@/types";

type Props = {
  day: number;
  mealType: MealType;
  dayLabel: string;
  mealPlanId: string;
  slotIndex?: number;
  onPickRecipe: (day: number, mealType: MealType, slotIndex?: number) => void;
};

export function AddSlotButton({ day, mealType, dayLabel, mealPlanId, slotIndex = 0, onPickRecipe }: Props) {
  const [mode, setMode] = useState<"idle" | "quickadd">("idle");

  if (mode === "quickadd") {
    return (
      <QuickAddForm
        mealPlanId={mealPlanId}
        day={day}
        mealType={mealType}
        slotIndex={slotIndex}
        onDone={() => setMode("idle")}
        onSwitchToRecipe={() => {
          setMode("idle");
          onPickRecipe(day, mealType, slotIndex);
        }}
      />
    );
  }

  return (
    <div className="group relative min-h-[64px] w-full">
      <button
        type="button"
        onClick={() => setMode("quickadd")}
        aria-label={`Add ${mealType} for ${dayLabel}`}
        className="flex h-full min-h-[64px] w-full items-center justify-center rounded-lg border-2 border-dashed border-slate-200 text-slate-300 transition-all duration-150 hover:border-[#6EE7B7] hover:bg-[#F0FDF4] hover:text-[#1A4731]"
      >
        <Plus className="h-4 w-4" />
      </button>

      <div className="absolute inset-0 z-10 hidden flex-col divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm group-hover:flex">
        <button
          type="button"
          onClick={() => setMode("quickadd")}
          className="flex flex-1 items-center gap-2 px-3 text-xs text-slate-500 transition-colors hover:bg-[#F0FDF4] hover:text-[#1A4731]"
        >
          <PenLine className="h-3 w-3 shrink-0" />
          Quick add
        </button>
        <button
          type="button"
          onClick={() => onPickRecipe(day, mealType, slotIndex)}
          className="flex flex-1 items-center gap-2 px-3 text-xs text-slate-500 transition-colors hover:bg-[#F0FDF4] hover:text-[#1A4731]"
        >
          <BookOpen className="h-3 w-3 shrink-0" />
          From recipes
        </button>
      </div>
    </div>
  );
}
