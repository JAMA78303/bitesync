import { asksForNonDairy, isDairyIngredient } from "@/lib/dietary/dairy";
export type CoFIDMatchKind = "exact" | "fulltext" | "partial";

export type CofidCandidate = {
  food_code: string;
  food_name: string;
  food_group: string | null;
  matchKind: CoFIDMatchKind;
};

const PROCESSED_MODIFIERS = [
  "frozen",
  "canned",
  "tinned",
  "dried",
  "powder",
  "instant",
  "fried",
  "deep-fried",
  "breaded",
  "smoked",
  "pickled",
  "retail",
  "takeaway",
  "composite",
  "soup",
  "sauce",
  "ready meal",
  "babyfood",
];

const COMPOSITE_HEAD_NOUNS = new Set([
  "bread",
  "cake",
  "pie",
  "split",
  "muffin",
  "biscuit",
  "cookie",
  "cookies",
  "crisp",
  "crisps",
  "bar",
  "jam",
  "fritter",
  "pudding",
  "smoothie",
  "juice",
  "drink",
  "sauce",
  "chips",
  "puree",
  "compote",
  "curd",
  "loaf",
  "roll",
  "tart",
  "flan",
  "sundae",
  "fool",
  "mousse",
  "nugget",
  "nuggets",
  "kiev",
  "waffle",
  "waffles",
  "croquette",
  "croquettes",
  "crumble",
  "flapjack",
  "flapjacks",
  "finger",
  "fingers",
  "goujon",
  "goujons",
  "bites",
  "cereal",
  "concentrate",
]);

/** Descriptors that do not distinguish one whole food from another (prep/state, not species). */
const GENERIC_FOOD_DESCRIPTORS = new Set([
  "eating",
  "raw",
  "boiled",
  "steamed",
  "grilled",
  "baked",
  "fried",
  "roasted",
  "poached",
  "scrambled",
  "flesh",
  "skin",
  "whole",
  "old",
  "new",
  "average",
  "weighed",
  "only",
  "and",
  "with",
  "without",
  "unsalted",
  "salted",
  "pasteurised",
  "pasteurized",
  "plain",
  "fresh",
  "frozen",
  "canned",
  "tinned",
  "dried",
  "drained",
  "reheated",
  "homemade",
  "retail",
  "fortified",
  "unfortified",
  "long",
  "grain",
  "short",
  "medium",
  "lean",
  "meat",
  "fillets",
  "fillet",
  "breast",
  "thigh",
  "drumstick",
  "mince",
  "chopped",
  "sliced",
  "diced",
  "grated",
  "shredded",
  "cooked",
  "uncooked",
  "ripe",
  "unripe",
]);

function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s,/-]/g, " ")
    .replace(/\s+/g, " ");
}

/** Shared normalisation for ingredient overlap (CoFID matcher, pantry, leftovers). */
export function normalizeIngredientForMatch(value: string): string {
  return normalizeForMatch(value);
}

/** Normalise an ingredient name before CoFID lookup / override resolution. */
export function normalizeCofidQuery(name: string): string {
  return normalizeForMatch(name)
    .replace(/^\d+(?:\.\d+)?\s*(?:g|kg|ml|l|oz|lb)\s+/i, "")
    .replace(/^\d+(?:\.\d+)?\s+/, "")
    .trim();
}

function tokenize(value: string): string[] {
  return normalizeForMatch(value)
    .split(/[\s,/]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1);
}

/** Tokenise a food name for overlap scoring. */
export function tokenizeIngredientForMatch(value: string): string[] {
  return tokenize(value);
}

/** CoFID primary descriptor — text before the first comma. */
export function primaryFoodName(foodName: string): string {
  const comma = foodName.indexOf(",");
  return (comma >= 0 ? foodName.slice(0, comma) : foodName).trim();
}

function singularForm(token: string): string {
  const t = token.toLowerCase();
  if (t.endsWith("ies") && t.length > 4) return `${t.slice(0, -3)}y`;
  if (t.endsWith("oes") && t.length > 4) return t.slice(0, -2);
  if (
    t.endsWith("es") &&
    t.length > 4 &&
    !t.endsWith("ses") &&
    !t.endsWith("les") &&
    !t.endsWith("pes") &&
    !t.endsWith("ges") &&
    !t.endsWith("nes") &&
    !t.endsWith("res") &&
    !t.endsWith("tes")
  ) {
    return t.slice(0, -2);
  }
  if (t.endsWith("s") && t.length > 3 && !t.endsWith("ss")) return t.slice(0, -1);
  return t;
}

