import type { NutritionLookupEntry } from "@/types";
import { ALLOWED_UNITS } from "@/types";
import { lookupNutrition } from "@/lib/nutrition/lookup";
import { matchPieceWeight } from "@/lib/nutrition/pieceWeights";

/** Average grams per countable whole-food unit (UK-style portions). Keys are lowercase. */
export const PIECE_WEIGHTS_G: Record<string, number> = {
  banana: 120,
  apple: 150,
  orange: 130,
  pear: 170,
  peach: 150,
  kiwi: 76,
  mango: 200,
  avocado: 150,
  lemon: 58,
  lime: 44,
  fig: 50,
  plum: 78,
  apricot: 35,

  onion: 150,
  "small onion": 110,
  "red onion": 150,
  mushroom: 20,
  mushrooms: 20,
  "garlic clove": 5,
  garlic: 5,
  egg: 60,
  eggs: 60,
  pepper: 160,
  "red pepper": 160,
  "green pepper": 160,
  "yellow pepper": 160,
  courgette: 196,
  cucumber: 300,
  tomato: 123,
  carrot: 100,
  potato: 175,
  "sweet potato": 180,
  beetroot: 100,
  leek: 150,

  "bread slice": 40,
  "tortilla wrap": 64,
  tortilla: 40,
  tortillas: 40,
  wrap: 64,
  wraps: 64,
  "chicken breast": 175,
  "chicken breasts": 175,
  chilli: 15,
  "red chilli": 15,
  "pitta bread": 60,
  pitta: 60,
  bagel: 98,

  rasher: 25,
  "bacon rasher": 25,
  sausage: 55,
  "egg white": 30,
  "egg yolk": 18,

  "stock cube": 10,

  walnut: 5,
  almond: 1,

  sheet: 20,
};

const STANDARD_UNIT_TO_GRAMS_PER_UNIT: Record<string, number> = {
  g: 1,
  kg: 1000,
  oz: 28.35,
  lb: 453.59,
  mg: 0.001,
  ml: 1,
  l: 1000,
  cl: 10,
  tsp: 5,
  tbsp: 15,
  cup: 240,
  "fl oz": 29.57,
  fl_oz: 29.57,
};

/** Count-style units with a fixed grams multiplier (not per-ingredient table). */
const COUNT_STYLE_MULTIPLIERS: Record<string, number> = {
  handful: 40,
  handfuls: 40,
  sprig: 5,
  sprigs: 5,
  stalk: 30,
  stalks: 30,
  head: 500,
  heads: 500,
  bunch: 100,
  bunches: 100,
  can: 400,
  cans: 400,
  tin: 400,
  tins: 400,
  jar: 350,
  jars: 350,
  sachet: 10,
  sachets: 10,
  fillet: 150,
  fillets: 150,
  breast: 175,
  breasts: 175,
  thigh: 120,
  thighs: 120,
  drumstick: 100,
  drumsticks: 100,
  tortilla: 40,
  tortillas: 40,
};

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Whole-word / phrase match so short keys (e.g. egg) do not match eggplant. */
function phraseBoundaryRegex(key: string): RegExp {
  const parts = key
    .trim()
    .split(/\s+/)
    .map(escapeRegExp)
    .join("\\s+");
  return new RegExp(`(^|[^a-z0-9])${parts}([^a-z0-9]|$)`, "i");
}

export function lookupPieceWeightGramsPerUnit(rawName: string): number | null {
  const name = rawName.toLowerCase().trim();
  if (!name) return null;

  const fromShared = matchPieceWeight(name);
  if (fromShared != null) return fromShared.grams;

  const direct = PIECE_WEIGHTS_G[name];
  if (direct != null) return direct;

  if (name.endsWith("ies")) {
    const y = `${name.slice(0, -3)}y`;
    if (PIECE_WEIGHTS_G[y] != null) return PIECE_WEIGHTS_G[y];
  }
  if (name.endsWith("es") && name.length > 4) {
    const stem = name.slice(0, -2);
    if (PIECE_WEIGHTS_G[stem] != null) return PIECE_WEIGHTS_G[stem];
  }
  if (name.endsWith("s") && name.length > 3) {
    const singular = name.slice(0, -1);
    if (PIECE_WEIGHTS_G[singular] != null) return PIECE_WEIGHTS_G[singular];
  }

  const keys = Object.keys(PIECE_WEIGHTS_G).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (phraseBoundaryRegex(key).test(name)) {
      return PIECE_WEIGHTS_G[key]!;
    }
  }
  return null;
}

