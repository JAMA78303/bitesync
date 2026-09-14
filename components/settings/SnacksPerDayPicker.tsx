"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSnacksPerDay } from "@/lib/supabase/profile-actions";
import { useToast } from "@/components/ui/use-toast";
import type { SnacksPerDay } from "@/lib/planner/snack-preference";

type Props = {
  /** Stored preference, or null if never set. */
  value: number | null;
  /** What the planner will use if nothing is set — shown so "default" means something. */
  fallback: SnacksPerDay;
};

const OPTIONS: { value: SnacksPerDay; label: string; desc: string }[] = [
  { value: 1, label: "1 snack", desc: "Three meals and one snack. Larger mains." },
  { value: 2, label: "2 snacks", desc: "Three meals and two snacks. Smaller mains." },
];

/**
 * Snacks per day used to be decided by calorie target alone — two above
 * 2200 kcal, otherwise one. Meal frequency is individual; this makes it a
 * choice. Saves on tap, no button: the highlighted card is the confirmation.
 */
export function SnacksPerDayPicker({ value, fallback }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<SnacksPerDay>(
    value === 1 || value === 2 ? value : fallback,
  );

  function choose(next: SnacksPerDay) {
    const previous = selected;
    setSelected(next);
    startTransition(async () => {
      const result = await saveSnacksPerDay(next);
      if ("error" in result) {
        setSelected(previous);
        toast({ title: "Couldn't save", description: result.error, variant: "destructive" });
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map((opt) => {
          const active = selected === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => choose(opt.value)}
              disabled={isPending}
              aria-pressed={active}
              className={`rounded-2xl border-2 px-3 py-3 text-left transition-all disabled:opacity-60 ${
                active
                  ? "border-[var(--brand-primary)] bg-[var(--surface-brand-subtle)]"
                  : "border-[var(--border-subtle)] bg-[var(--surface-card)] hover:border-[var(--border-default)]"
              }`}
            >
              <span
                className={`block text-sm font-semibold ${
                  active ? "text-[var(--brand-primary)]" : "text-[var(--text-primary)]"
                }`}
              >
                {opt.label}
              </span>
              <span className="mt-0.5 block text-xs text-[var(--text-muted)]">{opt.desc}</span>
            </button>
          );
        })}
      </div>
      {value == null ? (
        <p className="mt-2 text-2xs text-[var(--text-muted)]">
          Not set — the planner is using {fallback} based on your calorie target.
        </p>
      ) : null}
    </div>
  );
}
