export type Sex = "male" | "female";

export type DRVEntry = {
  rni: number;
  upper?: number;
  unit: string;
  type: "hit" | "limit" | "both";
};

export const UK_DRVS: Record<string, Record<Sex, DRVEntry>> = {
  vitamin_a_mcg: {
    male: { rni: 700, upper: 1500, unit: "mcg", type: "both" },
    female: { rni: 600, upper: 1500, unit: "mcg", type: "both" },
  },
  vitamin_c_mg: {
    male: { rni: 40, unit: "mg", type: "hit" },
    female: { rni: 40, unit: "mg", type: "hit" },
  },
  vitamin_d_mcg: {
    male: { rni: 10, upper: 100, unit: "mcg", type: "both" },
    female: { rni: 10, upper: 100, unit: "mcg", type: "both" },
  },
  vitamin_b12_mcg: {
    male: { rni: 1.5, unit: "mcg", type: "hit" },
    female: { rni: 1.5, unit: "mcg", type: "hit" },
  },
  folate_mcg: {
    male: { rni: 200, upper: 1000, unit: "mcg", type: "both" },
    female: { rni: 200, upper: 1000, unit: "mcg", type: "both" },
  },
  iron_mg: {
    male: { rni: 8.7, upper: 17, unit: "mg", type: "both" },
    female: { rni: 14.8, upper: 17, unit: "mg", type: "both" },
  },
  calcium_mg: {
    male: { rni: 700, upper: 1500, unit: "mg", type: "both" },
    female: { rni: 700, upper: 1500, unit: "mg", type: "both" },
  },
  zinc_mg: {
    male: { rni: 9.5, upper: 25, unit: "mg", type: "both" },
    female: { rni: 7, upper: 25, unit: "mg", type: "both" },
  },
  magnesium_mg: {
    male: { rni: 300, unit: "mg", type: "hit" },
    female: { rni: 270, unit: "mg", type: "hit" },
  },
  potassium_mg: {
    male: { rni: 3500, unit: "mg", type: "hit" },
    female: { rni: 3500, unit: "mg", type: "hit" },
  },
  selenium_mcg: {
    male: { rni: 75, upper: 350, unit: "mcg", type: "both" },
    female: { rni: 60, upper: 350, unit: "mcg", type: "both" },
  },
  iodine_mcg: {
    male: { rni: 140, unit: "mcg", type: "hit" },
    female: { rni: 140, unit: "mcg", type: "hit" },
  },
  saturated_fat_g: {
    male: { rni: 0, upper: 30, unit: "g", type: "limit" },
    female: { rni: 0, upper: 20, unit: "g", type: "limit" },
  },
  salt_g: {
    male: { rni: 0, upper: 6, unit: "g", type: "limit" },
    female: { rni: 0, upper: 6, unit: "g", type: "limit" },
  },
  sugar_g: {
    male: { rni: 0, upper: 30, unit: "g", type: "limit" },
    female: { rni: 0, upper: 30, unit: "g", type: "limit" },
  },
};

/** Whose reference intakes to use. Age changes a few of them (AGE_RNIS); unknown age uses the adult figures above. */
export type Person = { sex: Sex; age?: number | null };

/**
 * Where the UK reference intake changes with age: the RNI from each age up,
 * in order. Iron: 14.8 mg for girls and women until 50, then 8.7 mg (NHS:
 * "8.7mg a day for women aged 50 and over"); 11.3 mg for boys up to 18, then
 * 8.7 mg for men.
 */
const AGE_RNIS: Partial<Record<string, Record<Sex, { fromAge: number; rni: number }[]>>> = {
  iron_mg: {
    male: [
      { fromAge: 0, rni: 11.3 },
      { fromAge: 19, rni: 8.7 },
    ],
    female: [
      { fromAge: 0, rni: 14.8 },
      { fromAge: 50, rni: 8.7 },
    ],
  },
};

/** The reference intake for one nutrient and person; undefined for an unknown nutrient. */
export function drvFor(nutrientKey: string, who: Sex | Person): DRVEntry | undefined {
  const { sex, age } = typeof who === "string" ? { sex: who, age: null } : who;
  const base = UK_DRVS[nutrientKey]?.[sex];
  const bands = AGE_RNIS[nutrientKey]?.[sex];
  const years = Number(age);
  if (!base || !bands || age == null || !Number.isFinite(years)) return base;
  let rni = base.rni;
  for (const band of bands) if (years >= band.fromAge) rni = band.rni;
  return rni === base.rni ? base : { ...base, rni };
}

export const NUTRIENT_LABELS: Record<string, string> = {
  vitamin_a_mcg: "Vitamin A",
  vitamin_c_mg: "Vitamin C",
  vitamin_d_mcg: "Vitamin D",
  vitamin_b12_mcg: "Vitamin B12",
  folate_mcg: "Folate",
  iron_mg: "Iron",
  calcium_mg: "Calcium",
  zinc_mg: "Zinc",
  magnesium_mg: "Magnesium",
  potassium_mg: "Potassium",
  selenium_mcg: "Selenium",
  iodine_mcg: "Iodine",
  saturated_fat_g: "Saturated fat",
  salt_g: "Salt",
  sugar_g: "Free sugars",
};

