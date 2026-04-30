"use client";

import { Plus } from "lucide-react";
import type { MealType } from "@/types";

type Props = {
  day: number;
  mealType: MealType;
  dayLabel: string;
  onClick: (day: number, mealType: MealType) => void;
};

export function AddSlotButton({ day, mealType, dayLabel, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={() => onClick(day, mealType)}
      aria-label={`Add ${mealType} for ${dayLabel}`}
      className="flex min-h-[64px] w-full items-center justify-center rounded-lg border-2 border-dashed border-slate-200 text-slate-300 transition-all duration-150 hover:border-[#6EE7B7] hover:bg-[#F0FDF4] hover:text-[#1A4731]"
    >
      <Plus className="h-5 w-5" />
    </button>
  );
}
