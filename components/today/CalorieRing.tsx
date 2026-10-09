"use client";

import { getGoalStatus } from "@/lib/today/goal-status";

type Props = {
 consumed: number;
 target: number;
 size?: number;
};

export function CalorieRing({ consumed, target, size = 100 }: Props) {
 const radius = (size - 12) / 2;
 const circumference = 2 * Math.PI * radius;
 const safeTarget = target > 0 ? target : 1;
 const progress = Math.min(consumed / safeTarget, 1);
 const strokeDashoffset = circumference * (1 - progress);
 const ringColor = getGoalStatus("kcal", consumed, target).color;

 return (
 <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
 <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
 <circle
 cx={size / 2}
 cy={size / 2}
 r={radius}
 fill="none"
 stroke="currentColor"
 className="text-[var(--surface-brand-subtle)]"
 strokeWidth={10}
 />
 <circle
 cx={size / 2}
 cy={size / 2}
 r={radius}
 fill="none"
 stroke={ringColor}
 strokeWidth={10}
 strokeLinecap="round"
 strokeDasharray={circumference}
 strokeDashoffset={strokeDashoffset}
 transform={`rotate(-90 ${size / 2} ${size / 2})`}
 style={{ transition:"stroke-dashoffset 0.6s ease, stroke 0.3s ease" }}
 />
 </svg>
 <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden>
 <span className="font-display text-lg font-extrabold leading-none text-[var(--text-primary)]">
 {Math.round((consumed / safeTarget) * 100)}%
 </span>
 <span className="mt-1 text-[10px] text-[var(--text-muted)]">of goal</span>
 </div>
 </div>
 );
}
