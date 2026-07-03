import { getGoalStatus, type GoalMetric } from "@/lib/today/goal-status";

type Props = {
 metric: GoalMetric;
 label: string;
 value: number;
 target: number;
 unit: string;
};

export function MacroBar({ metric, label, value, target, unit }: Props) {
 const safeTarget = target > 0 ? target : 1;
 const progress = Math.min(value / safeTarget, 1);
 const status = getGoalStatus(metric, value, target);

 return (
 <div className="min-w-0 overflow-hidden">
 <p className="text-xs font-medium text-[var(--text-muted)]">{label}</p>
 <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
 <span className="font-semibold text-[var(--text-secondary)]">{Math.round(value)}</span>
 {" / "}
 {target}
 {unit}
 </p>
 <p className={`text-2xs font-medium leading-tight ${status.textClassName}`}>{status.label}</p>
 <div className="mb-0 mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--surface-muted)]">
 <div
 className="h-full rounded-full transition-all duration-500"
 style={{
 width: `${progress * 100}%`,
 backgroundColor: status.color,
 }}
 />
 </div>
 </div>
 );
}
