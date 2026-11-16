/**
 * UK SACN "free sugars" limit (≤30 g/day) excludes intrinsic sugars in whole
 * fruit, vegetables, and lactose in milk products. Sugars in fruit and
 * vegetable juices, smoothies, syrups and preserves DO count. Our micro DB
 * stores total sugars per 100 g — this maps an ingredient to the grams that
 * count toward the limit panel.
 */

const LACTOSE_SOURCES =
  /\b(milk|yoghurt|yogurt|skyr|cottage cheese|cream cheese|feta|cheese)\b/i;

/** Singular or plural: "apple" and "apples", "strawberry" and "strawberries". */
const WHOLE_FRUIT =
  /\b(bananas?|apples?|oranges?|pears?|peach(?:es)?|kiwis?|mangoe?s?|pineapples?|grapes?|strawberr(?:y|ies)|blueberr(?:y|ies)|raspberr(?:y|ies)|lemons?|limes?|avocados?|figs?|plums?|apricots?|cherr(?:y|ies)|melons?)\b/i;

const WHOLE_VEGETABLE =
  /\b(spinach|broccoli|carrot|tomato|pepper|onion|cucumber|mushroom|courgette|zucchini|peas|corn|sweet potato|potato|lettuce|kale|aubergine|eggplant|beetroot|celery|asparagus|cauliflower|cabbage|beans|green beans)\b/i;

/**
 * Fruit or vegetable names in a form whose sugars are free sugars: juiced,
 * blended, concentrated or preserved with added sugar. "Apple juice" and
 * "strawberry jam" count even though "apple" and "strawberry" don't.
 */
const FREE_SUGAR_FORM =
  /\b(juices?|smoothies?|concentrate|nectar|cordial|squash|syrup|jam|marmalade|curd|ketchup|drinks?)\b/i;

/** Grams of sugar from this ingredient that count toward the 30 g/day free-sugar limit. */
export function sugarGramsTowardFreeSugarLimit(ingredientName: string, totalSugarG: number): number {
  if (totalSugarG <= 0) return 0;
  const name = ingredientName.toLowerCase().trim();
  if (LACTOSE_SOURCES.test(name)) return 0;
  if (FREE_SUGAR_FORM.test(name)) return totalSugarG;
  if (WHOLE_FRUIT.test(name)) return 0;
  if (WHOLE_VEGETABLE.test(name)) return 0;
  return totalSugarG;
}
