"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  applyAIBasketToGrocery,
  generateAIBasketForWeek,
  generateAIWeekPlan,
  getSubstitutionSuggestions,
} from "@/app/(app)/planner/ai-actions";
import { StoreComparisonPanel } from "@/components/grocery/StoreComparisonPanel";
import { SubstitutionSuggestionsList } from "@/components/grocery/SubstitutionSuggestionsList";
import { SavingsSummary } from "@/components/grocery/SavingsSummary";
import type { GoalContext, StoreTotal, SubstitutionSuggestion } from "@/lib/pricing/types";

type Props = {
  isPro: boolean;
  mealPlanId: string;
  weekStartDate: string;
  goals: GoalContext;
};

export function GenerateAIBasketButton({ isPro, mealPlanId, weekStartDate, goals }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lastSummary, setLastSummary] = useState<string | null>(null);
  const [storeTotals, setStoreTotals] = useState<StoreTotal[]>([]);
  const [suggestions, setSuggestions] = useState<SubstitutionSuggestion[]>([]);
  const [snapshotId, setSnapshotId] = useState<string | null>(null);
  const [priceMatchNote, setPriceMatchNote] = useState<string | null>(null);
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
      });
      if ("error" in result) {
        toast({ title: "AI generation failed", description: result.error, variant: "destructive" });
        return;
      }
      const best = [...result.storeTotals].sort((a, b) => a.total - b.total)[0];
      setStoreTotals(result.storeTotals);
      setSnapshotId(result.snapshotId);
      setLastSummary(best ? `${best.store.toUpperCase()} ~£${best.total.toFixed(2)}` : "No estimate yet");

      const substitutions = await getSubstitutionSuggestions(result.snapshotId);
      if ("success" in substitutions) {
        setSuggestions(substitutions.suggestions);
      } else {
        setSuggestions([]);
      }

      const pm = result.priceMatchSummary;
      let description: string;
      let note: string | null = null;
      if (best) {
        description = `Best current estimate: ${best.store.toUpperCase()} ~£${best.total.toFixed(2)}`;
      } else if (pm.catalogLoadError) {
        description = `Could not load price catalogue: ${pm.catalogLoadError}`;
        note = `${description} If this is a permissions issue, run sql/2026-05-14_price_catalog_select_rls.sql in Supabase.`;
      } else if (pm.catalogSize === 0) {
        description =
          "The app loaded zero canonical price rows (tables exist but SELECT returned nothing). This is usually RLS blocking reads, or the seed was applied to a different Supabase project than production. Run sql/2026-05-14_price_catalog_select_rls.sql, then confirm sql/2026-05-09_seed_store_prices_mvp.sql was run on this same project.";
        note = description;
      } else {
        const sample = pm.unmatchedSample.length ? pm.unmatchedSample.slice(0, 5).join(", ") : "your ingredients";
        description = `Snapshot saved, but none of ${pm.ingredientLineCount} ingredient lines matched priced items (e.g. ${sample}). Run sql/2026-05-09_seed_store_prices_mvp.sql if you have not, or add aliases for your common ingredient names.`;
        note = description;
      }
      setPriceMatchNote(best ? null : note);

      toast({
        title: best ? "AI estimate generated" : "Basket saved — pricing",
        description,
      });
    });
  }

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
      const result = await generateAIWeekPlan({ mealPlanId, goals });
      if ("error" in result) {
        toast({ title: "AI week plan failed", description: result.error, variant: "destructive" });
        return;
      }
      toast({
        title: "AI weekly plan applied",
        description: `Planned 7 days with ${result.snackCountPerDay} snack slot(s) per day from ${result.recipePool} recipes.`,
      });
      router.refresh();
    });
  }

  function applyToGrocery() {
    if (!snapshotId) return;
    startTransition(async () => {
      const result = await applyAIBasketToGrocery(snapshotId);
      if ("error" in result) {
        toast({ title: "Apply failed", description: result.error, variant: "destructive" });
        return;
      }
      toast({
        title: "Applied to grocery list",
        description: "Your AI basket has been applied to this week's grocery list.",
      });
    });
  }

  const ordered = [...storeTotals].sort((a, b) => a.total - b.total);
  const best = ordered[0];
  const secondBest = ordered[1];
  const estimatedSavings = best && secondBest ? Math.max(0, secondBest.total - best.total) : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          onClick={runWeekPlan}
          disabled={isPending}
          variant="outline"
          className="h-9 border-[#1A4731] text-[#1A4731] hover:bg-[#F0FDF4]"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {isPending ? "Planning..." : "AI weekly plan"}
        </Button>
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

      {priceMatchNote ? (
        <p className="text-xs leading-relaxed text-amber-800">{priceMatchNote}</p>
      ) : null}

      {storeTotals.length > 0 ? (
        <>
          <div className="flex items-center">
            <Button
              type="button"
              onClick={applyToGrocery}
              disabled={isPending || !snapshotId}
              className="h-8 bg-[#1A4731] text-xs text-white hover:bg-[#153928]"
            >
              Apply to grocery list
            </Button>
          </div>
          <SavingsSummary bestStore={best?.store ?? null} estimatedSavings={estimatedSavings} />
          <StoreComparisonPanel storeTotals={storeTotals} />
        </>
      ) : null}
      {suggestions.length > 0 ? <SubstitutionSuggestionsList suggestions={suggestions} /> : null}
    </div>
  );
}
