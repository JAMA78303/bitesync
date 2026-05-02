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