function tokenMatches(queryToken: string, foodToken: string): boolean {
  const q = singularForm(queryToken);
  const f = singularForm(foodToken);
  return q.length >= 2 && f.length >= 2 && q === f;
}

function tokensEquivalent(a: string, b: string): boolean {
  const ta = tokenize(a);
  const tb = tokenize(b);
  if (ta.length === 1 && tb.length === 1) return tokenMatches(ta[0], tb[0]);
  return normalizeForMatch(a) === normalizeForMatch(b);
}

function isCompositeHead(token: string): boolean {
  return COMPOSITE_HEAD_NOUNS.has(singularForm(token));
}

function matchKindBonus(matchKind: CoFIDMatchKind): number {
  if (matchKind === "exact") return 800;
  if (matchKind === "fulltext") return 350;
  return 120;
}

/** Energy-dense / processed preparations a bare ingredient name does NOT imply. */
const DENSE_PREP_PATTERN =
  /\b(roast|roasted|fried|deep[- ]?fried|chips|crisps|saut[eé]ed|saut[eé]|batter|battered|breaded|in crumbs|in oil|crisped|crispy)\b/;

/** Staple grains/pulses where raw/dry is ~2–3× denser than the cooked form users mean. */
const STAPLE_GRAIN_PULSE_PATTERN =
  /\b(rice|pasta|quinoa|couscous|bulgur|oats?|porridge|lentils?|chickpeas?|chick\s*peas?|barley|farro|freekeh|semolina|noodles?|spaghetti|macaroni|penne|fusilli)\b/i;
const PASTA_SHAPE_PATTERN =
  /\b(spaghetti|tagliatelle|penne|fusilli|macaroni|linguine|fettuccine|pasta)\b/i;
const MINCE_QUERY_PATTERN = /\b(mince|minced)\b/i;
const BREADCRUMB_QUERY_PATTERN = /\bbreadcrumbs?\b/i;
const MUSHROOM_QUERY_PATTERN = /\bmushrooms?\b/i;
const PLAIN_OIL_QUERY_PATTERN = /\b(rapeseed|canola|vegetable|sunflower|olive|groundnut|peanut)\s+oil\b/i;
const STAPLE_PULSE_PATTERN =
  /\b(kidney\s*beans?|black\s*beans?|baked\s*beans?|cannellini|red\s*kidney|chickpeas?|lentils?)\b/i;

const RAW_DRY_PREP_PATTERN = /\b(raw|dried|dry|uncooked)\b/;
const COOKED_PREP_PATTERN = /\b(boiled|steamed|poached|cooked|re-heated|reheated)\b/;

export function queryRequestsRawDry(query: string): boolean {
  return RAW_DRY_PREP_PATTERN.test(normalizeCofidQuery(query));
}

/** True when the user entered a bare staple grain/pulse name (not "raw quinoa"). */
export function isStapleGrainPulseQuery(query: string): boolean {
  const q = normalizeCofidQuery(query);
  if (!q || queryRequestsRawDry(q)) return false;
  return STAPLE_GRAIN_PULSE_PATTERN.test(q) || STAPLE_PULSE_PATTERN.test(q);
}

/** CoFID row is a cooked/boiled/canned-ready form (not raw/dry). */
export function isCookedStapleForm(foodName: string): boolean {
  const f = normalizeForMatch(foodName);
  if (COOKED_PREP_PATTERN.test(f)) return true;
  // Canned pulses are already cooked ("canned … re-heated, drained").
  if (/\b(canned|tinned)\b/.test(f) && /\b(re-heated|reheated|drained)\b/.test(f)) return true;
  if (/\b(canned|tinned)\b/.test(f) && /\b(in water|in brine)\b/.test(f)) return true;
  return false;
}

/** CoFID row is a raw/dry/uncooked staple form (the calorie-dense trap). */
export function isRawDryStapleForm(foodName: string): boolean {
  if (isCookedStapleForm(foodName)) return false;
  return RAW_DRY_PREP_PATTERN.test(normalizeForMatch(foodName));
}

