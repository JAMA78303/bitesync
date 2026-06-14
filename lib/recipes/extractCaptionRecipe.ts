import { parseIngredientLine, type ParsedIngredient } from "@/lib/recipes/parseIngredient";

const INGREDIENT_HEADER = /^(ingredients?|what you(?:'ll| will) need|you will need)\s*:?\s*$/i;
const METHOD_HEADER = /^(method|instructions?|directions?|steps?)\s*:?\s*$/i;
const INGREDIENT_LINE =
  /^[-•*]?\s*(?:\d+(?:\.\d+)?(?:\s*[-–]\s*\d+(?:\.\d+)?)?|[½¼¾⅓⅔⅛]|\d+\/\d+)\s+.+/i;

function normaliseLines(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function extractIngredientsFromCaption(text: string): ParsedIngredient[] {
  const lines = normaliseLines(text);
  const ingredients: ParsedIngredient[] = [];
  let inIngredients = false;

  for (const line of lines) {
    if (INGREDIENT_HEADER.test(line)) {
      inIngredients = true;
      continue;
    }
    if (METHOD_HEADER.test(line)) {
      inIngredients = false;
      continue;
    }

    const looksLikeIngredient =
      INGREDIENT_LINE.test(line) ||
      /^[-•*]\s*[a-z]/i.test(line) ||
      (inIngredients && line.length > 2 && line.length < 160);

    if (looksLikeIngredient && !METHOD_HEADER.test(line)) {
      const parsed = parseIngredientLine(line.replace(/^[-•*]\s*/, ""));
      if (parsed && parsed.name.length > 1) ingredients.push(parsed);
      continue;
    }

    if (!inIngredients && INGREDIENT_LINE.test(line)) {
      const parsed = parseIngredientLine(line.replace(/^[-•*]\s*/, ""));
      if (parsed && parsed.name.length > 1) ingredients.push(parsed);
    }
  }

  const deduped = new Map<string, ParsedIngredient>();
  for (const ing of ingredients) {
    deduped.set(ing.rawText.toLowerCase(), ing);
  }
  return [...deduped.values()];
}

export function extractStepsFromCaption(text: string): string[] {
  const lines = normaliseLines(text);
  const steps: string[] = [];
  let inMethod = false;

  for (const line of lines) {
    if (METHOD_HEADER.test(line)) {
      inMethod = true;
      continue;
    }
    if (INGREDIENT_HEADER.test(line)) {
      inMethod = false;
      continue;
    }

    const numbered = line.match(/^\d+[\.)]\s*(.+)$/);
    if (numbered?.[1]) {
      steps.push(numbered[1].trim());
      inMethod = true;
      continue;
    }

    if (inMethod && line.length > 4) {
      steps.push(line);
    }
  }

  return steps;
}
