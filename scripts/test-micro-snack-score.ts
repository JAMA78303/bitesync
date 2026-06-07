import {
  DEFAULT_SNACK_MICRO_PRIORITIES,
  microPrioritiesFromDeficiencies,
  scoreRecipeMicroBoost,
} from "@/lib/nutrition/micro-rich-foods";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const ironPriority = microPrioritiesFromDeficiencies([{ key: "iron_mg", traffic: "red" }]);
assert(ironPriority[0]?.key === "iron_mg", "red deficiency becomes priority");

const spinachSnack = scoreRecipeMicroBoost(["spinach", "egg", "oats"], ironPriority);
const plainSnack = scoreRecipeMicroBoost(["white rice", "pasta"], ironPriority);
assert(spinachSnack > plainSnack, "iron-rich snack should score higher");

const defaults = microPrioritiesFromDeficiencies([]);
assert(defaults.length === DEFAULT_SNACK_MICRO_PRIORITIES.length, "empty analysis uses defaults");

const vitC = microPrioritiesFromDeficiencies([{ key: "vitamin_c_mg", traffic: "amber" }]);
const berryScore = scoreRecipeMicroBoost(["strawberries", "greek yogurt"], vitC);
const riceScore = scoreRecipeMicroBoost(["white rice"], vitC);
assert(berryScore > riceScore, "vit C snack should beat rice");

console.log("micro snack scoring: all checks passed");
