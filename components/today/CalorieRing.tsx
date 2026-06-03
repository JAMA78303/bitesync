"use client";

import { getGoalStatus } from "@/lib/today/goal-status";

type Props = {
  consumed: number;
  target: number;
  size?: number;
};

export function CalorieRing({ consumed, target, size = 80 }: Props) {
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
          className="text-gray-200 dark:text-gray-700"
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
          style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.3s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl" aria-hidden>
          ⚡
        </span>
      </div>
    </div>
  );
}
