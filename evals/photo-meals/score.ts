/** Scoring for the photo meal eval (run.ts), kept apart so it can be tested. */

export const TARGETS = {
  identification: 0.85,
  energyMedianError: 0.2,
  proteinMedianError: 0.2,
  rangeCoverage: 0.7,
} as const;

export type TrueFood = {
  /** What it is, ideally the CoFID-style name: "Rice, white, boiled". */
  name: string;
  grams: number;
  /** Words that count as naming it correctly. Defaults to the first word of name. */
  accept?: string[];
};

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** A true food counts as named if any of its accepted words appears in a predicted food's name. */
export function isNamed(truth: TrueFood, predictedNames: string[]): boolean {
  const accept = (truth.accept?.length ? truth.accept : [truth.name.split(",")[0] ?? truth.name]).map(norm);
  const predicted = predictedNames.map((p) => ` ${norm(p)} `);
  return accept.some((word) => word.length > 0 && predicted.some((p) => p.includes(` ${word}`)));
}

export function median(values: number[]): number | null {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}
