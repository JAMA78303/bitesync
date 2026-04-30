type Ingredient = { name: string; quantity: number; unit: string };

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