function stapleFoodMatchesQuery(foodName: string, query: string): boolean {
  const qTokens = tokenize(normalizeCofidQuery(query));
  const fTokens = tokenize(normalizeForMatch(foodName));
  if (!qTokens.length) return false;
  return qTokens.every((qt) => fTokens.some((ft) => tokenMatches(qt, ft)));
}

/** Raw-vs-cooked scoring nudge for staple grains/pulses (class rule, not per-food). */
function stapleGrainPulseAdjustment(query: string, normalisedFood: string): number {
  if (!isStapleGrainPulseQuery(query)) return 0;
  let adj = 0;
  if (isRawDryStapleForm(normalisedFood)) adj -= 150;
  if (isCookedStapleForm(normalisedFood)) adj += 100;
  return adj;
}

/**
 * Differentiates CoFID rows that share the same primary food name (e.g. all the
 * "Potatoes, ..." variants) so the bare ingredient resolves deterministically to
 * the plain cooked form rather than a fried/roast variant. Bounded to ±~300 so a
 * primary-name match always outranks weaker partial matches.
 */
function sameFoodPrepAdjustment(query: string, normalisedFood: string): number {
  let adj = 0;
  // Energy-dense prep the bare name doesn't imply (chips/roast/fried) — the main
  // inflation source when "potato" resolves to "chips, fried in oil".
  if (DENSE_PREP_PATTERN.test(normalisedFood) && !DENSE_PREP_PATTERN.test(query)) {
    adj -= 250;
  }
  for (const modifier of PROCESSED_MODIFIERS) {
    if (normalisedFood.includes(modifier) && !query.includes(modifier)) adj -= 40;
  }
  // Prefer the plain cooked form when one exists.
  if (isCookedStapleForm(normalisedFood)) adj += 60;
  adj += stapleGrainPulseAdjustment(query, normalisedFood);
  return adj;
}

/** Bare "chicken mince" must not resolve to casseroled chicken with skin. */
function minceQueryAdjustment(query: string, normalisedFood: string): number {
  if (!MINCE_QUERY_PATTERN.test(query)) return 0;
  if (/\bmince\b/.test(normalisedFood)) {
    if (/\bchicken\b/.test(query) && /\bturkey\b/.test(normalisedFood)) return -400;
    return 150;
  }
  if (/\bchicken\b/.test(query) && isAcceptableChickenMinceProxy(normalisedFood)) return 200;
  if (/\b(casseroled|skin|roast|fried|nugget|kiev|goujon)\b/.test(normalisedFood)) return -950;
  return -750;
}

/** "Spaghetti" is pasta, not spaghetti squash, unless the user said squash. */
function pastaQueryAdjustment(query: string, foodName: string): number {
  const q = normalizeCofidQuery(query);
  if (!PASTA_SHAPE_PATTERN.test(q)) return 0;
  if (/\bsquash\b/.test(q)) return 0;
  const f = normalizeForMatch(foodName);
  const primary = normalizeForMatch(primaryFoodName(foodName));
  if (/\bsquash\b/.test(primary)) return -1000;
  let adj = 0;
  if (/\bfresh\b/.test(f)) adj -= 220;
  if (/\bdried,\s*boiled\b/.test(f) || /\bspaghetti,\s*dried,\s*boiled\b/.test(f)) adj += 120;
  if (/\b(pasta|spaghetti|tagliatelle|macaroni|penne|fusilli)\b/.test(f)) adj += 180;
  return adj;
}

/** "Breadcrumbs" is not "plaice in breadcrumbs". */
function breadcrumbQueryAdjustment(query: string, foodName: string): number {
  if (!BREADCRUMB_QUERY_PATTERN.test(normalizeCofidQuery(query))) return 0;
  const f = normalizeForMatch(foodName);
  if (
    /\b(in|with|coated in|coated with)\s+breadcrumbs?\b/.test(f) &&
    /\b(plaice|cod|fish|scampi|salmon|lamb|kofta|beef|chicken|pork)\b/.test(f)
  ) {
    return -950;
  }
  return 0;
}

