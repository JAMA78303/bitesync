import type { RecipeIngredientInput } from "@/lib/nutrition/calculate";

export function ingredientQuantityError(
  name: string,
  quantity: number | string,
): string | null {
  if (!name.trim()) return null;
  const raw = typeof quantity === "string" ? quantity.trim() : String(quantity);
  const qty = typeof quantity === "string" ? Number.parseFloat(quantity) : quantity;
  if (!raw || !Number.isFinite(qty) || qty <= 0) {
    return "Enter a quantity greater than 0";
  }
  return null;
}

export function validateRecipeIngredients(ingredients: RecipeIngredientInput[]): string | null {
  const named = ingredients.filter((i) => i.name.trim());
  if (!named.length) return "Add at least one ingredient with a name and quantity.";
  for (const ing of named) {
    const err = ingredientQuantityError(ing.name, ing.quantity);
    if (err) return `${ing.name.trim()}: ${err}`;
  }
  return null;
}

export function filterValidRecipeIngredients(
  ingredients: RecipeIngredientInput[],
): RecipeIngredientInput[] {
  return ingredients.filter(
    (ingredient) =>
      ingredient.name.trim() &&
      Number.isFinite(ingredient.quantity) &&
      ingredient.quantity > 0,
  );
}
