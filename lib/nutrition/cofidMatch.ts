import { asksForNonDairy, isDairyIngredient } from "@/lib/dietary/dairy";
import { canonicalFatAndGrainPhrase } from "@/lib/nutrition/ingredientPhrase";
export type CoFIDMatchKind = "exact" | "fulltext" | "partial";

export type CofidCandidate = {
  food_code: string;
  food_name: string;
  food_group: string | null;
  matchKind: CoFIDMatchKind;
};

const PROCESSED_MODIFIERS = [
  // "Rice, white, pudding, raw" is a variety for desserts, not the rice you cook.
  "pudding",
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

/**
 * Plain water, however a recipe describes it: "water", "cold water", "boiling
 * water", "tap water". Not sparkling, tonic, coconut or rose water, and not
 * water chestnuts or water biscuits.
 */
const PLAIN_WATER_PATTERN =
  /^(?:(?:cold|hot|warm|boiling|boiled|freshly|just|tap|filtered|still|iced|ice|ice-cold|lukewarm|tepid|chilled|plain|drinking|extra)\s+)*water$/;

/** A bare pasta shape, optionally "dried", "white", "egg" or "wholewheat" — not cooked, fresh or tinned. */
const PASTA_SHAPE_QUERY_PATTERN =
  /^(?:(dried|dry|uncooked|white|egg|wholewheat|wholemeal|brown) )?(spaghetti|spaghettini|penne|fusilli|macaroni|rigatoni|farfalle|conchiglie|linguine|orzo|orecchiette|bucatini|ditalini|paccheri|casarecce|gemelli|cavatappi|tagliatelle|fettuccine|fettucine|pappardelle)(?: pasta)?$/;
const RIBBON_PASTA_PATTERN = /^(?:tagliatelle|fettuccine|fettucine|pappardelle)$/;

/**
 * Everyday names for foods CoFID files under another name. Each is the same
 * food, not a stand-in:
 *   "bean sprouts"                      → CoFID "Beansprouts, mung, …"
 *   "soya beans" (frozen, not dried)    → CoFID "Beans, edamame, frozen, …"
 *   button / chestnut / closed-cup mushrooms are all Agaricus bisporus,
 *                                       → CoFID "Mushrooms, white, …"
 */
function rewriteToCofidVocabulary(query: string): string {
  let q = query.replace(/\bbean ?sprouts?\b/g, "beansprouts");
  if (!/\bdried\b/.test(q)) q = q.replace(/\b(?:soya|soy)\s+beans?\b/g, "edamame beans");
  q = q.replace(/\b(?:button|chestnut|closed[ -]cup)\s+mushrooms?\b/g, "white mushrooms");
  // CoFID files these as "Beans, blackeye, …" and "Beans, pinto, re-fried beans".
  q = q.replace(/\bblack[- ]?eyed?\b(?=\s+(?:beans?|peas?)\b)/g, "blackeye");
  q = q.replace(/\brefried\b/g, "re-fried");
  // CoFID says "canned" and "vegetables": "mushroom soup tin" is "Soup, mushroom,
  // cream of, canned"; "frozen mixed veg" is "Vegetables, mixed, frozen, …".
  q = q.replace(/\btins? of\b/g, "canned").replace(/\b(?:tinned|tins?)\b/g, "canned");
  // Re-fried beans come in a tin: CoFID's "Beans, pinto, re-fried beans"
  // (107 kcal, 1.1 g fat). "Re-fried beans" is a homemade dish fried in fat
  // (169 kcal, 8.6 g fat), and "canned" pulled in "Beans, butter, canned".
  if (!/\bhomemade\b/.test(q)) {
    q = q.replace(/\b(?:canned )?(?<!pinto )re-fried beans?(?: canned)?\b/g, "pinto re-fried beans");
  }
  q = q.replace(/\b(?:veg|veggies)\b/g, "vegetables");
  q = q.replace(/\bbbq\b/g, "barbecue");
  // A plain jar of pasta sauce is tomato based; it took "Sauce, pasta, carbonara type".
  q = q.replace(/^(?:jarred |tomato )?pasta sauce(?: jar)?$/, "sauce pasta tomato based napoletana");
  // Sweet peppers are CoFID's "Pepper, capsicum, …"; "bell pepper" took
  // "Pepper, black". Peppercorns are black pepper ("peppercorns" took sweetcorn).
  q = q.replace(/\bbell peppers?\b/g, "pepper capsicum");
  q = q.replace(/(?<!\b(?:pink|green|sichuan|szechuan)\s)\b(?:black\s+)?peppercorns?\b/g, "black pepper");
  // Rich tea is CoFID's "Biscuits, semi-sweet"; a teacake is a currant bun. Both
  // took "Tea, green, infusion" (0 kcal).
  q = q.replace(/\brich tea biscuits?\b/g, "semi-sweet biscuits");
  q = q.replace(/\btea ?cakes?\b/g, "currant buns");
  // Named teas: CoFID has black, green and herbal infusions, and "earl grey tea"
  // took green.
  q = q.replace(/\b(?:earl grey|english breakfast|breakfast|builders?|assam|darjeeling|ceylon)\s+tea\b/g, "black tea");
  q = q.replace(/\b(?:peppermint|mint|fruit|herbal|camomile|chamomile|rooibos|redbush|ginger)\s+tea\b/g, "herbal tea");
  // "black coffee" took "Coffee, Irish" (125 kcal, with whisky and cream).
  q = q.replace(/\bblack coffee\b/g, "coffee infusion");
  // CoFID files the nut as "Cashew nuts, …". Bare "cashews" scored "Cashew fruit,
  // flesh only" higher (33 kcal per 100 g instead of about 600).
  q = q.replace(/\bcashews?\b(?!\s+(?:nuts?|fruit|apples?|butter|milk|cream|drink))/g, "cashew nuts");
  if (/\bcheddar\b/.test(q)) q = rewriteCheddar(q);
  // One spelling, so the rules for dried foods see "dried" in "sundried".
  q = q.replace(/\bsun[- ]?dried\b/g, "sun dried");
  // Red pesto is the sun-dried tomato one: CoFID's "Pesto, red". "sun dried
  // tomato pesto" took grilled tomatoes (17 kcal) and "tomato pesto" took green.
  // "basil pesto" took "Basil, fresh" (40 kcal against 420).
  q = q.replace(/\b(?:sun dried )?tomato pesto\b|\bpesto rosso\b/g, "red pesto");
  q = q.replace(/\bbasil pesto\b|\bpesto genovese\b/g, "green pesto");
  // CoFID writes "Chinese 5 spice"; "chinese five spice" found nothing (0 kcal).
  // Cassia is the cinnamon most shops sell.
  q = q.replace(/\b(?:chinese )?(?:five|5)[- ]spice(?: powder)?\b/g, "chinese 5 spice");
  q = q.replace(/\bcassia(?: bark)?\b/g, "cinnamon");
  return q.replace(/\s+/g, " ").trim();
}

/**
 * CoFID files cheddar as "Cheese, Cheddar, English", "Cheese, Cheddar type,
 * half fat" and "Cheese, Cheddar type, '30% less fat'". Only a query whose
 * whole name appears in the row ("cheddar") or whose every word does ("half
 * fat cheddar") reaches them, so "grated cheddar", "mature cheddar" and
 * "reduced fat cheddar" found no row at all. Grating, maturity and strength
 * don't change cheddar per 100 g. A reduced-fat, lighter or light cheddar is
 * the 30%-less-fat kind ("reduced fat" means at least 30% less on a UK label);
 * "low fat" asks for the leanest, which is half fat.
 */
function rewriteCheddar(q: string): string {
  return q
    .replace(/\b(?:grated|shredded|mild|medium|mature|extra|vintage|strong|sharp)\s+/g, "")
    .replace(/\b(?:reduced fat|lower fat|less fat|lighter|light)\s+cheddar\b/g, "cheddar 30 less fat")
    .replace(/\blow fat\s+cheddar\b/g, "half fat cheddar");
}

/**
 * What a whole ingredient name means, in CoFID's terms. Applied to the whole
 * name only, never to one word of a longer name: "spaghetti" alone is dried
 * pasta, but "spaghetti hoops" is not "pasta hoops".
 */
function rewriteWholeQuery(q: string): string {
  // "boiling water" scored "Turnip, boiled in unsalted water" (12 kcal per 100 g).
  if (PLAIN_WATER_PATTERN.test(q)) return "water";
  // Bare "coriander" in a recipe is the fresh herb ("a handful of coriander");
  // the spice is written "ground coriander" or "coriander seeds". CoFID scored
  // "Coriander seeds" first for bare "coriander", and found nothing at all for
  // "ground coriander".
  if (q === "coriander") return "fresh coriander";
  if (/^(?:ground coriander(?: seeds?)?|(?:ground )?coriander (?:seeds?|powder))$/.test(q)) return "coriander seeds";
  // Oregano is the other way round: a recipe's "1 tsp oregano" is dried, and
  // fresh is written "fresh oregano". CoFID's fresh row has no energy figure.
  if (q === "oregano") return "dried oregano";
  // CoFID has smooth peanut butter only; crunchy is the same with nut pieces.
  // "crunchy peanut butter" found no peanut butter row and took "Butter, salted".
  if (/^crunchy peanut butter$/.test(q)) return "peanut butter";
  // A pasta shape is the same food per 100 g dry. CoFID has a dried row for
  // plain pasta but not for each shape: "fusilli" found only the boiled row,
  // "macaroni" found macaroni cheese, "spaghetti" the wholewheat one, and
  // "penne" nothing. Ribbon pastas are sold as egg pasta.
  const shape = q.match(PASTA_SHAPE_QUERY_PATTERN);
  if (shape) {
    const form = shape[1] ?? "";
    if (/^(?:wholewheat|wholemeal|brown)$/.test(form)) return "wholewheat pasta";
    return form === "egg" || RIBBON_PASTA_PATTERN.test(shape[2]) ? "egg pasta" : "pasta";
  }
  return q;
}

/**
 * The query CoFID is searched and scored with. Overrides and the lookup cache
 * stay keyed on normalizeCofidQuery, so an override for "spaghetti" would
 * still apply.
 */
export function cofidSearchQuery(name: string): string {
  return rewriteWholeQuery(rewriteNamesCofidLacks(normalizeCofidQuery(name)));
}

export function isPlainWaterQuery(name: string): boolean {
  return PLAIN_WATER_PATTERN.test(normalizeForMatch(name));
}

/** Normalise an ingredient name before CoFID lookup / override resolution. */
export function normalizeCofidQuery(name: string): string {
  const base = normalizeForMatch(canonicalFatAndGrainPhrase(name))
    .replace(/^\d+(?:\.\d+)?\s*(?:g|kg|ml|l|oz|lb)\s+/i, "")
    .replace(/^\d+(?:\.\d+)?\s+/, "")
    .trim();
  return rewriteToCofidVocabulary(base);
}

/**
 * Extra full-text queries for words CoFID spells differently: "wholemeal pasta"
 * finds nothing, but CoFID files it as "Pasta, wholewheat, …"; "yoghurt" is
 * "Yogurt" there.
 */
export function cofidSynonymQueries(normalised: string): string[] {
  const swaps: [RegExp, string][] = [
    [/\bwholemeal\b/g, "wholewheat"],
    [/\bwholewheat\b/g, "wholemeal"],
    [/\byoghurts?\b/g, "yogurt"],
  ];
  const out = new Set<string>();
  for (const [from, to] of swaps) {
    const alt = normalised.replace(from, to);
    if (alt !== normalised) out.add(alt);
  }
  return [...out];
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
  // -es is a plural ending only after ch, sh, x, z or ss ("peaches", "boxes").
  // Elsewhere the e belongs to the word: "cakes" → "cake", "olives" → "olive"
  // (this used to give "cak" and "oliv", which matched neither singular).
  if (/(?:ch|sh|x|z|ss)es$/.test(t) && t.length > 4) return t.slice(0, -2);
  if (t.endsWith("s") && t.length > 3 && !t.endsWith("ss")) return t.slice(0, -1);
  return t;
}

/** Words CoFID spells differently from most recipes; same food either way. */
const TOKEN_SYNONYMS: Record<string, string> = {
  wholemeal: "wholewheat",
  yoghurt: "yogurt",
};

function canonicalToken(token: string): string {
  const s = singularForm(token);
  return TOKEN_SYNONYMS[s] ?? s;
}

function tokenMatches(queryToken: string, foodToken: string): boolean {
  const q = canonicalToken(queryToken);
  const f = canonicalToken(foodToken);
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
// ---------------------------------------------------------------------------
// Staples come in two as-bought forms, and the bare name means the form you
// buy:
//
//   Grains and pasta are bought dry. "95 g rice" is 95 g from the packet, and
//   is costed on the raw row — the convention of every recipe and every app's
//   recipe builder. For a week these were costed on the boiled row instead,
//   with a "cooked weight" label to make that honest; now the label is gone
//   because the number is what the scales say.
//
//   Pulses are bought in a tin, cooked and drained. "240 g chickpeas" is the
//   drained tin, and is costed on the canned / boiled row. Costing that on the
//   dried row would triple it — the calorie-dense trap the pulse steering
//   exists to prevent.
//
// A query that names its own form ("cooked rice", "dried lentils") gets it.
// ---------------------------------------------------------------------------
const DRY_GRAIN_QUERY_PATTERN =
  /\b(rice|pasta|quinoa|couscous|bulgur|oats?|porridge oats|barley|farro|freekeh|semolina|noodles?|spaghetti|macaroni|penne|fusilli|linguine|tagliatelle|orzo)\b/i;
const COOKED_QUERY_PATTERN = /\b(cooked|boiled|steamed|leftover|pre-?cooked|microwave|ready)\b/i;
const PASTA_SHAPE_PATTERN =
  /\b(spaghetti|tagliatelle|penne|fusilli|macaroni|linguine|fettuccine|pasta)\b/i;
const MINCE_QUERY_PATTERN = /\b(mince|minced)\b/i;
const BREADCRUMB_QUERY_PATTERN = /\bbreadcrumbs?\b/i;
const MUSHROOM_QUERY_PATTERN = /\bmushrooms?\b/i;
const PLAIN_OIL_QUERY_PATTERN = /\b(rapeseed|canola|vegetable|sunflower|olive|groundnut|peanut)\s+oil\b/i;
const STAPLE_PULSE_PATTERN =
  /\b(kidney\s*beans?|black\s*beans?|baked\s*beans?|butter\s*beans?|cannellini|borlotti|haricot|pinto\s*beans?|flageolet|black[- ]?eyed?\s*beans?|blackeye\s*beans?|aduki|adzuki|mung\s*beans?|red\s*kidney|chickpeas?|lentils?)\b/i;

const RAW_DRY_PREP_PATTERN = /\b(raw|dried|dry|uncooked)\b/;
const COOKED_PREP_PATTERN = /\b(boiled|steamed|poached|cooked|re-heated|reheated)\b/;

export function queryRequestsRawDry(query: string): boolean {
  return RAW_DRY_PREP_PATTERN.test(normalizeCofidQuery(query));
}

/** A bare pulse name ("lentils", "chickpeas"): means the tin, costed cooked. */
export function isStaplePulseQuery(query: string): boolean {
  const q = normalizeCofidQuery(query);
  if (!q || queryRequestsRawDry(q)) return false;
  return STAPLE_PULSE_PATTERN.test(q);
}

/** A bare grain or pasta name ("rice", "pasta", "oats"): means the packet, costed dry. */
export function isDryGrainQuery(query: string): boolean {
  const q = normalizeCofidQuery(query);
  if (!q || COOKED_QUERY_PATTERN.test(q)) return false;
  if (/\b(rice cakes?|rice flour|rice paper|rice milk|rice pudding|oat milk|oatcakes?)\b/.test(q)) return false;
  return DRY_GRAIN_QUERY_PATTERN.test(q);
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
function staplePrepAdjustment(query: string, normalisedFood: string): number {
  if (isStaplePulseQuery(query)) {
    let adj = 0;
    if (isRawDryStapleForm(normalisedFood)) adj -= 150;
    if (isCookedStapleForm(normalisedFood)) adj += 100;
    return adj;
  }
  if (isDryGrainQuery(query)) {
    let adj = 0;
    if (isRawDryStapleForm(normalisedFood)) adj += 150;
    if (isCookedStapleForm(normalisedFood)) adj -= 150;
    return adj;
  }
  // "cooked rice", "leftover pasta": the user has said which form they mean.
  if (DRY_GRAIN_QUERY_PATTERN.test(normalizeCofidQuery(query)) && COOKED_QUERY_PATTERN.test(query)) {
    let adj = 0;
    if (isRawDryStapleForm(normalisedFood)) adj -= 150;
    if (isCookedStapleForm(normalisedFood)) adj += 150;
    return adj;
  }
  return 0;
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
  const dryGrain = isDryGrainQuery(query);
  for (const modifier of PROCESSED_MODIFIERS) {
    // Grains and pasta are bought dried: for them it's the plain form, not processing.
    if (modifier === "dried" && dryGrain) continue;
    if (normalisedFood.includes(modifier) && !query.includes(modifier)) adj -= 40;
  }
  // Prefer the plain cooked form when one exists — except for grains, bought dry.
  if (isCookedStapleForm(normalisedFood) && !dryGrain) adj += 60;
  adj += staplePrepAdjustment(query, normalisedFood);
  adj += asBoughtFormAdjustment(query, normalisedFood);
  adj += plainPastaAdjustment(query, normalisedFood);
  return adj;
}

/**
 * Bare "pasta" means plain dried pasta. "Pasta, egg, fresh, raw" used to win:
 * every "Pasta, …" row ties on the name, and "dried" counted as processing.
 */
function plainPastaAdjustment(query: string, normalisedFood: string): number {
  if (!PASTA_SHAPE_PATTERN.test(query)) return 0;
  let adj = 0;
  for (const word of ["fresh", "egg", "wholewheat", "coloured", "flavoured", "filled"]) {
    if (new RegExp(`\\b${word}\\b`).test(normalisedFood) && !new RegExp(`\\b${word}\\b`).test(query)) adj -= 60;
  }
  return adj;
}

/**
 * Two kinds of same-name row a bare name does not mean:
 *   - a "cooking" variety ("Apples, cooking, …" is Bramley, about half the
 *     sugar of an eating apple) unless the query says cooking or Bramley;
 *   - a "weighed with skin and core" row, which is per 100 g of the whole
 *     fruit including the parts nobody eats, unless the query asks for that.
 * "apple" used to tie across every "Apples, …" row and land on cooking apple
 * weighed with core (27 kcal/100 g against 51 for an eating apple).
 */
function asBoughtFormAdjustment(query: string, normalisedFood: string): number {
  let adj = 0;
  if (/\bcooking\b/.test(normalisedFood) && !/\b(cooking|bramley)\b/.test(query)) adj -= 400;
  // "Mango, unripe, green flesh, raw" tied with "Mangoes, ripe, flesh only, raw"
  // and won on row order. A recipe's mango is ripe unless it says green.
  if (/\bunripe\b/.test(normalisedFood) && !/\b(unripe|green)\b/.test(query)) adj -= 400;
  if (
    /\bweighed with\b/.test(normalisedFood) &&
    !/\b(whole|weighed|with (skin|core|bones?|stones?|shells?))\b/.test(query)
  ) {
    adj -= 150;
  }
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

/** Mushroom varieties a bare "mushrooms" does not mean. */
const NAMED_MUSHROOM_PATTERN = /\b(oyster|shiitake|chinese|jew s ear|porcini|enoki|chanterelle|morel)\b/;

/**
 * Bare "mushrooms" → white/button, raw. Not oyster or shiitake unless the query
 * names them: "mushrooms" was landing on "Mushrooms, shiitake, cooked" (55
 * kcal/100 g, eight times white mushrooms) because the cooked-form nudge broke
 * the tie between same-name rows.
 */
function mushroomQueryAdjustment(query: string, foodName: string): number {
  if (!MUSHROOM_QUERY_PATTERN.test(normalizeCofidQuery(query))) return 0;
  const q = normalizeForMatch(query);
  const f = normalizeForMatch(foodName);
  const named = f.match(NAMED_MUSHROOM_PATTERN)?.[1];
  if (named && !new RegExp(`\\b${named}\\b`).test(q)) return named === "oyster" ? -900 : -600;
  // Dried mushrooms are about 20 times the energy of fresh by weight.
  if (/\bdried\b/.test(f) && !/\bdried\b/.test(q)) return -600;
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
  if (!isStaplePulseQuery(q) && !isDryGrainQuery(q) && !/\b(potato|potatoes)\b/.test(q)) return false;
  return FAT_ADDED_PREP_PATTERN.test(normalizeForMatch(foodName));
}

/**
 * A bare staple resolving to its raw/dry row. `pickBestCofidCandidate` already
 * prefers a cooked sibling when one exists among the candidates; this covers the
 * case where CoFID offers no cooked form at all, where raw grain is ~3x denser.
 */
export function isRawStapleMismatch(query: string, foodName: string): boolean {
  if (!isStaplePulseQuery(query)) return false;
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

// ---------------------------------------------------------------------------
// Rows that are a different food from the one asked for.
//
// Scoring ranks candidates, so when CoFID has no row for the food at all, the
// "best" one is still some other food: black beans became a black gram curry,
// canned black beans became butter beans, wholewheat noodles became egg
// noodles, rice cakes became raw rice. Each rule below rejects a row outright;
// when every candidate is rejected the lookup returns nothing and the local
// table (which has these foods) answers instead.
// ---------------------------------------------------------------------------

/** Tokens for the rules below: hyphenated words compare part by part ("semi-skimmed", "Stir-fry"). */
function ruleTokens(value: string): string[] {
  return normalizeForMatch(value)
    .split(/[\s,/-]+/)
    .filter((t) => t.length > 1)
    .map(canonicalToken);
}

/** Query words that describe a form, size or fat level rather than which food it is. */
const VARIETY_NEUTRAL_WORDS = new Set(
  [
    ...GENERIC_FOOD_DESCRIPTORS,
    "natural",
    "organic",
    "british",
    "free",
    "range",
    "large",
    "small",
    "extra",
    "fat",
    "low",
    "reduced",
    "half",
    "skinless",
    "boneless",
    "ground",
    "or",
    "of",
    "for",
    "the",
    "in",
  ].map(canonicalToken),
);

/**
 * Foods whose varieties differ enough that another variety is a different food:
 * black beans vs butter or broad beans, wholewheat vs egg noodles, vegetable vs
 * chicken stock. Not apples, onions, lentils or rice, where CoFID's generic row
 * is a fair stand-in for a named variety ("bramley apple" → "Apples, cooking"),
 * and not pasta, whose shapes are the same food ("orzo" → "Pasta, … dried").
 */
const VARIETY_SENSITIVE_HEADS = new Set(["bean", "noodle", "stock", "broth", "water"].map(canonicalToken));

/**
 * Heads where a row without the head word is a different food too. CoFID has
 * no coconut water, and "coconut water" took "Coconut, desiccated" (604 kcal
 * per 100 g, against about 20).
 */
const HEAD_REQUIRED = new Set(["water"].map(canonicalToken));

/**
 * The row is the same kind of food but a different variety: "black beans" vs
 * "Beans, butter, …" or "Beans, blackeye, …"; "wholewheat noodles" vs
 * "Noodles, egg, …"; "black turtle beans" vs "Beans, broad, …". Fires when the
 * row contains the query's head noun but none of the words that say which one.
 */
export function isVarietyMismatch(query: string, foodName: string): boolean {
  const words = ruleTokens(normalizeCofidQuery(query)).filter((t) => !VARIETY_NEUTRAL_WORDS.has(t));
  if (words.length < 2) return false;
  const head = words[words.length - 1];
  if (!VARIETY_SENSITIVE_HEADS.has(head)) return false;
  const row = new Set(ruleTokens(foodName));
  if (!row.has(head)) return HEAD_REQUIRED.has(head);
  return !words.slice(0, -1).some((w) => row.has(w));
}

/** Rows that are a prepared dish, whatever is in them. */
const DISH_LEAD_WORDS = new Set(
  [
    "curry",
    "salad",
    "soup",
    "stew",
    "casserole",
    "pie",
    "pizza",
    "sandwich",
    "lasagne",
    "risotto",
    "korma",
    "biryani",
    "bhaji",
    "samosa",
    "pasty",
    "quiche",
    "omelette",
    "kebab",
    "burger",
    "dhal",
    "dal",
    "stir",
    "moussaka",
    "hotpot",
    "goulash",
  ].map(canonicalToken),
);

/** Cooking liquids that describe how a single food was prepared, not a second food. */
const PREP_LIQUID_PATTERN = /\bin (?:unsalted |salted )?(?:water|brine)\b|\bmade up with water\b|\bweighed with [\w ]+?(?=,|$)|\bwith(?:out)? (?:skin|bones?)\b|\bwith added \w+\b/g;

/**
 * The row is a dish the query food is one ingredient of: "Curry, black gram …
 * and red kidney bean", "Salad, wholemeal pasta, with vegetables and
 * mayonnaise", "Chicken, stir-fried with peppers in black bean sauce", "Rice
 * and black-eye beans". The row's lead word is not one of the query's words,
 * and it is either a dish word or joins several foods with "with", "in" or "and".
 */
export function isCompositeDishMismatch(query: string, foodName: string): boolean {
  const queryWords = new Set(ruleTokens(normalizeCofidQuery(query)));
  const lead = ruleTokens(primaryFoodName(foodName))[0];
  if (!lead || queryWords.has(lead)) return false;
  if (DISH_LEAD_WORDS.has(lead)) return true;
  const rest = normalizeForMatch(foodName).replace(PREP_LIQUID_PATTERN, " ");
  return /\b(with|in|and)\b/.test(rest);
}

const PUFFED_CAKE_PATTERN = /\b(rice|corn)\s+cakes?\b/;

/**
 * Rice and corn cakes are puffed grain, not cake and not raw grain: "rice cake"
 * took "Cake, chocolate fudge", "rice cakes" took "Rice, brown, basmati, raw"
 * and then "Cakes, crispie". The row has to name both the grain and the cake.
 */
export function isPuffedCakeMismatch(query: string, foodName: string): boolean {
  const grain = normalizeCofidQuery(query).match(PUFFED_CAKE_PATTERN)?.[1];
  if (!grain) return false;
  const row = ruleTokens(foodName);
  return !row.includes(grain) || !row.includes("cake");
}

const STOCK_QUERY_PATTERN = /\b(stock|broth|bouillon)\b/;
const STOCK_CONCENTRATE_QUERY_PATTERN = /\b(cubes?|pots?|powder|granules|concentrate|gel|paste|bouillon|dried|dry)\b/;
const STOCK_CONCENTRATE_ROW_PATTERN = /\b(cubes?|gel|powder|granules|concentrate|dried)\b/;

/**
 * "Vegetable stock" in millilitres is the made-up liquid. CoFID's "Stock cubes,
 * vegetable" is per 100 g of dry cube (13.5 g protein, 17.3 g fat): 300 ml of
 * stock costed on it came to 40 g protein and 52 g fat. It must also be a stock
 * row at all — with the cube ruled out, "Vegetables, mixed, frozen" was next.
 */
export function isStockConcentrateMismatch(query: string, foodName: string): boolean {
  const q = normalizeCofidQuery(query);
  if (!STOCK_QUERY_PATTERN.test(q)) return false;
  const f = normalizeForMatch(foodName);
  if (!/\b(stock|broth|bouillon)\b/.test(f)) return true;
  const madeUp = /\bmade up\b/.test(f);
  // A cube, powder or pot is the concentrate: "vegetable stock powder" took
  // "Stock, chicken, ready made" (12 kcal against about 250), and "vegetable
  // bouillon" took mixed frozen vegetables.
  if (STOCK_CONCENTRATE_QUERY_PATTERN.test(q)) return !STOCK_CONCENTRATE_ROW_PATTERN.test(f) || madeUp;
  return STOCK_CONCENTRATE_ROW_PATTERN.test(f) && !madeUp;
}

const REDUCED_FAT_QUERY_PATTERN = /\b(fat free|low fat|reduced fat|half fat)\b/;
const REDUCED_FAT_ROW_PATTERN =
  /\b(fat free|low fat|reduced fat|half fat|lighter|light|lite|diet|skimmed|semi-skimmed)\b/;

/** "0% Greek yoghurt" must not take a full-fat row (133 kcal and 10 g fat per 100 g). */
export function isFatLevelMismatch(query: string, foodName: string): boolean {
  if (!REDUCED_FAT_QUERY_PATTERN.test(normalizeCofidQuery(query))) return false;
  return !REDUCED_FAT_ROW_PATTERN.test(normalizeForMatch(foodName));
}

/**
 * "Low fat yoghurt" means plain: CoFID files "Yogurt, low fat, fruit",
 * "…, hazelnut" and "…, toffee" beside "…, plain", and they tie on words.
 */
function plainYogurtAdjustment(query: string, f: string): number {
  if (!/\byogh?urt\b/.test(f) || !/\b(plain|natural)\b/.test(f)) return 0;
  return /\b(plain|natural)\b/.test(query) ? 0 : 40;
}

/** Words that make a "chilli" query the dish rather than the pepper. */
const CHILLI_DISH_QUERY_PATTERN =
  /\b(con carne|quorn|beans?|lentils?|vegetable|veggie|vegan|vegetarian|mince|beef|turkey|meal)\b/;

/**
 * CoFID files chilli con carne and its bean, Quorn and vegetable versions as
 * "Chilli, …" and "Chilli con carne, …". In an ingredient list "chilli" or
 * "chilli flakes" is the pepper: "chilli flakes" was costed as Quorn chilli
 * (83 kcal per 100 g), and bare "chilli" as bean and lentil chilli.
 */
export function isChilliDishMismatch(query: string, foodName: string): boolean {
  const primary = normalizeForMatch(primaryFoodName(foodName));
  if (!/^chilli(?: con carne)?$/.test(primary)) return false;
  return !CHILLI_DISH_QUERY_PATTERN.test(normalizeCofidQuery(query));
}

const NUT_BUTTER_QUERY_PATTERN =
  /\b(cashew|almond|hazelnut|peanut|walnut|pistachio|brazil|macadamia|pecan|sunflower|pumpkin|sesame)s?\s+(?:nut\s+|seed\s+)?butter\b/;

/**
 * A nut or seed butter is that nut, ground, so the row must name the nut.
 * "cashew butter" took "Butter, salted" (dairy: 744 kcal and 52 g saturated
 * fat per 100 g). CoFID has peanut butter; for other nuts the nut itself is
 * the closest row ("Cashew nuts, kernel only, plain").
 */
export function isNutButterMismatch(query: string, foodName: string): boolean {
  const nut = normalizeCofidQuery(query).match(NUT_BUTTER_QUERY_PATTERN)?.[1];
  if (!nut) return false;
  return !ruleTokens(foodName).includes(canonicalToken(nut));
}

const SAUCE_QUERY_PATTERN = /\bsauces?\b/;
const SAUCE_ROW_PATTERN = /\b(sauces?|ketchup|pesto|dressing|gravy|relish|chutney|mayonnaise|puree|paste)\b/;
const DRY_MIX_PATTERN = /\b(packet|mix|mixes|dry|dried|powder|granules)\b/;
/** Words that say how a sauce is sold or made, not which sauce it is. */
const SAUCE_NEUTRAL_WORDS = new Set(
  [
    ...VARIETY_NEUTRAL_WORDS,
    "sauce",
    "jar",
    "bottle",
    "bottled",
    "squeezy",
    "pot",
    "sachet",
    "ready",
    "made",
    "readymade",
    "shop",
    "bought",
    "chilled",
    "classic",
    "original",
    "smooth",
    "thick",
    "chunky",
    "salt",
    "sugar",
    "sodium",
  ].map(canonicalToken),
);

/**
 * A sauce must be that sauce. CoFID has no row for most bottled sauces, and
 * "teriyaki sauce", "hot sauce", "pizza sauce jar" and a dozen others took
 * "Sauce, duck a l'orange"; "oyster sauce" took "Oysters, raw", "black bean
 * sauce" canned butter beans, "pasta sauce" a dried pasta-and-sauce mix (358
 * kcal) and "sweet chilli sauce" "Sauce, Chinese cook in, sweet & sour". The
 * row has to be a sauce, carry every word that says which sauce, and not be a
 * dry mix unless asked for. A food in a sauce ("sardines in tomato sauce") is
 * left to the other rules: its row is the food.
 */
export function isSauceMismatch(query: string, foodName: string): boolean {
  const q = normalizeCofidQuery(query);
  if (!SAUCE_QUERY_PATTERN.test(q) || /\bin\b/.test(q)) return false;
  // The row's own name, before the first comma, must be a sauce: "Curry,
  // chicken, made with cook-in sauce" is a curry.
  if (!SAUCE_ROW_PATTERN.test(normalizeForMatch(primaryFoodName(foodName)))) return true;
  const f = normalizeForMatch(foodName);
  if (DRY_MIX_PATTERN.test(f) && !DRY_MIX_PATTERN.test(q)) return true;
  const row = new Set(ruleTokens(foodName));
  return ruleTokens(q).some((w) => !SAUCE_NEUTRAL_WORDS.has(w) && !row.has(w));
}

const SPICE_PEPPER_ROW_PATTERN = /^pepper, (black|white|cayenne)\b/;
const SPICE_PEPPER_QUERY_PATTERN = /\b(black|white|cayenne|ground|cracked|seasoning)\b/;

/** Sweet peppers aren't the spice: "roasted peppers jar" took "Pepper, black" (277 kcal). */
export function isSpicePepperMismatch(query: string, foodName: string): boolean {
  if (!SPICE_PEPPER_ROW_PATTERN.test(normalizeForMatch(foodName))) return false;
  return !SPICE_PEPPER_QUERY_PATTERN.test(normalizeCofidQuery(query));
}

const BAKED_GOOD_PATTERN = /\b(biscuits?|cakes?|teacakes?|loaf|bread|buns?|scones?|brack)\b/;

/** A tea biscuit or tea loaf is not the drink ("Tea, green, infusion", 0 kcal). */
export function isTeaDrinkMismatch(query: string, foodName: string): boolean {
  if (!/^tea\b/.test(normalizeForMatch(foodName))) return false;
  return BAKED_GOOD_PATTERN.test(normalizeCofidQuery(query));
}

/**
 * "Water" in front of another word names a different food: water chestnuts
 * took "Chestnuts, kernel only, raw" (170 kcal, not 46) and a water biscuit
 * took "Biscuits, cheese flavoured". Those rows must name "water" and the
 * word after it ("Water chestnuts, raw"). "In water" and "made up with water"
 * say how something was cooked or packed, so they don't count on either side.
 * A water itself ("coconut water") is isVarietyMismatch's.
 */
export function isWaterFoodMismatch(query: string, foodName: string): boolean {
  const queryText = normalizeCofidQuery(query).replace(PREP_LIQUID_PATTERN, " ");
  const words = ruleTokens(queryText).filter((t) => !VARIETY_NEUTRAL_WORDS.has(t));
  const at = words.indexOf("water");
  if (at === -1 || at === words.length - 1) return false;
  const rowText = normalizeForMatch(foodName).replace(PREP_LIQUID_PATTERN, " ");
  const row = new Set(ruleTokens(rowText));
  const singular = (w: string) => w.replace(/s$/, "");
  const next = singular(words[at + 1]);
  return !(row.has("water") && [...row].some((t) => singular(t) === next));
}

/** "Salsa dip" and "tzatziki dip" took "Dips, sour-cream based" (360 kcal). */
export function isSourCreamDipMismatch(query: string, foodName: string): boolean {
  if (!/\bsour-cream based\b/.test(normalizeForMatch(foodName))) return false;
  return !/\bsour[ -]?cream\b/.test(normalizeCofidQuery(query));
}

/** CoFID has no salsa; "tomato salsa" took "Tomatoes, cherry, raw". */
export function isSalsaMismatch(query: string, foodName: string): boolean {
  if (!/\bsalsa\b/.test(normalizeCofidQuery(query))) return false;
  return !/\bsalsa\b/.test(normalizeForMatch(foodName));
}

const TEXTURED_SOYA_QUERY_PATTERN =
  /\b(?:textured (?:vegetable|soya?) protein|tvp|soya? (?:mince|chunks?|pieces))\b/;

/**
 * Textured soya protein (TVP, dried soya mince and chunks) is about 370 kcal
 * and 50 g protein per 100 g. CoFID has none, and "textured vegetable
 * protein" took "Vegetables, mixed, frozen, boiled" (42 kcal, 3 g protein).
 */
export function isTexturedSoyaMismatch(query: string, foodName: string): boolean {
  if (!TEXTURED_SOYA_QUERY_PATTERN.test(normalizeCofidQuery(query))) return false;
  return !/\b(?:textured|tvp)\b/.test(normalizeForMatch(foodName));
}

/** Any of the rules above: the row is a different food, so it must never be picked. */
export function isDifferentFoodRow(query: string, foodName: string): boolean {
  return (
    isTexturedSoyaMismatch(query, foodName) ||
    isCompositeDishMismatch(query, foodName) ||
    isVarietyMismatch(query, foodName) ||
    isPuffedCakeMismatch(query, foodName) ||
    isStockConcentrateMismatch(query, foodName) ||
    isFatLevelMismatch(query, foodName) ||
    isChilliDishMismatch(query, foodName) ||
    isNutButterMismatch(query, foodName) ||
    isSauceMismatch(query, foodName) ||
    isSpicePepperMismatch(query, foodName) ||
    isTeaDrinkMismatch(query, foodName) ||
    isWaterFoodMismatch(query, foodName) ||
    isSourCreamDipMismatch(query, foodName) ||
    isSalsaMismatch(query, foodName)
  );
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
  if (isDifferentFoodRow(query, foodName)) return -Infinity;
  if (isWrongFormRow(query, foodName)) return -Infinity;

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
    return (
      9000 +
      sameFoodPrepAdjustment(q, f) -
      fatAddedPenalty +
      rawMeatAdjustment(q, foodName) +
      mushroomQueryAdjustment(q, foodName)
    );
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

  score += staplePrepAdjustment(q, f);
  score += minceQueryAdjustment(q, f);
  score += pastaQueryAdjustment(q, foodName);
  score += breadcrumbQueryAdjustment(q, foodName);
  score += mushroomQueryAdjustment(q, foodName);
  score += rawMeatAdjustment(q, foodName);
  score += plainOilQueryAdjustment(q, foodName);
  score += asBoughtFormAdjustment(q, f);
  score += plainYogurtAdjustment(q, f);

  return score;
}

const DRIED_ROW_PATTERN = /\b(dried|dehydrated)\b/;
const DRIED_QUERY_PATTERN = /\b(dried|dry|dehydrated|powder|powdered|ground|flakes)\b/;

/**
 * A dried row for a name that doesn't ask for dried. Grains and pulses are
 * excluded: their dry and cooked forms are steered by the staple rules above.
 */
export function isUnaskedDriedForm(query: string, foodName: string): boolean {
  const q = normalizeCofidQuery(query);
  if (DRIED_QUERY_PATTERN.test(q)) return false;
  if (isDryGrainQuery(q) || isStaplePulseQuery(q)) return false;
  return DRIED_ROW_PATTERN.test(normalizeForMatch(foodName));
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
    isStaplePulseQuery(query) &&
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

  // Dried-form trap: "green beans" is a primary-name match for "Green beans,
  // dried" (246 kcal per 100 g), which outranks "Beans, green, raw" (24). A name
  // that doesn't say dried means the fresh food when CoFID has one.
  if (best && isUnaskedDriedForm(query, best.food_name)) {
    let bestFresh: CofidCandidate | null = null;
    let bestFreshScore = -Infinity;
    for (const candidate of candidates) {
      if (isUnaskedDriedForm(query, candidate.food_name)) continue;
      if (!stapleFoodMatchesQuery(candidate.food_name, query)) continue;
      const score = scoreCofidMatch(
        query,
        candidate.food_name,
        candidate.matchKind,
        candidate.food_group,
      );
      if (score > bestFreshScore) {
        bestFreshScore = score;
        bestFresh = candidate;
      }
    }
    if (bestFresh) return bestFresh;
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

// ---------------------------------------------------------------------------
// Names CoFID has no row for, and rows in the wrong form (16 Nov 2026 audit).
// ---------------------------------------------------------------------------

/** Bird's eye and Thai chillies are small fresh chillies; CoFID has red and green. */
const SMALL_CHILLI_PATTERN =
  /^(?:(red|green) )?(?:thai |(?:thai )?birds?(?: s)? eye |bird )(?:(red|green) )?chill?(?:i|is|ies|es)$/;
/** Butter with garlic or herbs beaten in. CoFID has none; it is nearly all butter. */
const FLAVOURED_BUTTER_PATTERN =
  /^(?:(?:wild )?garlic|herbs?|parsley|chives?)(?: (?:and )?(?:(?:wild )?garlic|herbs?|parsley|chives?))* butter$/;
/** Plain cooked rice. CoFID calls it boiled. */
const PLAIN_COOKED_RICE_PATTERN =
  /^(?:cooked|boiled|steamed|leftover|leftover cooked|plain cooked|plain boiled)(?: white)?(?: long grain)? rice$/;
const COOKED_PASTA_PREFIX_PATTERN = /^(?:cooked|boiled|leftover|leftover cooked) (.+)$/;
/** Spaghetti in tomato sauce from a tin, by its shop names. */
const TINNED_SPAGHETTI_PATTERN =
  /^(?:canned )?(?:spaghetti hoops|alphabet spaghetti|spaghetti(?: hoops)? in tomato sauce|canned spaghetti|spaghetti canned)(?: canned)?$/;

/**
 * Whole names that found nothing in CoFID, or the wrong food, rewritten to
 * the row for the same food. Applied to the whole name, before
 * rewriteWholeQuery.
 */
function rewriteNamesCofidLacks(q: string): string {
  // "bird's eye chilli" found no row and went to the AI estimate.
  const chilli = q.match(SMALL_CHILLI_PATTERN);
  if (chilli) return `${chilli[1] ?? chilli[2] ?? "red"} chilli`;
  // "garlic butter" tied with "Garlic, raw": 98 kcal per 100 g, not about 700.
  if (FLAVOURED_BUTTER_PATTERN.test(q)) return "butter";
  // "cooked rice" matched "Rice, egg fried, ready cooked" because only rows
  // that say "cooked" were fetched, and CoFID says "boiled".
  if (PLAIN_COOKED_RICE_PATTERN.test(q)) return "boiled long grain rice";
  // CoFID's "Pasta, spaghetti, canned, in tomato sauce" (72 kcal). "spaghetti
  // hoops" found nothing and was costed as dry spaghetti.
  if (TINNED_SPAGHETTI_PATTERN.test(q)) return "pasta spaghetti canned";
  // "cooked penne" found no row, and the local table costs penne dry.
  const cooked = q.match(COOKED_PASTA_PREFIX_PATTERN);
  const shape = cooked?.[1].match(PASTA_SHAPE_QUERY_PATTERN);
  if (shape && !/^(?:dried|dry|uncooked)$/.test(shape[1] ?? "")) {
    if (/^(?:wholewheat|wholemeal|brown)$/.test(shape[1] ?? "")) return "boiled wholewheat pasta";
    return shape[2] === "spaghetti" ? "boiled spaghetti" : "boiled pasta";
  }
  return q;
}

/**
 * The row is the food in a form other than the one the name asks for, and
 * the two forms differ several-fold per 100 g. Prep scoring only nudges
 * between forms, so when CoFID has just the wrong one it was still taken:
 *   "dried mango"        → "Mangoes, ripe, flesh only, raw"  48 kcal (dried ~320)
 *   "cooked quinoa"      → "Quinoa, raw"                     309 kcal (cooked ~120)
 *   "dried rice noodles" → "Noodles, rice, fine, dried, boiled…" 89 kcal (dry ~360)
 * Rejecting the row sends the name on to the local table.
 */
export function isWrongFormRow(query: string, foodName: string): boolean {
  const q = normalizeCofidQuery(query);
  const f = normalizeForMatch(foodName);
  const staple = DRY_GRAIN_QUERY_PATTERN.test(q) || STAPLE_PULSE_PATTERN.test(q);
  if (/\b(?:dried|dehydrated)\b/.test(q)) {
    // A fresh food's raw row, for a name that asks for the dried food.
    if (/\braw\b/.test(f) && !/\b(?:dried|dehydrated|dry)\b/.test(f)) return true;
    // A preserve, a tin or a dish made with it: with the fresh rows gone,
    // "dried mango" took "Chutney, mango, sweet" and "sun dried tomatoes" took
    // "Tomatoes, stuffed with rice".
    const made = f.match(/\b(?:chutney|jam|pickle|juice|sauce|relish|conserve|marmalade|compote|canned|tinned|stewed|syrup|stuffed|with)\b/);
    if (made && !q.includes(made[0])) return true;
    // A boiled or canned staple, for a name that asks for it dried.
    if (staple && isCookedStapleForm(f)) return true;
    // Any undried tomato row, for dried tomatoes: with the raw rows gone,
    // "sun dried tomatoes" took "Tomatoes, standard, grilled" (17 kcal per
    // 100 g, against about 180 drained from a jar). CoFID has no dried tomato.
    if (DRIED_TOMATO_QUERY_PATTERN.test(q) && !/\b(?:dried|dehydrated|dry)\b/.test(f)) return true;
  }
  // A raw or dry staple, for a name that says it is cooked.
  if (staple && COOKED_QUERY_PATTERN.test(q) && isRawDryStapleForm(f)) return true;
  // Dried noodles are noodles: with the boiled row gone, "dried rice noodles"
  // took "Rice, pilau, plain, homemade".
  if (/\b(?:dried|dry)\b/.test(q) && /\bnoodles?\b/.test(q) && !/\bnoodles?\b/.test(f)) return true;
  // Rice noodles are rice noodles: "flat rice noodles" and "rice vermicelli"
  // took raw rice grain. Names that only come dry (vermicelli, rice sticks,
  // pad thai, flat) can't take CoFID's only rice noodle row either, which is
  // boiled (89 kcal per 100 g, against about 360 dry), so the local table
  // answers. Bare "rice noodles" keeps the boiled row: Tesco's own "Rice
  // Noodles" are a ready-to-wok pack.
  if (RICE_NOODLE_QUERY_PATTERN.test(q)) {
    if (!/\bnoodles?\b/.test(f) || !/\brice\b/.test(f)) return true;
    if (DRY_RICE_NOODLE_QUERY_PATTERN.test(q) && !COOKED_QUERY_PATTERN.test(q) && isCookedStapleForm(f)) return true;
  }
  return false;
}

/** "sun dried tomatoes", "dried cherry tomatoes": the tomatoes themselves, not a pesto or paste. */
const DRIED_TOMATO_QUERY_PATTERN = /\bdried (?:cherry )?tomato(?:es)?(?: in (?:olive |sunflower )?oil)?$/;
const RICE_NOODLE_QUERY_PATTERN = /\brice (?:noodles?|vermicelli|sticks?)\b|\bvermicelli rice\b/;
const DRY_RICE_NOODLE_QUERY_PATTERN = /\b(?:dried|dry|flat|vermicelli|sticks?|pad thai)\b/;