export type TrafficLight = "green" | "amber" | "red";

/** Below this fraction of RNI → red traffic / severe deficiency band. */
export const MICRO_HIT_RED_THRESHOLD = 0.7;

/** At/above this fraction of RNI → green traffic (no deficiency alarm). Between red and green → amber. */
export const MICRO_HIT_GREEN_THRESHOLD = 0.9;

/** @deprecated Use MICRO_HIT_GREEN_THRESHOLD — kept for callers comparing against 100% RNI. */
export const MICRO_HIT_AMBER_THRESHOLD = MICRO_HIT_GREEN_THRESHOLD;

/** Limit nutrients: at or above this fraction of upper → amber. */
export const MICRO_LIMIT_AMBER_THRESHOLD = 0.8;

export function dailyAverageFromWeekly(weeklyTotal: number): number {
  return weeklyTotal / 7;
}

export type MicroCheckContext = {
  /** Weekly preformed retinol (mcg) — vitamin A upper limit uses this, not total RE. */
  weeklyRetinolMcg?: number;
};

export function isUnderTarget(nutrientKey: string, weeklyTotal: number, who: Sex | Person): boolean {
  const drv = drvFor(nutrientKey, who);
  if (!drv || drv.type === "limit" || drv.rni <= 0) return false;
  return dailyAverageFromWeekly(weeklyTotal) < drv.rni;
}

export function isAboveUpperLimit(
  nutrientKey: string,
  weeklyTotal: number,
  who: Sex | Person,
  context?: MicroCheckContext,
): boolean {
  const drv = drvFor(nutrientKey, who);
  if (!drv?.upper || drv.upper <= 0) return false;
  if (nutrientKey === "vitamin_a_mcg") {
    const retinolWeekly = context?.weeklyRetinolMcg ?? weeklyTotal;
    return dailyAverageFromWeekly(retinolWeekly) > drv.upper;
  }
  return dailyAverageFromWeekly(weeklyTotal) > drv.upper;
}

export function getTrafficLight(
  nutrientKey: string,
  weeklyTotal: number,
  who: Sex | Person,
  context?: MicroCheckContext,
): TrafficLight {
  const drv = drvFor(nutrientKey, who);
  if (!drv) return "green";
  const dailyAvg = dailyAverageFromWeekly(weeklyTotal);

  if (drv.type === "limit") {
    const pct = dailyAvg / (drv.upper ?? 1);
    if (pct >= 1.0) return "red";
    if (pct >= MICRO_LIMIT_AMBER_THRESHOLD) return "amber";
    return "green";
  }

  const pctRni = dailyAvg / drv.rni;
  if (pctRni < MICRO_HIT_RED_THRESHOLD) return "red";
  if (pctRni < MICRO_HIT_GREEN_THRESHOLD) return "amber";

  // Target met — excess above a safe upper limit is a distinct amber, not deficiency red.
  if (isAboveUpperLimit(nutrientKey, weeklyTotal, who, context)) return "amber";
  return "green";
}

export function getTrafficLightLabel(
  nutrientKey: string,
  weeklyTotal: number,
  who: Sex | Person,
  context?: MicroCheckContext,
): string {
  const drv = drvFor(nutrientKey, who);
  if (!drv) return "";
  const dailyAvg = dailyAverageFromWeekly(weeklyTotal);

  if (drv.type === "limit") {
    const pct = Math.round((dailyAvg / (drv.upper ?? 1)) * 100);
    return `${pct}% of daily limit`;
  }

  const pct = Math.round((dailyAvg / drv.rni) * 100);
  const base = `${pct}% of daily target`;
  if (isAboveUpperLimit(nutrientKey, weeklyTotal, who, context)) {
    if (nutrientKey === "vitamin_a_mcg") {
      return `${base} · above retinol upper limit`;
    }
    return `${base} · above upper limit`;
  }
  return base;
}

/** Short band label for deficiency callouts — must match getTrafficLight cutoffs. */
export function getUnderTargetBandLabel(traffic: TrafficLight): string {
  if (traffic === "red") {
    return `below ${Math.round(MICRO_HIT_RED_THRESHOLD * 100)}% of daily target`;
  }
  if (traffic === "amber") {
    return "almost there";
  }
  return "";
}

/** Headline for deficiency cards — "Low" only in the red band. */
export function getDeficiencyHeadline(traffic: TrafficLight, label: string): string {
  if (traffic === "red") return `Low ${label}`;
  if (traffic === "amber") return `Almost there — ${label}`;
  return label;
}

/** Short band label for limit-nutrient excess callouts. */
export function getOverLimitBandLabel(traffic: TrafficLight): string {
  if (traffic === "red") return "exceeding daily limit";
  if (traffic === "amber") {
    return `above ${Math.round(MICRO_LIMIT_AMBER_THRESHOLD * 100)}% of daily limit`;
  }
  return "";
}
