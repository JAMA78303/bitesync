/**
 * Store-cupboard staples vs perishables.
 *
 * A pantry item with no quantity is treated as "enough" and drops the ingredient
 * from the grocery list entirely. That is right for a bottle of olive oil — a
 * recipe uses 8ml of 500ml, and nobody wants oil on every weekly shop. It is
 * wrong for chicken breast: owning *some* chicken says nothing about owning the
 * 980g a week of meals needs, and the item silently vanished from the list.
 *
 * Staples keep the assume-enough behaviour. Everything else must either carry a
 * quantity (so the shortfall can be worked out) or stay on the list.
 *
 * Matched on keywords rather than the ingredient catalog because pantry names are
 * free text — users type whatever they have. Predictability matters more than
 * cleverness here: this decides what silently disappears from a shopping list.
 */

const STAPLE_PATTERNS: RegExp[] = [
  // Fats and oils — bought by the bottle, used by the spoon.
  /\b(oil|ghee|lard|dripping)\b/,
  // Acids and condiments.
  /\b(vinegar|soy sauce|soya sauce|tamari|worcestershire|fish sauce|ketchup|mustard|mayonnaise|mayo|hot sauce|sriracha|tabasco|bbq sauce|horseradish|pesto|marmite|tahini)\b/,
  // Seasonings and dried herbs/spices.
  /\b(salt|peppercorns?|black pepper|white pepper|paprika|cumin|coriander seed|turmeric|cinnamon|nutmeg|ginger|cardamom|cloves?|chilli|chili|cayenne|oregano|thyme|rosemary|sage|bay lea(f|ves)|mixed herbs|italian herbs|curry powder|garam masala|five spice|seasoning|spice)\b/,
  // Baking and thickeners.
  /\b(flour|cornflour|cornstarch|baking powder|bicarbonate|bicarb|yeast|gelatine|vanilla|cocoa|cacao)\b/,
  // Sweeteners.
  /\b(sugar|honey|syrup|molasses|treacle|sweetener)\b/,
  // Stocks.
  /\b(stock|bouillon|broth cube|gravy)\b/,
  // Long-life jars and spreads used in small amounts.
  /\b(peanut butter|almond butter|nut butter|jam|marmalade|chutney|pickle)\b/,
  // Aromatics with long shelf life used a clove at a time.
  /\bgarlic\b/,
];

/**
 * True when owning this item means it never needs to appear on a shopping list,
 * even without a recorded quantity.
 */
export function isStorePantryStaple(name: string): boolean {
  const n = name.toLowerCase().trim();
  if (!n) return false;
  // "garlic bread" is not garlic; only treat the bare aromatic as a staple.
  if (/\bgarlic\b/.test(n) && /\b(bread|butter|sauce|mayo)\b/.test(n)) return false;
  return STAPLE_PATTERNS.some((re) => re.test(n));
}
