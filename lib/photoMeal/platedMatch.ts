/**
 * Matching a food seen on a plate to a CoFID row.
 *
 * Recipe matching (lib/nutrition/cofidMatch.ts) is built for ingredients as
 * bought: "140 g chicken breast" means raw chicken. A photo shows food as
 * served, so it needs the cooked row, and the AI's descriptive names ("roast
 * sweet potato", "mixed salad leaves") sent the recipe matcher to the wrong
 * food entirely ("Sweets, boiled", "Salad, Waldorf"). This matcher is separate
 * so recipe costing doesn't change.
 *
 * Rules, in order:
 * 1. Every word that names the food must appear in the CoFID name, and the
 *    first part of the CoFID name must share a word with it. "Sweet potato"
 *    can't become "Sweets", "beef steak" can't become "Bacon loin steaks".
 * 2. Among those, prefer the cooking method asked for, and never raw or dried
 *    for food that is eaten cooked (rice, pasta, meat, fish, eggs, potatoes).
 * 3. Then the plainest row: fewest extra words, "average" where offered.
 * No acceptable row means no match ("unknown, not zero"), never a guess.
 *
 * Pure: the caller supplies the CoFID names (see loadCofidIndex).
 */

export const COOKING_METHODS = [
  "raw",
  "boiled",
  "steamed",
  "roasted",
  "baked",
  "grilled",
  "fried",
  "stewed",
  "scrambled",
  "poached",
  "mashed",
  "toasted",
  "none",
] as const;
export type CookingMethod = (typeof COOKING_METHODS)[number];

/** Words in a food's name that state a cooking method. */
const METHOD_WORDS: Record<string, Exclude<CookingMethod, "none">> = {
  raw: "raw",
  boiled: "boiled",
  steamed: "steamed",
  roast: "roasted",
  roasted: "roasted",
  baked: "baked",
  grilled: "grilled",
  chargrilled: "grilled",
  barbecued: "grilled",
  griddled: "grilled",
  fried: "fried",
  stirfried: "fried",
  panfried: "fried",
  deepfried: "fried",
  sauteed: "fried",
  stewed: "stewed",
  braised: "stewed",
  casseroled: "stewed",
  scrambled: "scrambled",
  poached: "poached",
  mashed: "mashed",
  toasted: "toasted",
  // "Jacket potato" is a baked potato.
  jacket: "baked",
};

/** CoFID's words for each method: the same method, then the nearest ones. */
const METHOD_IN_COFID: Record<Exclude<CookingMethod, "none">, { same: string[]; near: string[] }> = {
  raw: { same: ["raw"], near: [] },
  boiled: { same: ["boiled"], near: ["steamed", "cooked", "microwaved", "reheated"] },
  steamed: { same: ["steamed"], near: ["boiled", "microwaved"] },
  roasted: { same: ["roasted", "roast"], near: ["baked", "grilled", "barbecued", "chargrilled"] },
  baked: { same: ["baked"], near: ["roasted", "roast", "grilled"] },
  grilled: { same: ["grilled", "barbecued", "griddled", "chargrilled"], near: ["roasted", "roast", "baked", "dryfried"] },
  fried: { same: ["fried", "stirfried", "panfried", "deepfried", "dryfried"], near: ["grilled"] },
  stewed: { same: ["stewed", "casseroled", "braised"], near: ["cooked", "boiled"] },
  scrambled: { same: ["scrambled"], near: [] },
  poached: { same: ["poached"], near: ["boiled"] },
  mashed: { same: ["mashed"], near: ["boiled"] },
  toasted: { same: ["toasted"], near: [] },
};
/** Any word that says a CoFID row is cooked, ready to eat. */
const COOKED_WORDS = new Set([
  ...Object.entries(METHOD_IN_COFID)
    .filter(([m]) => m !== "raw")
    .flatMap(([, w]) => [...w.same, ...w.near]),
  "cooked",
  "microwaved",
  "reheated",
]);

