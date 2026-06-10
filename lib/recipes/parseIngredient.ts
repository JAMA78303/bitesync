import { ingredientGrams } from "@/lib/nutrition/convert";
import type { RecipeIngredientInput } from "@/lib/nutrition/calculate";

export type ParsedIngredient = {
  quantity: number | null;
  unit: string | null;
  name: string;
  grams: number | null;
  gramsSource: "explicit" | "estimated" | null;
  rawText: string;
};

const UNICODE_FRACTIONS: Record<string, number> = {
  "½": 0.5,
  "¼": 0.25,
  "¾": 0.75,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "⅛": 0.125,
};

/** Normalised unit token → canonical unit. `piece`/`pieces` intentionally excluded. */
const UNIT_ALIASES: Record<string, string> = {
  g: "g",
  gram: "g",
  grams: "g",
  kg: "kg",
  kilo: "kg",
  kilogram: "kg",
  kilograms: "kg",
  oz: "oz",
  lb: "lb",
  lbs: "lb",
  ml: "ml",
  l: "l",
  litre: "l",
  liter: "l",
  litres: "l",
  liters: "l",
  tsp: "tsp",
  teaspoon: "tsp",
  teaspoons: "tsp",
  tbsp: "tbsp",
  tablespoon: "tbsp",
  tablespoons: "tbsp",
  cup: "cup",
  cups: "cup",
  "fl oz": "fl oz",
  floz: "fl oz",
  pint: "pint",
  pints: "pint",
  clove: "clove",
  cloves: "clove",
  can: "can",
  cans: "can",
  tin: "tin",
  tins: "tin",
  handful: "handful",
  handfuls: "handful",
  pinch: "pinch",
  pinches: "pinch",
  slice: "slice",
  slices: "slice",
  sprig: "sprig",
  sprigs: "sprig",
  head: "head",
  heads: "head",
  bunch: "bunch",
  bunches: "bunch",
  stick: "stick",
  sticks: "stick",
};

const SIZE_PREFIXES = /^(small|medium|large|big|tiny)\s+/i;
const TRAILING_SERVING = /\s*,\s*(to serve|for serving|optional|plus extra.*)$/i;
const TRAILING_PREP =
  /\s*,?\s*(plus an extra drizzle|for garnish|to taste|as needed|or to taste)\.?$/i;

const SPICE_ONLY_PATTERN =
  /\b(spice|spices|paprika|cumin|coriander|oregano|basil|thyme|turmeric|nutmeg|chilli|chili|tabasco|pepper|salt)\b/i;

const COUNT_NOUN_PATTERN =
  /^(breasts?|thighs?|tortillas?|wraps?|fillets?|rashers?|drumsticks?)\b/i;