/** Bare "mushrooms" → white/button, not oyster unless the query says oyster. */
function mushroomQueryAdjustment(query: string, foodName: string): number {
  if (!MUSHROOM_QUERY_PATTERN.test(normalizeCofidQuery(query))) return 0;
  const q = normalizeForMatch(query);
  const f = normalizeForMatch(foodName);
  if (/\boyster\b/.test(f) && !/\boyster\b/.test(q)) return -900;
  if (/\b(fried in|roasted in|stewed in|with)\b/.test(f)) return -450;
  if (/\bwhite\b/.test(f) && /\braw\b/.test(f)) return 180;
  return 0;
}

/** Bare "rapeseed oil" → pure oil, not asparagus fried in rapeseed oil. */
function plainOilQueryAdjustment(query: string, foodName: string): number {
  const q = normalizeCofidQuery(query);
  if (!/\boil\b/.test(q) && !PLAIN_OIL_QUERY_PATTERN.test(q)) return 0;
  const f = normalizeForMatch(foodName);
  if (/\b(fried in|roasted in|stewed in|baked in|with)\b/.test(f) && /\boil\b/.test(f)) return -950;
  if (/\b(fried|roasted|stewed|baked|burger|bread|asparagus|aubergine)\b/.test(f) && !/^oil,\s*/.test(f)) {
    return -350;
  }
  if (/^oil,\s*(rapeseed|olive|sunflower|vegetable|corn|groundnut)/.test(f)) return 250;
  if (PLAIN_OIL_QUERY_PATTERN.test(q) && /\brapeseed\b/.test(f) && /\boil\b/.test(f)) return 200;
  return 0;
}

export function isSpaghettiSquashMismatch(query: string, foodName: string): boolean {
  const q = normalizeCofidQuery(query);
  if (!PASTA_SHAPE_PATTERN.test(q) || /\bsquash\b/.test(q)) return false;
  return /\bsquash\b/.test(normalizeForMatch(primaryFoodName(foodName)));
}

export function isMinceMismatch(query: string, foodName: string): boolean {
  if (!MINCE_QUERY_PATTERN.test(normalizeCofidQuery(query))) return false;
  const f = normalizeForMatch(foodName);
  if (/\bmince\b/.test(f)) return false;
  // CoFID has no "chicken mince" row — raw average chicken meat is the standard proxy.
  if (/\bchicken\b/.test(normalizeCofidQuery(query)) && isAcceptableChickenMinceProxy(foodName)) {
    return false;
  }
  return true;
}

/** Raw skinless chicken forms that stand in for "chicken mince" in CoFID. */
export function isAcceptableChickenMinceProxy(foodName: string): boolean {
  const f = normalizeForMatch(foodName);
  return (
    /\bchicken\b/.test(f) &&
    /\braw\b/.test(f) &&
    !/\b(skin only|skin, raw|casseroled|fried|nugget|goujon|kiev|wing quarter|whole,)\b/.test(f)
  );
}

export function isBreadcrumbCompositeMismatch(query: string, foodName: string): boolean {
  if (!BREADCRUMB_QUERY_PATTERN.test(normalizeCofidQuery(query))) return false;
  return /\b(in|with|coated in|coated with)\s+breadcrumbs?\b/.test(normalizeForMatch(foodName));
}

/** CoFID preparations that add substantial cooking fat to a plain staple. */
const FAT_ADDED_PREP_PATTERN =
  /\b(chips|fries|crisps|fried|deep[- ]fried|roast|roasted|saut[eé]ed|dauphinoise|croquette|hash brown|wedges)\b/;
/** The same words in a query mean the user actually wants that preparation. */
const FAT_ADDED_QUERY_PATTERN =
  /\b(chip|chips|fries|crisps|fried|fry|roast|roasted|saut[eé]|sauteed|wedges|hash brown)\b/;

/**
 * A bare staple ("potato", "quinoa") must not resolve to a fat-added preparation.
 * "Potatoes, chips, fried in vegetable oil" is cooked — so the raw/dry guard does
 * not catch it — but it carries ~14g more fat and ~300 more kcal per portion than
 * the boiled potato the recipe actually calls for.
 */
