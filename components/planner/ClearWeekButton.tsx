"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { clearWeekEntries } from "@/lib/supabase/meal-plan-actions";
import { refreshNativeReminders } from "@/lib/native/reminders";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/use-toast";

type Props = {
  mealPlanId: string;
};

/** Removes every meal from the visible week in one action (individual removal stays per-card). */
export function ClearWeekButton({ mealPlanId }: Props) {
  const router = useRouter();
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  async function handleClear() {
    const ok = await confirm({
      title: "Clear this week?",
      description:
        "Every meal in this week's plan will be removed. Your recipes stay in your library, and you can still remove meals one at a time instead.",
      confirmLabel: "Clear week",
      destructive: true,
    });
    if (!ok) return;

    startTransition(async () => {
      const result = await clearWeekEntries(mealPlanId);
      if ("error" in result) {
        toast({ title: "Couldn't clear the week", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Week cleared", description: "All meals removed from this week's plan." });
      refreshNativeReminders();
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClear}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[var(--semantic-error-text)] transition-colors hover:bg-[var(--semantic-error-bg)] disabled:opacity-60"
    >
      <Trash2 className="h-3.5 w-3.5" aria-hidden />
      {isPending ? "Clearing..." : "Clear week"}
    </button>
  );
}
