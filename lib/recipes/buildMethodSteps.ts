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

const LIQUID_PATTERN = /\b(milk|water|stock|broth|juice|cream)\b/;
const FRUIT_PATTERN = /\b(banana|strawberr|blueberr|raspberr|blackberr|apple|pear|orange|grape|mango|peach|plum|kiwi|pineapple|melon|berries)\b/;
const VEG_PATTERN =
  /\b(broccoli|spinach|kale|pepper|carrot|tomato|onion|lettuce|cucumber|beans|peas|mushroom|courgette|cabbage|leek|asparagus|aubergine|squash|sweetcorn|corn)\b/;
const TOPPING_PATTERN = /\b(almond|walnut|cashew|pecan|seed|chia|granola|nut|avocado)\b/;
const FAT_PATTERN = /\b(oil|butter(?! bean))\b/;
const CHEESE_PATTERN = /\b(cheese|feta|parmesan|cheddar|mozzarella|halloumi)\b/;
const HERB_SPICE_PATTERN =
  /\b(salt|pepper corns?|paprika|cumin|turmeric|cinnamon|oregano|thyme|rosemary|basil|coriander|parsley|chilli|chili|spice|seasoning|herbs?)\b/;

/**
 * Phrase an ingredient the way it is actually used, rather than "Prepare X and add
 * to the dish before serving" for everything. That generic line produced
 * instructions like seasoning almond milk and cooking it "until safe to eat".
 */
/** Fold plurals so "mushrooms" matches a "mushroom" pattern. */
function singular(word: string): string {
  if (word.endsWith("ies") && word.length > 4) return `${word.slice(0, -3)}y`;
  if (word.endsWith("oes") && word.length > 4) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3) return word.slice(0, -1);
  return word;
}

function describeAddStep(ing: RecipeIngredientInput): string {
  const name = ing.name
    .toLowerCase()
    .split(/\s+/)
    .map(singular)
    .join(" ");
  const label = titleCase(ing.name);
  const qty = formatQty(ing);

  if (/\bavocado\b/.test(name)) return `Slice ${qty} ${label} and lay on top.`;
  if (HERB_SPICE_PATTERN.test(name)) return `Season with ${qty} ${label}.`;
  if (FAT_PATTERN.test(name)) return `Drizzle over ${qty} ${label}.`;
  if (LIQUID_PATTERN.test(name)) return `Pour in ${qty} ${label} and stir through.`;
  if (CHEESE_PATTERN.test(name)) return `Crumble over ${qty} ${label}.`;
  if (TOPPING_PATTERN.test(name)) return `Scatter over ${qty} ${label}.`;
  if (FRUIT_PATTERN.test(name)) return `Top with ${qty} ${label}.`;
  if (VEG_PATTERN.test(name)) return `Add ${qty} ${label} and cook until tender.`;
  return `Add ${qty} ${label} to the dish.`;
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
    out.splice(insertAt, 0, describeAddStep(ing));
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

  const milk = findIngredient(ingredients, /\bmilk\b/);
  const isBowl =
    (oats || yoghurt || cottage) &&
    // Oats + a milk is porridge / overnight oats — the most common breakfast the
    // generator makes. Without this it fell through to the generic builder and
    // told users to season the almond milk and cook it "until safe to eat".
    (pb || yoghurt || cottage || chia || (oats && milk)) &&
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

  if (oats && milk) {
    steps.push(
      `Combine ${formatQty(oats)} ${titleCase(oats.name)} with ${formatQty(milk)} ${titleCase(milk.name)} in a bowl or jar.`,
    );
    steps.push(
      mealSlot === "breakfast"
        ? `Simmer gently for 4–5 minutes until creamy, stirring often (or microwave 90 seconds).`
        : `Chill for at least 2 hours, or overnight, until thick and creamy.`,
    );
  } else if (oats) {
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
    "prawn",
    // White fish and other meats were missing entirely, so a cod dinner got no
    // cooking step and the fish was appended as a generic "add to the dish".
    "cod",
    "haddock",
    "mackerel",
    "sea bass",
    "trout",
    "tilapia",
    "pork",
    "lamb",
    "duck",
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
  // No fallback to "whatever weighs most". It picked almond milk as the protein
  // of an overnight-oats snack and told the user to season it and cook it through.
  return null;
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

  const protein = mainProtein(ingredients);
  const veg = ingredients
    .filter((i) => /broccoli|spinach|pepper|carrot|tomato|onion|lettuce|cucumber|beans|peas/i.test(i.name))
    .map((i) => titleCase(i.name));

  // No "gather and weigh ingredients" opener — it is filler, not a cooking step.
  const steps: string[] = [];

  if (protein && !/peanut butter/i.test(protein)) {
    if (/egg/i.test(protein)) {
      steps.push(`Beat or fry the eggs until cooked to your liking.`);
    } else if (/yoghurt|yogurt|cottage/i.test(protein)) {
      steps.push(`Spoon the ${protein} into a bowl — no cooking needed.`);
    } else if (/cod|haddock|salmon|mackerel|sea bass|trout|tilapia|tuna/i.test(protein)) {
      steps.push(
        `Season the ${protein} and pan-fry or bake for 10–12 minutes, until it flakes easily.`,
      );
    } else if (/mince/i.test(protein)) {
      steps.push(`Brown the ${protein} in a hot pan, breaking it up, until cooked through.`);
    } else if (/tofu/i.test(protein)) {
      steps.push(`Press and cube the ${protein}, then fry until golden on all sides.`);
    } else if (/lentils|chickpeas/i.test(protein)) {
      steps.push(`Rinse the ${protein} and warm through.`);
    } else if (/shrimp|prawn/i.test(protein)) {
      steps.push(`Fry the ${protein} for 2–3 minutes a side, until pink and opaque.`);
    } else {
      // "until safe to eat" reads like a warning label, not a recipe.
      steps.push(`Season the ${protein} and cook through, turning once, until done.`);
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