// ---------------------------------------------------------------------------
// Meat and fish: costed raw, as bought.
//
// A recipe's "140 g chicken breast" is the 140 g on the scales and the 140 g on
// the grocery list. Cooking removes water, not nutrients, so raw weight on a
// raw row is the correct as-eaten figure; raw weight on a cooked row overstates
// it by the water that left — ~30% on protein for chicken, which is the number
// this app is built around. The matcher had no view on this: pork and lamb
// mince went raw, beef mince went to "microwaved", chicken breast to "grilled",
// chicken thigh to "casseroled, meat and skin", cod to "poached in milk and
// butter", and bacon to "fat only, cooked" at 692 kcal/100 g.
//
// The rule: a bare meat or fish name — one that does not ask for a preparation
// itself — prefers a raw row and shrinks from a cooked one. "Purchased cooked",
// canned, smoked and cured rows are as-bought forms and are left alone; a
// query that names its own prep ("smoked mackerel", "tuna canned") is not bare.
// ---------------------------------------------------------------------------

const MEAT_FISH_QUERY_PATTERN =
  /\b(chicken|turkey|beef|steak|pork|lamb|mince|salmon|cod|haddock|tuna|prawns?|mackerel|trout|sea ?bass|sardines?|bacon|sausages?|gammon|duck|venison|fillets?|thighs?|breasts?|drumsticks?|wings?|chops?|loin|ham)\b/;

/** A query that names its own preparation is asking for that form. */
const QUERY_NAMES_PREP_PATTERN =
  /\b(raw|cooked|grilled|roast|roasted|fried|smoked|canned|tinned|cured|dried|poached|boiled|baked|stewed|casseroled|barbecued|steamed|jerky|purchased cooked|pre-?cooked|leftover)\b/;

const ROW_COOKED_PREP_PATTERN =
  /\b(grilled|roasted|roast|fried|stewed|casseroled|microwaved|poached|boiled|baked|barbecued|steamed|stir-fried|braised|cooked)\b/;

/** As-bought forms that are not "raw" but are what the shopper picks up. */
const ROW_AS_BOUGHT_PATTERN = /\b(purchased cooked|canned|tinned|smoked|cured|salted)\b/;

/** Rows for a part nobody buys as "chicken": the skin, the fat, the bones. */
const ROW_PART_ONLY_PATTERN = /\b(skin|fat|bone|bones|carcass|giblets|offal|trimmings)\b/;
/** …unless the row is the meat itself, described with or without those parts. */
const ROW_IS_MEAT_PATTERN =
  /\b(meat|flesh|lean|without skin|rashers?|breasts?|thighs?|drumsticks?|wings?|fillets?|steaks?|chops?|mince|loin)\b/;
const ROW_WEIGHED_WITH_PATTERN = /\bweighed with (bone|bones|shell|shells|skin|stone|stones)\b/;

function isPartOnlyRow(f: string): boolean {
  if (ROW_WEIGHED_WITH_PATTERN.test(f)) return true;
  return ROW_PART_ONLY_PATTERN.test(f) && !ROW_IS_MEAT_PATTERN.test(f);
}

export function isBareMeatOrFishQuery(query: string): boolean {
  const q = normalizeCofidQuery(query);
  return MEAT_FISH_QUERY_PATTERN.test(q) && !QUERY_NAMES_PREP_PATTERN.test(q);
}

/** True when the row is a cooked preparation rather than raw or as-bought. */
export function isCookedMeatRow(foodName: string): boolean {
  const f = normalizeForMatch(foodName);
  if (ROW_AS_BOUGHT_PATTERN.test(f)) return false;
  return ROW_COOKED_PREP_PATTERN.test(f);
}

function rawMeatAdjustment(query: string, foodName: string): number {
  if (!isBareMeatOrFishQuery(query)) return 0;
  const f = normalizeForMatch(foodName);
  // Nobody who writes "bacon" or "chicken" means the fat or the skin on its own,
  // and a same-name row starts 9000 up — only a veto stops it.
  if (isPartOnlyRow(f)) return -Infinity;
  // "grilled from raw" is a cooked row that happens to say raw.
  if (/\braw\b/.test(f) && !/\bfrom raw\b/.test(f)) return 200;
  if (isCookedMeatRow(foodName)) return -200;
  return 0;
}

