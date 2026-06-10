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
 variant={onGradient ?"outline" :"default"}
 className={
 onGradient
 ?"h-9 w-full border-[var(--surface-overlay)] bg-[var(--surface-card)] text-sm font-medium !text-[var(--brand-primary)] hover:!bg-[var(--surface-overlay)]/90 disabled:opacity-50 sm:w-auto dark:!text-[var(--brand-primary)] dark:hover:!bg-[var(--surface-overlay)]/90"
 :"h-9 bg-[var(--brand-primary)] text-sm text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)]"
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
