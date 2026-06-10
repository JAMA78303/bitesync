import {
  dailyCalorieBand,
  isWithinDailyCalorieBand,
  isWithinWeekAvgCalorieBand,
  weekAvgCalorieBand,
} from "./calorie-bands";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

// ±150 kcal is tighter than ±7% at 2500 kcal (175)
const band2500 = dailyCalorieBand(2500);
assert(band2500.min === 2350 && band2500.max === 2650, `2500 band: ${JSON.stringify(band2500)}`);
assert(isWithinDailyCalorieBand(2400, 2500), "2400 should be in band for 2500");
assert(!isWithinDailyCalorieBand(2300, 2500), "2300 should be below band for 2500");

// ±7% is tighter than ±150 at 1800 kcal (126)
const band1800 = dailyCalorieBand(1800);
assert(band1800.min === 1674 && band1800.max === 1926, `1800 band: ${JSON.stringify(band1800)}`);

const weekBand = weekAvgCalorieBand(2500);
assert(weekBand.min === 2375 && weekBand.max === 2625, `week band: ${JSON.stringify(weekBand)}`);
assert(isWithinWeekAvgCalorieBand(2500, 2500), "exact avg in band");
assert(!isWithinWeekAvgCalorieBand(2300, 2500), "low avg out of band");

console.log("calorie-bands.test.ts: ok");
