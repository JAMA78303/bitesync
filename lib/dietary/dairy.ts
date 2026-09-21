/**
 * Is this ingredient (or CoFID row) an animal-milk product?
 *
 * Shared by the template engine, the snack combos and the CoFID matcher so
 * "dairy free" means one thing everywhere. Until now it meant nothing in the
 * engine — only vegan, vegetarian and gluten-free were enforced, and dairy_free
 * became a sentence in Claude's prompt. The template picked Cottage Cheese &
 * Banana for a dairy-free user, Claude obeyed the sentence by renaming the
 * ingredient "dairy-free cottage cheese alternative", and the matcher costed
 * that as Caerphilly: 812 kcal and 61 g fat for a banana and some soft cheese.
 *
 * Judged by name, not by catalog role: "oat milk" fills the same template slot
 * as milk and is not dairy.
 */

const DAIRY_WORD =
  /\b(cheese|yoghurt|yogurt|milk|butter|cream|whey|ghee|paneer|halloumi|mozzarella|cheddar|feta|parmesan|ricotta|mascarpone|kefir|fromage frais|quark)\b/i;

/** Names in which a dairy word does not mean dairy. */
const NOT_DAIRY =
  /\b(oat|almond|soya?|coconut|cashew|rice|hemp|pea|plant|vegan|dairy[- ]free|non[- ]dairy|alternative to|peanut|nut|cocoa|shea|apple)\b/i;

export function isDairyIngredient(name: string): boolean {
  if (!DAIRY_WORD.test(name)) return false;
  return !NOT_DAIRY.test(name);
}

/** The user asked for the plant version: "dairy-free …", "vegan …", "non-dairy …". */
export function asksForNonDairy(name: string): boolean {
  return /\b(dairy[- ]free|non[- ]dairy|vegan|plant[- ]based)\b/i.test(name);
}
