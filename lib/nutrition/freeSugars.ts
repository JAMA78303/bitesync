/**
 * UK SACN "free sugars" limit (≤30 g/day) excludes intrinsic sugars in whole
 * fruit, vegetables, and lactose in milk products. Our micro DB stores total
 * sugars per 100 g — this maps an ingredient to the grams that count toward
 * the limit panel.
 */

const LACTOSE_SOURCES =
  /\b(milk|yoghurt|yogurt|skyr|cottage cheese|cream cheese|feta|cheese)\b/i;

const WHOLE_FRUIT =
  /\b(banana|apple|orange|pear|peach|kiwi|mango|pineapple|grape|strawberr|blueberr|raspberr|lemon|lime|avocado|fig|plum|apricot|cherry|melon)\b/i;

const WHOLE_VEGETABLE =
  /\b(spinach|broccoli|carrot|tomato|pepper|onion|cucumber|mushroom|courgette|zucchini|peas|corn|sweet potato|potato|lettuce|kale|aubergine|eggplant|beetroot|celery|asparagus|cauliflower|cabbage|beans|green beans)\b/i;

/** Grams of sugar from this ingredient that count toward the 30 g/day free-sugar limit. */
export function sugarGramsTowardFreeSugarLimit(ingredientName: string, totalSugarG: number): number {
  if (totalSugarG <= 0) return 0;
  const name = ingredientName.toLowerCase().trim();
  if (LACTOSE_SOURCES.test(name)) return 0;
  if (WHOLE_FRUIT.test(name)) return 0;
  if (WHOLE_VEGETABLE.test(name)) return 0;
  return totalSugarG;
}
