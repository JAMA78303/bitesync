import type { GoalMealSlot, ProteinAxis } from "@/lib/ai/goal-matched-recipe";
import type { RecipeIngredientInput } from "@/lib/nutrition/calculate";
import { dietaryPreferencesToLegacyFlags } from "@/lib/dietary/constraints";

export type BulkProteinAxis = ProteinAxis | "vegan" | "vegetarian";

export type BulkFillSlotPlan = {
  slotId: string;
  mealSlot: GoalMealSlot;
  proteinAxis: BulkProteinAxis;
  variantSeed: number;
  label: string;
};

export type HardDietConstraints = {
  vegan: boolean;
  vegetarian: boolean;
  glutenFree: boolean;
  dairyFree: boolean;
  dietaryPreferences: string[];
};

export type ExistingLibrarySnapshot = {
  names: string[];
  signatures: string[];
};

const DEFAULT_PER_TYPE = 7;
const DEFAULT_COUNT = DEFAULT_PER_TYPE * 4;
const MIN_PER_TYPE = 2;
const MAX_PER_TYPE = 10;
const MIN_TOTAL = MIN_PER_TYPE * 4;
const MAX_TOTAL = MAX_PER_TYPE * 4;

const MEAL_TYPES: GoalMealSlot[] = ["breakfast", "lunch", "dinner", "snack"];

const OMNIVORE_AXIS_ROTATION: BulkProteinAxis[] = [
  "meat",
  "fish",
  "vegetarian",
  "vegan",
  "meat",
  "fish",
  "plant",
  "meat",
  "fish",
  "vegetarian",
];

export function defaultBulkRecipeCount(): number {
  return DEFAULT_COUNT;
}

/** Recipes generated per meal type for a total batch count (even split across 4 types). */
export function recipesPerMealType(totalCount: number): number {
  const n = Math.min(Math.max(Math.round(totalCount), MIN_TOTAL), MAX_TOTAL);
  return Math.min(MAX_PER_TYPE, Math.max(MIN_PER_TYPE, Math.round(n / MEAL_TYPES.length)));
}

/**
 * Per-type split that honours non-multiples of 4: the remainder goes to the earliest
 * meal types (breakfast first) so a 10-recipe free-tier batch lands as 3/3/2/2
 * instead of over-planning 12 and failing 2 at the recipe cap.
 */
export function bulkFillMealTypeCountsExact(totalCount: number): Record<GoalMealSlot, number> {
  const n = Math.min(Math.max(Math.round(totalCount), MIN_TOTAL), MAX_TOTAL);
  const base = Math.floor(n / MEAL_TYPES.length);
  let remainder = n - base * MEAL_TYPES.length;
  const counts = {} as Record<GoalMealSlot, number>;
  for (const mealType of MEAL_TYPES) {
    const extra = remainder > 0 ? 1 : 0;
    counts[mealType] = Math.min(MAX_PER_TYPE, Math.max(MIN_PER_TYPE, base + extra));
    if (extra) remainder -= 1;
  }
  return counts;
}

export function bulkFillMealTypeCounts(totalCount: number): Record<GoalMealSlot, number> {
  const perType = recipesPerMealType(totalCount);
  return {
    breakfast: perType,
    lunch: perType,
    dinner: perType,
    snack: perType,
  };
}

export function bulkFillBatchSummary(totalCount: number): string {
  const counts = bulkFillMealTypeCountsExact(totalCount);
  return MEAL_TYPES.map((t) => `${counts[t]} ${t}`).join(", ");
}

export function hardConstraintsFromPreferences(prefs: string[]): HardDietConstraints {
  const flags = dietaryPreferencesToLegacyFlags(prefs);
  return {
    vegan: flags.followsVegan,
    vegetarian: flags.followsVegetarian,
    glutenFree: flags.followsGlutenFree,
    dairyFree: flags.dairyFree,
    dietaryPreferences: prefs,
  };
}

function proteinAxisForSlot(
  index: number,
  hard: HardDietConstraints,
  mealSlot: GoalMealSlot,
): BulkProteinAxis {
  if (hard.vegan) return "vegan";
  if (hard.vegetarian) return index % 2 === 0 ? "vegetarian" : "plant";
  if (mealSlot === "breakfast" || mealSlot === "snack") {
    const soft: BulkProteinAxis[] = ["plant", "vegetarian", "plant", "vegetarian"];
    return soft[index % soft.length];
  }
  return OMNIVORE_AXIS_ROTATION[index % OMNIVORE_AXIS_ROTATION.length];
}

function axisLabel(axis: BulkProteinAxis): string {
  switch (axis) {
    case "meat":
      return "Meat-based";
    case "fish":
      return "Fish-based";
    case "vegetarian":
      return "Vegetarian";
    case "vegan":
      return "Vegan";
    case "plant":
      return "Plant-based";
    default:
      return axis;
  }
}

