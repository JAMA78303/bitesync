import {
  drvFor,
  getDeficiencyHeadline,
  getTrafficLight,
  getTrafficLightLabel,
  getUnderTargetBandLabel,
  isAboveUpperLimit,
  isUnderTarget,
  UK_DRVS,
} from "@/lib/nutrition/drv";

function assertEqual<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

// iodine 14% of RNI — genuinely low
assertEqual(getTrafficLight("iodine_mcg", 140 * 0.14 * 7, "male"), "red", "iodine 14%");
assertEqual(isUnderTarget("iodine_mcg", 140 * 0.14 * 7, "male"), true, "iodine under target");

// Iron from food has no upper level: the NHS 17 mg is for supplements. A
// pulse-heavy week (~18.6 mg/day) or more stays green.
const ironWeekly = 31.6 * 7;
assertEqual(getTrafficLight("iron_mg", ironWeekly, "male"), "green", "iron 363% from food is green");
assertEqual(isUnderTarget("iron_mg", ironWeekly, "male"), false, "iron not under target");
assertEqual(isAboveUpperLimit("iron_mg", ironWeekly, "male"), false, "iron from food never above upper");
assertEqual(getTrafficLightLabel("iron_mg", ironWeekly, "male"), "363% of daily target", "iron label, no upper");
assertEqual(getTrafficLight("iron_mg", 18.6 * 7, "female"), "green", "pulse-heavy week, woman");
assertEqual(isAboveUpperLimit("iron_mg", 18.6 * 7, "female"), false, "pulse-heavy week not above upper");
assertEqual(drvFor("iron_mg", "male")?.upper, undefined, "iron has no food upper");
assertEqual(drvFor("iron_mg", "male")?.supplementUpper, 17, "iron supplement level kept");

// vitamin A 517% RE — above 1500 mcg upper when retinol equals RE (no plant carve-out)
const vitAWeekly = 3617 * 7;
assertEqual(getTrafficLight("vitamin_a_mcg", vitAWeekly, "male"), "amber", "vitamin A above upper");
assertEqual(isUnderTarget("vitamin_a_mcg", vitAWeekly, "male"), false, "vitamin A not under");

// plant-heavy RE with low retinol — green, not false upper alarm
const plantReWeekly = 700 * 3.73 * 7;
const plantRetinolWeekly = 40 * 7;
assertEqual(
  getTrafficLight("vitamin_a_mcg", plantReWeekly, "male", { weeklyRetinolMcg: plantRetinolWeekly }),
  "green",
  "plant-heavy vitamin A stays green",
);
assertEqual(
  isAboveUpperLimit("vitamin_a_mcg", plantReWeekly, "male", { weeklyRetinolMcg: plantRetinolWeekly }),
  false,
  "plant RE does not count toward retinol upper",
);

// Folate 540% from food — the 1,000 µg level is for folic acid, so no flag.
const folateWeekly = 1080 * 7;
assertEqual(getTrafficLight("folate_mcg", folateWeekly, "male"), "green", "folate from food is green");
assertEqual(isAboveUpperLimit("folate_mcg", folateWeekly, "male"), false, "folate never above upper");
assertEqual(drvFor("folate_mcg", "female")?.upper, undefined, "folate has no food upper");
assertEqual(drvFor("folate_mcg", "female")?.supplementUpper, 1000, "folic acid level kept");

// Calcium: 1,500 mg is the NHS supplement level; total intake is checked
// against EFSA's 2,500 mg.
assertEqual(getTrafficLight("calcium_mg", 1600 * 7, "female"), "green", "calcium 1,600 mg green");
assertEqual(isAboveUpperLimit("calcium_mg", 1600 * 7, "female"), false, "calcium 1,600 mg not above");
assertEqual(getTrafficLight("calcium_mg", 2600 * 7, "female"), "amber", "calcium 2,600 mg amber");
assertEqual(
  getTrafficLightLabel("calcium_mg", 2600 * 7, "female").includes("above upper limit"),
  true,
  "calcium 2,600 mg label",
);

// Selenium: 350 µg is the NHS supplement level; total intake uses EVM 450 µg.
assertEqual(getTrafficLight("selenium_mcg", 400 * 7, "male"), "green", "selenium 400 µg green");
assertEqual(getTrafficLight("selenium_mcg", 500 * 7, "male"), "amber", "selenium 500 µg amber");

// Total-intake upper levels still flag.
assertEqual(getTrafficLight("zinc_mg", 30 * 7, "male"), "amber", "zinc 30 mg amber");
assertEqual(isAboveUpperLimit("zinc_mg", 30 * 7, "male"), true, "zinc 30 mg above upper");
assertEqual(getTrafficLight("vitamin_d_mcg", 110 * 7, "male"), "amber", "vitamin D 110 µg amber");

