import type { RecipeIngredientInput } from "@/lib/nutrition/calculate";
import type { GoalMealSlot } from "@/lib/ai/goal-matched-recipe";
import { mealLabel } from "@/lib/ai/goal-matched-recipe";
import { orphanIngredients } from "@/lib/recipes/recipeCoherence";

function titleCase(name: string): string {
  return name
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function ingredientNames(ingredients: RecipeIngredientInput[]): string[] {
  return ingredients.map((i) => i.name.toLowerCase());
}

function hasIngredient(ingredients: RecipeIngredientInput[], pattern: RegExp): boolean {
  return ingredientNames(ingredients).some((n) => pattern.test(n));
}

function findIngredient(ingredients: RecipeIngredientInput[], pattern: RegExp): RecipeIngredientInput | undefined {
  return ingredients.find((i) => pattern.test(i.name.toLowerCase()));
}

function formatQty(ing: RecipeIngredientInput): string {
  return ing.unit === "g" || ing.unit === "ml"
    ? `${ing.quantity}${ing.unit}`
    : `${ing.quantity} ${ing.unit}`;
}

/** Bread + toppings — must toast the bread, not a fruit bowl. */
function buildToastSteps(ingredients: RecipeIngredientInput[]): string[] | null {
  const bread = findIngredient(ingredients, /bread|toast|bagel|muffin|crumpet/);
  if (!bread) return null;

  const pb = findIngredient(ingredients, /peanut butter|almond butter|nut butter/);
  const eggs = findIngredient(ingredients, /\begg/);
  const fruit =
    findIngredient(ingredients, /banana/) ??
    ingredients.find((i) => /strawberr|blueberr|raspberr|apple|pear|grape/i.test(i.name));

  const steps: string[] = [
    `Toast the ${titleCase(bread.name)} (${formatQty(bread)}) until golden and crisp.`,
  ];

  if (eggs) {
    steps.push(`Scramble or fry the ${titleCase(eggs.name)} in a non-stick pan until set.`);
  }
  if (pb) {
    steps.push(`Spread ${formatQty(pb)} ${titleCase(pb.name)} evenly over the toast.`);
  }
  if (fruit) {
    steps.push(`Top with sliced ${titleCase(fruit.name)} and serve immediately.`);
  } else if (eggs) {
    steps.push(`Pile the eggs on the toast, season lightly, and serve.`);
  } else {
    steps.push(`Serve the toast straight away while warm.`);
  }

  return steps.length >= 2 ? steps : null;
}

function appendStepsForOrphanIngredients(
  steps: string[],
  ingredients: RecipeIngredientInput[],
): string[] {
  const orphans = orphanIngredients(steps, ingredients);
  if (!orphans.length) return steps;

  const out = [...steps];
  const insertAt = Math.max(out.length - 1, 0);
  for (const ing of orphans) {
    out.splice(
      insertAt,
      0,
      `Prepare ${formatQty(ing)} ${titleCase(ing.name)} and add to the dish before serving.`,
    );
  }
  return out;
}

/** Oats / yoghurt / nut-butter bowls — no frying eggs or chicken. */
function buildNoCookBowlSteps(ingredients: RecipeIngredientInput[], mealSlot: GoalMealSlot): string[] | null {
  const oats = findIngredient(ingredients, /\boats?\b/);
  const pb = findIngredient(ingredients, /peanut butter/);
  const banana = findIngredient(ingredients, /banana/);
  const yoghurt = findIngredient(ingredients, /yoghurt|yogurt|skyr/);
  const cottage = findIngredient(ingredients, /cottage cheese/);
  const chia = findIngredient(ingredients, /chia/);

  const isBowl =
    (oats || yoghurt || cottage) &&
    (pb || yoghurt || cottage || chia) &&
    !hasIngredient(ingredients, /\begg|chicken|salmon|tuna|beef|turkey|shrimp\b/);

  const isFruitNutSnack =
    pb &&
    (banana || ingredients.some((i) => /strawberr|blueberr|raspberr|apple|pear|grape/i.test(i.name))) &&
    !hasIngredient(ingredients, /\begg|chicken|salmon|tuna|beef|turkey|shrimp\b/) &&
    !hasIngredient(ingredients, /bread|toast|bagel|muffin|crumpet/);

  if (isFruitNutSnack) {
    const fruit = banana ?? ingredients.find((i) => /strawberr|blueberr|raspberr|apple|pear|grape/i.test(i.name));
    const steps: string[] = [];
    if (fruit) {
      steps.push(`Slice the ${titleCase(fruit.name)} and arrange on a plate or in a bowl.`);
    }
    steps.push(`Spread or drizzle ${formatQty(pb!)} ${titleCase(pb!.name)} over the fruit and serve.`);
    return steps.length >= 2 ? steps : null;
  }

  if (!isBowl) return null;

  const steps: string[] = [];

  if (oats) {
    steps.push(
      `Stir ${formatQty(oats)} ${titleCase(oats.name)} with a splash of water or milk until creamy (microwave 90 seconds or soak 5 minutes).`,
    );
  }

  if (pb && banana) {
    steps.push(`Slice the ${titleCase(banana.name)} and stir ${formatQty(pb)} ${titleCase(pb.name)} through the oats.`);
  } else if (pb) {
    steps.push(`Stir ${formatQty(pb)} ${titleCase(pb.name)} through until evenly mixed.`);
  } else if (banana && yoghurt) {
    steps.push(`Slice the ${titleCase(banana.name)} and fold through ${formatQty(yoghurt!)} ${titleCase(yoghurt!.name)}.`);
  } else if (yoghurt || cottage) {
    const dairy = yoghurt ?? cottage!;
    steps.push(`Spoon ${formatQty(dairy)} ${titleCase(dairy.name)} into a bowl.`);
  }

  if (chia) {
    steps.push(`Sprinkle over ${formatQty(chia)} ${titleCase(chia.name)} and stir once more.`);
  }

  const berries = ingredients.filter((i) => /strawberr|blueberr|raspberr/i.test(i.name));
  if (berries.length) {
    steps.push(`Top with ${berries.map((b) => titleCase(b.name)).join(" and ")} and serve.`);
  } else {
    steps.push(`Serve straight away as a ${mealLabel(mealSlot).toLowerCase()}.`);
  }

  return steps.length >= 2 ? steps : null;
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
    "peanut butter",
  ];
  const names = ingredientNames(ingredients);
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
  const toastSteps = buildToastSteps(ingredients);
  if (toastSteps) {
    return appendStepsForOrphanIngredients(toastSteps, ingredients);
  }

  const bowlSteps = buildNoCookBowlSteps(ingredients, mealSlot);
  if (bowlSteps) {
    return appendStepsForOrphanIngredients(bowlSteps, ingredients);
  }

  const slot = mealLabel(mealSlot);
  const protein = mainProtein(ingredients);
  const veg = ingredients
    .filter((i) => /broccoli|spinach|pepper|carrot|tomato|onion|lettuce|cucumber|beans|peas/i.test(i.name))
    .map((i) => titleCase(i.name));

  const steps: string[] = [
    `Gather and weigh ingredients for this ${slot.toLowerCase()} recipe.`,
  ];

  if (protein && !/peanut butter/i.test(protein)) {
    if (/egg/i.test(protein)) {
      steps.push(`Beat or fry the eggs until cooked to your liking.`);
    } else if (/yoghurt|yogurt|cottage/i.test(protein)) {
      steps.push(`Spoon the ${protein} into a bowl — no cooking needed.`);
    } else {
      steps.push(`Prepare ${protein}: season lightly and cook through until safe to eat.`);
    }
  }

  if (veg.length) {
    steps.push(`Cook or prepare ${veg.slice(0, 2).join(" and ")} until tender.`);
  }

  const carbs = ingredients.find((i) =>
    /rice|oats|pasta|quinoa|potato|sweet potato|bread|tortilla/i.test(i.name),
  );
  if (carbs) {
    steps.push(
      `Cook ${titleCase(carbs.name)} (${formatQty(carbs)}) according to pack instructions or until done.`,
    );
  }

  if (hasIngredient(ingredients, /peanut butter/) && !steps.some((s) => /peanut butter/i.test(s))) {
    const pb = findIngredient(ingredients, /peanut butter/)!;
    steps.push(`Stir ${formatQty(pb)} ${titleCase(pb.name)} through before serving.`);
  }

  steps.push("Combine everything on a plate or bowl, adjust seasoning, and serve.");
  return appendStepsForOrphanIngredients(steps, ingredients);
}

export function formatDescriptionWithMethod(intro: string, steps: string[]): string {
  const body = intro.trim();
  const method = steps.map((s, i) => `${i + 1}. ${s}`).join("\n");
  return body ? `${body}\n\nMethod\n${method}` : `Method\n${method}`;
}