/** Build generation slots — equal depth per meal type, interleaved for varied progress. */
export function planBulkFillBatch(
  count: number,
  hard: HardDietConstraints,
  baseSeed: number,
  /** Per-type counts to use instead of the even split (the onboarding starter set). */
  typeCountsOverride?: Record<GoalMealSlot, number>,
): BulkFillSlotPlan[] {
  const typeCounts = typeCountsOverride ?? bulkFillMealTypeCountsExact(count);
  const slots: BulkFillSlotPlan[] = [];
  let slotIndex = 0;

  // Grouped by meal type — all breakfasts, then lunches, then dinners, then
  // snacks. Previously interleaved for "varied progress", which left the review
  // list shuffled and made it hard to judge whether a meal type had enough depth.
  for (let typeIdx = 0; typeIdx < MEAL_TYPES.length; typeIdx += 1) {
    const mealSlot = MEAL_TYPES[typeIdx]!;
    for (let round = 0; round < typeCounts[mealSlot]; round += 1) {
      const proteinAxis = proteinAxisForSlot(slotIndex, hard, mealSlot);
      const variantSeed =
        (baseSeed ^ (slotIndex * 0x9e3779b9) ^ (mealSlot.length << 12) ^ (round << 18) ^ (typeIdx << 6)) >>> 0;
      slots.push({
        slotId: `slot-${slotIndex}`,
        mealSlot,
        proteinAxis,
        variantSeed,
        label: `${mealSlot.charAt(0).toUpperCase() + mealSlot.slice(1)} · ${axisLabel(proteinAxis)}`,
      });
      slotIndex += 1;
    }
  }

  return slots;
}

export function dietFlagsForSlot(
  slot: BulkFillSlotPlan,
  hard: HardDietConstraints,
): { vegan: boolean; vegetarian: boolean; glutenFree: boolean; dairyFree: boolean; proteinAxis?: ProteinAxis } {
  return { ...dietFlagsForSlotBase(slot, hard), dairyFree: hard.dairyFree };
}

function dietFlagsForSlotBase(
  slot: BulkFillSlotPlan,
  hard: HardDietConstraints,
): { vegan: boolean; vegetarian: boolean; glutenFree: boolean; proteinAxis?: ProteinAxis } {
  const glutenFree = hard.glutenFree;
  if (hard.vegan) {
    return { vegan: true, vegetarian: true, glutenFree, proteinAxis: "plant" };
  }
  if (hard.vegetarian) {
    return { vegan: slot.proteinAxis === "vegan", vegetarian: true, glutenFree, proteinAxis: "plant" };
  }
  if (slot.proteinAxis === "vegan") {
    return { vegan: true, vegetarian: true, glutenFree, proteinAxis: "plant" };
  }
  if (slot.proteinAxis === "vegetarian") {
    return { vegan: false, vegetarian: true, glutenFree, proteinAxis: "plant" };
  }
  return {
    vegan: false,
    vegetarian: false,
    glutenFree,
    proteinAxis: slot.proteinAxis === "meat" || slot.proteinAxis === "fish" ? slot.proteinAxis : undefined,
  };
}

export function ingredientSignature(ingredients: RecipeIngredientInput[]): string {
  return ingredients
    .map((i) => i.name.trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join("|");
}

export function normalizeRecipeName(name: string): string {
  return name
    .toLowerCase()
    // Strip a disambiguating "(2)" suffix first: without this, a renamed duplicate
    // normalises to "chicken curry with rice 2" and never collides with its own
    // base name again, so the same dish can be re-added indefinitely.
    .replace(/\s*\(\s*\d+\s*\)\s*$/, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function overlapRatio(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const setA = new Set(a.split("|"));
  const setB = new Set(b.split("|"));
  let inter = 0;
  for (const t of setA) {
    if (setB.has(t)) inter += 1;
  }
  const union = setA.size + setB.size - inter;
  return union > 0 ? inter / union : 0;
}

export type DuplicateDraftOptions = {
  /** Ingredient overlap vs batch (default 0.85). */
  batchOverlap?: number;
  /** Ingredient overlap vs library (default 0.9). */
  libraryOverlap?: number;
  /** When true, only reject identical normalized titles. */
  nameOnly?: boolean;
};

export function isDuplicateDraft(
  draft: { name: string; ingredients: RecipeIngredientInput[] },
  existing: ExistingLibrarySnapshot,
  acceptedInBatch: { name: string; ingredients: RecipeIngredientInput[] }[],
  opts?: DuplicateDraftOptions,
): boolean {
  const normName = normalizeRecipeName(draft.name);
  const sig = ingredientSignature(draft.ingredients);
  const batchOverlap = opts?.batchOverlap ?? 0.85;
  const libraryOverlap = opts?.libraryOverlap ?? 0.9;

  for (const name of existing.names) {
    if (normalizeRecipeName(name) === normName) return true;
  }
  for (const prior of acceptedInBatch) {
    if (normalizeRecipeName(prior.name) === normName) return true;
    if (!opts?.nameOnly && overlapRatio(sig, ingredientSignature(prior.ingredients)) >= batchOverlap) {
      return true;
    }
  }
  if (!opts?.nameOnly) {
    for (const priorSig of existing.signatures) {
      if (overlapRatio(sig, priorSig) >= libraryOverlap) return true;
    }
  }
  return false;
}

/** Loosen dedupe as generation retries exhaust finite template variety. */
export function duplicateDraftOptsForAttempt(attempt: number): DuplicateDraftOptions {
  if (attempt >= 12) return { nameOnly: true, batchOverlap: 1, libraryOverlap: 1 };
  if (attempt >= 10) return { nameOnly: true };
  if (attempt >= 6) return { batchOverlap: 0.95, libraryOverlap: 0.97 };
  if (attempt >= 3) return { batchOverlap: 0.9, libraryOverlap: 0.93 };
  return {};
}

/** Skip dedupe entirely — last resort so a slot still fills. */
export function skipDuplicateChecks(): DuplicateDraftOptions {
  return { nameOnly: true, batchOverlap: 1, libraryOverlap: 1 };
}

/** How many templates to exclude from reuse as attempts progress. */
export function excludeTemplateCountForAttempt(attempt: number, totalExcluded: number): number {
  if (attempt >= 10) return 0;
  if (attempt >= 6) return Math.floor(totalExcluded / 2);
  return totalExcluded;
}
