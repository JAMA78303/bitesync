import type { NutritionLookupEntry } from "@/types";
import { NUTRITION_DB } from "@/lib/nutrition/nutrition-db";
import { canonicalIngredientPhrase } from "@/lib/nutrition/ingredientPhrase";
import { isPlainWaterQuery } from "@/lib/nutrition/cofidMatch";

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
  "tomato salsa": "salsa mild jar",
  "ground cumin": "cumin",
  cumin: "cumin",
  tabasco: "hot sauce tabasco",
  // A recipe's "1 red chilli" is the fresh pod. These went to "chilli flakes"
  // (282 kcal per 100 g, dried) when there was no fresh row.
  "red chilli": "fresh red chilli",
  chilli: "fresh red chilli",
  chili: "fresh red chilli",
  "green chilli": "fresh green chilli",
  "mixed salad": "lettuce",
  "lime juiced": "lime",
  bulgur: "bulgur wheat",
  "bulgur wheat": "bulgur wheat",
  breadcrumbs: "bread",
  breadcrumb: "bread",
  "spaghetti or tagliatelle": "spaghetti",
  // Ribbon pasta is sold as egg pasta; "linguine egg" is CoFID 11-715, dried.
  tagliatelle: "linguine egg",
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
  // Partial matching found "macaroni cheese ready meal" (196 kcal, 17 g protein).
  macaroni: "macaroni elbow",
  // 100% cashew butter is ground cashews; partial matching found dairy "butter".
  "cashew butter": "cashews",
  // Partial matching found fresh "mango" (60 kcal per 100 g) and "egg".
  "mango dried": "dried mango",
  "dried mango slices": "dried mango",
  "egg noodles": "noodles",
  "dried egg noodles": "noodles",
  // Partial matching finds "spaghetti" (dry, 343 kcal). Tinned spaghetti is
  // CoFID 11-735, which the "spaghetti hoops tin" row carries.
  "spaghetti hoops": "spaghetti hoops tin",
  "alphabet spaghetti": "alphabet spaghetti tin",
  "tinned spaghetti": "spaghetti hoops tin",
  "canned spaghetti": "spaghetti hoops tin",
  "spaghetti in tomato sauce": "spaghetti hoops tin",
  // Sold cooked, ready for the wok. Partial matching finds "noodles", which is
  // dry as bought.
  udon: "cooked egg noodles",
  "udon noodles": "cooked egg noodles",
  "straight to wok noodles": "cooked egg noodles",
  "ready to wok noodles": "cooked egg noodles",
  // Cheddar after its grating and strength words are dropped (see resolveLookupName).
  cheddar: "cheddar cheese",
  "light cheddar": "reduced fat cheddar",
  "lighter cheddar": "reduced fat cheddar",
  "reduced fat cheddar cheese": "reduced fat cheddar",
  // Soya-based meat-free mince, whatever the pack calls it. Neither CoFID nor
  // this table had any of these, so they cost 0 kcal without an AI estimate.
  "vegan mince": "meat free mince",
  "meat-free mince": "meat free mince",
  "plant-based mince": "meat free mince",
  "plant based mince": "meat free mince",
};

/** Grating, maturity and strength don't change cheddar per 100 g: "grated mature cheddar" is cheddar. */
const CHEDDAR_FORM_WORDS = /\b(?:grated|shredded|mild|medium|mature|extra|vintage|strong|sharp)\s+(?=(?:\w+\s+)*cheddar\b)/g;

/**
 * Plain water. Kept out of NUTRITION_DB so partial matching can't land on it:
 * "water biscuits" must still find "water biscuit". Figures: CoFID 17-377
 * "Water, distilled", which is 0 for everything.
 */
const WATER_ENTRY: NutritionLookupEntry = {
  name: "water",
  per_100g: {
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    fibre_g: 0,
    sugar_g: 0,
    sodium_mg: 0,
    saturated_fat_g: 0,
  },
};

