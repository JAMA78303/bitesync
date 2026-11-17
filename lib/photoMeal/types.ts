import type { MicroEntry } from "@/lib/nutrition/micros";

/** Calories and the four macros the Today screen shows. */
export type Macros = {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
};

/**
 * What a food name resolved to, per 100 g. Always from BiteSync's own
 * nutrition data (CoFID first), never from the AI: the AI only names foods
 * and guesses weights.
 */
export type FoodMatch = {
  per100: Macros;
  /** Vitamins and minerals per 100 g, or null when this food has no data (unknown, not zero). */
  micros100: MicroEntry | null;
  /** Sugar, sodium and saturated fat per 100 g, for the saved meal. Null = unknown. */
  more100: { sugar: number | null; sodiumMg: number | null; saturatedFat: number | null };
  /** Where the numbers came from, shown on the review screen: "CoFID: Rice, white, boiled". */
  source: string;
  /** The CoFID row used, or null for BiteSync's own food list. */
  cofid: { name: string; code: string } | null;
};

export type PhotoMealConfidence = "high" | "medium" | "low";

/** One food the AI saw in the photo. */
export type PhotoMealItem = {
  key: string;
  name: string;
  cookingMethod: string | null;
  /** The AI's weight range for what's on the plate, in grams. */
  gramsLow: number;
  gramsHigh: number;
  confidence: PhotoMealConfidence;
  /** Null when no nutrition data matched the name: shown as "couldn't match". */
  match: FoodMatch | null;
};

/** A fat or sauce that was probably used but can't be seen ("Was oil used?"). */
export type PhotoMealExtra = {
  key: string;
  name: string;
  grams: number;
  match: FoodMatch | null;
};

export type PhotoMealAnalysis = {
  title: string;
  items: PhotoMealItem[];
  extras: PhotoMealExtra[];
};

/** A food as the user is reviewing it: the AI's range plus their edits. */
export type ReviewItem = {
  key: string;
  name: string;
  gramsLow: number;
  gramsHigh: number;
  /** The slider's current value. Starts at the middle of the range. */
  grams: number;
  /** Once the user sets the weight, it's no longer a range. */
  edited: boolean;
  match: FoodMatch | null;
};
