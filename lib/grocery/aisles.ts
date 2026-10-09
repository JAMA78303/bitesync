/**
 * Groups grocery items the way a dietitian would plan a shop — by food group,
 * which is also roughly how a supermarket is laid out. Worked out from the
 * item's name when the list is shown; nothing is stored.
 *
 * Order of the checks matters. Specific phrases first ("peanut butter",
 * "green beans", "black pepper", "oat milk"), then anything that is clearly a
 * cupboard item whatever it's made from (oils, sauces, stock, dried spices),
 * then the food groups. So "garlic powder" is cupboard but "garlic" is veg,
 * and "chicken stock" is cupboard but "chicken breast" is protein.
 */

export type AisleId = "produce" | "protein" | "pulses" | "carbs" | "nuts" | "cupboard" | "other";

export const AISLES: { id: AisleId; label: string }[] = [
  { id: "produce", label: "Fruit & veg" },
  { id: "protein", label: "Protein & dairy" },
  { id: "pulses", label: "Pulses" },
  { id: "carbs", label: "Carbs" },
  { id: "nuts", label: "Nuts & seeds" },
  { id: "cupboard", label: "Cupboard" },
  { id: "other", label: "Other" },
];

/** Whole-word (or whole-word-plus-plural) match against a list of terms. */
function has(name: string, terms: string[]): boolean {
  return terms.some((t) => new RegExp(`\\b${t}(?:e?s)?\\b`).test(name));
}

const OVERRIDES: [string[], AisleId][] = [
  [["peanut butter", "almond butter", "cashew butter", "nut butter", "tahini"], "nuts"],
  [
    [
      "almond milk", "oat milk", "soy milk", "soya milk", "coconut yoghurt", "coconut yogurt",
      "soya yoghurt", "soy yoghurt", "oat yoghurt", "cream cheese", "plant milk",
    ],
    "protein",
  ],
  [
    [
      "green bean", "runner bean", "french bean", "fine bean", "broad bean", "sugar snap",
      "mangetout", "bean sprout", "beansprout", "sweet potato", "sweetcorn", "sweet corn",
      "garden pea", "frozen pea", "petits pois",
    ],
    "produce",
  ],
  [["baked bean", "refried bean", "butter bean"], "pulses"],
  [["egg noodle", "rice noodle", "rice cake", "rice paper", "oatcake", "oat cake"], "carbs"],
  [
    [
      "black pepper", "white pepper", "ground pepper", "peppercorn", "pepper flakes",
      "chilli flakes", "chili flakes", "coconut milk", "coconut cream", "stock cube",
      "dried herbs", "mixed herbs", "dried fruit", "lemon juice", "lime juice",
    ],
    "cupboard",
  ],
];

/** Clearly cupboard items, whatever they're made from. */
const CUPBOARD = [
  "oil", "vinegar", "sauce", "stock", "gravy", "ketchup", "mayonnaise", "mayo", "mustard",
  "paste", "puree", "purée", "passata", "tinned", "canned", "powder", "ground", "dried",
  "spice", "seasoning", "salt", "sugar", "honey", "syrup", "jam", "marmalade", "cocoa",
  "chocolate", "baking", "yeast", "vanilla", "extract", "bouillon", "cinnamon", "cumin",
  "paprika", "turmeric", "oregano", "nutmeg", "cayenne", "curry", "chopped tomato",
  "sultana", "raisin", "cornflour", "stevia", "sweetener",
];

const PROTEIN = [
  // meat, fish, eggs, soya
  "chicken", "beef", "pork", "lamb", "turkey", "duck", "mince", "steak", "bacon", "ham",
  "sausage", "chorizo", "salami", "gammon", "venison", "salmon", "tuna", "cod", "haddock",
  "hake", "pollock", "trout", "mackerel", "sardine", "anchovy", "anchovies", "prawn",
  "shrimp", "crab", "mussel", "squid", "fish", "seabass", "sea bass", "egg", "tofu",
  "tempeh", "seitan", "quorn",
  // dairy
  "milk", "yoghurt", "yogurt", "cheese", "cheddar", "mozzarella", "feta", "parmesan",
  "halloumi", "ricotta", "mascarpone", "paneer", "cream", "butter", "kefir", "skyr",
  "quark", "creme fraiche", "crème fraîche", "fromage frais",
];