export function isFatAddedPrepMismatch(query: string, foodName: string): boolean {
  const q = normalizeCofidQuery(query);
  if (!q || FAT_ADDED_QUERY_PATTERN.test(q)) return false;
  if (!isStapleGrainPulseQuery(q) && !/\b(potato|potatoes)\b/.test(q)) return false;
  return FAT_ADDED_PREP_PATTERN.test(normalizeForMatch(foodName));
}

/**
 * A bare staple resolving to its raw/dry row. `pickBestCofidCandidate` already
 * prefers a cooked sibling when one exists among the candidates; this covers the
 * case where CoFID offers no cooked form at all, where raw grain is ~3x denser.
 */
export function isRawStapleMismatch(query: string, foodName: string): boolean {
  if (!isStapleGrainPulseQuery(query)) return false;
  return isRawDryStapleForm(foodName);
}

/** Plant drinks: "oat milk", "almond milk", "soya milk", "coconut milk drink", … */
const PLANT_MILK_QUERY_PATTERN =
  /\b(oat|almond|soy|soya|rice|cashew|hazelnut|hemp|pea|coconut)\s*(milk|drink)\b/;

/** CoFID rows that are actually a liquid: "… drink", "Milk, …", "beverage". */
/** The plant the drink is made from, as it appears in a CoFID row. */
const PLANT_FOOD_PATTERN = /\b(oat|oats|almond|almonds|soy|soya|rice|cashew|hazelnut|hemp|pea|coconut|plant)\b/;

/**
 * A plant-milk query must resolve to a plant *drink* row and nothing else.
 *
 * Two distinct traps, both seen in production:
 *   "almond milk" -> "Milk, whole, pasteurised"  (dairy: wrong food class entirely)
 *   "almond milk" -> "Almonds, flaked"           (the solid nut: 579 kcal/100g vs 15)
 *
 * The second is far worse — 110g of almond drink is ~17 kcal, 110g of almonds is
 * ~637 — so requiring a liquid row is the rule, rather than blocking dairy alone.
 */
export function isPlantMilkMismatch(query: string, foodName: string): boolean {
  const q = normalizeCofidQuery(query);
  if (!PLANT_MILK_QUERY_PATTERN.test(q)) return false;
  const f = normalizeForMatch(foodName);
  // A plant drink row is one CoFID labels as such ("Milk, soya, non-dairy
  // alternative to milk, …"). Testing for the words "milk" and "oats" anywhere
  // in the name accepted "Porridge oats, cooked, made up with semi-skimmed
  // milk" for oat milk — porridge, at two and a half times the calories.
  // CoFID carries only soya drinks; for oat or almond the right answer is no
  // row at all, and the local table has them.
  const isPlantDrinkRow =
    /\bnon-dairy\b/.test(f) ||
    /\balternative to (milk|yogurt|yoghurt)\b/.test(f) ||
    // A row *named* as the drink ("Oat drink, unsweetened"), should CoFID add them.
    /^(oat|almond|soya|soy|rice|cashew|hazelnut|hemp|pea|coconut)\s+(drink|milk)\b/.test(f);
  const isPlant = PLANT_FOOD_PATTERN.test(f);
  return !(isPlantDrinkRow && isPlant);
}

/**
 * "Dairy-free cottage cheese" must never take a cheese row's numbers. The
 * engine once let Claude rename cottage cheese to a dairy-free alternative for
 * a dairy-free user; the matcher then found "Cheese, Caerphilly" — 375
 * kcal/100 g for a soft plant cheese. There is no plant cheese in CoFID, so
 * the correct result is no match, and the caller estimates instead.
 */
export function isDairyFreeMismatch(query: string, foodName: string): boolean {
  if (!asksForNonDairy(query)) return false;
  return isDairyIngredient(foodName);
}

