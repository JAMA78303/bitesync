"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { generateGroceryList } from "@/lib/supabase/grocery";
import { useToast } from "@/components/ui/use-toast";
import { DAY_NAMES, MEAL_LABELS, MEAL_TYPES } from "@/types";
import type { MealType } from "@/types";

const WEEK_DAYS = [0, 1, 2, 3, 4, 5, 6] as const;

type Props = {
  open: boolean;
  onClose: () => void;
  mealPlanId: string;
  weekStart: string;
  filledDays: number[];
  filledMealTypes: MealType[];
};

export function DaySelectorModal({ open, onClose, mealPlanId, weekStart, filledDays, filledMealTypes }: Props) {
  const plannerHasRecipeSlots = filledMealTypes.length > 0;
  const availableMealTypes = plannerHasRecipeSlots ? filledMealTypes : [...MEAL_TYPES];
  const [selected, setSelected] = useState<number[]>([...WEEK_DAYS]);
  const [selectedMeals, setSelectedMeals] = useState<MealType[]>([...availableMealTypes]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setSelected([...WEEK_DAYS]);
      setSelectedMeals(filledMealTypes.length ? [...filledMealTypes] : [...MEAL_TYPES]);
    }
  }, [open, filledMealTypes]);

  function toggleDay(day: number) {
    setSelected((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  function toggleMealType(mealType: MealType) {
    if (!availableMealTypes.includes(mealType)) return;
    setSelectedMeals((prev) => (prev.includes(mealType) ? prev.filter((m) => m !== mealType) : [...prev, mealType]));
  }

  function handleGenerate() {
    if (!selected.length || !selectedMeals.length) return;
    startTransition(async () => {
      const mealTypesArg = plannerHasRecipeSlots ? selectedMeals : undefined;
      const result = await generateGroceryList(mealPlanId, selected, mealTypesArg);
      if (result?.error) {
        toast({
          title: "Failed to generate",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      onClose();
      router.push(`/grocery?week=${weekStart}&plan=${mealPlanId}`);
      router.refresh();
    });
  }

  const snackUnavailable = plannerHasRecipeSlots && !filledMealTypes.includes("snack");
  const visibleMealTypes = MEAL_TYPES.filter((mealType) => {
    if (mealType === "snack" && snackUnavailable) return false;
    return true;
  });

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-md gap-0 p-0 sm:max-w-lg">
        <div className="space-y-1 border-b border-slate-100 px-5 pb-4 pt-5">
          <DialogHeader>
            <div className="flex items-start justify-between gap-2">
              <DialogTitle>Build your grocery list</DialogTitle>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="-mr-1 -mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </DialogHeader>
          <p className="text-sm text-slate-500">Choose which days and meals to shop for.</p>
        </div>

        <div className="space-y-6 px-5 py-5">
          <section className="space-y-3">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-800">Days</h3>
              <span className="text-xs text-slate-400">{selected.length} of 7 selected</span>
            </div>
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {Array.from({ length: 7 }, (_, day) => {
                const hasMeals = filledDays.includes(day);
                const isSelected = selected.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`flex flex-col items-center rounded-xl px-1 py-2.5 text-center transition-all ${
                      isSelected ? "bg-[#1A4731] text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wide">
                      {DAY_NAMES[day].slice(0, 3)}
                    </span>
                    <span className={`mt-1 text-[9px] ${isSelected ? "text-green-200" : "text-slate-400"}`}>
                      {hasMeals ? "planned" : "empty"}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <button type="button" onClick={() => setSelected([...WEEK_DAYS])} className="hover:text-[#1A4731] hover:underline">
                Select all
              </button>
              <span aria-hidden>·</span>
              <button type="button" onClick={() => setSelected([])} className="hover:text-red-500 hover:underline">
                Clear
              </button>
            </div>
          </section>

          <section className="space-y-3 border-t border-slate-100 pt-5">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-800">Meal types</h3>
              <span className="text-xs text-slate-400">{selectedMeals.length} selected</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {visibleMealTypes.map((mealType) => {
                const isSelected = selectedMeals.includes(mealType);
                return (
                  <button
                    key={mealType}
                    type="button"
                    onClick={() => toggleMealType(mealType)}
                    className={`rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      isSelected
                        ? "bg-[#1A4731] text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {MEAL_LABELS[mealType]}
                  </button>
                );
              })}
            </div>
            {snackUnavailable ? (
              <p className="text-xs text-slate-400">No snacks planned this week — snack meals are omitted.</p>
            ) : null}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <button
                type="button"
                onClick={() => setSelectedMeals([...availableMealTypes])}
                className="hover:text-[#1A4731] hover:underline"
              >
                Select all
              </button>
              <span aria-hidden>·</span>
              <button type="button" onClick={() => setSelectedMeals([])} className="hover:text-red-500 hover:underline">
                Clear
              </button>
            </div>
          </section>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="w-full border-gray-300 bg-white text-gray-800 hover:bg-gray-50 sm:flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={!selected.length || !selectedMeals.length || isPending}
            className="w-full bg-[#1A4731] text-white hover:bg-[#153928] sm:flex-[2]"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              `Generate list for ${selected.length} day${selected.length !== 1 ? "s" : ""} · ${selectedMeals.length} type${selectedMeals.length !== 1 ? "s" : ""}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
