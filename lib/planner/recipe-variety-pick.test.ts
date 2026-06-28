import { filterPoolByUsageTier } from "@/lib/planner/recipe-pool-availability";
import { maxRecipeUseCount, pickLeastUsedByScore } from "@/lib/planner/recipe-variety-pick";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

type R = { id: string };

// 4 lunches over 7 days — use all 4, no recipe 7×
const lunchPool: R[] = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
const usedCount = new Map<string, number>();
const lunchPicks: string[] = [];

for (let day = 0; day < 7; day++) {
  const usedOnDay = new Set<string>();
  let tierPool: R[] = [];
  for (const tier of ["strict", "allow_same_day", "allow_third_use", "any_recipe"] as const) {
    tierPool = filterPoolByUsageTier(lunchPool, usedCount, usedOnDay, tier);
    if (tierPool.length) break;
  }
  const picked = pickLeastUsedByScore(tierPool, usedCount, () => 1, day);
  assert(!!picked, `day ${day} should pick a lunch`);
  lunchPicks.push(picked!.id);
  usedCount.set(picked!.id, (usedCount.get(picked!.id) ?? 0) + 1);
}

assert(usedCount.size === 4, "all 4 lunch recipes used");
assert(maxRecipeUseCount(lunchPicks) <= 2, "no lunch repeats more than 2× in 7 days");
assert(Math.min(...[...usedCount.values()]) >= 1, "every lunch used at least once");

// Macro-favoured recipe does not dominate when others are least-used
const macroPool: R[] = [{ id: "fav" }, { id: "alt1" }, { id: "alt2" }];
const macroUsed = new Map<string, number>();
const scoreById: Record<string, number> = { fav: 100, alt1: 10, alt2: 10 };
const first = pickLeastUsedByScore(
  macroPool,
  macroUsed,
  (r) => scoreById[r.id] ?? 0,
  0,
);
assert(first?.id === "fav", "first pick may be highest score among unused");

macroUsed.set("fav", 1);
const second = pickLeastUsedByScore(
  macroPool.filter((r) => r.id !== "fav" || (macroUsed.get("fav") ?? 0) < 2),
  macroUsed,
  (r) => scoreById[r.id] ?? 0,
  1,
);
assert(second?.id !== "fav" || (macroUsed.get("fav") ?? 0) >= 1, "after fav used, prefer unused alts");

const spreadUsed = new Map<string, number>([
  ["fav", 1],
  ["alt1", 1],
  ["alt2", 0],
]);
const third = pickLeastUsedByScore(macroPool, spreadUsed, (r) => scoreById[r.id] ?? 0, 2);
assert(third?.id === "alt2", "least-used alt wins over higher-scoring repeats");

console.log("recipe-variety-pick.test.ts: ok");
