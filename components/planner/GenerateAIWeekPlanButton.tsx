"use client";

import { useState, useTransition } from "react";
import { CalendarDays, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  generateAIWeekPlan,
  generateHeuristicWeekPlan,
  type GoalContext,
} from "@/app/(app)/planner/ai-actions";
import { refreshNativeReminders } from "@/lib/native/reminders";

type Props = {
  isPro: boolean;
  mealPlanId: string;
  goals: GoalContext;
};

export function GenerateAIWeekPlanButton({ isPro, mealPlanId, goals }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // Which planner is running, so "Planning…" shows on the button that was
  // tapped rather than always on the AI one.
  const [running, setRunning] = useState<"ai" | "standard" | null>(null);
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
    setRunning(mode);
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
        refreshNativeReminders();
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong";
        toast({ title: "Week plan failed", description: message, variant: "destructive" });
      } finally {
        setRunning(null);
      }
    });
  }

  // Both planners as a matched pair: same height, same shape, side by side
  // — AI filled as the recommended default, the other outlined —
  // with a real gap. "Plan without AI" was first a full-width button stacked
  // an inch under the AI one (mis-tapped), then a small grey text link (read
  // as an afterthought). Two equal buttons with distinct icons and labels is
  // the standard pattern for sibling actions and separates them by position,
  // not by making one hard to see. flex-wrap rather than a breakpoint: side by
  // side wherever both labels fit (every current phone from 360 px up), each
  // full width and stacked with a 12 px gap on the narrowest screens, never
  // truncated or pushed off the edge.
  const buttonBase = "h-11 flex-1 gap-2 whitespace-nowrap px-4 text-sm md:h-10 md:flex-none";
  return (
    <div className="flex w-full flex-wrap items-stretch gap-3 md:w-auto md:flex-nowrap md:justify-end">
      <Button
        type="button"
        onClick={() => runWeekPlan("ai")}
        disabled={isPending}
        className={`${buttonBase} bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)]`}
      >
        <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
        {running === "ai" ? "Planning…" : "AI weekly plan"}
      </Button>
      {/* The heuristic planner was reachable only through onboarding. Pro users
          had no way to a plan when Claude was slow or down, and no way to
          compare the two — which is how neither was ever measured. */}
      {isPro ? (
        <Button
          type="button"
          onClick={() => runWeekPlan("standard")}
          disabled={isPending}
          variant="outline"
          className={buttonBase}
        >
          <CalendarDays className="h-4 w-4 shrink-0" aria-hidden />
          {running === "standard" ? "Planning…" : "Plan without AI"}
        </Button>
      ) : null}
    </div>
  );
}