const PULSES = [
  "lentil", "chickpea", "bean", "hummus", "houmous", "edamame", "split pea", "dal", "dhal",
  "falafel",
];

const NUTS = [
  "almond", "walnut", "cashew", "peanut", "pistachio", "hazelnut", "pecan", "macadamia",
  "brazil nut", "nut", "seed", "chia", "flaxseed", "flax", "linseed", "sesame",
];

const CARBS = [
  "bread", "loaf", "wrap", "tortilla", "pitta", "pita", "bagel", "baguette", "crumpet",
  "roll", "rice", "pasta", "spaghetti", "penne", "fusilli", "macaroni", "linguine",
  "tagliatelle", "lasagne", "noodle", "couscous", "quinoa", "bulgur", "bulgar", "freekeh",
  "buckwheat", "barley", "oat", "porridge", "granola", "muesli", "cereal", "weetabix",
  "flour", "potato", "gnocchi", "polenta", "cracker", "crispbread",
];

const PRODUCE = [
  "apple", "banana", "berry", "berries", "blueberry", "blueberries", "strawberry",
  "strawberries", "raspberry", "raspberries", "blackberry", "blackberries", "grape",
  "orange", "satsuma", "clementine", "lemon", "lime", "mango", "pineapple", "pear", "peach",
  "nectarine", "plum", "apricot", "kiwi", "melon", "watermelon", "cherry", "cherries",
  "pomegranate", "fig", "date", "avocado", "tomato", "tomatoes", "cucumber", "lettuce",
  "spinach", "kale", "chard", "broccoli", "cauliflower", "carrot", "onion", "shallot",
  "garlic", "ginger", "pepper", "courgette", "zucchini", "aubergine", "eggplant",
  "mushroom", "celery", "leek", "cabbage", "sprout", "asparagus", "pea", "corn",
  "beetroot", "squash", "butternut", "pumpkin", "parsnip", "swede", "turnip", "radish",
  "rocket", "watercress", "salad", "coriander", "parsley", "basil", "mint", "dill",
  "chive", "thyme", "rosemary", "chilli", "chili", "spring onion", "pak choi", "bok choy",
  "fennel", "artichoke", "okra", "herb",
];

export function aisleFor(rawName: string): AisleId {
  const name = rawName.toLowerCase().replace(/\s+/g, " ").trim();
  if (!name) return "other";

  for (const [terms, aisle] of OVERRIDES) {
    if (has(name, terms)) return aisle;
  }
  if (has(name, CUPBOARD)) {
    // A few cupboard words describe a form, not the food: ground meat is still
    // meat, dried or tinned pulses are still pulses, tinned fish is still fish.
    const form = (words: string[]) => has(name, words);
    if (form(["ground", "minced"]) && form(["beef", "turkey", "pork", "lamb", "chicken"])) return "protein";
    if (form(["dried", "tinned", "canned"]) && form(["lentil", "chickpea", "bean", "split pea"])) return "pulses";
    if (form(["tinned", "canned"]) && form(["tuna", "salmon", "sardine", "mackerel", "anchovy", "anchovies", "crab"])) {
      return "protein";
    }
    return "cupboard";
  }
  if (has(name, PROTEIN)) return "protein";
  if (has(name, PULSES)) return "pulses";
  if (has(name, NUTS)) return "nuts";
  if (has(name, CARBS)) return "carbs";
  if (has(name, PRODUCE)) return "produce";
  return "other";
}

/** Items grouped in aisle order, keeping each group's original order; empty groups left out. */
export function groupByAisle<T extends { name: string }>(
  items: T[],
): { id: AisleId; label: string; items: T[] }[] {
  const buckets = new Map<AisleId, T[]>();
  for (const item of items) {
    const id = aisleFor(item.name);
    const list = buckets.get(id) ?? [];
    list.push(item);
    buckets.set(id, list);
  }
  return AISLES.filter((a) => buckets.has(a.id)).map((a) => ({ ...a, items: buckets.get(a.id)! }));
}
