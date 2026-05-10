/**
 * Typical retail / portion weights for whole foods (UK-oriented).
 * Shared by grocery display (piece count) and nutrition gram conversion.
 */
export type PieceWeightEntry = { label: string; grams: number };

export const PIECE_WEIGHT_MAP: Record<string, PieceWeightEntry> = {
  apple: { label: "apple", grams: 182 },
  banana: { label: "banana", grams: 118 },
  egg: { label: "egg", grams: 58 },
  eggs: { label: "egg", grams: 58 },
  orange: { label: "orange", grams: 131 },
  lemon: { label: "lemon", grams: 84 },
  lime: { label: "lime", grams: 67 },
  avocado: { label: "avocado", grams: 200 },
  "bell pepper": { label: "bell pepper", grams: 160 },
  pepper: { label: "pepper", grams: 160 },
  "red pepper": { label: "red pepper", grams: 160 },
  "yellow pepper": { label: "yellow pepper", grams: 160 },
  "green pepper": { label: "green pepper", grams: 160 },
  tomato: { label: "tomato", grams: 123 },
  onion: { label: "onion", grams: 150 },
  "red onion": { label: "red onion", grams: 150 },
  shallot: { label: "shallot", grams: 30 },
  potato: { label: "potato", grams: 213 },
  "sweet potato": { label: "sweet potato", grams: 200 },
  carrot: { label: "carrot", grams: 80 },
  courgette: { label: "courgette", grams: 200 },
  cucumber: { label: "cucumber", grams: 300 },
  "garlic clove": { label: "garlic clove", grams: 5 },
  garlic: { label: "garlic bulb", grams: 40 },
  broccoli: { label: "broccoli head", grams: 400 },
  cauliflower: { label: "cauliflower", grams: 600 },
  corn: { label: "corn cob", grams: 150 },
  "corn on the cob": { label: "corn cob", grams: 150 },
  mango: { label: "mango", grams: 300 },
  peach: { label: "peach", grams: 150 },
  pear: { label: "pear", grams: 178 },
  plum: { label: "plum", grams: 78 },
  kiwi: { label: "kiwi", grams: 76 },
};

const SORTED_KEYS = Object.keys(PIECE_WEIGHT_MAP).sort((a, b) => b.length - a.length);

/** Longest substring match on normalised ingredient name. */
export function matchPieceWeight(normalisedName: string): PieceWeightEntry | null {
  const n = normalisedName.toLowerCase().trim();
  if (!n) return null;
  if (PIECE_WEIGHT_MAP[n]) return PIECE_WEIGHT_MAP[n];
  for (const key of SORTED_KEYS) {
    if (n.includes(key)) return PIECE_WEIGHT_MAP[key];
  }
  return null;
}