// Every upper level the check uses is at or above any supplement-only level.
for (const [key, bySex] of Object.entries(UK_DRVS)) {
  for (const entry of Object.values(bySex)) {
    if (entry.upper != null && entry.supplementUpper != null && entry.upper < entry.supplementUpper) {
      throw new Error(`${key}: food upper ${entry.upper} is below supplement level ${entry.supplementUpper}`);
    }
  }
}

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

// band labels match traffic thresholds (no hardcoded mismatch)
assertEqual(getUnderTargetBandLabel("red"), "below 70% of daily target", "red band label");
assertEqual(getUnderTargetBandLabel("amber"), "almost there", "amber band label");
assertEqual(getDeficiencyHeadline("red", "Vitamin D"), "Low Vitamin D", "red headline");
assertEqual(getDeficiencyHeadline("amber", "Iodine"), "Almost there — Iodine", "amber headline");

// graded bands: near-target green, moderate amber, severe red
assertEqual(getTrafficLight("vitamin_d_mcg", 10 * 0.97 * 7, "male"), "green", "vitamin D 97% green");
assertEqual(getTrafficLight("iodine_mcg", 140 * 0.86 * 7, "male"), "amber", "iodine 86% amber");
assertEqual(getTrafficLight("vitamin_d_mcg", 10 * 0.06 * 7, "male"), "red", "vitamin D 6% red");
assertEqual(isUnderTarget("vitamin_d_mcg", 10 * 0.97 * 7, "male"), true, "97% still under 100% RNI");

// 88% of RNI → amber, not red
assertEqual(getTrafficLight("vitamin_b12_mcg", 1.5 * 0.88 * 7, "male"), "amber", "B12 88% amber");
assertEqual(isUnderTarget("vitamin_b12_mcg", 1.5 * 0.88 * 7, "male"), true, "B12 88% under target");
assertEqual(
  getTrafficLightLabel("vitamin_b12_mcg", 1.5 * 0.88 * 7, "male"),
  "88% of daily target",
  "B12 88% label",
);

// Iron changes with age (NHS): women 14.8 mg until 50, then 8.7 mg; boys 11.3 mg up to 18.
assertEqual(drvFor("iron_mg", { sex: "female", age: 49 })?.rni, 14.8, "iron woman 49");
assertEqual(drvFor("iron_mg", { sex: "female", age: 50 })?.rni, 8.7, "iron woman 50");
assertEqual(drvFor("iron_mg", { sex: "female", age: 72 })?.rni, 8.7, "iron woman 72");
assertEqual(drvFor("iron_mg", { sex: "female", age: 17 })?.rni, 14.8, "iron girl 17");
assertEqual(drvFor("iron_mg", { sex: "male", age: 17 })?.rni, 11.3, "iron boy 17");
assertEqual(drvFor("iron_mg", { sex: "male", age: 19 })?.rni, 8.7, "iron man 19");
// Unknown age keeps the adult figures; the sex-only form is unchanged.
assertEqual(drvFor("iron_mg", { sex: "female", age: null })?.rni, 14.8, "iron woman, age unknown");
assertEqual(drvFor("iron_mg", { sex: "male" })?.rni, 8.7, "iron man, age unknown");
assertEqual(drvFor("iron_mg", "female")?.rni, 14.8, "iron by sex only");
// Age touches only the iron RNI; the supplement level stays.
assertEqual(drvFor("calcium_mg", { sex: "female", age: 60 })?.rni, 700, "calcium woman 60");
assertEqual(drvFor("iron_mg", { sex: "female", age: 60 })?.supplementUpper, 17, "iron supplement level unchanged");
assertEqual(drvFor("iron_mg", { sex: "female", age: 60 })?.upper, undefined, "iron food upper still none");
assertEqual(drvFor("not_a_nutrient", { sex: "female", age: 60 }), undefined, "unknown nutrient");
// 9 mg a day: low for a 30-year-old woman, met for a 55-year-old.
assertEqual(getTrafficLight("iron_mg", 9 * 7, { sex: "female", age: 30 }), "red", "iron 9 mg, woman 30");
assertEqual(getTrafficLight("iron_mg", 9 * 7, { sex: "female", age: 55 }), "green", "iron 9 mg, woman 55");
assertEqual(isUnderTarget("iron_mg", 9 * 7, { sex: "female", age: 55 }), false, "iron 9 mg not under at 55");
assertEqual(getTrafficLightLabel("iron_mg", 8.7 * 7, { sex: "female", age: 55 }), "100% of daily target", "iron label at 55");

console.log("drv.test.ts: all assertions passed");
