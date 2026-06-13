/**
 * Part 3 — Template-fill generation.
 *
 * Flow: pick a template valid for the meal type + diet → fill each role with a
 * role-compatible ingredient (respecting diet, variety, and any micro focus) →
 * scale the one gram-based slot to hit the kcal target (reusing the existing
 * macro tuning) → name the dish from the template + key ingredients.
 *
 * Coherence is structural: incoherent piles are impossible because every
 * ingredient is placed into a named role inside a real dish archetype.
 */

import {
  clampTarget,
  findBestCarbAdjustment,
  ing,
  pickVariant,
  type GoalMatchedRecipeOptions,
  type GoalMealSlot,
} from "@/lib/ai/goal-matched-recipe";
import type { RecipeIngredientInput } from "@/lib/nutrition/calculate";
import { MICRO_RICH_FOODS } from "@/lib/nutrition/micro-rich-foods";
import {
  dietAllows,
  ingredientsForRole,
  type IngredientDef,
  type IngredientRole,
} from "@/lib/recipes/ingredientRoles";
import {
  MEAL_TEMPLATES,
  templatesFor,
  type MealTemplate,
  type TemplateSlot,
} from "@/lib/recipes/mealTemplates";

export type ComposedMeal = {
  ingredients: RecipeIngredientInput[];
  name: string;
  templateId: string;
};

function hashRole(role: IngredientRole): number {
  let h = 0;
  for (let i = 0; i < role.length; i++) h = (h * 31 + role.charCodeAt(i)) >>> 0;
  return h;
}

/** True for meal types where we steer protein choice toward the requested axis. */
function axisApplies(mealSlot: GoalMealSlot): boolean {
  return mealSlot === "lunch" || mealSlot === "dinner";
}

function applyProteinAxis(
  candidates: IngredientDef[],
  opts: GoalMatchedRecipeOptions,
): IngredientDef[] {
  if (!opts.proteinAxis || !axisApplies(opts.mealSlot)) return candidates;
  const matched = candidates.filter((d) => d.proteinAxis === opts.proteinAxis);
  return matched.length ? matched : candidates;
}

/** Snack micro focus: prefer fills that are rich sources of the focus nutrient. */
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

/** A template can actually be built under these constraints (all required slots fillable). */
function templateIsFillable(template: MealTemplate, opts: GoalMatchedRecipeOptions): boolean {
  const used = new Set<string>();
  for (const slot of template.slots) {
    if (!slot.required) continue;
    const list = candidatesForSlot(slot, opts, used);
    if (!list.length) return false;
    // Reserve one name so a later required slot of the same role still has options.
    used.add(list[0]!.name.toLowerCase());
  }
  return true;
}

export type MealComposition = {
  template: MealTemplate;
  /** Fixed (non-scaled) ingredients at their default portions. */
  base: RecipeIngredientInput[];
  /** The single gram slot the macro tuning scales to hit the target (if any). */
  scaled: { def: IngredientDef; band: { min: number; max: number; step?: number } } | null;
  name: string;
};

/**
 * Step 1 + 2 + 4 (offline): pick a template, fill its roles, and name the dish.
 * No nutrition lookup — coherence is fully determined here, so this is what the
 * verification harness exercises.
 */
export function selectMealComposition(opts: GoalMatchedRecipeOptions): MealComposition | null {
  const eligible = templatesFor(opts.mealSlot, {
    vegan: opts.vegan,
    vegetarian: opts.vegetarian,
    glutenFree: opts.glutenFree,
  }).filter((t) => templateIsFillable(t, opts));

  if (!eligible.length) return null;

  const template = eligible[pickVariant(opts.variantSeed, eligible.length)]!;

  const usedNames = new Set<string>();
  const chosenByRole = new Map<IngredientRole, IngredientDef>();
  const base: RecipeIngredientInput[] = [];
  let scaled: { def: IngredientDef; band: { min: number; max: number; step?: number } } | null = null;
  let salt = 0;

  for (let s = 0; s < template.slots.length; s++) {
    const slot = template.slots[s]!;

    // Optional, non-scaled slots are included for only some seeds, so toppings
    // and sides genuinely vary instead of appearing on every meal. The macro-
    // scaled slot is always kept so portions can still hit the target.
    if (!slot.required && !slot.scale) {
      const gate = pickVariant((opts.variantSeed ^ hashRole(slot.role) ^ (s * 0x27d4eb2f)) >>> 0, 100);
      if (gate >= 60) continue;
    }

    const count = Math.max(1, slot.count ?? 1);
    for (let c = 0; c < count; c++) {
      const list = candidatesForSlot(slot, opts, usedNames);
      const def = pickFromList(list, opts.variantSeed, salt++, slot.role);
      if (!def) break;
      usedNames.add(def.name.toLowerCase());
      if (!chosenByRole.has(slot.role)) chosenByRole.set(slot.role, def);

      if (slot.scale && !scaled) {
        scaled = { def, band: slot.scale };
      } else {
        base.push(ing(def.name, def.portion.quantity, def.portion.unit));
      }
    }
  }

  if (!base.length && !scaled) return null;

  const name = template.name((role) => chosenByRole.get(role)).trim() || template.archetype;
  return { template, base, scaled, name };
}

/**
 * Full generation: select a coherent composition, then scale its gram slot to hit
 * the calorie target (step 3 — reuses the existing macro tuning).
 */
export async function composeMealFromTemplate(
  opts: GoalMatchedRecipeOptions,
): Promise<ComposedMeal | null> {
  const selection = selectMealComposition(opts);
  if (!selection) return null;

  const target = clampTarget(opts.targetCalories);
  const { template, base, scaled, name } = selection;

  let ingredients: RecipeIngredientInput[];
  if (scaled) {
    ingredients = await findBestCarbAdjustment(
      base,
      { name: scaled.def.name, minG: scaled.band.min, maxG: scaled.band.max, step: scaled.band.step },
      target,
    );
  } else {
    ingredients = base;
  }

  return { ingredients, name, templateId: template.id };
}

/** Names of all known template ids (for diagnostics/verification scripts). */
export function allTemplateIds(): string[] {
  return MEAL_TEMPLATES.map((t) => t.id);
}

/** Re-export for callers that only need to know diet compatibility of a def. */
export { dietAllows };