/** Score how well a CoFID row matches the user's ingredient name (higher = better). */
export function scoreCofidMatch(
  query: string,
  foodName: string,
  matchKind: CoFIDMatchKind,
  foodGroup?: string | null,
): number {
  const q = normalizeCofidQuery(query);
  const f = normalizeForMatch(foodName);
  if (!q || !f) return -Infinity;

  // Dairy rows share the word "milk" with every plant drink and would otherwise
  // outrank the correct plant row. Push them below any real candidate.
  if (isPlantMilkMismatch(query, foodName)) return -Infinity;
  if (isDairyFreeMismatch(query, foodName)) return -Infinity;

  // Chip/roast rows for a plain staple stay selectable (CoFID may offer nothing
  // else) but must lose to any boiled/plain sibling.
  const fatAddedPenalty = isFatAddedPrepMismatch(query, foodName) ? 3000 : 0;

  if (q === f) return 10_000;

  const primary = normalizeForMatch(primaryFoodName(foodName));
  if (primary === q || tokensEquivalent(primary, q)) {
    // The bare ingredient name matches the CoFID primary descriptor (e.g. "potato"
    // -> "Potatoes, ..."). Many rows share this primary but differ by preparation;
    // without differentiation they all tie and the winner is just DB return order,
    // which lets "potato" resolve to "chips, fried" or "roast" and inflate macros.
    // Keep a strong base, then nudge toward the plain cooked form the user means.
    // Meat and fish still prefer raw here — single-word queries ("bacon", "cod")
    // take this branch, and it is where cod found "poached in milk and butter".
    return 9000 + sameFoodPrepAdjustment(q, f) - fatAddedPenalty + rawMeatAdjustment(q, foodName);
  }

  let score = matchKindBonus(matchKind);

  const qTokens = tokenize(q);
  const fTokens = tokenize(f);
  const pTokens = tokenize(primary);

  if (qTokens.length === 1) {
    const qt = qTokens[0];

    if (pTokens.length === 1 && tokenMatches(qt, pTokens[0])) {
      score += 900;
    } else if (pTokens.length > 1) {
      const head = pTokens[pTokens.length - 1];
      const queryMatchesHead = tokenMatches(qt, head);
      const queryMatchesModifier = pTokens.slice(0, -1).some((t) => tokenMatches(qt, t));
      const distinguishingPrefixes = pTokens.slice(0, -1).filter(
        (t) => !GENERIC_FOOD_DESCRIPTORS.has(t) && !tokenMatches(qt, t),
      );

      if (queryMatchesHead) score += 750;
      if (queryMatchesHead && distinguishingPrefixes.length > 0) {
        score -= 700;
      }
      if (queryMatchesModifier && isCompositeHead(head)) score -= 700;
      else if (queryMatchesModifier && !queryMatchesHead) score -= 80;
    }

    if (/\b(flesh only|flesh and skin|raw)\b/.test(f) && !isCompositeHead(pTokens[pTokens.length - 1] ?? "")) {
      score += 140;
    }

    const group = (foodGroup ?? "").toLowerCase();
    if ((group === "fa" || group === "f" || group.startsWith("f")) && pTokens.some((t) => tokenMatches(qt, t))) {
      score += 40;
    }
  } else {
    const matchedQueryTokens = qTokens.filter((qt) => fTokens.some((ft) => tokenMatches(qt, ft)));
    score += (matchedQueryTokens.length / Math.max(qTokens.length, 1)) * 280;
    score -= (qTokens.length - matchedQueryTokens.length) * 100;
  }

  const unmatchedQuery = qTokens.filter(
    (qt) => !fTokens.some((ft) => tokenMatches(qt, ft)),
  );
  score -= unmatchedQuery.length * 80;

  const extraFoodTokens = fTokens.filter(
    (ft) => !qTokens.some((qt) => tokenMatches(qt, ft)),
  );
  score -= extraFoodTokens.length * 15;

  score -= Math.max(0, fTokens.length - qTokens.length - 2) * 10;

  for (const modifier of PROCESSED_MODIFIERS) {
    if (f.includes(modifier) && !q.includes(modifier)) score -= 45;
  }

  if (/\b(homemade|retail|takeaway|fortified)\b/.test(f) && !/\b(homemade|retail|takeaway|fortified)\b/.test(q)) {
    score -= 55;
  }

  if (/\b(raw|boiled|steamed|grilled|baked)\b/.test(q)) {
    const prep = q.match(/\b(raw|boiled|steamed|grilled|baked)\b/)?.[1];
    if (prep && f.includes(prep)) score += 35;
  }

  score += stapleGrainPulseAdjustment(q, f);
  score += minceQueryAdjustment(q, f);
  score += pastaQueryAdjustment(q, foodName);
  score += breadcrumbQueryAdjustment(q, foodName);
  score += mushroomQueryAdjustment(q, foodName);
  score += rawMeatAdjustment(q, foodName);
  score += plainOilQueryAdjustment(q, foodName);

  return score;
}

