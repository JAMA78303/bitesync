"use client";

import { useEffect, useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  applyAIBasketToGrocery,
  generateAIBasketForWeek,
  generateAIWeekPlan,
  getSubstitutionSuggestions,
  type LivePriceMatchSummary,
} from "@/app/(app)/planner/ai-actions";
import { StoreComparisonPanel } from "@/components/grocery/StoreComparisonPanel";
import { SubstitutionSuggestionsList } from "@/components/grocery/SubstitutionSuggestionsList";
import { SavingsSummary } from "@/components/grocery/SavingsSummary";
import type { GoalContext, StoreItemEstimate, StoreTotal, SubstitutionSuggestion } from "@/lib/pricing/types";

const PRICE_STORE_STORAGE_KEY = "bitesync.preferredPriceStores";
const ALL_PRICE_STORE_IDS = ["tesco", "asda", "aldi"] as const;
type PriceStoreId = (typeof ALL_PRICE_STORE_IDS)[number];

const PRICE_STORE_LABEL: Record<PriceStoreId, string> = {
  tesco: "Tesco",
  asda: "Asda",
  aldi: "Aldi",
};

function parseStoredPriceStores(): PriceStoreId[] {
  if (typeof window === "undefined") return [...ALL_PRICE_STORE_IDS];
  try {
    const raw = window.localStorage.getItem(PRICE_STORE_STORAGE_KEY);
    if (!raw) return [...ALL_PRICE_STORE_IDS];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [...ALL_PRICE_STORE_IDS];
    const next = parsed
      .map((s) => String(s).toLowerCase().trim())
      .filter((s): s is PriceStoreId => (ALL_PRICE_STORE_IDS as readonly string[]).includes(s));
    const unique = [...new Set(next)];
    return unique.length > 0 ? unique : [...ALL_PRICE_STORE_IDS];
  } catch {
    return [...ALL_PRICE_STORE_IDS];
  }
}

function sortPriceStores(ids: PriceStoreId[]): PriceStoreId[] {
  const order = new Map(ALL_PRICE_STORE_IDS.map((id, i) => [id, i]));
  return [...ids].sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
}

type Props = {
  isPro: boolean;
  mealPlanId: string;
  weekStartDate: string;
  goals: GoalContext;
  /** Live £ estimate from current meal plan (server); refreshes on navigation. */
  initialLivePricing?: {
    storeTotals: StoreTotal[];
    estimates: StoreItemEstimate[];
    priceMatchSummary: LivePriceMatchSummary;
  } | null;
};

