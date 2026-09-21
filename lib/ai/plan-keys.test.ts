import { mapPlanKeysToIds } from "@/lib/ai/client";

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}
const idByKey = new Map([
  ["R1", "0461348e-4276-4114-96a6-0b150c7c8b36"],
  ["R2", "11111111-1111-1111-1111-111111111111"],
]);

const out = mapPlanKeysToIds(
  [
    { day: 0, breakfast: "R1", lunch: "r2", dinner: " R1 ", snack: null, snack_b: "R9" },
    { day: 1, breakfast: "11111111-1111-1111-1111-111111111111", lunch: "Chicken Curry" },
  ],
  idByKey,
);

assert(out[0]!.breakfast === "0461348e-4276-4114-96a6-0b150c7c8b36", "R1 maps to its id");
assert(out[0]!.lunch === "11111111-1111-1111-1111-111111111111", "keys are case-insensitive");
assert(out[0]!.dinner === "0461348e-4276-4114-96a6-0b150c7c8b36", "whitespace is tolerated");
assert(out[0]!.snack === null, "null stays null");
assert(out[0]!.snack_b === null, "an invented key becomes null, not a crash");
assert(out[1]!.breakfast === "11111111-1111-1111-1111-111111111111", "an echoed real id is kept");
assert(out[1]!.lunch === null, "a recipe name is not an id");
assert(!("dinner" in out[1]!), "an absent slot stays absent");

console.log("plan-keys.test.ts: all assertions passed");
