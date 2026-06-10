import { GOAL_STATUS_COLORS } from "@/lib/today/goal-status";

const LEGEND_ITEMS = [
 { label:"On track", color: GOAL_STATUS_COLORS["on-track"] },
 { label:"Below target", color: GOAL_STATUS_COLORS.under },
 { label:"Over target", color: GOAL_STATUS_COLORS["over-moderate"] },
 { label:"Well over target", color: GOAL_STATUS_COLORS["over-high"] },
] as const;

export function GoalsStatusLegend() {
 return (
 <div
 className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[var(--border-subtle)] pt-3"
 aria-label="Goal progress colour key"
 >
 {LEGEND_ITEMS.map((item) => (
 <span key={item.label} className="inline-flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
 <span
 className="inline-block h-2 w-2 shrink-0 rounded-full"
 style={{ backgroundColor: item.color }}
 aria-hidden
 />
 {item.label}
 </span>
 ))}
 </div>
 );
}
