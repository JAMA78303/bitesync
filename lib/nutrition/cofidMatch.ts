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

/** Head noun of a composite product — not the produce the user asked for. */
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
  if (t.endsWith("es") && t.length > 4 && !t.endsWith("ses")) return t.slice(0, -2);
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

  if (q === f) return 10_000;

  const primary = normalizeForMatch(primaryFoodName(foodName));
  if (primary === q || tokensEquivalent(primary, q)) return 9000;

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

      if (queryMatchesHead) score += 750;
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

  return best;
}

/** Singular/plural variants for DB candidate gathering. */
export function cofidQueryVariants(normalised: string): string[] {
  const base = normalizeCofidQuery(normalised);
  const variants = new Set<string>([base]);
  if (base.endsWith("s") && base.length > 3) {
    variants.add(base.slice(0, -1));
  } else if (base.length >= 2) {
    variants.add(`${base}s`);
  }
  return [...variants];
}
