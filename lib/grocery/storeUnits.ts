import { PIECE_WEIGHT_MAP, type PieceWeightEntry } from "@/lib/nutrition/pieceWeights";
import { normalizeUnitLabel } from "@/lib/utils/merge";

export interface StoreUnit {
  unit: string;
  size: number;
  baseUnit: "g" | "ml" | "each";
}

/** Map from normalised ingredient phrase → typical retail pack. Keys lowercase. */
export const STORE_UNIT_MAP: Record<string, StoreUnit> = {
  oats: { unit: "bag", size: 1000, baseUnit: "g" },
  "porridge oats": { unit: "bag", size: 1000, baseUnit: "g" },
  "rolled oats": { unit: "bag", size: 1000, baseUnit: "g" },
  rice: { unit: "bag", size: 1000, baseUnit: "g" },
  "basmati rice": { unit: "bag", size: 1000, baseUnit: "g" },
  "white rice": { unit: "bag", size: 1000, baseUnit: "g" },
  pasta: { unit: "bag", size: 500, baseUnit: "g" },
  spaghetti: { unit: "bag", size: 500, baseUnit: "g" },
  penne: { unit: "bag", size: 500, baseUnit: "g" },
  flour: { unit: "bag", size: 1500, baseUnit: "g" },
  "plain flour": { unit: "bag", size: 1500, baseUnit: "g" },
  "self raising flour": { unit: "bag", size: 1500, baseUnit: "g" },
  sugar: { unit: "bag", size: 1000, baseUnit: "g" },
  "brown sugar": { unit: "bag", size: 500, baseUnit: "g" },
  lentils: { unit: "bag", size: 500, baseUnit: "g" },
  "red lentils": { unit: "bag", size: 500, baseUnit: "g" },
  quinoa: { unit: "bag", size: 500, baseUnit: "g" },
  breadcrumbs: { unit: "box", size: 400, baseUnit: "g" },

  blueberries: { unit: "punnet", size: 150, baseUnit: "g" },
  strawberries: { unit: "punnet", size: 400, baseUnit: "g" },

  "olive oil": { unit: "bottle", size: 500, baseUnit: "ml" },
  "extra virgin olive oil": { unit: "bottle", size: 500, baseUnit: "ml" },
  "vegetable oil": { unit: "bottle", size: 1000, baseUnit: "ml" },
  "sunflower oil": { unit: "bottle", size: 1000, baseUnit: "ml" },
  "coconut oil": { unit: "jar", size: 300, baseUnit: "ml" },
  "sesame oil": { unit: "bottle", size: 150, baseUnit: "ml" },
  "soy sauce": { unit: "bottle", size: 150, baseUnit: "ml" },
  "worcestershire sauce": { unit: "bottle", size: 150, baseUnit: "ml" },
  "hot sauce": { unit: "bottle", size: 150, baseUnit: "ml" },
  "fish sauce": { unit: "bottle", size: 200, baseUnit: "ml" },
  "balsamic vinegar": { unit: "bottle", size: 250, baseUnit: "ml" },
  "white wine vinegar": { unit: "bottle", size: 350, baseUnit: "ml" },
  "apple cider vinegar": { unit: "bottle", size: 350, baseUnit: "ml" },
  honey: { unit: "jar", size: 340, baseUnit: "g" },
  "maple syrup": { unit: "bottle", size: 250, baseUnit: "ml" },

  "chopped tomatoes": { unit: "tin", size: 400, baseUnit: "g" },
  "tinned tomatoes": { unit: "tin", size: 400, baseUnit: "g" },
  "tomato puree": { unit: "tube", size: 200, baseUnit: "g" },
  "tomato paste": { unit: "tin", size: 140, baseUnit: "g" },
  "coconut milk": { unit: "tin", size: 400, baseUnit: "ml" },
  chickpeas: { unit: "tin", size: 400, baseUnit: "g" },
  "kidney beans": { unit: "tin", size: 400, baseUnit: "g" },
  "black beans": { unit: "tin", size: 400, baseUnit: "g" },
  "baked beans": { unit: "tin", size: 400, baseUnit: "g" },
  "cannellini beans": { unit: "tin", size: 400, baseUnit: "g" },
  "lentil soup": { unit: "tin", size: 400, baseUnit: "g" },
  tuna: { unit: "tin", size: 145, baseUnit: "g" },
  sardines: { unit: "tin", size: 120, baseUnit: "g" },
  "peanut butter": { unit: "jar", size: 340, baseUnit: "g" },
  "almond butter": { unit: "jar", size: 340, baseUnit: "g" },

  milk: { unit: "bottle", size: 1000, baseUnit: "ml" },
  "semi skimmed milk": { unit: "bottle", size: 1000, baseUnit: "ml" },
  "whole milk": { unit: "bottle", size: 1000, baseUnit: "ml" },
  "oat milk": { unit: "carton", size: 1000, baseUnit: "ml" },
  "almond milk": { unit: "carton", size: 1000, baseUnit: "ml" },
  "greek yogurt": { unit: "tub", size: 500, baseUnit: "g" },
  "greek yoghurt": { unit: "tub", size: 500, baseUnit: "g" },
  yogurt: { unit: "tub", size: 500, baseUnit: "g" },
  yoghurt: { unit: "tub", size: 500, baseUnit: "g" },
  butter: { unit: "pack", size: 250, baseUnit: "g" },
  "cream cheese": { unit: "tub", size: 200, baseUnit: "g" },
  cheddar: { unit: "block", size: 400, baseUnit: "g" },
  "cheddar cheese": { unit: "block", size: 400, baseUnit: "g" },
  mozzarella: { unit: "ball", size: 125, baseUnit: "g" },
  feta: { unit: "block", size: 200, baseUnit: "g" },
  "feta cheese": { unit: "block", size: 200, baseUnit: "g" },
  parmesan: { unit: "block", size: 100, baseUnit: "g" },
  "double cream": { unit: "pot", size: 300, baseUnit: "ml" },
  "single cream": { unit: "pot", size: 300, baseUnit: "ml" },
  "creme fraiche": { unit: "tub", size: 300, baseUnit: "g" },
  "sour cream": { unit: "tub", size: 300, baseUnit: "g" },
  "cottage cheese": { unit: "tub", size: 300, baseUnit: "g" },

  salt: { unit: "box", size: 750, baseUnit: "g" },
  "black pepper": { unit: "jar", size: 40, baseUnit: "g" },
  cumin: { unit: "jar", size: 38, baseUnit: "g" },
  paprika: { unit: "jar", size: 45, baseUnit: "g" },
  "smoked paprika": { unit: "jar", size: 45, baseUnit: "g" },
  turmeric: { unit: "jar", size: 38, baseUnit: "g" },
  // Not plain "coriander": in recipes that's usually the fresh herb.
  "ground coriander": { unit: "jar", size: 28, baseUnit: "g" },
  "chilli flakes": { unit: "jar", size: 25, baseUnit: "g" },
  "chilli powder": { unit: "jar", size: 38, baseUnit: "g" },
  "garlic powder": { unit: "jar", size: 60, baseUnit: "g" },
  "onion powder": { unit: "jar", size: 60, baseUnit: "g" },
  cinnamon: { unit: "jar", size: 38, baseUnit: "g" },
  oregano: { unit: "jar", size: 10, baseUnit: "g" },
  "dried basil": { unit: "jar", size: 10, baseUnit: "g" },
  "dried thyme": { unit: "jar", size: 10, baseUnit: "g" },
  "mixed herbs": { unit: "jar", size: 20, baseUnit: "g" },
  "curry powder": { unit: "jar", size: 38, baseUnit: "g" },
  "garam masala": { unit: "jar", size: 38, baseUnit: "g" },

  bread: { unit: "loaf", size: 800, baseUnit: "g" },
  "white bread": { unit: "loaf", size: 800, baseUnit: "g" },
  "wholemeal bread": { unit: "loaf", size: 800, baseUnit: "g" },
  "pitta bread": { unit: "pack", size: 6, baseUnit: "each" },
  "tortilla wraps": { unit: "pack", size: 8, baseUnit: "each" },
  wraps: { unit: "pack", size: 8, baseUnit: "each" },
  wrap: { unit: "pack", size: 8, baseUnit: "each" },

  "chicken stock": { unit: "carton", size: 500, baseUnit: "ml" },
  "vegetable stock": { unit: "carton", size: 500, baseUnit: "ml" },
  "beef stock": { unit: "carton", size: 500, baseUnit: "ml" },
  "stock cube": { unit: "box", size: 12, baseUnit: "each" },

  almonds: { unit: "bag", size: 200, baseUnit: "g" },
  cashews: { unit: "bag", size: 200, baseUnit: "g" },
  walnuts: { unit: "bag", size: 200, baseUnit: "g" },
  "pine nuts": { unit: "bag", size: 100, baseUnit: "g" },
  "chia seeds": { unit: "bag", size: 300, baseUnit: "g" },
  flaxseed: { unit: "bag", size: 300, baseUnit: "g" },
  "pumpkin seeds": { unit: "bag", size: 200, baseUnit: "g" },
  "sunflower seeds": { unit: "bag", size: 200, baseUnit: "g" },
  "sesame seeds": { unit: "bag", size: 100, baseUnit: "g" },
  "desiccated coconut": { unit: "bag", size: 200, baseUnit: "g" },
};

