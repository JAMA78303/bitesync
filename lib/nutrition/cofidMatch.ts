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

function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s,/-]/g, " ")
    .replace(/\s+/g, " ");
}

function tokenize(value: string): string[] {
  return normalizeForMatch(value)
    .split(/[\s,/]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1);
}

/** Score how well a CoFID row matches the user's ingredient name (higher = better). */
export function scoreCofidMatch(
  query: string,
  foodName: string,
  matchKind: CoFIDMatchKind,
  foodGroup?: string | null,
): number {
  const q = normalizeForMatch(query);
  const f = normalizeForMatch(foodName);
  if (!q || !f) return -Infinity;

  if (q === f) return 10_000;

  let score = 0;
  if (matchKind === "exact") score += 800;
  else if (matchKind === "fulltext") score += 350;
  else score += 120;

  const qTokens = tokenize(q);
  const fTokens = tokenize(f);

  const matchedQueryTokens = qTokens.filter((qt) =>
    fTokens.some((ft) => ft === qt || ft.startsWith(qt) || qt.startsWith(ft)),
  );
  score += (matchedQueryTokens.length / Math.max(qTokens.length, 1)) * 220;

  const unmatchedQuery = qTokens.filter(
    (qt) => !fTokens.some((ft) => ft === qt || ft.includes(qt) || qt.includes(ft)),
  );
  score -= unmatchedQuery.length * 80;

  const extraFoodTokens = fTokens.filter(
    (ft) => !qTokens.some((qt) => ft === qt || ft.includes(qt) || qt.includes(ft)),
  );
  score -= extraFoodTokens.length * 18;

  if (f.startsWith(q)) score += 90;
  if (f.includes(q)) score += 40;

  score -= Math.max(0, fTokens.length - qTokens.length - 1) * 12;

  if (f.includes(",") && !q.includes(",")) score -= 20;

  for (const modifier of PROCESSED_MODIFIERS) {
    if (f.includes(modifier) && !q.includes(modifier)) score -= 45;
  }

  if (/\braw\b/.test(f) && !/\braw\b/.test(q) && !/\bcooked\b/.test(q)) score += 15;
  if (/\b(raw|boiled|steamed|grilled|baked)\b/.test(q)) {
    const prep = q.match(/\b(raw|boiled|steamed|grilled|baked)\b/)?.[1];
    if (prep && f.includes(prep)) score += 35;
  }

  const group = (foodGroup ?? "").toLowerCase();
  if (group.includes("vegetable") && /\b(mushroom|onion|pepper|tomato|spinach|broccoli)\b/.test(q)) {
    score += 10;
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
