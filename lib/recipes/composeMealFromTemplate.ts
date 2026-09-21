/**
 * Part 3 — Template-fill generation (target-aware).
 *
 * Flow: rank diet-valid templates by how well they reach the per-meal calorie
 * target (light templates for low goals, reaching templates for build-muscle) →
 * fill each role with a role-compatible ingredient (diet, variety, micro focus) →
 * scale to hit the kcal band, scaling the primary gram slot first and, when the
 * meal's calorie floor/ceiling gets in the way, dropping optional roles or
 * nudging secondary gram portions within realistic bounds → name the dish.
 *
 * Coherence is structural; macro-hitting is handled here per goal. When no
 * template can sensibly hit a target we return the closest honest attempt and
 * flag it (targetMet=false) rather than padding with filler.
 */

import {
  GOAL_MEAL_KCAL_TOLERANCE,
  clampTarget,
  ing,
  pickVariant,
  type GoalMatchedRecipeOptions,
  type GoalMealSlot,
} from "@/lib/ai/goal-matched-recipe";
import type { RecipeIngredientInput } from "@/lib/nutrition/calculate";
import { MICRO_RICH_FOODS } from "@/lib/nutrition/micro-rich-foods";
import { getRecipeNutritionTotals } from "@/lib/nutrition/recipeNutritionTotals";
import {
  dietAllows,
  ingredientsForRole,
  type IngredientDef,
  type IngredientRole,
} from "@/lib/recipes/ingredientRoles";
import {
  MEAL_TEMPLATES,
  rankTemplatesForTarget,
  templatesFor,
  type MealTemplate,
  type TemplateSlot,
} from "@/lib/recipes/mealTemplates";

export type ComposedMeal = {
  ingredients: RecipeIngredientInput[];
  name: string;
  templateId: string;
  /** Estimated calories of the returned portions (target-tuning estimate). */
  estimatedCalories: number;
  /** False when the closest achievable meal still misses the band — surface, don't pad. */
  targetMet: boolean;
};

/** Pluggable nutrition evaluator so verification can run on the local DB offline. */
export type NutritionEval = (
  ings: RecipeIngredientInput[],
) => Promise<{ calories: number; protein_g: number }>;

const defaultNutritionEval: NutritionEval = async (ings) => {
  const { totals } = await getRecipeNutritionTotals(ings, { aiEnabled: true });
  return { calories: totals.calories, protein_g: totals.protein_g };
};

const SECONDARY_DOWN_STEPS = [0.8, 0.65, 0.55];
const SECONDARY_UP_STEPS = [1.2, 1.4, 1.6];
const MAX_TEMPLATE_ATTEMPTS = 6;

function hashRole(role: IngredientRole): number {
  let h = 0;
  for (let i = 0; i < role.length; i++) h = (h * 31 + role.charCodeAt(i)) >>> 0;
  return h;
}

function axisApplies(mealSlot: GoalMealSlot): boolean {
  return mealSlot === "lunch" || mealSlot === "dinner";
}

function applyProteinAxis(candidates: IngredientDef[], opts: GoalMatchedRecipeOptions): IngredientDef[] {
  if (!opts.proteinAxis || !axisApplies(opts.mealSlot)) return candidates;
  const matched = candidates.filter((d) => d.proteinAxis === opts.proteinAxis);
  return matched.length ? matched : candidates;
}

function applyMicroFocus(
  candidates: IngredientDef[],
  role: IngredientRole,
  opts: GoalMatchedRecipeOptions,
): IngredientDef[] {
  const key = opts.microFocusKey?.trim();
  if (!key || opts.mealSlot !== "snack") return candidates;
  if (!["protein", "fat_topping", "fruit", "vegetable", "dairy"].includes(role)) return candidates;
  const rich = MICRO_RICH_FOODS[key] ?? [];
  if (!rich.length) return candidates;
  const preferred = candidates.filter((d) =>
    rich.some((r) => {
      const a = d.name.toLowerCase();
      const b = r.toLowerCase();
      return a.includes(b) || b.includes(a);
    }),
  );
  return preferred.length ? preferred : candidates;
}