/** Pick the best CoFID row from candidates for an ingredient query. */
export function pickBestCofidCandidate(
  query: string,
  candidates: CofidCandidate[],
): CofidCandidate | null {
  if (!candidates.length) return null;

  let best: CofidCandidate | null = null;
  let bestScore = -Infinity;

  for (const candidate of candidates) {
    const score = scoreCofidMatch(
      query,
      candidate.food_name,
      candidate.matchKind,
      candidate.food_group,
    );
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  // Safety net: if the winner is a raw/dry staple form but a cooked variant exists
  // among candidates, switch to the best-scored cooked form (density-gap class fix).
  if (
    best &&
    isStapleGrainPulseQuery(query) &&
    isRawDryStapleForm(best.food_name)
  ) {
    let bestCooked: CofidCandidate | null = null;
    let bestCookedScore = -Infinity;
    for (const candidate of candidates) {
      if (!isCookedStapleForm(candidate.food_name)) continue;
      if (!stapleFoodMatchesQuery(candidate.food_name, query)) continue;
      const score = scoreCofidMatch(
        query,
        candidate.food_name,
        candidate.matchKind,
        candidate.food_group,
      );
      if (score > bestCookedScore) {
        bestCookedScore = score;
        bestCooked = candidate;
      }
    }
    if (bestCooked) return bestCooked;
  }

  // Spaghetti squash trap: bare pasta names must not resolve to the vegetable.
  if (best && isSpaghettiSquashMismatch(query, best.food_name)) {
    let bestPasta: CofidCandidate | null = null;
    let bestPastaScore = -Infinity;
    for (const candidate of candidates) {
      if (isSpaghettiSquashMismatch(query, candidate.food_name)) continue;
      if (!/\b(pasta|spaghetti)\b/i.test(candidate.food_name)) continue;
      const score = scoreCofidMatch(
        query,
        candidate.food_name,
        candidate.matchKind,
        candidate.food_group,
      );
      if (score > bestPastaScore) {
        bestPastaScore = score;
        bestPasta = candidate;
      }
    }
    if (bestPasta) return bestPasta;
  }

  return best;
}

/** Singular/plural variants for DB candidate gathering. */
/**
 * Query forms to try as a CoFID name prefix ("Tomatoes, …").
 *
 * CoFID names most foods in the plural, so a singular query has to be
 * pluralised to hit the prefix fetch — and that fetch is the precise one.
 * This used to append "s" and nothing else: "tomato" became "tomatos", which
 * matches no row, so the lookup fell through to the broad `%tomato%` net,
 * capped at 35 rows in alphabetical order. Those 35 are baked beans, chutneys
 * and curries; "Tomatoes, raw" is row 40-something. Fifteen recipes had fresh
 * tomato costed as tomato chutney, and "potato" landed on mashed-with-spread
 * the same way. Real English plurals fix it: -o → -oes, -y → -ies, sibilant
 * → -es. Both -os and -oes are tried since CoFID has "Avocados" and
 * "Tomatoes".
 */
export function cofidQueryVariants(normalised: string): string[] {
  const base = normalizeCofidQuery(normalised);
  if (!base) return [];
  const variants = new Set<string>([base]);
  const words = base.split(" ");
  const last = words[words.length - 1] ?? "";
  const withLast = (form: string) => [...words.slice(0, -1), form].join(" ");

  const singular = singularForm(last);
  if (singular !== last) variants.add(withLast(singular));

  if (last.length >= 2 && singular === last) {
    if (/[^aeiou]y$/.test(last)) {
      variants.add(withLast(`${last.slice(0, -1)}ies`));
    } else if (last.endsWith("o")) {
      variants.add(withLast(`${last}es`));
      variants.add(withLast(`${last}s`));
    } else if (/(s|x|z|ch|sh)$/.test(last)) {
      variants.add(withLast(`${last}es`));
    } else {
      variants.add(withLast(`${last}s`));
    }
  }
  return [...variants];
}
