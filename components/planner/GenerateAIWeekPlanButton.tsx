"use client";

import { useTransition } from "react";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { generateAIWeekPlan, type GoalContext } from "@/app/(app)/planner/ai-actions";

type Props = {
  isPro: boolean;
  mealPlanId: string;
  goals: GoalContext;
};

export function GenerateAIWeekPlanButton({ isPro, mealPlanId, goals }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function runWeekPlan() {
    if (!isPro) {
      toast({
        title: "Pro feature",
        description: "Upgrade to Pro to generate AI weekly meal plans.",
        variant: "destructive",
      });
      return;
    }
    startTransition(async () => {
      try {
        const result = await generateAIWeekPlan({ mealPlanId, goals });
        if ("error" in result) {
          toast({ title: "AI week plan failed", description: result.error, variant: "destructive" });
          return;
        }
        const src = "planSource" in result && result.planSource === "claude" ? "Claude" : "Heuristic";
        const note = "notes" in result && result.notes ? ` ${result.notes}` : "";
        toast({
          title: "AI weekly plan applied",
          description: `${src}: 7 days, ${result.snackCountPerDay} snack slot(s)/day, ${result.recipePool} recipes.${note}`,
        });
        if ("heuristicWarning" in result && result.heuristicWarning) {
          toast({ title: "Calorie goal note", description: result.heuristicWarning });
        }
        if ("snackLibraryNotice" in result && result.snackLibraryNotice) {
          toast({ title: "Snack library", description: result.snackLibraryNotice });
        }
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong";
        toast({ title: "AI week plan failed", description: message, variant: "destructive" });
      }
    });
  }

  return (
    <Button
      type="button"
      onClick={runWeekPlan}
      disabled={isPending}
      variant="outline"
      className="h-11 w-full border-[var(--brand-primary)] text-[var(--brand-primary)] hover:bg-[var(--surface-brand-subtle)] md:h-9 md:w-auto md:text-sm"
    >
      <Sparkles className="mr-1.5 h-4 w-4 shrink-0 md:mr-2" />
      <span className="text-center text-[11px] font-medium leading-snug sm:text-xs md:text-sm md:truncate">
        {isPending ? "Planning…" : "AI weekly plan"}
      </span>
    </Button>
  );
}