export function GenerateAIBasketButton({
  isPro,
  mealPlanId,
  weekStartDate,
  goals,
  initialLivePricing = null,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [preferredPriceStores, setPreferredPriceStores] = useState<PriceStoreId[]>(() => [...ALL_PRICE_STORE_IDS]);
  const [daysToGenerate, setDaysToGenerate] = useState<number>(7);
  const [lastSummary, setLastSummary] = useState<string | null>(null);
  const [storeTotals, setStoreTotals] = useState<StoreTotal[]>(() => initialLivePricing?.storeTotals ?? []);
  const [estimates, setEstimates] = useState<StoreItemEstimate[]>(() => initialLivePricing?.estimates ?? []);
  const [suggestions, setSuggestions] = useState<SubstitutionSuggestion[]>([]);
  const [snapshotId, setSnapshotId] = useState<string | null>(null);
  const [priceMatchNote, setPriceMatchNote] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setPreferredPriceStores(sortPriceStores(parseStoredPriceStores()));
  }, []);

  function persistPriceStores(next: PriceStoreId[]) {
    const sorted = sortPriceStores(next);
    setPreferredPriceStores(sorted);
    try {
      window.localStorage.setItem(PRICE_STORE_STORAGE_KEY, JSON.stringify(sorted));
    } catch {
      /* ignore quota / private mode */
    }
  }

  function togglePriceStore(id: PriceStoreId) {
    const has = preferredPriceStores.includes(id);
    if (has && preferredPriceStores.length <= 1) {
      toast({
        title: "Keep at least one store",
        description: "Choose which supermarkets you want £ estimates from (e.g. skip Aldi if you do not shop there).",
      });
      return;
    }
    if (has) {
      persistPriceStores(preferredPriceStores.filter((s) => s !== id));
    } else {
      persistPriceStores([...preferredPriceStores, id]);
    }
  }

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
      const selectedDays = Array.from({ length: Math.min(Math.max(daysToGenerate, 1), 7) }, (_, i) => i);
      const result = await generateAIBasketForWeek({
        mealPlanId,
        weekStartDate,
        goals,
        preferredStores: preferredPriceStores,
        selectedDays,
      });
      if ("error" in result) {
        toast({ title: "AI generation failed", description: result.error, variant: "destructive" });
        return;
      }
      const best = [...result.storeTotals].sort((a, b) => a.total - b.total)[0];
      setStoreTotals(result.storeTotals);
      setEstimates(result.estimates ?? []);
      setSnapshotId(result.snapshotId);
      setLastSummary(
        best
          ? `${best.store.toUpperCase()} ~£${best.total.toFixed(2)} (${result.selectedDaysCount} day${result.selectedDaysCount === 1 ? "" : "s"})`
          : "No estimate yet",
      );

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
        const planner =
          "planSource" in result && result.planSource === "claude"
            ? "Planner updated with Claude; priced for your selection. "
            : "";
        description = `${planner}Best current estimate for ${result.selectedDaysCount} day${result.selectedDaysCount === 1 ? "" : "s"}: ${best.store.toUpperCase()} ~£${best.total.toFixed(2)}`;
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
      const src =
        "planSource" in result && result.planSource === "claude"
          ? "Claude"
          : "Heuristic";
      const note = "notes" in result && result.notes ? ` ${result.notes}` : "";
      toast({
        title: "AI weekly plan applied",
        description: `${src}: 7 days, ${result.snackCountPerDay} snack slot(s)/day, ${result.recipePool} recipes.${note}`,
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
        description:
          "This week’s ingredients were merged into your grocery list. The list is the same whichever stores you use for £ comparison.",
      });
    });
  }

  const ordered = [...storeTotals].sort((a, b) => a.total - b.total);
  const best = ordered[0];
  const secondBest = ordered[1];
  const estimatedSavings = best && secondBest ? Math.max(0, secondBest.total - best.total) : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs text-slate-700">
        <span className="font-medium text-slate-800">Compare prices at</span>
        {ALL_PRICE_STORE_IDS.map((id) => (
          <label key={id} className="inline-flex cursor-pointer items-center gap-1.5">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-slate-300 text-[#1A4731] focus:ring-[#1A4731]"
              checked={preferredPriceStores.includes(id)}
              onChange={() => togglePriceStore(id)}
            />
            <span>{PRICE_STORE_LABEL[id]}</span>
          </label>
        ))}
        <label className="inline-flex items-center gap-1.5">
          <span className="font-medium text-slate-800">Generate for</span>
          <select
            value={daysToGenerate}
            onChange={(event) => setDaysToGenerate(Number(event.target.value))}
            className="h-7 rounded border border-slate-300 bg-white px-2 text-xs text-slate-700"
          >
            {[1, 2, 3, 4, 5, 6, 7].map((days) => (
              <option key={days} value={days}>
                {days} day{days === 1 ? "" : "s"}
              </option>
            ))}
          </select>
        </label>
      </div>
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
          <div className="space-y-1">
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
            <p className="text-[11px] leading-snug text-slate-500">
              Merges this week’s ingredient lines into your grocery list. Store checkboxes only change which shops
              appear in the £ comparison.
            </p>
          </div>
          <SavingsSummary bestStore={best?.store ?? null} estimatedSavings={estimatedSavings} />
          <StoreComparisonPanel storeTotals={storeTotals} estimates={estimates} />
        </>
      ) : null}
      {suggestions.length > 0 ? <SubstitutionSuggestionsList suggestions={suggestions} /> : null}
    </div>
  );
}