/** "almond butter", "hazelnut butter": never dairy butter. */
const NUT_BUTTER_PATTERN =
  /\b(cashew|almond|hazelnut|peanut|walnut|pistachio|brazil|macadamia|pecan|sunflower|pumpkin|sesame|nut|seed)s?\s+butter\b/;

/**
 * "cooked rice", "boiled basmati rice", "leftover penne": the cooked row for
 * that staple. The bare names in the table are dry, as bought, so partial
 * matching would cost cooked weight on a dry row, about 2.5 times too high.
 * Most specific first.
 */
const COOKED_STAPLE_WORD = /\b(?:cooked|boiled|steamed|leftover|pre-?cooked|microwave)\b/;
const NOT_A_PLAIN_STAPLE = /\b(?:rice (?:cakes?|pudding|paper|vinegar|milk|flour)|fried|salad|cheese|bake)\b/;
const COOKED_STAPLE_ROWS: [RegExp, string][] = [
  [/\brice noodles?\b/, "cooked rice noodles"],
  [/\bnoodles?\b/, "cooked egg noodles"],
  [/\b(?:wholewheat|wholemeal|brown)\b.*\b(?:pasta|spaghetti|penne|fusilli|macaroni)\b/, "cooked wholewheat pasta"],
  [
    /\b(?:pasta|spaghetti|spaghettini|penne|fusilli|macaroni|rigatoni|farfalle|conchiglie|linguine|orzo|tagliatelle|fettuccine|pappardelle)\b/,
    "cooked pasta",
  ],
  [/\bbrown\b.*\brice\b/, "cooked brown rice"],
  [/\bbasmati\b/, "cooked basmati rice"],
  [/\brice\b/, "cooked rice"],
  [/\bcouscous\b/, "cooked couscous"],
  [/\bquinoa\b/, "cooked quinoa"],
  [/\bbulgu?r\b/, "cooked bulgur wheat"],
];

function cookedStapleEntry(normalized: string): NutritionLookupEntry | null {
  if (!COOKED_STAPLE_WORD.test(normalized) || NOT_A_PLAIN_STAPLE.test(normalized)) return null;
  const row = COOKED_STAPLE_ROWS.find(([pattern]) => pattern.test(normalized))?.[1];
  return row ? (NUTRITION_DB.find((item) => item.name === row) ?? null) : null;
}

/**
 * Bird's eye and Thai chillies are small fresh chillies. No row or alias
 * matched them, so the recipe-form preview counted nothing.
 */
const SMALL_FRESH_CHILLI =
  /^(?:(red|green) )?(?:thai |(?:thai )?bird(?:['’]?s)? ?eye |birdseye )(?:(red|green) )?chill?(?:i|is|ies|es)$/;

function smallFreshChilliEntry(normalized: string): NutritionLookupEntry | null {
  const m = normalized.match(SMALL_FRESH_CHILLI);
  if (!m) return null;
  const colour = m[1] ?? m[2] ?? "red";
  return NUTRITION_DB.find((item) => item.name === `fresh ${colour} chilli`) ?? null;
}

function resolveLookupName(name: string): string {
  const normalized = normalizeName(name).replace(CHEDDAR_FORM_WORDS, "");
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
  // "water" partially matched "watermelon" (30 kcal per 100 g).
  if (isPlainWaterQuery(name)) return WATER_ENTRY;
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

  const cooked = cookedStapleEntry(normalized);
  if (cooked) return cooked;
  const smallChilli = smallFreshChilliEntry(normalized);
  if (smallChilli) return smallChilli;

  // Fallback matching for user-entered variations (e.g. "alfredo sauce", "grated parmesan")
  const nutButter = NUT_BUTTER_PATTERN.test(normalized);
  const partial = NUTRITION_DB.find((item) => {
    const dbName = normalizeName(item.name);
    if (dbName.length <= 4 && normalized.includes(" and ") && !normalized.startsWith(`${dbName} `)) {
      return false;
    }
    if (nutButter && dbName === "butter") return false;
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
