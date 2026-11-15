/**
 * Ingredient names arrive in many spellings of the same thing. These fold the
 * ones that change which food is meant, so every table lookup sees one form:
 *
 *   "0% greek yoghurt", "0% fat Greek yoghurt", "fat-free", "non-fat",
 *   "nonfat", "zero fat"           → "fat free"
 *   "low-fat", "reduced-fat", "half-fat" → "low fat", "reduced fat", "half fat"
 *   "whole wheat", "whole-wheat"    → "wholewheat"
 *
 * "0%" has to be handled before punctuation is stripped: once the "%" goes,
 * "0% greek yoghurt" reads as a quantity of 0 followed by full-fat yoghurt.
 */
export function canonicalFatAndGrainPhrase(name: string): string {
  return ` ${name.toLowerCase()} `
    .replace(/(^|[^\d.])0\s*%(\s*fat\b)?/g, "$1 fat free ")
    .replace(/\b(?:fat[- ]free|non[- ]?fat|zero[- ]fat)\b/g, "fat free")
    .replace(/\b(low|reduced|half)-fat\b/g, "$1 fat")
    .replace(/\bwhole[- ]wheat\b/g, "wholewheat")
    .replace(/\b(fat free)(?:\s+fat free)+\b/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The form used for the local nutrition and micronutrient tables, which spell
 * it "yoghurt" (CoFID spells it "yogurt", so the CoFID matcher does not use this).
 */
export function canonicalIngredientPhrase(name: string): string {
  return canonicalFatAndGrainPhrase(name).replace(/\byogurt(s?)\b/g, "yoghurt$1");
}
