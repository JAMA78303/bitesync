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
  sugar_g: "Sugar",
};

export type TrafficLight = "green" | "amber" | "red";

export function getTrafficLight(nutrientKey: string, weeklyTotal: number, sex: Sex): TrafficLight {
  const drv = UK_DRVS[nutrientKey]?.[sex];
  if (!drv) return "green";
  const dailyAvg = weeklyTotal / 7;

  if (drv.type === "limit") {
    const pct = dailyAvg / (drv.upper ?? 1);
    if (pct >= 1.0) return "red";
    if (pct >= 0.8) return "amber";
    return "green";
  }

  const pct = dailyAvg / drv.rni;
  if (drv.upper && dailyAvg > drv.upper) return "red";
  if (pct >= 0.9) return "green";
  if (pct >= 0.7) return "amber";
  return "red";
}

export function getTrafficLightLabel(nutrientKey: string, weeklyTotal: number, sex: Sex): string {
  const drv = UK_DRVS[nutrientKey]?.[sex];
  if (!drv) return "";
  const dailyAvg = weeklyTotal / 7;

  if (drv.type === "limit") {
    const pct = Math.round((dailyAvg / (drv.upper ?? 1)) * 100);
    return `${pct}% of daily limit`;
  }

  const pct = Math.round((dailyAvg / drv.rni) * 100);
  return `${pct}% of daily target`;
}