function candidatesForSlot(
  slot: TemplateSlot,
  opts: GoalMatchedRecipeOptions,
  usedNames: Set<string>,
): IngredientDef[] {
  let list = ingredientsForRole(slot.role, opts);
  if (slot.only) {
    const only = slot.only.map((n) => n.toLowerCase());
    list = list.filter((d) => only.includes(d.name.toLowerCase()));
  }
  if (slot.not) {
    const not = slot.not.map((n) => n.toLowerCase());
    list = list.filter((d) => !not.includes(d.name.toLowerCase()));
  }
  list = list.filter((d) => !usedNames.has(d.name.toLowerCase()));
  if (slot.role === "protein") list = applyProteinAxis(list, opts);
  list = applyMicroFocus(list, slot.role, opts);
  return list;
}

function pickFromList(
  list: IngredientDef[],
  seed: number,
  salt: number,
  role: IngredientRole,
): IngredientDef | undefined {
  if (!list.length) return undefined;
  const idx = pickVariant((seed ^ hashRole(role) ^ (salt * 0x9e3779b9)) >>> 0, list.length);
  return list[idx];
}

function templateIsFillable(template: MealTemplate, opts: GoalMatchedRecipeOptions): boolean {
  const used = new Set<string>();
  for (const slot of template.slots) {
    if (!slot.required) continue;
    const list = candidatesForSlot(slot, opts, used);
    if (!list.length) return false;
    used.add(list[0]!.name.toLowerCase());
  }
  return true;
}

/** A picked ingredient with where it came from, used by scaling. */
type Picked = {
  def: IngredientDef;
  role: IngredientRole;
  optional: boolean;
  scaleBand?: { min: number; max: number; step?: number };
};

export type MealComposition = {
  template: MealTemplate;
  picks: Picked[];
  name: string;
};

/** Step 1 + 2 + 4: rank + pick a template, fill its roles, and name the dish (no nutrition). */
export function selectMealComposition(opts: GoalMatchedRecipeOptions): MealComposition | null {
  const list = orderedFillableTemplates(opts);
  if (!list.length) return null;
  return fillTemplate(list[0]!, opts);
}

function orderedFillableTemplates(opts: GoalMatchedRecipeOptions): MealTemplate[] {
  const excluded = new Set((opts.excludeTemplateIds ?? []).map((id) => id.toLowerCase()));
  const eligible = templatesFor(opts.mealSlot, {
    vegan: opts.vegan,
    vegetarian: opts.vegetarian,
    glutenFree: opts.glutenFree,
    dairyFree: opts.dairyFree,
  })
    .filter((t) => templateIsFillable(t, opts))
    .filter((t) => !excluded.has(t.id.toLowerCase()));
  return rankTemplatesForTarget(eligible, clampTarget(opts.targetCalories), opts.variantSeed);
}

function fillTemplate(template: MealTemplate, opts: GoalMatchedRecipeOptions): MealComposition {
  const usedNames = new Set<string>();
  const chosenByRole = new Map<IngredientRole, IngredientDef>();
  const picks: Picked[] = [];
  let salt = 0;

  for (let s = 0; s < template.slots.length; s++) {
    const slot = template.slots[s]!;

    // Optional, non-scaled slots only appear for some seeds → toppings/sides vary.
    if (!slot.required && !slot.scale) {
      const gate = pickVariant((opts.variantSeed ^ hashRole(slot.role) ^ (s * 0x27d4eb2f)) >>> 0, 100);
      if (gate >= 60) continue;
    }

    const count = Math.max(1, slot.count ?? 1);
    for (let c = 0; c < count; c++) {
      const candidates = candidatesForSlot(slot, opts, usedNames);
      const def = pickFromList(candidates, opts.variantSeed, salt++, slot.role);
      if (!def) break;
      usedNames.add(def.name.toLowerCase());
      if (!chosenByRole.has(slot.role)) chosenByRole.set(slot.role, def);
      picks.push({ def, role: slot.role, optional: !slot.required, scaleBand: slot.scale });
    }
  }

  const name = template.name((role) => chosenByRole.get(role)).trim() || template.archetype;
  return { template, picks, name };
}