/** Dropped from the food's name: they don't say which food it is. */
const FILLER = new Set([
  "a", "an", "the", "of", "and", "with", "in", "on", "some", "portion", "serving", "side", "piece", "pieces",
  "slice", "slices", "sliced", "chopped", "diced", "strips", "strip", "chunks", "cubes", "cubed", "shredded",
  "fresh", "cooked", "plain", "homemade", "home", "made", "style", "type", "cut", "small", "large", "medium",
  "big", "little", "few", "handful", "bowl", "plate", "cup",
]);

/** Describe the food but needn't appear in CoFID's name: a bonus when they do. */
const OPTIONAL = new Set([
  "baby", "mixed", "lean", "skinless", "boneless", "skin", "thin", "thick", "mini", "whole", "natural",
  "unsweetened", "salted", "unsalted", "light", "dark", "red", "green", "yellow", "white", "brown", "garden",
  // Varieties that don't change the food's nutrition much.
  "cos", "romaine", "iceberg", "gem", "butterhead", "chestnut", "button", "portobello", "closed", "organic",
  "british", "pulled", "savoy", "vine", "gala", "braeburn", "granny", "smith", "maris", "piper", "free", "range",
  "flaky",
]);

const MEAT_OR_FISH = /\b(beef|pork|lamb|chicken|turkey|gammon|venison|tuna|salmon|swordfish|cod|halibut)\b/;

/**
 * Everyday names → CoFID's wording, applied in order to the food's words
 * (after cooking and filler words are gone).
 */
const ALIASES: [RegExp, string][] = [
  [/\bbakedbeans?\b/, "baked beans"],
  [/\beggfried\b/, "egg fried"],
  [/^(?:(?:mixed|green|side|garden) )?(?:salad|salad leaves|salad greens|leafy greens|greens|leaves)$/, "lettuce"],
  [/^mixed (?:salad )?(?:leaves|greens)$/, "lettuce"],
  [/\barugula\b/, "rocket"],
  [/\bzucchini\b/, "courgette"],
  [/\beggplant\b/, "aubergine"],
  [/\bcilantro\b/, "coriander"],
  [/\bshrimps?\b/, "prawns"],
  [/^(?:oven |potato )?chips$|^(?:french )?fries$/, "potato chips"],
  [/\b(?<!curly )kale\b/, "curly kale"],
  [/^naan$/, "naan bread"],
  [/^(cos|romaine|iceberg|little gem|gem)$/, "$1 lettuce"],
  [/\b(?:penne|rigatoni|farfalle|linguine|orzo|conchiglie|tortiglioni|gemelli|ziti|bucatini|pappardelle|macaroni)(?: pasta)?\b(?! cheese)/, "pasta"],
  [/^(spaghetti|fusilli|tagliatelle)(?: pasta)?$/, "$1 pasta"],
  [/\b(?:pepperoni|salami|meat feast|meat|sausage|meatball)s? pizza\b/, "meat topped pizza"],
  [/\bmargherita(?: pizza)?\b/, "cheese and tomato pizza"],
  [/\b(?:veggie|vegetable) pizza\b/, "vegetarian pizza"],
  [/\bminced (?:meat|beef)\b|^mince$/, "beef mince"],
  [/\bjasmine rice\b/, "thai fragrant rice"],
  [/\bhummus\b/, "houmous"],
  [/\b(?:tomato )?ketchup\b/, "tomato ketchup"],
  [/\bcantaloupe(?: melon)?\b/, "cantaloupe melon"],
  [/\bhoneydew(?: melon)?\b/, "melon yellow flesh"],
  [/\bwatermelons?\b/, "watermelon melon"],
  [/\b(?:mandarin|satsuma|clementine|tangerine)s?(?: oranges?)?\b/, "citrus fruit easy peelers"],
  [/^corn$|^corn kernels$|\bcorn(?: on the)? cob\b/, "sweetcorn"],
  [/\bchick ?peas?\b|\bgarbanzos?(?: beans?)?\b/, "chick peas beans"],
  [/\b(parmesan|mozzarella|halloumi|paneer|feta|cheddar|brie|stilton|edam|gouda|camembert|ricotta|mascarpone)\b(?! cheese)/, "$1 cheese"],
  [/^(?:(red|green|yellow|orange) )?(?:bell |sweet )?peppers?$/, "$1 capsicum pepper"],
  [/^sausages?$/, "pork sausages"],
  [/^natural yogurt$/, "whole milk yogurt"],
  [/^gravy$/, "gravy instant granules"],
  [/^salad dressing$/, "french dressing"],
  [/^pizza$/, "cheese and tomato pizza"],
  [/\bwhite fish\b|^fish$/, "cod"],
  // Katsu, goujons, nuggets, "breaded chicken": CoFID's coated chicken pieces.
  [/^(?:breadcrumbs|coated|panko|katsu|popcorn) chicken(?: breasts?| fillets?| pieces?| strips?| goujons?)?$|^chicken (?:katsu|goujons?|nuggets?|dippers?|breadcrumbs)$/, "coated chicken piece"],
  // Curry sauce on its own (chips and curry sauce, katsu, Japanese curry) is the sweet, mild UK kind.
  [/^(?:(?:katsu|japanese)(?: curry)?|curry) sauce$/, "sweet curry sauce"],
  // CoFID has no croutons: they're cubes of bread crisped in oil, so fried white bread.
  [/^croutons?$/, "white bread fried"],
  // A fresh chilli on the plate, not chilli con carne.
  [/^(?:(red|green) )?(?:chill?(?:i|ies|is|y)|chiles?)(?: peppers?)$|^(red|green) (?:chill?(?:i|ies|is|y)|chiles?)$|^chillies$/, "$1$2 chilli capsicum pepper"],
  [/^(?:(?:pork|bbq|barbecue) )?(?:spare )?ribs$/, "pork spare ribs"],
  // Bought sausage rolls (bakery chains, supermarkets) are flaky pastry: CoFID's retail row.
  [/^sausage rolls?$/, "flaky sausage roll"],
  [/\b(tikka masala|korma|balti|vindaloo|madras|jalfrezi|bhuna|dhansak|rogan josh|thai green|thai red)\b(?!.*\bcurry\b)/, "$1 curry"],
];

