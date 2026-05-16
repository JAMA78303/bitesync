"use client";

import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DaySelectorModal } from "@/components/planner/DaySelectorModal";
import type { MealType } from "@/types";

type Props = {
  mealPlanId: string;
  weekStart: string;
  filledDays: number[];
  filledMealTypes: MealType[];
  onGradient?: boolean;
};

export function GenerateListButton({
  mealPlanId,
  weekStart,
  filledDays,
  filledMealTypes,
  onGradient = false,
}: Props) {
  const [showSelector, setShowSelector] = useState(false);

  return (
    <>
      <Button
        onClick={() => setShowSelector(true)}
        disabled={filledDays.length === 0}
        className={
          onGradient
            ? "h-9 w-full bg-white text-sm text-[#3a5a40] hover:bg-white/90 sm:w-auto"
            : "h-9 bg-[#3a5a40] text-sm text-white hover:bg-[#2d4a32]"
        }
      >
        <ShoppingCart className="mr-2 h-4 w-4" />
        Generate grocery list
      </Button>

      <DaySelectorModal
        open={showSelector}
        onClose={() => setShowSelector(false)}
        mealPlanId={mealPlanId}
        weekStart={weekStart}
        filledDays={filledDays}
        filledMealTypes={filledMealTypes}
      />
    </>
  );
}
