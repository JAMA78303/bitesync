import {
  duplicateDraftOptsForAttempt,
  excludeTemplateCountForAttempt,
  isDuplicateDraft,
  skipDuplicateChecks,
} from "@/lib/recipes/bulkFillLibrary";
import {
  filterPoolByUsageTier,
  recipeAvailabilityTiers,
} from "@/lib/planner/recipe-pool-availability";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

// Dedupe relaxes with attempt count
assert(duplicateDraftOptsForAttempt(0).nameOnly !== true, "early attempt keeps ingredient dedupe");
assert(duplicateDraftOptsForAttempt(10).nameOnly === true, "late attempt is name-only");
assert(skipDuplicateChecks().batchOverlap === 1, "skip duplicate checks allows full overlap");

const existing = { names: ["Chicken Rice Bowl"], signatures: ["chicken|rice|broccoli"] };
const batch = [{ name: "Salmon Tray Bake", ingredients: [{ name: "salmon", quantity: 120, unit: "g" }] }];
const nearDup = {
  name: "New Bowl",
  ingredients: [
    { name: "chicken", quantity: 120, unit: "g" },
    { name: "rice", quantity: 60, unit: "g" },
    { name: "broccoli", quantity: 100, unit: "g" },
  ],
};
assert(
  isDuplicateDraft(nearDup, existing, batch, duplicateDraftOptsForAttempt(0)),
  "strict overlap should flag near-duplicate",
);
assert(
  !isDuplicateDraft(nearDup, existing, batch, skipDuplicateChecks()),
  "forced fill should accept near-duplicate ingredients",
);

assert(excludeTemplateCountForAttempt(0, 4) === 4, "early attempts exclude all used templates");
assert(excludeTemplateCountForAttempt(10, 4) === 0, "late attempts allow template reuse");

// Pool availability tiers
const pool = [{ id: "a" }, { id: "b" }, { id: "c" }];
const usedCount = new Map<string, number>([
  ["a", 2],
  ["b", 1],
]);
const usedOnDay = new Set(["b"]);

assert(
  filterPoolByUsageTier(pool, usedCount, usedOnDay, "strict").map((r) => r.id).join() === "c",
  "strict tier only allows unused-today and <2/week",
);
assert(
  filterPoolByUsageTier(pool, usedCount, usedOnDay, "allow_same_day").map((r) => r.id).join() === "b,c",
  "allow_same_day permits same-day repeat if under weekly cap",
);
assert(
  filterPoolByUsageTier(pool, usedCount, usedOnDay, "any_recipe").length === 3,
  "any_recipe returns full pool",
);
assert(recipeAvailabilityTiers().length === 4, "four relaxation tiers");

console.log("fill-skip-fallback.test.ts: ok");
