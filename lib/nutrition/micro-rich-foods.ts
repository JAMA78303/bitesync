/** Foods rich in each tracked micronutrient — used by deficiency UI and snack scoring. */
export const MICRO_RICH_FOODS: Record<string, readonly string[]> = {
  vitamin_a_mcg: ["sweet potato", "spinach", "carrots", "eggs"],
  vitamin_c_mg: ["peppers", "broccoli", "strawberries", "orange"],
  vitamin_d_mcg: ["salmon", "mackerel", "eggs", "tuna canned"],
  vitamin_b12_mcg: ["salmon", "tuna canned", "eggs", "greek yoghurt"],
  folate_mcg: ["spinach", "broccoli", "lentils", "chickpeas"],
  iron_mg: ["lentils", "spinach", "oats", "tofu"],
  calcium_mg: ["greek yoghurt", "milk", "almonds", "broccoli"],
  zinc_mg: ["almonds", "oats", "chicken breast", "lentils"],
  magnesium_mg: ["almonds", "oats", "spinach", "lentils"],
  potassium_mg: ["banana", "sweet potato", "salmon", "spinach"],
  selenium_mcg: ["tuna canned", "salmon", "eggs", "oats"],
  iodine_mcg: ["milk", "greek yoghurt", "eggs", "salmon"],
};

export type MicroPriority = { key: string; weight: number };

/** Fallback when no weekly micro analysis is available yet. */
export const DEFAULT_SNACK_MICRO_PRIORITIES: MicroPriority[] = [
  { key: "vitamin_d_mcg", weight: 1 },
  { key: "iron_mg", weight: 1 },
  { key: "folate_mcg", weight: 1 },
  { key: "vitamin_c_mg", weight: 1 },
  { key: "calcium_mg", weight: 1 },
];

export function microPrioritiesFromDeficiencies(
  nutrients: { key: string; traffic: "green" | "amber" | "red"; under_target?: boolean }[],
): MicroPriority[] {
  const priorities = nutrients
    .filter(
      (n) =>
        (n.under_target ?? true) && (n.traffic === "red" || n.traffic === "amber"),
    )
    .map((n) => ({
      key: n.key,
      weight: n.traffic === "red" ? 2 : 1,
    }));
  return priorities.length ? priorities : DEFAULT_SNACK_MICRO_PRIORITIES;
}

function ingredientMatchesRichFood(ingredientName: string, richFood: string): boolean {
  const a = ingredientName.toLowerCase().trim();
  const b = richFood.toLowerCase().trim();
  if (!a || !b) return false;
  return a.includes(b) || b.includes(a);
}

/** Higher = better micro coverage for the given priority nutrients. */
export function scoreRecipeMicroBoost(ingredientNames: string[], priorities: MicroPriority[]): number {
  if (!priorities.length || !ingredientNames.length) return 0;

  let score = 0;
  for (const { key, weight } of priorities) {
    const richFoods = MICRO_RICH_FOODS[key] ?? [];
    const matched = ingredientNames.some((ing) => richFoods.some((food) => ingredientMatchesRichFood(ing, food)));
    if (matched) score += 15 * weight;
  }
  return score;
}
