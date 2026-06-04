import type { RecipeIngredientInput } from "@/lib/nutrition/calculate";
import type { GoalMealSlot } from "@/lib/ai/goal-matched-recipe";
import { mealLabel } from "@/lib/ai/goal-matched-recipe";

function titleCase(name: string): string {
  return name
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function mainProtein(ingredients: RecipeIngredientInput[]): string | null {
  const proteins = [
    "chicken breast",
    "chicken",
    "salmon",
    "tuna",
    "turkey",
    "beef mince",
    "beef",
    "shrimp",
    "tofu",
    "lentils",
    "chickpeas",
    "egg",
    "eggs",
    "greek yogurt",
    "cottage cheese",
  ];
  const names = ingredients.map((i) => i.name.toLowerCase());
  for (const p of proteins) {
    if (names.some((n) => n.includes(p))) return titleCase(p);
  }
  const first = ingredients.find((i) => i.quantity >= 40 && i.unit === "g");
  return first ? titleCase(first.name) : null;
}

/** Deterministic method steps from drafted ingredients (DB path — no LLM required). */
export function buildMethodStepsFromIngredients(
  ingredients: RecipeIngredientInput[],
  mealSlot: GoalMealSlot,
): string[] {
  const slot = mealLabel(mealSlot);
  const protein = mainProtein(ingredients);
  const veg = ingredients
    .filter((i) => /broccoli|spinach|pepper|carrot|tomato|onion|lettuce|cucumber|beans|peas/i.test(i.name))
    .map((i) => titleCase(i.name));

  const steps: string[] = [
    `Gather and weigh ingredients for this ${slot.toLowerCase()} recipe.`,
  ];

  if (protein) {
    steps.push(`Prepare ${protein}: season lightly and cook through until safe to eat.`);
  }

  if (veg.length) {
    steps.push(`Cook or prepare ${veg.slice(0, 2).join(" and ")} until tender.`);
  }

  const carbs = ingredients.find((i) =>
    /rice|oats|pasta|quinoa|potato|sweet potato|bread|tortilla/i.test(i.name),
  );
  if (carbs) {
    const qty =
      carbs.unit === "g" || carbs.unit === "ml"
        ? `${carbs.quantity}${carbs.unit}`
        : `${carbs.quantity} ${carbs.unit}`;
    steps.push(`Cook ${titleCase(carbs.name)} (${qty}) according to pack instructions or until done.`);
  }

  steps.push("Combine everything on a plate or bowl, adjust seasoning, and serve warm.");
  return steps;
}

export function formatDescriptionWithMethod(intro: string, steps: string[]): string {
  const body = intro.trim();
  const method = steps.map((s, i) => `${i + 1}. ${s}`).join("\n");
  return body ? `${body}\n\nMethod\n${method}` : `Method\n${method}`;
}
