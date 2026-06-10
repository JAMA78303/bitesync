"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addDays, formatWeekLabel, toLocalISO, isCurrentWeek } from "@/lib/utils/dates";

type Props = { weekStart: Date; onGradient?: boolean };

export function WeekNav({ weekStart, onGradient = false }: Props) {
 const router = useRouter();
 const current = isCurrentWeek(weekStart);

 function navigate(direction:"prev" |"next") {
 const newDate = addDays(weekStart, direction ==="next" ? 7 : -7);
 router.push(`/planner?week=${toLocalISO(newDate)}`);
 }

 const navBtnClass = onGradient
 ?"h-8 w-8 shrink-0 border-[var(--surface-overlay)]/25 bg-[var(--surface-overlay)]/15 text-[var(--text-on-header)] hover:bg-[var(--surface-overlay)]/25"
 :"h-8 w-8 shrink-0 bg-[var(--surface-card)]";
 const labelClass = onGradient
 ?"min-w-0 flex-1 text-center text-xs font-medium text-[var(--text-on-header)] sm:flex-none sm:text-sm"
 :"min-w-0 flex-1 text-center text-xs font-medium text-[var(--text-secondary)] sm:flex-none sm:text-sm";
 const todayClass = onGradient
 ?"ml-1 text-xs text-[var(--text-on-header-muted)] hover:bg-[var(--surface-overlay)]/10 hover:text-[var(--text-on-header)]"
 :"ml-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)]";

 return (
 <div className="relative z-30 flex w-full shrink-0 items-center justify-center gap-2 sm:w-auto">
 <Button
 type="button"
 variant="outline"
 size="icon"
 onClick={() => navigate("prev")}
 aria-label="Previous week"
 className={navBtnClass}
 >
 <ChevronLeft className="h-4 w-4" />
 </Button>
 <p className={labelClass}>{formatWeekLabel(weekStart)}</p>
 <Button
 type="button"
 variant="outline"
 size="icon"
 onClick={() => navigate("next")}
 aria-label="Next week"
 className={navBtnClass}
 >
 <ChevronRight className="h-4 w-4" />
 </Button>
 {!current && (
 <Button variant="ghost" size="sm" onClick={() => router.push("/planner")} className={todayClass}>
 Today
 </Button>
 )}
 </div>
 );
}
