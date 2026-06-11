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
  dietaryPreferences: string[];
};

export type ExistingLibrarySnapshot = {
  names: string[];
  signatures: string[];
};

const DEFAULT_COUNT = 10;

const MEAL_DISTRIBUTION: GoalMealSlot[] = [
  "breakfast",
  "breakfast",
  "breakfast",
  "lunch",
  "lunch",
  "dinner",
  "dinner",
  "dinner",
  "snack",
  "snack",
];

const OMNIVORE_AXIS_ROTATION: BulkProteinAxis[] = ["meat", "fish", "vegetarian", "vegan", "meat", "fish", "plant", "meat", "fish", "vegetarian"];

export function defaultBulkRecipeCount(): number {
  return DEFAULT_COUNT;
}

export function hardConstraintsFromPreferences(prefs: string[]): HardDietConstraints {
  const flags = dietaryPreferencesToLegacyFlags(prefs);
  return {
    vegan: flags.followsVegan,
    vegetarian: flags.followsVegetarian,
    glutenFree: flags.followsGlutenFree,
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
  // Breakfast/snack templates are eggs, dairy, and composed bowls — not meat mains.
  if (mealSlot === "breakfast" || mealSlot === "snack") {
    const soft: BulkProteinAxis[] = ["plant", "vegetarian", "plant"];
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

/** Build generation slots spread across meal types with soft protein variety. */
export function planBulkFillBatch(
  count: number,
  hard: HardDietConstraints,
  baseSeed: number,
): BulkFillSlotPlan[] {
  const n = Math.min(Math.max(Math.round(count), 4), 16);
  const slots: BulkFillSlotPlan[] = [];

  for (let i = 0; i < n; i++) {
    const mealSlot = MEAL_DISTRIBUTION[i % MEAL_DISTRIBUTION.length];
    const proteinAxis = proteinAxisForSlot(i, hard, mealSlot);
    const variantSeed = (baseSeed ^ (i * 0x9e3779b9) ^ (mealSlot.length << 12)) >>> 0;
    slots.push({
      slotId: `slot-${i}`,
      mealSlot,
      proteinAxis,
      variantSeed,
      label: `${mealSlot.charAt(0).toUpperCase() + mealSlot.slice(1)} · ${axisLabel(proteinAxis)}`,
    });
  }

  return slots;
}

export function dietFlagsForSlot(
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
  if (attempt >= 10) return { nameOnly: true };
  if (attempt >= 6) return { batchOverlap: 0.95, libraryOverlap: 0.97 };
  if (attempt >= 3) return { batchOverlap: 0.9, libraryOverlap: 0.93 };
  return {};
}
