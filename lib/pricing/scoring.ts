import { daysSince } from "@/lib/pricing/normalize";
import type { PriceVolatility } from "@/lib/pricing/types";

const VOLATILITY_WEIGHT: Record<PriceVolatility, number> = {
  low: 1.0,
  medium: 0.88,
  high: 0.72,
};

export function freshnessFactor(daysOld: number, decay = 0.12): number {
  const raw = Math.exp(-decay * Math.max(0, daysOld));
  return Math.min(1, Math.max(0.35, raw));
}

export function itemConfidenceScore(params: {
  baseConfidence: number;
  lastSeenAt: string;
  volatility: PriceVolatility;
}): number {
  const daysOld = daysSince(params.lastSeenAt);
  const score =
    params.baseConfidence * freshnessFactor(daysOld) * VOLATILITY_WEIGHT[params.volatility];
  return Math.min(1, Math.max(0, score));
}

export function basketCertaintyScore(
  items: { confidence: number; estimatedCost: number }[],
): number {
  const total = items.reduce((s, i) => s + i.estimatedCost, 0);
  if (total <= 0) return 0;
  const weighted = items.reduce((s, i) => s + i.confidence * (i.estimatedCost / total), 0);
  return Math.round(weighted * 10000) / 100;
}

export function estimateRange(total: number, basketCertainty: number): number {
  return Math.round(total * (1 - basketCertainty / 100) * 0.25 * 100) / 100;
}
