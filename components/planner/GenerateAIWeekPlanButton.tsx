"use client";

import { useTransition } from "react";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  generateAIWeekPlan,
  generateHeuristicWeekPlan,
  type GoalContext,
} from "@/app/(app)/planner/ai-actions";

type Props = {
  isPro: boolean;
  mealPlanId: string;
  goals: GoalContext;
};

export function GenerateAIWeekPlanButton({ isPro, mealPlanId, goals }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function runWeekPlan(mode: "ai" | "standard") {
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
        const result =
          mode === "standard"
            ? await generateHeuristicWeekPlan({ mealPlanId, goals })
            : await generateAIWeekPlan({ mealPlanId, goals });
        if ("error" in result) {
          toast({ title: "Week plan failed", description: result.error, variant: "destructive" });
          return;
        }
        const src =
          "planSource" in result && result.planSource === "claude" ? "Claude" : "Standard planner";
        const note = "notes" in result && result.notes ? ` ${result.notes}` : "";
        toast({
          title: "Weekly plan applied",
          description: `${src}: 7 days, ${result.snackCountPerDay} snack slot(s)/day, ${result.recipePool} recipes.${note}`,
        });
        // The plan still built, so this isn't destructive — but it is the only
        // place a rejected key or unfunded account ever becomes visible.
        if ("aiFallbackNotice" in result && result.aiFallbackNotice) {
          toast({ title: "AI planning unavailable", description: result.aiFallbackNotice });
        }
        if ("heuristicWarning" in result && result.heuristicWarning) {
          toast({ title: "Calorie goal note", description: result.heuristicWarning });
        }
        if ("snackLibraryNotice" in result && result.snackLibraryNotice) {
          toast({ title: "Snack library", description: result.snackLibraryNotice });
        }
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong";
        toast({ title: "Week plan failed", description: message, variant: "destructive" });
      }
    });
  }

  return (
    <div className="flex w-full flex-col items-stretch gap-1 md:w-auto md:items-end">
      <Button
        type="button"
        onClick={() => runWeekPlan("ai")}
        disabled={isPending}
        variant="outline"
        className="h-11 w-full border-[var(--brand-primary)] text-[var(--brand-primary)] hover:bg-[var(--surface-brand-subtle)] md:h-9 md:w-auto md:text-sm"
      >
        <Sparkles className="mr-1.5 h-4 w-4 shrink-0 md:mr-2" />
        <span className="text-center text-2xs font-medium leading-snug sm:text-xs md:text-sm md:truncate">
          {isPending ? "Planning…" : "AI weekly plan"}
        </span>
      </Button>
      {/* The heuristic planner was reachable only through onboarding. Pro users
          had no way to a plan when Claude was slow or down, and no way to
          compare the two — which is how neither was ever measured.

          It sat directly under the AI button as a full-width tap target and
          was mis-tapped: two buttons that rebuild the whole week, a few pixels
          apart. Now a short, self-sized link, pushed down and right, with its
          own generous tap padding so the gap is real on a phone. */}
      {isPro ? (
        <button
          type="button"
          onClick={() => runWeekPlan("standard")}
          disabled={isPending}
          className="mt-2 self-end px-2 py-1.5 text-2xs font-medium text-[var(--text-muted)] underline-offset-2 hover:text-[var(--text-secondary)] hover:underline disabled:opacity-60"
        >
          Plan without AI
        </button>
      ) : null}
    </div>
  );
}
