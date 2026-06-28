import type { RecipeIngredientInput } from "@/lib/nutrition/calculate";

/** Pantry items that may appear in the list without an explicit method mention. */
const PANTRY_OPTIONAL =
  /\b(salt|pepper|black pepper|herbs?|seasoning|stock cube|paprika|cumin|garlic powder|chilli flakes?)\b/i;

export type RecipeCoherenceInput = {
  name: string;
  steps: string[];
  ingredients: RecipeIngredientInput[];
};

export type RecipeCoherenceResult = {
  ok: boolean;
  orphanIngredients: string[];
  nameMismatch?: string;
};

function significantIngredients(ingredients: RecipeIngredientInput[]): RecipeIngredientInput[] {
  return ingredients.filter((i) => {
    const n = i.name.toLowerCase().trim();
    if (!n) return false;
    if (PANTRY_OPTIONAL.test(n) && i.quantity <= 5) return false;
    return true;
  });
}

/** Search terms used to decide if an ingredient appears in the method text. */
export function ingredientSearchTerms(name: string): string[] {
  const lower = name.toLowerCase().trim();
  const terms = new Set<string>([lower]);

  if (/bread|toast|bagel|muffin|crumpet/i.test(lower)) {
    terms.add("bread");
    terms.add("toast");
  }
  if (/peanut butter|almond butter|nut butter/i.test(lower)) {
    terms.add("peanut butter");
    terms.add("nut butter");
  }
  if (/yoghurt|yogurt|skyr/i.test(lower)) {
    terms.add("yoghurt");
    terms.add("yogurt");
  }
  if (/sweet potato/i.test(lower)) {
    terms.add("sweet potato");
  }

  for (const word of lower.split(/\s+/)) {
    if (word.length >= 4) terms.add(word);
  }

  return [...terms];
}

export function ingredientReferencedInSteps(ingredientName: string, stepText: string): boolean {
  const haystack = stepText.toLowerCase();
  return ingredientSearchTerms(ingredientName).some((term) => haystack.includes(term));
}

/** Significant ingredients that never appear in any method step. */
export function orphanIngredients(
  steps: string[],
  ingredients: RecipeIngredientInput[],
): RecipeIngredientInput[] {
  const stepText = steps.join(" ");
  return significantIngredients(ingredients).filter(
    (i) => !ingredientReferencedInSteps(i.name, stepText),
  );
}

export function stepsCoverAllIngredients(
  steps: string[],
  ingredients: RecipeIngredientInput[],
): boolean {
  return orphanIngredients(steps, ingredients).length === 0;
}

type NameDishRule = {
  namePattern: RegExp;
  requireInSteps: RegExp;
  requireIngredient?: RegExp;
};

const NAME_DISH_RULES: NameDishRule[] = [
  {
    namePattern: /\btoast\b/i,
    requireInSteps: /\b(toast|bread|grill)\b/i,
    requireIngredient: /bread|toast|bagel|muffin|crumpet/i,
  },
  { namePattern: /\bstir[- ]?fry\b/i, requireInSteps: /\b(stir[- ]?fry|wok|fry)\b/i },
  { namePattern: /\bsalad\b/i, requireInSteps: /\b(salad|toss|dress|mix)\b/i },
  { namePattern: /\bsoup\b/i, requireInSteps: /\b(soup|simmer|blitz|blend)\b/i },
  {
    namePattern: /\bscrambled\b/i,
    requireInSteps: /\b(scramble|scrambled|egg)\b/i,
    requireIngredient: /\begg/i,
  },
  { namePattern: /\bowl\b/i, requireInSteps: /\bbowl\b/i },
];

function checkNameMatchesMethod(input: RecipeCoherenceInput): string | undefined {
  const stepText = input.steps.join(" ");
  const ingBlob = input.ingredients.map((i) => i.name).join(" ").toLowerCase();

  for (const rule of NAME_DISH_RULES) {
    if (!rule.namePattern.test(input.name)) continue;
    if (rule.requireIngredient && !rule.requireIngredient.test(ingBlob)) {
      return `title suggests ${rule.namePattern.source} but ingredients do not match`;
    }
    if (!rule.requireInSteps.test(stepText)) {
      return `title suggests ${rule.namePattern.source} but method does not`;
    }
  }

  return undefined;
}

export function validateRecipeCoherence(input: RecipeCoherenceInput): RecipeCoherenceResult {
  const orphans = orphanIngredients(input.steps, input.ingredients);
  const nameMismatch = checkNameMatchesMethod(input);

  return {
    ok: orphans.length === 0 && !nameMismatch,
    orphanIngredients: orphans.map((i) => i.name),
    nameMismatch,
  };
}
