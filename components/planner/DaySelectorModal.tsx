"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { generateGroceryList } from "@/lib/supabase/grocery";
import { useToast } from "@/components/ui/use-toast";
import { DAY_NAMES, MEAL_LABELS, MEAL_TYPES } from "@/types";
import type { MealType } from "@/types";

type Props = {
  open: boolean;
  onClose: () => void;
  mealPlanId: string;
  weekStart: string;
  filledDays: number[];
  filledMealTypes: MealType[];
};

export function DaySelectorModal({ open, onClose, mealPlanId, weekStart, filledDays, filledMealTypes }: Props) {
  const orderedFilledDays = [...filledDays].sort((a, b) => a - b);
  const [selected, setSelected] = useState<number[]>(filledDays);
  const [selectedMeals, setSelectedMeals] = useState<MealType[]>(filledMealTypes);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setSelected(filledDays);
      setSelectedMeals(filledMealTypes);
    }
  }, [open, filledDays, filledMealTypes]);

  function toggleDay(day: number) {
    setSelected((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  function selectAll() {
    setSelected(orderedFilledDays);
  }

  function clearAll() {
    setSelected([]);
  }

  function selectDayCount(count: number) {
    setSelected(orderedFilledDays.slice(0, count));
  }

  function toggleMealType(mealType: MealType) {
    setSelectedMeals((prev) => (prev.includes(mealType) ? prev.filter((m) => m !== mealType) : [...prev, mealType]));
  }

  function selectAllMeals() {
    setSelectedMeals(filledMealTypes);
  }

  function clearAllMeals() {
    setSelectedMeals([]);
  }

  const dayCountOptions = Array.from({ length: 7 }, (_, i) => i + 1);

  function handleGenerate() {
    if (!selected.length || !selectedMeals.length) return;
    startTransition(async () => {
      const result = await generateGroceryList(mealPlanId, selected, selectedMeals);
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

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            <span className="text-sm font-semibold">Which days to include?</span>
          </DialogTitle>
        </DialogHeader>
        <p className="-mt-2 text-xs text-slate-400">Only ingredients from selected days and meal types will be added</p>
        <div className="flex flex-wrap gap-2">
          {dayCountOptions.map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => selectDayCount(count)}
              disabled={orderedFilledDays.length < count}
              className="rounded-md border border-slate-200 px-2 py-1 text-[11px] text-slate-500 transition-colors hover:bg-slate-50 hover:text-[#1A4731] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {count} day{count === 1 ? "" : "s"}
            </button>
          ))}
          <button
            type="button"
            onClick={selectAll}
            disabled={orderedFilledDays.length === 0}
            className="rounded-md border border-slate-200 px-2 py-1 text-[11px] text-slate-500 transition-colors hover:bg-slate-50 hover:text-[#1A4731] disabled:cursor-not-allowed disabled:opacity-40"
          >
            All planned
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }, (_, day) => {
            const hasMeals = filledDays.includes(day);
            const isSelected = selected.includes(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => hasMeals && toggleDay(day)}
                disabled={!hasMeals}
                className={`flex flex-col items-center rounded-lg px-1 py-2 text-center transition-all duration-150 ${
                  !hasMeals
                    ? "cursor-not-allowed bg-slate-50 opacity-30"
                    : isSelected
                      ? "bg-[#1A4731] text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                <span className="text-[9px] font-semibold uppercase tracking-wide">{DAY_NAMES[day].slice(0, 3)}</span>
                {hasMeals ? <span className={`mt-0.5 text-[8px] ${isSelected ? "text-green-200" : "text-slate-400"}`}>●</span> : null}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={selectAll} className="text-xs text-slate-400 transition-colors hover:text-[#1A4731]">
            Select all
          </button>
          <span className="text-slate-200">·</span>
          <button type="button" onClick={clearAll} className="text-xs text-slate-400 transition-colors hover:text-red-400">
            Clear all
          </button>
          <span className="ml-auto text-xs text-slate-400">
            {selected.length} of {filledDays.length} days
          </span>
        </div>
        <p className="text-xs font-semibold text-slate-500">Meal types</p>
        <div className="grid grid-cols-2 gap-2">
          {MEAL_TYPES.map((mealType) => {
            const hasMeals = filledMealTypes.includes(mealType);
            const isSelected = selectedMeals.includes(mealType);
            return (
              <button
                key={mealType}
                type="button"
                onClick={() => hasMeals && toggleMealType(mealType)}
                disabled={!hasMeals}
                className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                  !hasMeals
                    ? "cursor-not-allowed bg-slate-100 text-slate-300"
                    : isSelected
                      ? "bg-[#1A4731] text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {MEAL_LABELS[mealType]}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={selectAllMeals} className="text-xs text-slate-400 transition-colors hover:text-[#1A4731]">
            Select all meal types
          </button>
          <span className="text-slate-200">·</span>
          <button type="button" onClick={clearAllMeals} className="text-xs text-slate-400 transition-colors hover:text-red-400">
            Clear all
          </button>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={!selected.length || !selectedMeals.length || isPending}
          className="w-full bg-[#1A4731] text-white hover:bg-[#153928]"
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
      </DialogContent>
    </Dialog>
  );
}