function round5(g: number): number {
  return Math.max(0, Math.round(g / 5) * 5);
}

/**
 * Scale a composition to the target, returning the best achievable portions.
 * Strategy: sweep the primary gram slot; if the floor still overshoots a low
 * target, drop optional roles then nudge secondary grams down; if maxing the
 * primary still undershoots a high target, nudge secondary grams up.
 */
async function scaleComposition(
  comp: MealComposition,
  target: number,
  evalFn: NutritionEval,
): Promise<{ ingredients: RecipeIngredientInput[]; calories: number; targetMet: boolean }> {
  const tol = GOAL_MEAL_KCAL_TOLERANCE;
  const primary = comp.picks.find((p) => p.scaleBand);
  // Secondary gram items we may nudge (not the primary, not non-gram like eggs/oil).
  const secondaries = comp.picks.filter(
    (p) => !p.scaleBand && p.def.portion.unit === "g" && p.role !== "cooking_fat",
  );

  const booster = comp.template.booster;
  const boosterAlreadyPicked =
    booster != null &&
    comp.picks.some((p) => p.def.name.toLowerCase() === booster.name.toLowerCase());

  const buildIngredients = (opts: {
    primaryG?: number;
    secondaryMult: number;
    dropOptional: boolean;
    boosterG?: number;
  }): RecipeIngredientInput[] => {
    const rows: RecipeIngredientInput[] = [];
    for (const p of comp.picks) {
      if (p === primary) continue;
      if (opts.dropOptional && p.optional && p.role !== "vegetable") continue;
      const isSecondary = secondaries.includes(p);
      const qty = isSecondary
        ? round5(p.def.portion.quantity * opts.secondaryMult)
        : p.def.portion.quantity;
      if (qty <= 0) continue;
      rows.push(ing(p.def.name, qty, p.def.portion.unit));
    }
    if (primary && opts.primaryG != null) {
      rows.push(ing(primary.def.name, opts.primaryG, "g"));
    }
    // High-target booster: a coherent calorie-dense add for the archetype.
    if (booster && !boosterAlreadyPicked && opts.boosterG && opts.boosterG > 0) {
      rows.push(ing(booster.name, opts.boosterG, booster.unit));
    }
    return rows;
  };

  type Attempt = { ingredients: RecipeIngredientInput[]; calories: number };
  let best: Attempt | null = null;
  const consider = (a: Attempt) => {
    if (!best || Math.abs(a.calories - target) < Math.abs(best.calories - target)) best = a;
  };

  const sweepPrimary = async (
    secondaryMult: number,
    dropOptional: boolean,
    boosterG = 0,
  ): Promise<Attempt> => {
    if (!primary) {
      const ings = buildIngredients({ secondaryMult, dropOptional, boosterG });
      const { calories } = await evalFn(ings);
      const a = { ingredients: ings, calories };
      consider(a);
      return a;
    }
    const { min, max, step = 5 } = primary.scaleBand!;
    // Pick the portion landing CLOSEST to target (centred in band), not the
    // highest within-band portion — otherwise meals systematically run high.
    let local: Attempt | null = null;
    for (let g = min; g <= max; g += step) {
      const ings = buildIngredients({ primaryG: g, secondaryMult, dropOptional, boosterG });
      const { calories } = await evalFn(ings);
      const a = { ingredients: ings, calories };
      consider(a);
      if (!local || Math.abs(calories - target) < Math.abs(local.calories - target)) local = a;
    }
    return local!;
  };

  // Phase 1: primary sweep at default secondary portions.
  let result = await sweepPrimary(1, false);
  if (Math.abs(result.calories - target) <= tol) {
    return { ingredients: result.ingredients, calories: result.calories, targetMet: true };
  }

  if (result.calories > target + tol) {
    // Overshoot (low target): drop optional roles, then trim secondary grams.
    result = await sweepPrimary(1, true);
    for (const mult of SECONDARY_DOWN_STEPS) {
      if (Math.abs(result.calories - target) <= tol) break;
      result = await sweepPrimary(mult, true);
    }
  } else {
    // Undershoot (high target): push secondary grams up, then add a calorie-dense
    // booster in growing portions so build-muscle targets are reached, not missed.
    for (const mult of SECONDARY_UP_STEPS) {
      if (Math.abs(result.calories - target) <= tol) break;
      result = await sweepPrimary(mult, false);
    }
    if (comp.template.booster && result.calories < target - tol) {
      const topMult = SECONDARY_UP_STEPS[SECONDARY_UP_STEPS.length - 1]!;
      for (const boosterG of comp.template.booster.steps) {
        if (result.calories >= target - tol) break;
        result = await sweepPrimary(topMult, false, boosterG);
      }
    }
  }

  const bestFinal = best!;
  return {
    ingredients: bestFinal.ingredients,
    calories: bestFinal.calories,
    targetMet: Math.abs(bestFinal.calories - target) <= tol,
  };
}

