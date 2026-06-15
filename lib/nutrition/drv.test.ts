import {
  getTrafficLight,
  getTrafficLightLabel,
  isAboveUpperLimit,
  isUnderTarget,
} from "@/lib/nutrition/drv";

function assertEqual<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

// iodine 14% of RNI — genuinely low
assertEqual(getTrafficLight("iodine_mcg", 140 * 0.14 * 7, "male"), "red", "iodine 14%");
assertEqual(isUnderTarget("iodine_mcg", 140 * 0.14 * 7, "male"), true, "iodine under target");

// iron 363% of RNI but above 17 mg upper — amber, not deficiency red
const ironWeekly = 31.6 * 7;
assertEqual(getTrafficLight("iron_mg", ironWeekly, "male"), "amber", "iron above upper");
assertEqual(isUnderTarget("iron_mg", ironWeekly, "male"), false, "iron not under target");
assertEqual(isAboveUpperLimit("iron_mg", ironWeekly, "male"), true, "iron above upper");
assertEqual(
  getTrafficLightLabel("iron_mg", ironWeekly, "male").includes("above upper limit"),
  true,
  "iron upper label",
);

// vitamin A 517% — above 1500 mcg upper
const vitAWeekly = 3617 * 7;
assertEqual(getTrafficLight("vitamin_a_mcg", vitAWeekly, "male"), "amber", "vitamin A above upper");
assertEqual(isUnderTarget("vitamin_a_mcg", vitAWeekly, "male"), false, "vitamin A not under");

// folate 540% — above 1000 mcg upper
const folateWeekly = 1080 * 7;
assertEqual(getTrafficLight("folate_mcg", folateWeekly, "male"), "amber", "folate above upper");

// met target, no upper concern — green (not deficiency red)
assertEqual(getTrafficLight("folate_mcg", 300 * 7, "male"), "green", "folate 150% below upper");
assertEqual(getTrafficLight("iron_mg", 12 * 7, "male"), "green", "iron 138% below upper");
assertEqual(getTrafficLight("vitamin_a_mcg", 840 * 7, "male"), "green", "vitamin A 120% below upper");
assertEqual(isUnderTarget("folate_mcg", 300 * 7, "male"), false, "folate 150% not under");

// vitamin C 120% — no upper limit concern
assertEqual(getTrafficLight("vitamin_c_mg", 48 * 7, "male"), "green", "vitamin C met target");
assertEqual(getTrafficLightLabel("vitamin_c_mg", 48 * 7, "male"), "120% of daily target", "vit C label");

// limit nutrients unchanged
assertEqual(getTrafficLight("salt_g", 7 * 7, "male"), "red", "salt over limit");

console.log("drv.test.ts: all assertions passed");
