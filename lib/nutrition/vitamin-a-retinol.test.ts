import {
  attachRetinolToMicroEntry,
  inferRetinolMcgPer100g,
} from "@/lib/nutrition/vitamin-a-retinol";
import {
  getTrafficLight,
  getTrafficLightLabel,
  isAboveUpperLimit,
} from "@/lib/nutrition/drv";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

assert(inferRetinolMcgPer100g("sweet potato", 852) === 0, "sweet potato retinol is 0");
assert(inferRetinolMcgPer100g("carrots", 835) === 0, "carrots retinol is 0");
assert(inferRetinolMcgPer100g("spinach", 469) === 0, "spinach retinol is 0");
assert(inferRetinolMcgPer100g("eggs", 190) === 190, "eggs retinol matches RE");

const spinachEntry = attachRetinolToMicroEntry("spinach", { vitamin_a_mcg: 469 });
assert(spinachEntry.retinol_mcg === 0, "attachRetinol sets spinach retinol to 0");

// Plant-heavy week: 373% RE target but retinol well below 1500 mcg upper
const plantWeeklyRe = 700 * 3.73 * 7;
const plantWeeklyRetinol = 50 * 7;
assert(
  isAboveUpperLimit("vitamin_a_mcg", plantWeeklyRe, "male", { weeklyRetinolMcg: plantWeeklyRetinol }) === false,
  "plant-heavy RE does not trip retinol upper limit",
);
assert(
  getTrafficLight("vitamin_a_mcg", plantWeeklyRe, "male", { weeklyRetinolMcg: plantWeeklyRetinol }) === "green",
  "plant-heavy week stays green on vitamin A",
);
assert(
  getTrafficLightLabel("vitamin_a_mcg", plantWeeklyRe, "male", { weeklyRetinolMcg: plantWeeklyRetinol }).includes(
    "retinol",
  ) === false,
  "plant-heavy label has no retinol upper note",
);

// Genuine preformed excess still flags
const liverWeeklyRetinol = 1600 * 7;
assert(
  isAboveUpperLimit("vitamin_a_mcg", liverWeeklyRetinol, "male", { weeklyRetinolMcg: liverWeeklyRetinol }) === true,
  "high retinol week trips upper limit",
);
assert(
  getTrafficLightLabel("vitamin_a_mcg", liverWeeklyRetinol, "male", { weeklyRetinolMcg: liverWeeklyRetinol }).includes(
    "retinol upper limit",
  ),
  "retinol excess label is explicit",
);

// Iron: 237% of RNI (~20.6 mg/day) exceeds UK 17 mg upper — flag is correct
const ironWeekly = 20.6 * 7;
assert(
  isAboveUpperLimit("iron_mg", ironWeekly, "male") === true,
  "iron above 17 mg/day UK upper still flags",
);

console.log("vitamin-a-retinol.test.ts: all assertions passed");