/** Foods eaten cooked: a raw or dried row would be 2–3 times off. */
const EATEN_COOKED = new Set([
  "rice", "pasta", "spaghetti", "penne", "fusilli", "macaroni", "noodle", "couscous", "quinoa", "bulgur",
  "lentil", "millet", "barley", "buckwheat", "potato", "chicken", "beef", "pork", "lamb", "turkey", "bacon", "sausage", "steak", "mince",
  "salmon", "cod", "haddock", "fish", "egg", "prawn", "duck", "ham", "tuna",
]);

/** Ignored when counting a CoFID name's extra words: they don't change the food. */
const NEUTRAL = new Set([
  "average", "flesh", "only", "meat", "and", "in", "with", "without", "unsalted", "water", "standard",
  "whole", "lean", "fat", "oil", "sunflower", "rapeseed", "corn", "blended", "retail", "homemade",
  "takeaway", "skin", "of", "the", "a", "type", "plain", "fresh", "medium", "rasher", "style", "ready", "to", "eat",
]);

/** A crumb or batter coating adds a lot of energy: prefer uncoated rows unless the food is coated. */
const COATING = new Set(["coated", "batter", "breadcrumb"]);

function normaliseText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]s\b/g, "")
    .replace(/\b(stir|pan|deep|dry)[- ]fried\b/g, "$1fried")
    .replace(/\bchar[- ]grilled\b/g, "chargrilled")
    .replace(/\bre[- ]heated\b/g, "reheated")
    .replace(/canteloupe/g, "cantaloupe")
    .replace(/yoghurt/g, "yogurt")
    // CoFID says "in batter" and "in (bread)crumbs"; people say battered and breaded.
    .replace(/\bbattered\b/g, "batter")
    .replace(/\b(?:breaded|(?:bread)?crumbed|(?:bread)?crumbs?)\b/g, "breadcrumbs");
}

