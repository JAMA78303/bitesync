import type { NutritionLookupEntry } from "@/types";
import { NUTRITION_DB } from "@/lib/nutrition/nutrition-db";
import { canonicalIngredientPhrase } from "@/lib/nutrition/ingredientPhrase";

function normalizeName(value: string): string {
  return value.toLowerCase().trim();
}

/** Common import / recipe phrasing → canonical nutrition DB name. */
const INGREDIENT_LOOKUP_ALIASES: Record<string, string> = {
  tortilla: "flour tortilla",
  tortillas: "flour tortilla",
  "flour tortilla": "flour tortilla",
  "flour tortillas": "flour tortilla",
  salsa: "salsa mild jar",
  "fresh salsa": "salsa mild jar",
  "ground cumin": "cumin",
  cumin: "cumin",
  tabasco: "hot sauce tabasco",
  "red chilli": "chilli flakes",
  chilli: "chilli flakes",
  chili: "chilli flakes",
  "mixed salad": "lettuce",
  "lime juiced": "lime",
  bulgur: "bulgur wheat",
  "bulgur wheat": "bulgur wheat",
  breadcrumbs: "bread",
  breadcrumb: "bread",
  "spaghetti or tagliatelle": "spaghetti",
  tagliatelle: "spaghetti",
  "chicken stock pot": "stock cube chicken",
  "stock pot": "stock cube chicken",
  "chopped tomatoes": "tomato",
  "tin chopped tomatoes": "tomato",
  // Black turtle beans are black beans; neither is in CoFID.
  "black turtle beans": "black beans",
  "turtle beans": "black beans",
  "butter bean": "butter beans",
  // Without these, partial matching found "rice" (raw grain) and "rice cakes salted".
  "rice cakes": "rice cake",
  "plain rice cakes": "rice cake",
  // The "rice cake" row is Kallo lightly salted; the old "rice cakes salted" row
  // had 187 kcal and 16 g protein per 100 g.
  "rice cakes salted": "rice cake",
  "salted rice cakes": "rice cake",
  "lightly salted rice cakes": "rice cake",
  // Made-up stock is a few kcal per 100 ml whatever the flavour. CoFID has no
  // made-up beef or lamb stock (only the dry cube, which is per 100 g of cube),
  // so these use the vegetable stock figures.
  "beef stock": "vegetable stock",
  "lamb stock": "vegetable stock",
  "wholemeal pittas": "wholemeal pitta",
  "wholemeal pitta bread": "wholemeal pitta",
  "wholewheat pitta": "wholemeal pitta",
  "wholewheat pitta bread": "wholemeal pitta",
  "wholemeal noodles": "wholewheat noodles",
  "wholewheat noodle": "wholewheat noodles",
  "bean sprouts": "bean sprouts fresh",
  beansprouts: "bean sprouts fresh",
  // Frozen soya beans are edamame.
  "soya beans": "edamame",
  "soy beans": "edamame",
  "frozen soya beans": "edamame",
  "frozen soy beans": "edamame",
  "edamame beans": "edamame",
  "frozen edamame": "edamame",
  "fat free greek style yoghurt": "fat free greek yoghurt",
  "low fat greek style yoghurt": "low fat greek yoghurt",
  "fat free skyr": "skyr",
  "natural skyr": "skyr",
};

function resolveLookupName(name: string): string {
  const normalized = normalizeName(name);
  return (
    INGREDIENT_LOOKUP_ALIASES[normalized] ??
    INGREDIENT_LOOKUP_ALIASES[canonicalIngredientPhrase(normalized)] ??
    normalized
  );
}

/** Display hints for autocomplete (whole foods / common count units). Keys lowercase. */
export const FOOD_UNIT_HINTS: Record<string, string> = {
  banana: "piece (~120g each)",
  apple: "piece (~150g each)",
  egg: "piece (~60g each)",
  eggs: "piece (~60g each)",
  avocado: "piece (~150g each)",
  orange: "piece (~130g each)",
  onion: "piece (~150g each)",
  garlic: "clove (~5g each)",
  lemon: "piece (~58g each)",
  lime: "piece (~44g each)",
  pepper: "piece (~160g each)",
  "red pepper": "piece (~160g each)",
  "green pepper": "piece (~160g each)",
  "yellow pepper": "piece (~160g each)",
  courgette: "piece (~196g each)",
  cucumber: "piece (~300g each)",
  "sweet potato": "piece (~180g each)",
  potato: "piece (~175g each)",
  carrot: "piece (~100g each)",
  "tortilla wrap": "piece (~64g each)",
  tortilla: "piece (~40g each)",
  tortillas: "piece (~40g each)",
  "chicken breast": "piece (~175g each)",
  "chicken breasts": "piece (~175g each)",
  "pitta bread": "piece (~60g each)",
  "stock cube": "piece (~10g each)",
  "bacon rasher": "rasher (~25g each)",
  pear: "piece (~170g each)",
  peach: "piece (~150g each)",
  kiwi: "piece (~76g each)",
  tomato: "piece (~123g each)",
  beetroot: "piece (~100g each)",
  leek: "piece (~150g each)",
};

export function getIngredientAutocompleteLabel(name: string): string {
  const key = normalizeName(name);
  const hint = FOOD_UNIT_HINTS[key];
  if (hint) return `${name} — ${hint}`;
  return name;
}

/** Local curated DB (sync). UK CoFID lookup runs server-side in async recipe nutrition (see cofidLookup.ts). */
export function lookupNutrition(name: string): NutritionLookupEntry | null {
  const normalized = resolveLookupName(name);
  const exact = NUTRITION_DB.find((item) => normalizeName(item.name) === normalized);
  if (exact) return exact;

  // "0% greek yoghurt", "fat-free Greek yogurt" → "fat free greek yoghurt". Tried
  // before partial matching, which would otherwise find full-fat "greek yoghurt".
  const canonical = canonicalIngredientPhrase(normalized);
  if (canonical !== normalized) {
    const canonicalExact = NUTRITION_DB.find((item) => normalizeName(item.name) === canonical);
    if (canonicalExact) return canonicalExact;
  }

  // Fallback matching for user-entered variations (e.g. "alfredo sauce", "grated parmesan")
  const partial = NUTRITION_DB.find((item) => {
    const dbName = normalizeName(item.name);
    if (dbName.length <= 4 && normalized.includes(" and ") && !normalized.startsWith(`${dbName} `)) {
      return false;
    }
    return normalized.includes(dbName) || dbName.includes(normalized);
  });
  const entry = partial;
  return entry ?? null;
}

export function getNutritionSeedSize(): number {
  return NUTRITION_DB.length;
}

export function getNutritionIngredientNames(): string[] {
  return NUTRITION_DB.map((entry) => entry.name).sort((a, b) => a.localeCompare(b));
}

/** Alias for autocomplete — full merged lookup list */
export function getAllFoodNames(): string[] {
  return getNutritionIngredientNames();
}