function normalizeSpaces(value: string): string {
  return value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function parseFractionToken(token: string): number {
  if (UNICODE_FRACTIONS[token] != null) return UNICODE_FRACTIONS[token]!;
  if (/^\d+\/\d+$/.test(token)) {
    const [a, b] = token.split("/");
    const den = Number(b);
    return den ? Number(a) / den : 0;
  }
  const n = Number(token);
  return Number.isFinite(n) ? n : 0;
}

function parseQuantityToken(token: string): number | null {
  const clean = token.trim();
  if (!clean) return null;

  const rangeMatch = clean.match(/^(.+?)\s*(?:[-–]|(?:\s+to\s+))\s*(.+)$/i);
  if (rangeMatch) {
    const low = parseQuantityToken(rangeMatch[1] ?? "");
    if (low != null) return low;
  }

  const parts = clean.split(/\s+/).filter(Boolean);
  if (!parts.length) return null;
  const total = parts.reduce((sum, part) => sum + parseFractionToken(part), 0);
  return Number.isFinite(total) && total > 0 ? total : null;
}

function canonicalUnit(raw: string | undefined): string | null {
  if (!raw) return null;
  const key = raw.toLowerCase().trim();
  return UNIT_ALIASES[key] ?? null;
}

/** UK recipe sites often use dual metric/imperial weights, e.g. `250g/9oz chicken mince`. */
function extractUkDualMetricWeight(text: string): { grams: number | null; remainder: string } {
  const match = text.match(
    /^(\d+(?:\.\d+)?)\s*g\s*\/\s*(?:[½¼¾⅓⅔⅛]|\d+(?:\.\d+)?(?:\s*\/\s*\d+)?)?\s*oz\.?\s*/i,
  );
  if (!match) return { grams: null, remainder: text };
  const grams = Number(match[1]);
  if (!Number.isFinite(grams) || grams <= 0) return { grams: null, remainder: text };
  return {
    grams,
    remainder: normalizeSpaces(text.slice(match[0].length)),
  };
}

function extractExplicitWeight(text: string): { grams: number | null; remainder: string } {
  let working = text;
  let grams: number | null = null;

  const dual = extractUkDualMetricWeight(working);
  if (dual.grams != null) {
    return dual;
  }

  const patterns: RegExp[] = [
    /\((?:about|approx\.?|approximately|around|~)?\s*(\d+(?:\.\d+)?)\s*(kg|g)\s*\)/gi,
    /\b(?:about|approx\.?|approximately|around|~)\s*(\d+(?:\.\d+)?)\s*(kg|g)\b/gi,
    /\b(\d+(?:\.\d+)?)\s*(kg|g)\b/gi,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(working);
    if (!match) continue;
    const amount = Number(match[1]);
    const unit = match[2]?.toLowerCase();
    if (!Number.isFinite(amount) || amount <= 0) continue;
    grams = unit === "kg" ? amount * 1000 : amount;
    working = `${working.slice(0, match.index)} ${working.slice(match.index + match[0].length)}`;
    break;
  }

  return { grams, remainder: normalizeSpaces(working) };
}

function parseLeadingQuantity(text: string): { quantity: number | null; remainder: string } {
  const match = text.match(
    /^((?:[½¼¾⅓⅔⅛]|\d+(?:\.\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+)(?:\s*(?:[-–]|(?:\s+to\s+))(?:[½¼¾⅓⅔⅛]|\d+(?:\.\d+)?|\d+\/\d+))?)\s+/i,
  );
  if (!match) return { quantity: null, remainder: text };
  const quantity = parseQuantityToken(match[1] ?? "");
  const remainder = text.slice(match[0].length).trim();
  return { quantity, remainder };
}

function extractUnit(text: string): { unit: string | null; remainder: string } {
  const leading = text.match(/^([a-zA-Z]+(?:\s+[a-zA-Z]+)?)\b/);
  if (leading?.[1]) {
    const candidate = leading[1].toLowerCase();
    if (candidate === "fl oz") {
      return { unit: "fl oz", remainder: text.slice(5).trim() };
    }
    const firstWord = candidate.split(/\s+/)[0] ?? candidate;
    const unit = canonicalUnit(firstWord);
    if (unit) {
      return { unit, remainder: text.slice(firstWord.length).trim() };
    }
  }

  for (const token of Object.keys(UNIT_ALIASES).sort((a, b) => b.length - a.length)) {
    const re = new RegExp(`\\b${token.replace(/\s+/g, "\\s+")}\\b`, "i");
    const match = re.exec(text);
    if (!match) continue;
    const unit = UNIT_ALIASES[token.toLowerCase()]!;
    const remainder = normalizeSpaces(`${text.slice(0, match.index)} ${text.slice(match.index + match[0].length)}`);
    return { unit, remainder };
  }

  return { unit: null, remainder: text };
}

function cleanIngredientName(name: string): string {
  let cleaned = normalizeSpaces(name)
    .replace(TRAILING_SERVING, "")
    .replace(TRAILING_PREP, "")
    .replace(/\([^)]*\)/g, " ")
    .replace(SIZE_PREFIXES, "")
    .replace(/^[/\s]+/, "")
    .replace(/^\d+(?:\.\d+)?\s*oz\.?\s+/i, "")
    .replace(/,\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  cleaned = cleaned
    .replace(/\b(chopped|sliced|diced|grated|minced|crushed|peeled|finely|roughly|thinly|juiced)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned.toLowerCase();
}

function estimateGrams(quantity: number | null, unit: string | null, name: string): number | null {
  if (quantity == null || quantity <= 0) return null;
  const grams = ingredientGrams(quantity, unit ?? "", null, name);
  return grams != null && grams > 0 ? Math.round(grams * 10) / 10 : null;
}

function parseDescriptiveAmount(rawText: string): ParsedIngredient | null {
  const lower = rawText.toLowerCase();

  if (/\bto taste\b/i.test(rawText)) {
    return {
      quantity: 1,
      unit: "pinch",
      name: cleanIngredientName(rawText),
      grams: 1,
      gramsSource: "estimated",
      rawText,
    };
  }

  if (/\bdrizzle\b/i.test(rawText)) {
    const name = cleanIngredientName(rawText.replace(/^drizzle\s+(?:of\s+)?/i, ""));
    return {
      quantity: 0.5,
      unit: "tbsp",
      name: name || "olive oil",
      grams: 7,
      gramsSource: "estimated",
      rawText,
    };
  }

  if (/\b(optional|plus extra to serve)\b/i.test(lower) && !/\d/.test(rawText)) {
    return null;
  }

  return null;
}

/** Parse a single ingredient line into a structured, nutrition-ready shape. */
export function parseIngredientLine(raw: string): ParsedIngredient {
  const rawText = normalizeSpaces(raw.replace(/^[•\-*]\s*/, ""));

  const descriptive = parseDescriptiveAmount(rawText);
  if (descriptive) return descriptive;

  let working = rawText;

  const { grams: explicitGrams, remainder: afterWeight } = extractExplicitWeight(working);
  working = afterWeight;

  const { quantity, remainder: afterQty } = parseLeadingQuantity(working);
  working = afterQty;

  let unit: string | null = null;
  let remainderAfterUnit = working;
  const countNoun = working.match(COUNT_NOUN_PATTERN);
  if (countNoun?.[1]) {
    const noun = countNoun[1].toLowerCase();
    unit =
      noun === "breasts" || noun === "breast"
        ? "breast"
        : noun === "thighs" || noun === "thigh"
          ? "thigh"
          : noun === "tortillas" || noun === "tortilla"
            ? "tortilla"
            : noun === "wraps" || noun === "wrap"
              ? "wrap"
              : noun === "fillets" || noun === "fillet"
                ? "fillet"
                : noun === "rashers" || noun === "rasher"
                  ? "rasher"
                  : noun === "drumsticks" || noun === "drumstick"
                    ? "drumstick"
                    : null;
    if (unit) {
      remainderAfterUnit = working.slice(countNoun[0].length).trim();
    }
  }

  if (!unit) {
    const extracted = extractUnit(working);
    unit = extracted.unit;
    remainderAfterUnit = extracted.remainder;
  }
  working = remainderAfterUnit;

  let name = cleanIngredientName(working);
  name = name.replace(/^(?:pieces?)\s+/i, "").trim();
  if (!name && countNoun?.[1]) {
    name = cleanIngredientName(countNoun[1]);
  }
  if (!name) name = cleanIngredientName(rawText.replace(/^(?:pieces?)\s+/i, ""));

  let quantityResolved = quantity;
  if (quantityResolved == null && unit != null) {
    quantityResolved = 1;
  }
  if (quantityResolved == null && SPICE_ONLY_PATTERN.test(name) && !/\bto taste\b/i.test(rawText)) {
    quantityResolved = 1;
    if (!unit) unit = "tsp";
  }
  if (quantityResolved == null && /\b(salad|to serve)\b/i.test(rawText)) {
    quantityResolved = 1;
    if (!unit) unit = "handful";
  }

  let grams: number | null = explicitGrams;
  let gramsSource: ParsedIngredient["gramsSource"] = explicitGrams != null ? "explicit" : null;

  if (grams == null) {
    const estimated = estimateGrams(quantityResolved, unit, name);
    if (estimated != null) {
      grams = estimated;
      gramsSource = "estimated";
    }
  }

  if (grams != null && gramsSource === "explicit") {
    quantityResolved = null;
    unit = null;
  }

  return {
    quantity: quantityResolved,
    unit,
    name,
    grams,
    gramsSource,
    rawText,
  };
}

/** Convert parsed import line to stored recipe ingredient (never defaults to `piece`). */
export function parsedIngredientToInput(parsed: ParsedIngredient): RecipeIngredientInput {
  if (parsed.grams != null && parsed.gramsSource === "explicit") {
    return {
      name: parsed.name,
      quantity: parsed.grams,
      unit: "g",
    };
  }

  return {
    name: parsed.name,
    quantity: parsed.quantity != null && parsed.quantity > 0 ? parsed.quantity : 1,
    unit: parsed.unit ?? "",
  };
}

/** Scale parsed ingredients for servings adjustment. */
export function scaleParsedIngredients(
  ingredients: ParsedIngredient[],
  scale: number,
): ParsedIngredient[] {
  if (scale === 1) return ingredients;
  return ingredients.map((ing) => ({
    ...ing,
    quantity:
      ing.quantity != null && ing.quantity > 0
        ? Math.round(ing.quantity * scale * 100) / 100
        : ing.quantity,
    grams:
      ing.grams != null && ing.gramsSource === "explicit"
        ? Math.round(ing.grams * scale * 10) / 10
        : ing.gramsSource === "estimated" && ing.grams != null
          ? Math.round(ing.grams * scale * 10) / 10
          : ing.grams,
  }));
}

export function parsedIngredientsToInputs(ingredients: ParsedIngredient[]): RecipeIngredientInput[] {
  return ingredients
    .filter((ing) => ing.name.trim().length > 0)
    .map(parsedIngredientToInput);
}
