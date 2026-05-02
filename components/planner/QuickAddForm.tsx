"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { quickAddMeal } from "@/lib/supabase/meal-plans";
import { useToast } from "@/components/ui/use-toast";
import type { MealType } from "@/types";

type Props = {
  mealPlanId: string;
  day: number;
  mealType: MealType;
  slotIndex?: number;
  onDone: () => void;
  onSwitchToRecipe: () => void;
};

export function QuickAddForm({ mealPlanId, day, mealType, slotIndex = 0, onDone, onSwitchToRecipe }: Props) {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function handleSubmit() {
    if (!name.trim()) return;
    startTransition(async () => {
      const parsedCalories = calories.trim() ? Number.parseInt(calories, 10) : null;
      const result = await quickAddMeal(
        mealPlanId,
        day,
        mealType,
        name.trim(),
        Number.isNaN(parsedCalories as number) ? null : parsedCalories,
        slotIndex,
      );
      if (result?.error) {
        toast({
          title: "Failed to add meal",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      onDone();
    });
  }

  return (
    <div className="flex flex-col gap-2 p-1">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Meal name e.g. Chicken salad"
        className="h-9 text-sm"
        autoFocus
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
      />
      <Input
        value={calories}
        onChange={(e) => setCalories(e.target.value)}
        placeholder="Calories (optional)"
        type="number"
        className="h-9 text-sm"
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
          if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
        }}
      />
      <div className="flex gap-2">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!name.trim() || isPending}
          className="h-8 flex-1 bg-[#1A4731] text-xs text-white hover:bg-[#153928]"
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add"}
        </Button>
        <Button type="button" variant="outline" onClick={onDone} className="h-8 text-xs">
          Cancel
        </Button>
      </div>
      <button
        type="button"
        onClick={onSwitchToRecipe}
        className="text-center text-xs text-slate-400 transition-colors hover:text-[#1A4731]"
      >
        Add from recipe library instead →
      </button>
    </div>
  );
}
