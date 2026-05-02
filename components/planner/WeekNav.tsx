"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addDays, formatWeekLabel, toLocalISO, isCurrentWeek } from "@/lib/utils/dates";

type Props = { weekStart: Date };

export function WeekNav({ weekStart }: Props) {
  const router = useRouter();
  const current = isCurrentWeek(weekStart);

  function navigate(direction: "prev" | "next") {
    const newDate = addDays(weekStart, direction === "next" ? 7 : -7);
    router.push(`/planner?week=${toLocalISO(newDate)}`);
  }

  return (
    <div className="relative z-30 flex w-full shrink-0 items-center justify-center gap-2 sm:w-auto">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => navigate("prev")}
        aria-label="Previous week"
        className="h-8 w-8 shrink-0 bg-white"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <p className="min-w-0 flex-1 text-center text-xs font-medium text-gray-800 sm:flex-none sm:text-sm">
        {formatWeekLabel(weekStart)}
      </p>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => navigate("next")}
        aria-label="Next week"
        className="h-8 w-8 shrink-0 bg-white"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      {!current && (
        <Button variant="ghost" size="sm" onClick={() => router.push("/planner")} className="ml-1 text-xs text-slate-500 hover:text-slate-700">
          Today
        </Button>
      )}
    </div>
  );
}
