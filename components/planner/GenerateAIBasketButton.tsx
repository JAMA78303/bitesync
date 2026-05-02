"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { generateAIBasketForWeek } from "@/app/(app)/planner/ai-actions";
import type { GoalContext } from "@/lib/pricing/types";

type Props = {
  isPro: boolean;
  mealPlanId: string;
  weekStartDate: string;
  goals: GoalContext;
};

export function GenerateAIBasketButton({ isPro, mealPlanId, weekStartDate, goals }: Props) {
  const [isPending, startTransition] = useTransition();
  const [lastSummary, setLastSummary] = useState<string | null>(null);
  const { toast } = useToast();

  function run() {
    if (!isPro) {
      toast({
        title: "Pro feature",
        description: "Upgrade to Pro to generate AI grocery comparisons.",
        variant: "destructive",
      });
      return;
    }
    startTransition(async () => {
      const result = await generateAIBasketForWeek({
        mealPlanId,
        weekStartDate,
        goals,
        ingredients: [],
      });
      if ("error" in result) {
        toast({ title: "AI generation failed", description: result.error, variant: "destructive" });
        return;
      }
      const best = [...result.storeTotals].sort((a, b) => a.total - b.total)[0];
      setLastSummary(best ? `${best.store.toUpperCase()} ~£${best.total.toFixed(2)}` : "No estimate yet");
      toast({
        title: "AI estimate generated",
        description: best
          ? `Best current estimate: ${best.store.toUpperCase()} ~£${best.total.toFixed(2)}`
          : "Snapshot saved with no matched store prices yet.",
      });
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        onClick={run}
        disabled={isPending}
        variant="outline"
        className="h-9 border-[#1A4731] text-[#1A4731] hover:bg-[#F0FDF4]"
      >
        <Sparkles className="mr-2 h-4 w-4" />
        {isPending ? "Generating..." : "AI grocery plan"}
      </Button>
      {lastSummary ? <span className="text-xs text-slate-500">{lastSummary}</span> : null}
    </div>
  );
}