/** Longest first, so "chopped tomatoes" is tried before "tomato" and "black pepper" before "pepper". */
const STORE_KEYS = Object.keys(STORE_UNIT_MAP).sort((a, b) => b.length - a.length);
const PIECE_KEYS = Object.keys(PIECE_WEIGHT_MAP).sort((a, b) => b.length - a.length);

/**
 * Packs vary by a few per cent and recipes round, so 410 g of chopped
 * tomatoes is still one 400 g tin rather than two.
 */
const PACK_SLACK = 0.05;

const GRAMS_PER_UNIT = new Map([["g", 1], ["kg", 1000], ["oz", 28.35], ["lb", 453.59]]);
const ML_PER_UNIT = new Map([["ml", 1], ["l", 1000], ["cl", 10], ["tsp", 5], ["tbsp", 15], ["cup", 240], ["fl oz", 29.57]]);

function formatQty(qty: number): string {
  return qty % 1 === 0 ? String(qty) : qty.toFixed(1);
}

/** "tomato" → "tomatoes", "peach" → "peaches", "garlic bulb" → "garlic bulbs". */
function pluralLabel(label: string, count: number): string {
  if (count === 1 || label.endsWith("s")) return label;
  if (label === "loaf") return "loaves";
  if (/(?:tomato|potato|ch|sh|x)$/.test(label)) return `${label}es`;
  return `${label}s`;
}