export function singular(word: string): string {
  if (word === "leaves") return "leaf";
  if (word.length <= 3 || word.endsWith("ss") || word.endsWith("us")) return word;
  if (word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (word.endsWith("oes")) return word.slice(0, -2);
  if (/(ches|shes|xes)$/.test(word)) return word.slice(0, -2);
  if (word.endsWith("s")) return word.slice(0, -1);
  return word;
}

function words(text: string): string[] {
  return normaliseText(text)
    .split(/[^a-z]+/)
    .filter(Boolean)
    .map(singular);
}

export type ParsedFood = {
  /** Words that must all appear in the CoFID name. */
  required: string[];
  /** Words that earn a bonus when they appear. */
  optional: string[];
  method: Exclude<CookingMethod, "none"> | null;
  /** The food without method or filler words: for the local food list and vitamins lookup. */
  phrase: string;
};

/**
 * "Sweet potato, roasted" → required [sweet, potato], method roasted.
 * A method passed in wins over one found in the name.
 */
export function parseFoodName(text: string, method: CookingMethod | null = null): ParsedFood {
  // Foods whose name contains a cooking word: "baked beans" aren't beans, baked.
  const protectedText = normaliseText(text)
    .replace(/\bbaked beans?\b/g, "bakedbeans")
    .replace(/\b(?:egg )?fried rice\b/g, "eggfried rice");
  let found: ParsedFood["method"] = null;
  const kept: string[] = [];
  for (const raw of protectedText.split(/[^a-z]+/).filter(Boolean)) {
    const m = METHOD_WORDS[raw];
    if (m) {
      found ??= m;
      continue;
    }
    if (FILLER.has(raw)) continue;
    kept.push(raw);
  }
  let phrase = kept.join(" ");
  for (const [pattern, replacement] of ALIASES) phrase = phrase.replace(pattern, replacement);
  phrase = phrase.replace(/\s+/g, " ").trim();
  const chosen = method && method !== "none" ? method : found;
  // Plain "chilli": a raw one is the fresh pod, otherwise the dish.
  if (/^chill?(?:i|y)$/.test(phrase)) phrase = chosen === "raw" ? "chilli capsicum pepper" : "chilli con carne";
  // "Sirloin steak" is beef unless another meat is named.
  if (/\bsteak\b/.test(phrase) && !MEAT_OR_FISH.test(phrase)) phrase = `beef ${phrase}`;
  const tokens = phrase.split(" ").filter(Boolean).map(singular);
  // The last word names the food, so it's never optional: "egg whites" aren't eggs.
  const isOptional = (t: string, i: number) => OPTIONAL.has(t) && i < tokens.length - 1;
  const required = [...new Set(tokens.filter((t, i) => !isOptional(t, i)))];
  const optional = [...new Set(tokens.filter((t, i) => isOptional(t, i)))];
  return { required, optional, method: chosen, phrase };
}

/**
 * Simpler names to try when the full name matches nothing: the food before
 * "in"/"with" ("chicken in tomato sauce" → chicken), then the head word for
 * foods where a modifier rarely changes the nutrition much ("tomato salsa" →
 * salsa, "jerk chicken" → chicken). Never for heads like cheese, sauce or
 * beans, where it does.
 */
const HEAD_FALLBACK = new Set([
  "salsa", "pasta", "pizza", "curry", "lettuce", "mushroom", "cabbage", "onion", "apple", "potato",
  "bread", "noodle", "soup", "chicken", "pork", "beef", "lamb", "turkey", "fish", "sausage", "salmon", "cod",
  "haddock", "tuna", "prawn",
]);

/** Words that change a food too much to drop: "sun dried tomato", "crispy chicken", "sweet potato". */
const NEVER_DROP = new Set([
  "dried", "dry", "sweet", "chocolate", "coconut", "cauliflower", "broccoli", "cream", "creamy", "cheese",
  "cheesy", "butter", "buttered", "sugar", "honey", "syrup", "candied", "glazed", "batter", "breadcrumb", "coated",
  "crispy", "peanut", "nut", "garlic", "fried", "stuffed", "puff", "pastry",
]);

export function fallbackFoods(text: string, method: CookingMethod | null = null): ParsedFood[] {
  const out: ParsedFood[] = [];
  const full = parseFoodName(text, method);
  const normalised = normaliseText(text).trim();
  const before = normalised.split(/\b(?:in|with)\b/)[0]!.trim();
  if (before && before !== normalised) {
    const p = parseFoodName(before, method ?? full.method);
    if (p.required.length) out.push(p);
  }
  // Drop leading words one at a time, keeping the head: "purple sweet potato" → "sweet potato".
  const head = full.required.at(-1);
  if (head && HEAD_FALLBACK.has(head)) {
    for (let i = 1; i < full.required.length; i++) {
      const dropped = full.required.slice(0, i);
      if (dropped.some((w) => NEVER_DROP.has(w))) break;
      const required = full.required.slice(i);
      out.push({ required, optional: [...full.optional, ...dropped], method: full.method, phrase: required.join(" ") });
    }
  }
  return out;
}

export type CofidName = { food_code: string; food_name: string };

/** Below this, the best row is too far from the food to use. */
const MIN_SCORE = -4;

function wantsCooked(food: ParsedFood): boolean {
  if (food.method) return food.method !== "raw";
  return food.required.some((w) => EATEN_COOKED.has(w));
}

/** Pieces served on the bone: wings, drumsticks, chops, cutlets, spare ribs (not rib-eye or rib roast). */
function isBoneIn(food: ParsedFood, queryWords: Set<string>): boolean {
  if (queryWords.has("boneless") || queryWords.has("fillet")) return false;
  const w = new Set(food.required);
  if (["wing", "drumstick", "chop", "cutlet"].some((x) => w.has(x))) return true;
  return w.has("rib") && !w.has("steak") && !w.has("eye") && !w.has("roast");
}

/** Score one CoFID row for a parsed food, or null when it isn't this food. */
export function scoreCofidName(food: ParsedFood, cofidName: string): number | null {
  const text = normaliseText(cofidName);
  const segments = text.split(",").map((s) => s.split(/[^a-z]+/).filter(Boolean).map(singular));
  const all = new Set(segments.flat());
  if (!food.required.length || !food.required.every((w) => all.has(w))) return null;
  const queryWords = new Set([...food.required, ...food.optional]);
  // "Chicken, portions, not coated, deep-fried" is never coated chicken.
  const negated = new Set([...text.matchAll(/\b(?:not|no) ([a-z]+)/g)].map((m) => singular(m[1]!)));
  if (food.required.some((w) => negated.has(w))) return null;

  // The first part of CoFID's name is the food itself ("Bacon rashers"); a
  // trailing "in gravy" / "with rice" says what it comes in.
  const firstAll = segments[0] ?? [];
  const cut = firstAll.findIndex((w) => w === "in" || w === "with");
  const first = cut > 0 ? firstAll.slice(0, cut) : firstAll;
  const firstTail = cut > 0 ? firstAll.slice(cut + 1) : [];
  if (!first.some((w) => queryWords.has(w))) return null;

  let score = 0;
  const firstExtra = first.filter((w) => !queryWords.has(w) && !NEUTRAL.has(w));
  score -= firstExtra.length * 6;
  if (firstExtra.length === 0) score += 3;
  score -= firstTail.filter((w) => !queryWords.has(w) && !NEUTRAL.has(w)).length * 2;
  for (const w of food.optional) if (all.has(w)) score += 2;

  const cooked = wantsCooked(food);
  const cookedFood = food.required.some((w) => EATEN_COOKED.has(w));
  const cookedRow = [...all].some((w) => COOKED_WORDS.has(w)) || /\bmade up\b/.test(text);
  const isRaw = all.has("raw") || all.has("uncooked");
  const isDry = all.has("dried") || all.has("dry") || all.has("powder") || all.has("granule") || all.has("flour");

  if (food.method) {
    const { same, near } = METHOD_IN_COFID[food.method];
    if (same.some((w) => all.has(w))) score += 6;
    else if (near.some((w) => all.has(w))) score += 3;
    else if (food.method !== "raw" && cookedRow) score -= 1;
  }
  if (cooked && isRaw) score -= 10;
  // No method given for food eaten cooked: any cooked row beats an unspecified one.
  if (cooked && !food.method && cookedRow) score += 2;
  // "Pasta, dried, boiled" is cooked pasta; "Gravy instant granules" isn't gravy as served.
  if (isDry && !queryWords.has("dried") && !cookedRow) score -= 8;
  if (!cooked && isRaw && !cookedFood) score += 1;
  // Meat as served usually keeps some fat: "lean" only when the name says so.
  if (all.has("lean")) {
    const withFat = all.has("fat");
    if (!withFat && !queryWords.has("lean")) score -= 0.5;
    if (withFat && queryWords.has("lean")) score -= 1;
  }

  // Wings, drumsticks, chops and ribs are judged by how big they look, bone and
  // all, so CoFID's "weighed with bone" rows fit them. Anything else is weighed
  // as the food itself.
  const withBone = /weighed with|with bones?\b|weighed whole/.test(text);
  if (withBone) score += isBoneIn(food, queryWords) ? 3 : -10;
  // "Bacon, fat only", "Beef, fat, average, cooked", "Chicken, skin, raw": a part, not the food.
  if (/\b(fat|skin) only\b/.test(text) || segments.slice(1).some((seg) => seg.length === 1 && (seg[0] === "fat" || seg[0] === "skin"))) {
    score -= 10;
  }
  const coatedRow = [...all].some((w) => COATING.has(w) && !negated.has(w));
  if (coatedRow && ![...queryWords].some((w) => COATING.has(w))) score -= 3;
  if (/\bcanned\b/.test(text) && !queryWords.has("canned")) score -= 3;
  if (/\bfrozen\b/.test(text) && !queryWords.has("frozen")) score -= 1;
  if (all.has("baby") && !queryWords.has("baby")) score -= 2;
  if (all.has("average")) score += 1.5;

  // Later parts describe the row ("old", "leg joint"); "with vegetables" makes it a different dish.
  for (const seg of segments.slice(1)) {
    const withAt = seg.indexOf("with");
    seg.forEach((w, i) => {
      if (queryWords.has(w) || NEUTRAL.has(w) || COOKED_WORDS.has(w) || w === "raw") return;
      const oilOrWater = w === "vegetable" && seg[i + 1] === "oil";
      score -= oilOrWater ? 0 : withAt >= 0 && i > withAt ? 1 : 0.4;
    });
  }
  return score;
}

/** The best CoFID row for this food, or null. A raw or dried staple is refused when it's eaten cooked. */
export function pickCofidRow<T extends CofidName>(food: ParsedFood, rows: T[]): { row: T; score: number } | null {
  let best: { row: T; score: number } | null = null;
  for (const row of rows) {
    const score = scoreCofidName(food, row.food_name);
    if (score == null) continue;
    if (!best || score > best.score || (score === best.score && row.food_name.length < best.row.food_name.length)) {
      best = { row, score };
    }
  }
  if (!best || best.score < MIN_SCORE) return null;
  // Only raw or dried rows for a food eaten cooked ("Quinoa, raw"): costing the
  // plate with them would overstate it 2–3 times. Better unknown.
  const all = new Set(words(best.row.food_name));
  const uncooked = all.has("raw") || all.has("uncooked") || all.has("dried") || all.has("dry");
  const cookedRow = [...all].some((w) => COOKED_WORDS.has(w));
  const cookedFood = food.required.some((w) => EATEN_COOKED.has(w));
  if (wantsCooked(food) && cookedFood && uncooked && !cookedRow) return null;
  return best;
}

/** How a food shows on the review screen and is stored: "Sweet potato, roasted". */
export function displayName(food: string, method: CookingMethod | null): string {
  const name = food.trim().replace(/\s+/g, " ");
  const cap = name.charAt(0).toUpperCase() + name.slice(1);
  if (!method || method === "none") return cap;
  // The name may already say it ("Roast potatoes"): don't repeat.
  if (normaliseText(name).split(/[^a-z]+/).some((w) => METHOD_WORDS[w] === method)) return cap;
  return `${cap}, ${method}`;
}