export function isPieceLikeUnit(unit: string): boolean {
  const u = unit.toLowerCase().trim();
  return ["piece", "pieces", "whole", "unit", "units", "each", "item", "items", ""].includes(u);
}

function breadLikeName(name: string): boolean {
  return /\b(bread|toast|sourdough|bagel|pitta|pita|brioche|ciabatta)\b/i.test(name);
}

export function shouldShowApproxWeightHint(unit: string): boolean {
  const u = unit.toLowerCase().trim();
  return (
    isPieceLikeUnit(u) ||
    u === "slice" ||
    u === "slices" ||
    u === "rasher" ||
    u === "rashers" ||
    u === "clove" ||
    u === "cloves"
  );
}

function resolveGrams(
  quantity: number,
  unit: string,
  nutritionEntry: NutritionLookupEntry | null,
  ingredientName: string | undefined,
): number | null {
  if (!Number.isFinite(quantity) || quantity <= 0) return null;

  const u = unit.toLowerCase().trim();
  const name = ingredientName?.trim() ?? "";

  if (u === "slice" || u === "slices") {
    const per =
      nutritionEntry?.typical_slice_g != null && nutritionEntry.typical_slice_g > 0
        ? nutritionEntry.typical_slice_g
        : name && breadLikeName(name)
          ? 40
          : 30;
    return quantity * per;
  }

  if (u === "rasher" || u === "rashers") {
    return quantity * 25;
  }

  if (u === "clove" || u === "cloves") {
    return quantity * 5;
  }

  if (isPieceLikeUnit(u)) {
    if (name) {
      const tableG = lookupPieceWeightGramsPerUnit(name);
      if (tableG != null) return quantity * tableG;
    }
    const typical = nutritionEntry?.typical_piece_g;
    if (typical != null && typical > 0) {
      return quantity * typical;
    }
    return null;
  }

  if (!u && name) {
    const tableG = lookupPieceWeightGramsPerUnit(name);
    if (tableG != null) return quantity * tableG;
  }

  const countMul = COUNT_STYLE_MULTIPLIERS[u];
  if (countMul != null) {
    return quantity * countMul;
  }

  const std = STANDARD_UNIT_TO_GRAMS_PER_UNIT[u];
  if (std != null) {
    if (/\boil\b/i.test(name) && (u === "tbsp" || u === "tsp")) {
      return quantity * (u === "tbsp" ? 13.5 : 4.5);
    }
    if (/\b(purée|puree|paste)\b/i.test(name) && u === "tbsp") {
      return quantity * 16;
    }
    if (/\b(spice|spices|ground)\b/i.test(name) && u === "tsp") {
      return quantity * 2;
    }
    return quantity * std;
  }

  return null;
}

/** Mass/volume + count helpers; optional ingredient name unlocks whole-food weights. */
export function toGrams(quantity: number, unit: string, ingredientName?: string): number | null {
  return resolveGrams(quantity, unit, null, ingredientName);
}

/** Converts quantity + unit to grams using nutrition DB overrides when present, then piece-weight table. */
export function ingredientGrams(
  quantity: number,
  unit: string,
  nutritionEntry: NutritionLookupEntry | null,
  ingredientName?: string,
): number | null {
  return resolveGrams(quantity, unit, nutritionEntry, ingredientName);
}

export function getSupportedUnits(): string[] {
  const extra = [...Object.keys(STANDARD_UNIT_TO_GRAMS_PER_UNIT), ...Object.keys(COUNT_STYLE_MULTIPLIERS)];
  return [...new Set([...(ALLOWED_UNITS as readonly string[]), ...extra])].sort((a, b) =>
    a.localeCompare(b),
  );
}

const LIQUID_PATTERN =
  /\b(oil|olive oil|milk|water|stock|broth|cream|juice|vinegar|wine|sauce|paste|pur[ée]e|honey|syrup|yoghurt|yogurt|buttermilk|coconut milk)\b/i;
