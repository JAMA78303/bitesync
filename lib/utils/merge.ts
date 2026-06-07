type Ingredient = { name: string; quantity: number; unit: string };

/** How many planner slots use each recipe (same recipe on multiple days multiplies grocery needs). */
export function mealPlanRecipeServings(
  entries: Iterable<{ recipe_id: string | null | undefined }>,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const e of entries) {
    const rid = e.recipe_id;
    if (!rid) continue;
    counts.set(rid, (counts.get(rid) ?? 0) + 1);
  }
  return counts;
}

type RecipeIngredientRow = { recipe_id: string; name: string; quantity: number; unit: string };

/** Scale each recipe's ingredient rows by how often that recipe appears on the plan, then merge by name+unit. */
export function mergeScaledRecipeIngredients(
  recipeIngredientRows: RecipeIngredientRow[],
  servingsByRecipe: Map<string, number>,
): Ingredient[] {
  const expanded: Ingredient[] = [];
  for (const row of recipeIngredientRows) {
    const times = servingsByRecipe.get(row.recipe_id) ?? 0;
    if (times <= 0) continue;
    const q = Number(row.quantity);
    expanded.push({
      name: row.name,
      quantity: (Number.isFinite(q) ? q : 0) * times,
      unit: row.unit,
    });
  }
  return mergeIngredients(expanded);
}

export function mergeIngredients(ingredients: Ingredient[]): Ingredient[] {
  const map = new Map<string, Ingredient>();
  for (const ing of ingredients) {
    const key = `${ing.name.toLowerCase().trim()}::${ing.unit.toLowerCase().trim()}`;
    const existing = map.get(key);
    if (existing) {
      map.set(key, { ...existing, quantity: existing.quantity + ing.quantity });
    } else {
      map.set(key, { name: ing.name, quantity: ing.quantity, unit: ing.unit });
    }
  }
  return Array.from(map.values());
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function normalizeUnitLabel(unit: string): string {
  const u = unit.toLowerCase().trim();
  if (!u) return "piece";
  if (["pieces", "each", "item", "items", "whole", "unit", "units"].includes(u)) return "piece";
  if (u === "kgs") return "kg";
  if (u === "grams") return "g";
  if (u === "millilitres" || u === "milliliters") return "ml";
  if (u === "litres" || u === "liters") return "l";
  if (u === "slices") return "slice";
  if (u === "cloves") return "clove";
  if (u === "loaves") return "loaf";
  return u;
}

function breadLikeName(name: string): boolean {
  return /\b(bread|toast|sourdough|loaf|bagel|pitta|pita|brioche|ciabatta)\b/i.test(name);
}

/** Convert recipe-level prep units into realistic grocery buying units. */
function toShoppingLine(input: Ingredient): Ingredient {
  const name = input.name.trim();
  const rawQty = Number(input.quantity);
  const qty = Number.isFinite(rawQty) ? Math.max(0, rawQty) : 0;
  const unit = normalizeUnitLabel(input.unit);

  if (unit === "kg") return { name, quantity: round2(qty * 1000), unit: "g" };
  if (unit === "mg") return { name, quantity: round2(qty / 1000), unit: "g" };
  if (unit === "l") return { name, quantity: round2(qty * 1000), unit: "ml" };
  if (unit === "cl") return { name, quantity: round2(qty * 10), unit: "ml" };
  if (unit === "tsp") return { name, quantity: round2(qty * 5), unit: "ml" };
  if (unit === "tbsp") return { name, quantity: round2(qty * 15), unit: "ml" };
  if (unit === "cup") return { name, quantity: round2(qty * 240), unit: "ml" };
  if (unit === "fl oz") return { name, quantity: round2(qty * 29.57), unit: "ml" };

  // Prevent impossible lines like "1 slice toast": buy loaves for bread-like items.
  if (unit === "slice" && breadLikeName(name)) {
    const loaves = Math.max(1, Math.ceil(qty / 20));
    return { name, quantity: loaves, unit: "loaf" };
  }

  // Garlic is bought as bulbs in practice.
  if (unit === "clove" && /\bgarlic\b/i.test(name)) {
    const bulbs = Math.max(1, Math.ceil(qty / 8));
    return { name, quantity: bulbs, unit: "bulb" };
  }

  return { name, quantity: round2(qty), unit };
}

export function normalizeIngredientsForShopping(ingredients: Ingredient[]): Ingredient[] {
  return mergeIngredients(ingredients.map(toShoppingLine));
}