/** The food a line names, for matching: before any comma or bracket, lower case, single spaces. */
function foodName(raw: string): string {
  return raw.toLowerCase().split(/[,(]/)[0]!.replace(/\s+/g, " ").trim();
}

/**
 * Whether a table key is the food this name is, rather than a word inside the
 * name of another food: the whole name or its last words, allowing a plural.
 * "brown rice" is rice and "red onions" is red onion, but "rice noodles",
 * "flour tortillas", "egg noodles" and "chicken" (not chicken stock) aren't.
 */
function isFood(name: string, key: string): boolean {
  return [key, `${key}s`, `${key}es`].some((k) => name === k || name.endsWith(` ${k}`));
}

function bestKey(name: string, keys: string[]): string | null {
  if (!name) return null;
  return keys.find((key) => isFood(name, key)) ?? null;
}

/** Typical retail pack for an ingredient, or null when the name isn't a packed food we know. */
export function getStoreUnit(ingredientName: string): StoreUnit | null {
  const key = bestKey(foodName(ingredientName), STORE_KEYS);
  return key ? STORE_UNIT_MAP[key]! : null;
}

const SKIP_STORE_BRACKETS = ["bread", "loaf", "stock cube", "pitta", "wrap", "tortilla"];

function shouldSkipStoreBrackets(normalised: string): boolean {
  return SKIP_STORE_BRACKETS.some((s) => normalised.includes(s));
}

/** The amount in the pack's own measure (grams, millilitres or items), or null if it's measured another way. */
function amountInPackMeasure(pack: StoreUnit, quantity: number, unit: string): number | null {
  const perUnit = pack.baseUnit === "g" ? GRAMS_PER_UNIT.get(unit) : pack.baseUnit === "ml" ? ML_PER_UNIT.get(unit) : null;
  if (perUnit != null) return quantity * perUnit;
  return pack.baseUnit === "each" && unit === "piece" ? quantity : null;
}

/**
 * Spoonfuls of a spice sold by weight, or grams of a liquid sold by volume:
 * without the food's density we can't count packs, but a small amount plainly
 * fits in one. Taken at water's density, as the nutrition code does for foods
 * it has no cup weight for.
 */
function fitsInOnePack(pack: StoreUnit, quantity: number, unit: string): boolean {
  const perUnit = pack.baseUnit === "g" ? ML_PER_UNIT.get(unit) : pack.baseUnit === "ml" ? GRAMS_PER_UNIT.get(unit) : null;
  return perUnit != null && quantity * perUnit <= pack.size * (1 + PACK_SLACK);
}

/** "2 tins chopped tomatoes (800 g needed)", or null when the packs can't be counted. */
function packLine(pack: StoreUnit, name: string, quantity: number, unit: string): string | null {
  const inPacks =
    unit === pack.unit ||
    unit === pluralLabel(pack.unit, 2) ||
    (pack.unit === "tin" && (unit === "can" || unit === "cans")) ||
    // "2 milk" added by hand means two of whatever milk comes in.
    (unit === "piece" && pack.baseUnit !== "each");
  let count: number;
  if (inPacks) {
    count = Math.max(1, Math.ceil(quantity - 1e-9));
  } else {
    const amount = amountInPackMeasure(pack, quantity, unit);
    if (amount != null) count = Math.max(1, Math.ceil(amount / pack.size - PACK_SLACK));
    else if (fitsInOnePack(pack, quantity, unit)) count = 1;
    else return null;
  }
  const line = `${count} ${pluralLabel(pack.unit, count)} ${name}`;
  if (inPacks || shouldSkipStoreBrackets(name.toLowerCase())) return line;
  return `${line} (${formatQty(quantity)} ${unit} needed)`;
}

/** "3 red onions" from grams or a count; null for spoonfuls, cups and the like. */
function pieceLine(piece: PieceWeightEntry, quantity: number, unit: string): string | null {
  let count: number;
  const grams = GRAMS_PER_UNIT.get(unit);
  if (grams != null) {
    count = Math.max(1, Math.ceil((quantity * grams) / piece.grams));
  } else if (unit === "piece" || piece.label === unit || piece.label.endsWith(` ${unit}`)) {
    // "2 bulb" of garlic is 2 garlic bulbs.
    count = Number.isInteger(quantity) ? quantity : Number(quantity.toFixed(2));
  } else {
    return null;
  }
  return `${formatQty(count)} ${pluralLabel(piece.label, count)}`;
}

/**
 * Grocery list display: a count for foods bought whole ("3 red onions"), the
 * number of packs for packed foods ("2 tins chopped tomatoes (800 g needed)"),
 * otherwise the amount ("300 g chicken breast"). Display only; stored
 * quantities don't change.
 */
export function formatGroceryItem(
  name: string,
  quantity: number | undefined,
  unit: string | undefined,
): string {
  const trimmedName = name.trim();
  if (quantity == null || !Number.isFinite(quantity)) return trimmedName;
  const u = normalizeUnitLabel(unit ?? "");

  // The more specific name wins: "chopped tomatoes" is a tin, not tomatoes,
  // and "black pepper" a jar, not a pepper.
  const food = foodName(trimmedName);
  const storeKey = bestKey(food, STORE_KEYS);
  const pieceKey = bestKey(food, PIECE_KEYS);
  const line =
    pieceKey && (!storeKey || pieceKey.length > storeKey.length)
      ? pieceLine(PIECE_WEIGHT_MAP[pieceKey]!, quantity, u)
      : storeKey
        ? packLine(STORE_UNIT_MAP[storeKey]!, trimmedName, quantity, u)
        : null;
  if (line) return line;

  return u === "piece" ? `${formatQty(quantity)} ${trimmedName}` : `${formatQty(quantity)} ${u} ${trimmedName}`;
}
