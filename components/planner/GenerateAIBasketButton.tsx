"use client";

import { useEffect, useState, useTransition } from "react";
import { ChevronDown, ChevronUp, Loader2, Sparkles, X } from "lucide-react";
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
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isPanelMinimised, setIsPanelMinimised] = useState(false);
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
      setIsPanelOpen(true);
      setIsPanelMinimised(false);
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
        setIsPanelOpen(false);
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
      if ("heuristicWarning" in result && result.heuristicWarning) {
        toast({
          title: "Calorie goal note",
          description: result.heuristicWarning,
        });
      }
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

  function closePanel() {
    setIsPanelOpen(false);
    setIsPanelMinimised(false);
    setLastSummary(null);
    setStoreTotals([]);
    setEstimates([]);
    setSuggestions([]);
    setSnapshotId(null);
    setPriceMatchNote(null);
  }

  const ordered = [...storeTotals].sort((a, b) => a.total - b.total);
  const best = ordered[0];
  const secondBest = ordered[1];
  const estimatedSavings = best && secondBest ? Math.max(0, secondBest.total - best.total) : null;

  const storeAndDaysRow = (
    <div className="flex flex-nowrap items-center gap-x-4 gap-y-2 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50/90 px-3 py-2 text-xs text-slate-700 dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-200 [-webkit-overflow-scrolling:touch] md:flex-wrap md:overflow-visible">
      <span className="shrink-0 font-medium text-slate-800 dark:text-gray-100">Stores</span>
      {ALL_PRICE_STORE_IDS.map((id) => (
        <label key={id} className="inline-flex shrink-0 cursor-pointer items-center gap-1.5">
          <input
            type="checkbox"
            className="h-3.5 w-3.5 rounded border-slate-300 text-[#1A4731] focus:ring-[#1A4731]"
            checked={preferredPriceStores.includes(id)}
            onChange={() => togglePriceStore(id)}
          />
          <span>{PRICE_STORE_LABEL[id]}</span>
        </label>
      ))}
      <label className="inline-flex shrink-0 items-center gap-1.5 border-l border-slate-200 pl-3 md:border-l-0 md:pl-0">
        <span className="font-medium text-slate-800">Grocery plan</span>
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
  );

  const pricingBlock = (
    <>
      {priceMatchNote ? <p className="text-xs leading-relaxed text-amber-800">{priceMatchNote}</p> : null}
      {storeTotals.length > 0 ? (
        <>
          <div className="space-y-1">
            <div className="flex items-center">
              <Button
                type="button"
                onClick={applyToGrocery}
                disabled={isPending || !snapshotId}
                className="h-9 bg-[#1A4731] text-xs text-white hover:bg-[#153928] md:h-8"
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
    </>
  );

  const hasCollapsibleContent =
    Boolean(priceMatchNote) || storeTotals.length > 0 || suggestions.length > 0 || isPending;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:space-y-3 md:border-0 md:bg-transparent md:p-0 md:shadow-none">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400 md:hidden">AI &amp; prices</p>

      <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-center md:gap-2">
        <Button
          type="button"
          onClick={runWeekPlan}
          disabled={isPending}
          variant="outline"
          className="h-11 border-[#1A4731] text-[#1A4731] hover:bg-[#F0FDF4] md:h-9 md:text-sm"
        >
          <Sparkles className="mr-1.5 h-4 w-4 shrink-0 md:mr-2" />
          <span className="text-center text-[11px] font-medium leading-snug sm:text-xs md:text-sm md:truncate">
            {isPending ? "Planning…" : "AI weekly plan"}
          </span>
        </Button>
        <Button
          type="button"
          onClick={run}
          disabled={isPending}
          variant="outline"
          className="h-11 border-[#1A4731] text-[#1A4731] hover:bg-[#F0FDF4] md:h-9 md:text-sm"
        >
          <Sparkles className="mr-1.5 h-4 w-4 shrink-0 md:mr-2" />
          <span className="text-center text-[11px] font-medium leading-snug sm:text-xs md:text-sm md:truncate">
            {isPending ? "Working…" : "AI grocery plan"}
          </span>
        </Button>
      </div>

      {isPanelOpen ? (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/60">
          <div className="flex items-center justify-between px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-800">AI grocery plan</span>
              {isPending ? (
                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Generating...
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsPanelMinimised((v) => !v)}
                className="rounded p-1 text-slate-500 hover:bg-slate-200/70"
                aria-label={isPanelMinimised ? "Expand panel" : "Minimise panel"}
              >
                {isPanelMinimised ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={closePanel}
                className="rounded p-1 text-slate-500 hover:bg-slate-200/70"
                aria-label="Close panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!isPanelMinimised ? (
            <div className="space-y-3 border-t border-slate-200 px-3 pb-3 pt-2">
              {lastSummary ? (
                <p className="line-clamp-2 text-[11px] text-slate-500 md:line-clamp-none md:text-xs">{lastSummary}</p>
              ) : null}
              <div>{storeAndDaysRow}</div>
              {hasCollapsibleContent ? (
                <details className="group rounded-lg border border-slate-200 bg-white/70 md:hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium text-slate-800 [&::-webkit-details-marker]:hidden">
                    <span>Store totals &amp; more</span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-slate-500 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="space-y-3 border-t border-slate-200 px-3 pb-3 pt-2">{pricingBlock}</div>
                </details>
              ) : null}
              <div className="hidden space-y-3 md:block">{pricingBlock}</div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
