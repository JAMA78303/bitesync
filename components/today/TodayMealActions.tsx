"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { replaceMealEntry, setMealEntryStatus } from "@/lib/supabase/meal-plan-actions";
import { useToast } from "@/components/ui/use-toast";
import type { TodayMealStatus } from "@/lib/planner/today";

type Props = {
  entryId: string;
  status: TodayMealStatus;
  mealName: string;
};

/**
 * The tick on a Today card used to be decorative — `logged` was hardcoded
 * false, so every meal showed an empty circle forever. This makes it the
 * control it looked like, and adds the two deviations that actually change
 * the day's numbers: skipped, and replaced by something else.
 *
 * Tapping the circle toggles eaten. That is a confirmation, not a change in
 * totals — a planned meal already counts. Skip is what removes it.
 */
export function TodayMealActions({ entryId, status, mealName }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [replacing, setReplacing] = useState(false);
  const [replacementName, setReplacementName] = useState("");
  const [replacementKcal, setReplacementKcal] = useState("");

  function apply(next: TodayMealStatus) {
    startTransition(async () => {
      const result = await setMealEntryStatus(entryId, next);
      if ("error" in result) {
        toast({ title: "Couldn't update", description: result.error, variant: "destructive" });
        return;
      }
      router.refresh();
    });
  }

  function submitReplacement() {
    const kcal = replacementKcal.trim() === "" ? null : Number(replacementKcal);
    if (kcal != null && (!Number.isFinite(kcal) || kcal < 0)) {
      toast({ title: "Check the calories", description: "Enter a number, or leave it blank.", variant: "destructive" });
      return;
    }
    startTransition(async () => {
      const result = await replaceMealEntry(entryId, { name: replacementName, calories: kcal });
      if ("error" in result) {
        toast({ title: "Couldn't log that", description: result.error, variant: "destructive" });
        return;
      }
      setReplacing(false);
      setReplacementName("");
      setReplacementKcal("");
      router.refresh();
    });
  }

  const circle =
    status === "eaten" ? (
      <button
        type="button"
        onClick={() => apply("planned")}
        disabled={isPending}
        aria-label={`Mark ${mealName} as not eaten yet`}
        aria-pressed
        className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] transition-transform active:scale-95 disabled:opacity-60"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" strokeWidth={2.5} />}
      </button>
    ) : (
      <button
        type="button"
        onClick={() => apply("eaten")}
        disabled={isPending || status === "skipped"}
        aria-label={`Mark ${mealName} as eaten`}
        aria-pressed={false}
        className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--border-default)] text-transparent transition-colors hover:border-[var(--brand-action)] active:scale-95 disabled:opacity-40"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin text-[var(--text-muted)]" /> : <Check className="h-4 w-4" />}
      </button>
    );

  return (
    <div className="flex flex-col items-end gap-1.5">
      {circle}

      {status === "skipped" ? (
        <button
          type="button"
          onClick={() => apply("planned")}
          disabled={isPending}
          className="text-2xs font-medium text-[var(--text-link)] hover:underline disabled:opacity-60"
        >
          Undo skip
        </button>
      ) : status === "planned" && !replacing ? (
        // Stacked, so the column stays narrow and the meal name keeps its room.
        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            onClick={() => apply("skipped")}
            disabled={isPending}
            className="text-2xs font-medium text-[var(--text-muted)] hover:text-[var(--text-secondary)] disabled:opacity-60"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={() => setReplacing(true)}
            disabled={isPending}
            className="text-2xs font-medium text-[var(--text-link)] hover:underline disabled:opacity-60"
          >
            Ate something else
          </button>
        </div>
      ) : null}

      {replacing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitReplacement();
          }}
          className="mt-1 flex w-44 flex-col gap-1.5"
        >
          <input
            value={replacementName}
            onChange={(e) => setReplacementName(e.target.value)}
            placeholder="What did you eat?"
            autoFocus
            required
            className="h-8 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] px-2 text-xs text-[var(--text-primary)]"
          />
          <input
            value={replacementKcal}
            onChange={(e) => setReplacementKcal(e.target.value)}
            placeholder="kcal (optional)"
            inputMode="numeric"
            className="h-8 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] px-2 text-xs text-[var(--text-primary)]"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setReplacing(false)}
              disabled={isPending}
              className="text-2xs font-medium text-[var(--text-muted)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !replacementName.trim()}
              className="rounded-lg bg-[var(--btn-primary-bg)] px-2.5 py-1 text-2xs font-semibold text-[var(--btn-primary-text)] disabled:opacity-50"
            >
              {isPending ? "Saving…" : "Log it"}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