const SPICE_PATTERN =
  /\b(spice|spices|pepper|salt|paprika|cumin|oregano|basil|thyme|herb|herbs|ground|chilli|chili|turmeric|coriander|nutmeg|ginger powder)\b/i;
const COUNTABLE_PATTERN =
  /\b(apple|banana|orange|egg|eggs|onion|garlic|mushroom|tomato|potato|pepper|avocado|lemon|lime|carrot|courgette|aubergine|pear|peach|kiwi|bread|wrap|pitta|bagel|rasher|bacon|sausage|fillet|breast|thigh)\b/i;

/** Context-aware unit list for recipe-maker ingredient rows (always includes g). */
export function getUnitsForIngredient(ingredientName: string): string[] {
  const all = getSupportedUnits();
  const name = ingredientName.trim();
  if (!name) return all;

  const preferred: string[] = ["g"];
  const add = (...units: string[]) => {
    for (const unit of units) {
      if (!preferred.includes(unit) && all.includes(unit)) preferred.push(unit);
    }
  };

  if (LIQUID_PATTERN.test(name)) {
    add("ml", "l", "tbsp", "tsp", "cup", "fl oz", "cl");
  } else if (SPICE_PATTERN.test(name)) {
    add("tsp", "tbsp", "g");
  } else if (/\b(garlic|onion|shallot)\b/i.test(name)) {
    add("clove", "cloves", "piece", "whole", "kg");
  } else if (/\b(bread|toast|bacon|rashers?)\b/i.test(name)) {
    add("slice", "slices", "rasher", "rashers", "piece");
  } else if (lookupPieceWeightGramsPerUnit(name) != null || COUNTABLE_PATTERN.test(name)) {
    add("piece", "whole", "each", "item", "slice", "handful", "kg");
  } else if (/\b(chicken|beef|pork|lamb|fish|salmon|cod|tuna|prawn|prawns|mince)\b/i.test(name)) {
    add("kg", "oz", "lb", "fillet", "breast", "thigh", "piece");
  } else {
    add("kg", "tbsp", "tsp", "cup", "ml", "oz", "piece");
  }

  for (const unit of all) {
    if (!preferred.includes(unit)) preferred.push(unit);
  }

  return preferred;
}

export function defaultUnitForIngredient(ingredientName: string): string {
  const units = getUnitsForIngredient(ingredientName);
  if (lookupPieceWeightGramsPerUnit(ingredientName.trim()) != null && units.includes("piece")) {
    return "piece";
  }
  if (LIQUID_PATTERN.test(ingredientName) && units.includes("ml")) return "ml";
  return units[0] ?? "g";
}

/** Approximate total grams suffix for ingredient lists, e.g. `(~240g)`. */
export function formatIngredientWeightSuffix(
  quantity: number,
  unit: string,
  ingredientName: string,
): string | null {
  if (!shouldShowApproxWeightHint(unit)) return null;
  const grams = ingredientGrams(quantity, unit, lookupNutrition(ingredientName), ingredientName);
  if (grams == null) return null;
  if (grams >= 1000) return `(~${(grams / 1000).toFixed(1)}kg)`;
  return `(~${Math.round(grams)}g)`;
}

/** Grocery line secondary label: piece-like quantities show count · approximate grams. */
export function formatGroceryQuantitySubtitle(
  quantity: number,
  unit: string,
  name: string,
  formatQty: (q: number) => string,
): string {
  const u = unit.toLowerCase().trim();
  const pieceStyle =
    isPieceLikeUnit(u) ||
    u === "slice" ||
    u === "slices" ||
    u === "rasher" ||
    u === "rashers" ||
    u === "clove" ||
    u === "cloves";

  if (!pieceStyle) {
    return `${formatQty(quantity)} ${unit}`;
  }

  const grams = ingredientGrams(quantity, unit, lookupNutrition(name), name);
  if (grams == null) {
    return unit.trim() ? `${formatQty(quantity)} ${unit}` : `${formatQty(quantity)}`;
  }

  const weightStr = grams >= 1000 ? `${(grams / 1000).toFixed(1)}kg` : `${Math.round(grams)}g`;
  return `${formatQty(quantity)} · ~${weightStr}`;
}
