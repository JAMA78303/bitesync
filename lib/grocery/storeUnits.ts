import { matchPieceWeight } from "@/lib/nutrition/pieceWeights";

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
  coriander: { unit: "jar", size: 28, baseUnit: "g" },
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

const SORTED_KEYS = Object.keys(STORE_UNIT_MAP).sort((a, b) => b.length - a.length);

const MIN_PARTIAL_KEY_LEN = 4;

function formatQty(qty: number): string {
  return qty % 1 === 0 ? String(qty) : qty.toFixed(1);
}

function pluralPieceLabel(label: string, count: number): string {
  if (count === 1) return label;
  if (label.endsWith("s")) return label;
  return `${label}s`;
}

/** Resolve typical retail pack for an ingredient name (exact match, then longest substring ≥4 chars). */
export function getStoreUnit(ingredientName: string): StoreUnit | null {
  const normalised = ingredientName.toLowerCase().trim();
  if (!normalised) return null;

  const exact = STORE_UNIT_MAP[normalised];
  if (exact) return exact;

  for (const key of SORTED_KEYS) {
    if (key.length < MIN_PARTIAL_KEY_LEN) continue;
    if (normalised.includes(key) || (normalised.length >= MIN_PARTIAL_KEY_LEN && key.includes(normalised))) {
      return STORE_UNIT_MAP[key];
    }
  }

  return null;
}

const SKIP_STORE_BRACKETS = ["bread", "loaf", "stock cube", "pitta", "wrap", "tortilla"];

function shouldSkipStoreBrackets(normalised: string): boolean {
  return SKIP_STORE_BRACKETS.some((s) => normalised.includes(s));
}

/**
 * Grocery list display: piece counts for whole foods, retail unit + recipe amount, or raw qty + unit + name.
 * Display-only; does not change stored quantities.
 */
export function formatGroceryItem(
  name: string,
  quantity: number | undefined,
  unit: string | undefined,
): string {
  const trimmedName = name.trim();
  const normalised = trimmedName.toLowerCase();
  const u = unit?.trim().toLowerCase();
  const q = quantity;

  const piece = matchPieceWeight(normalised);
  if (piece) {
    if (q != null && (u === "g" || u === "kg")) {
      const grams = u === "kg" ? q * 1000 : q;
      const count = Math.max(1, Math.ceil(grams / piece.grams));
      return `${count} ${pluralPieceLabel(piece.label, count)}`;
    }
    if (q != null) {
      const count = Math.floor(q) === q ? q : Number(q.toFixed(2));
      return `${formatQty(count)} ${pluralPieceLabel(piece.label, count)}`;
    }
    return trimmedName;
  }

  const storeUnit = getStoreUnit(trimmedName);
  if (storeUnit && q != null) {
    const skip = shouldSkipStoreBrackets(normalised);
    const unitLabel = u ?? "";
    const neededLabel =
      !skip && unitLabel
        ? ` (${formatQty(q)} ${unitLabel} needed)`
        : skip
          ? ""
          : "";
    return `1 ${storeUnit.unit} ${trimmedName}${neededLabel}`;
  }

  if (q != null && u) return `${formatQty(q)} ${u} ${trimmedName}`;
  return trimmedName;
}