/**
 * Full generation: rank templates for the target, then fill + scale each in turn,
 * accepting the first that lands in band. If none do, return the closest honest
 * attempt (targetMet=false) so callers can surface the miss instead of padding.
 */
/**
 * Re-derive the title from the ingredients that survived scaling.
 *
 * `fillTemplate` names the dish from its initial picks, but `scaleComposition`
 * drops optional roles when a composition overshoots its target. Overnight oats
 * names itself after `fat_topping`, which is optional — so a snack that
 * overshot shipped as "Almonds Overnight Oats" containing no almonds.
 */
function nameForScaledIngredients(
  comp: MealComposition,
  ingredients: RecipeIngredientInput[],
): string {
  const present = new Set(ingredients.map((i) => i.name.toLowerCase().trim()));
  const survivingByRole = new Map<IngredientRole, IngredientDef>();
  for (const pick of comp.picks) {
    if (!present.has(pick.def.name.toLowerCase().trim())) continue;
    if (!survivingByRole.has(pick.role)) survivingByRole.set(pick.role, pick.def);
  }
  const rebuilt = comp.template.name((role) => survivingByRole.get(role)).trim();
  return rebuilt || comp.template.archetype;
}

export async function composeMealFromTemplate(
  opts: GoalMatchedRecipeOptions,
  evalFn: NutritionEval = defaultNutritionEval,
): Promise<ComposedMeal | null> {
  const target = clampTarget(opts.targetCalories);
  const ranked = orderedFillableTemplates(opts);
  if (!ranked.length) return null;

  let best: ComposedMeal | null = null;

  for (const template of ranked.slice(0, MAX_TEMPLATE_ATTEMPTS)) {
    const comp = fillTemplate(template, opts);
    const scaled = await scaleComposition(comp, target, evalFn);
    const candidate: ComposedMeal = {
      ingredients: scaled.ingredients,
      name: nameForScaledIngredients(comp, scaled.ingredients),
      templateId: template.id,
      estimatedCalories: Math.round(scaled.calories),
      targetMet: scaled.targetMet,
    };
    if (scaled.targetMet) return candidate;
    if (
      !best ||
      Math.abs(scaled.calories - target) < Math.abs(best.estimatedCalories - target)
    ) {
      best = candidate;
    }
  }

  return best;
}

export function allTemplateIds(): string[] {
  return MEAL_TEMPLATES.map((t) => t.id);
}

export { dietAllows };
