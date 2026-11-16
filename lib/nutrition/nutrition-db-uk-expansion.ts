import type { NutritionLookupEntry } from "@/types";

type TupleRow = readonly [
  string,
  number,
  number,
  number,
  number,
  number?,
  number?,
  number?,
  number?,
];

function fromTuple(row: TupleRow): NutritionLookupEntry {
  const [name, cal, p, c, f, fi = 0, su = 0, na = 0, sa = 0] = row;
  return {
    name,
    per_100g: {
      calories: cal,
      protein_g: p,
      carbs_g: c,
      fat_g: f,
      fibre_g: fi,
      sugar_g: su,
      sodium_mg: na,
      saturated_fat_g: sa,
    },
  };
}

/** UK-focused additions merged after core DB (deduped by name). Generated — approximate values. */
const ROWS: TupleRow[] = [
  [
    "chicken thigh",
    209,
    26,
    0,
    11,
    0,
    0,
    95,
    3
  ],
  [
    "chicken drumstick",
    172,
    28,
    0,
    5.7,
    0,
    0,
    91,
    1.6
  ],
  [
    "chicken wings",
    203,
    30,
    0,
    8.1,
    0,
    0,
    82,
    2.3
  ],
  [
    "chicken mince",
    148,
    17,
    0,
    8.5,
    0,
    0,
    75,
    2.4
  ],
  [
    "turkey breast",
    135,
    30,
    0,
    1,
    0,
    0,
    63,
    0.3
  ],
  [
    "turkey mince",
    159,
    21,
    0,
    7.7,
    0,
    0,
    70,
    2
  ],
  [
    "beef mince",
    254,
    17,
    0,
    20,
    0,
    0,
    72,
    7.8
  ],
  [
    "lean beef mince",
    174,
    20,
    0,
    10,
    0,
    0,
    72,
    4
  ],
  [
    "beef steak",
    271,
    26,
    0,
    18,
    0,
    0,
    59,
    7
  ],
  [
    "sirloin steak",
    207,
    29,
    0,
    9.7,
    0,
    0,
    55,
    3.8
  ],
  [
    "ribeye steak",
    291,
    24,
    0,
    21,
    0,
    0,
    54,
    9
  ],
  [
    "lamb chops",
    294,
    25,
    0,
    21,
    0,
    0,
    72,
    9
  ],
  [
    "lamb mince",
    282,
    17,
    0,
    23,
    0,
    0,
    68,
    10
  ],
  [
    "pork chops",
    231,
    28,
    0,
    13,
    0,
    0,
    65,
    4.5
  ],
  [
    "pork mince",
    226,
    16,
    0,
    18,
    0,
    0,
    63,
    6.5
  ],
  [
    "bacon",
    215,
    14,
    0,
    17,
    0,
    0,
    1717,
    6
  ],
  [
    "bacon rashers",
    215,
    14,
    0,
    17,
    0,
    0,
    1717,
    6
  ],
  [
    "ham",
    107,
    17,
    1.3,
    3.5,
    0,
    1.2,
    1203,
    1.2
  ],
  [
    "sausages",
    294,
    11,
    9.5,
    24,
    0.5,
    1,
    860,
    8.5
  ],
  [
    "chorizo",
    455,
    24,
    1.9,
    38,
    0,
    1,
    1650,
    14
  ],
  [
    "salmon fillet",
    208,
    20,
    0,
    13,
    0,
    0,
    59,
    3.1
  ],
  [
    "smoked salmon",
    142,
    23,
    0,
    4.5,
    0,
    0,
    1880,
    0.9
  ],
  [
    "tuna steak",
    132,
    28,
    0,
    1.3,
    0,
    0,
    47,
    0.3
  ],
  [
    "tuna canned",
    116,
    26,
    0,
    0.6,
    0,
    0,
    396,
    0.2
  ],
  [
    "cod fillet",
    82,
    18,
    0,
    0.7,
    0,
    0,
    77,
    0.1
  ],
  [
    "haddock",
    79,
    17,
    0,
    0.6,
    0,
    0,
    75,
    0.1
  ],
  [
    "mackerel",
    305,
    19,
    0,
    25,
    0,
    0,
    90,
    5.8
  ],
  [
    "sardines",
    208,
    25,
    0,
    11,
    0,
    0,
    307,
    2.9
  ],
  [
    "king prawns",
    99,
    21,
    0.9,
    0.9,
    0,
    0,
    661,
    0.2
  ],
  [
    "shrimp",
    99,
    21,
    0.9,
    0.9,
    0,
    0,
    661,
    0.2
  ],
  [
    "mussels",
    86,
    12,
    3.7,
    2,
    0,
    0,
    286,
    0.4
  ],
  [
    "sea bass",
    97,
    18,
    0,
    2.5,
    0,
    0,
    68,
    0.6
  ],
  [
    "tilapia",
    96,
    20,
    0,
    1.7,
    0,
    0,
    56,
    0.6
  ],
  [
    "eggs",
    155,
    13,
    1.1,
    11,
    0,
    1.1,
    124,
    3.3
  ],
  [
    "egg white",
    52,
    11,
    0.7,
    0.2,
    0,
    0.7,
    166,
    0
  ],
  [
    "egg yolk",
    322,
    16,
    3.6,
    27,
    0,
    3.6,
    48,
    8
  ],
  [
    "whole milk",
    61,
    3.2,
    4.8,
    3.3,
    0,
    4.8,
    43,
    2.1
  ],
  [
    "skimmed milk",
    35,
    3.4,
    5,
    0.2,
    0,
    5,
    44,
    0.1
  ],
  [
    "semi skimmed milk",
    46,
    3.3,
    5,
    1.6,
    0,
    5,
    43,
    1
  ],
  [
    "oat milk",
    46,
    1,
    6.6,
    1.5,
    0.8,
    4,
    50,
    0.2
  ],
  [
    "almond milk",
    24,
    0.5,
    3.4,
    1.1,
    0.3,
    3,
    72,
    0.1
  ],
  [
    "soy milk",
    42,
    3,
    5,
    1.8,
    0.4,
    3.5,
    51,
    0.3
  ],
  [
    "greek yoghurt",
    97,
    9,
    3.6,
    5,
    0,
    3.6,
    36,
    3.2
  ],
  [
    "natural yoghurt",
    61,
    3.5,
    4.7,
    3.3,
    0,
    4.7,
    43,
    2.1
  ],
  [
    "low fat yoghurt",
    56,
    4.3,
    7.7,
    0.8,
    0,
    7.7,
    58,
    0.5
  ],
  [
    "cheddar cheese",
    403,
    25,
    0.1,
    33,
    0,
    0.1,
    621,
    21
  ],
  [
    "mozzarella",
    280,
    28,
    2.2,
    17,
    0,
    1,
    627,
    11
  ],
  [
    "feta cheese",
    264,
    14,
    4.1,
    21,
    0,
    4.1,
    1116,
    15
  ],
  [
    "parmesan",
    431,
    38,
    3.2,
    29,
    0,
    0.3,
    1602,
    18
  ],
  [
    "cream cheese",
    342,
    6,
    4.1,
    34,
    0,
    3.7,
    321,
    21
  ],
  [
    "creme fraiche",
    300,
    2.4,
    2.9,
    30,
    0,
    2.9,
    39,
    19
  ],
  // CoFID 11-861 "Rice, white, long grain, raw": dry, as bought, like the bare name in a recipe.
  // Was a cooked figure (130 kcal), so the recipe-form preview read low.
  [
    "white rice",
    355,
    6.7,
    85.1,
    1,
    1.1,
    0.2,
    1,
    0.25
  ],
  // CoFID 11-868 "Rice, brown, wholegrain, raw": dry, as bought, like the bare name in a recipe.
  // Was a cooked figure (112 kcal), so the recipe-form preview read low.
  [
    "brown rice",
    333,
    7.7,
    77,
    1.5,
    3,
    0.7,
    0,
    0.28
  ],
  // CoFID 11-857 "Rice, white, basmati, raw": dry, as bought, like the bare name in a recipe.
  // Was a cooked figure (121 kcal), so the recipe-form preview read low.
  [
    "basmati rice",
    351,
    8.1,
    83.7,
    0.5,
    1.1,
    0.1,
    1,
    0.14
  ],
  // CoFID 11-716 "Pasta, white, dried, raw": dry, as bought, like the bare name in a recipe.
  // Was a cooked figure (131 kcal), so the recipe-form preview read low.
  [
    "spaghetti",
    343,
    11.3,
    75.6,
    1.6,
    3.7,
    2.1,
    2,
    0.23
  ],
  // CoFID 11-716 "Pasta, white, dried, raw": dry, as bought, like the bare name in a recipe.
  // Was a cooked figure (131 kcal), so the recipe-form preview read low.
  [
    "penne",
    343,
    11.3,
    75.6,
    1.6,
    3.7,
    2.1,
    2,
    0.23
  ],
  // CoFID 11-718 "Pasta, wholewheat, spaghetti, dried, raw": dry, as bought, like the bare name in a recipe.
  // Was a cooked figure (124 kcal), so the recipe-form preview read low.
  [
    "wholemeal pasta",
    329,
    12.6,
    68.3,
    2.5,
    11.7,
    3.9,
    3,
    0.4
  ],
  [
    "white bread",
    266,
    9,
    51,
    3.3,
    2.4,
    3.8,
    491,
    0.7
  ],
  [
    "wholemeal bread",
    217,
    9.4,
    37,
    2.7,
    6.4,
    3.4,
    459,
    0.6
  ],
  [
    "sourdough",
    274,
    9.5,
    53,
    1.9,
    2.4,
    1.8,
    517,
    0.4
  ],
  [
    "porridge oats",
    389,
    17,
    66,
    7,
    10,
    1,
    2,
    1.2
  ],
  [
    "couscous",
    112,
    3.8,
    23,
    0.2,
    1.4,
    0.1,
    5,
    0
  ],
  // CoFID 11-904 "Wheat, bulgur, raw": dry, as bought, like the bare name in a recipe.
  // Was a cooked figure (83 kcal), so the recipe-form preview read low.
  [
    "bulgur wheat",
    352,
    10.6,
    77.8,
    2,
    6.7,
    1.1,
    5,
    0.28
  ],
  // CoFID 11-719 "Noodles, egg, dried, raw": dry, as bought, like the bare name in a recipe.
  // Was a cooked figure (138 kcal), so the recipe-form preview read low.
  [
    "noodles",
    338,
    12,
    72.6,
    2,
    3.9,
    1.7,
    500,
    0.31
  ],
  [
    "rice noodles",
    109,
    2,
    25,
    0.2,
    0.9,
    0,
    10,
    0
  ],
  [
    "tortilla wrap",
    313,
    8.3,
    52,
    8,
    3,
    2.2,
    590,
    2
  ],
  [
    "pitta bread",
    265,
    9.1,
    53,
    1.7,
    2.3,
    1.9,
    500,
    0.3
  ],
  [
    "potatoes",
    77,
    2,
    17,
    0.1,
    1.3,
    0.7,
    6,
    0
  ],
  [
    "sweet potato",
    86,
    1.6,
    20,
    0.1,
    3,
    4.2,
    55,
    0
  ],
  [
    "new potatoes",
    70,
    1.7,
    15,
    0.3,
    1.5,
    1.3,
    7,
    0.1
  ],
  [
    "lettuce",
    15,
    1.4,
    2.9,
    0.2,
    1.3,
    1.9,
    28,
    0
  ],
  [
    "rocket",
    25,
    2.6,
    3.7,
    0.7,
    1.6,
    2,
    27,
    0.1
  ],
  [
    "cucumber",
    15,
    0.7,
    3.6,
    0.1,
    0.5,
    1.7,
    2,
    0
  ],
  [
    "tomatoes",
    18,
    0.9,
    3.9,
    0.2,
    1.2,
    2.6,
    5,
    0
  ],
  [
    "cherry tomatoes",
    18,
    0.9,
    3.9,
    0.2,
    1.2,
    2.6,
    5,
    0
  ],
  [
    "onion",
    40,
    1.1,
    9.3,
    0.1,
    1.7,
    4.2,
    4,
    0
  ],
  [
    "red onion",
    40,
    1.1,
    9.3,
    0.1,
    1.7,
    4.2,
    4,
    0
  ],
  [
    "garlic cloves",
    149,
    6.4,
    33,
    0.5,
    2.1,
    1,
    17,
    0.1
  ],
  [
    "ginger",
    80,
    1.8,
    18,
    0.8,
    2,
    1.7,
    13,
    0.2
  ],
  [
    "carrots",
    41,
    0.9,
    10,
    0.2,
    2.8,
    4.7,
    69,
    0
  ],
  [
    "celery",
    16,
    0.7,
    3,
    0.2,
    1.6,
    1.3,
    80,
    0
  ],
  [
    "peppers",
    31,
    1,
    6,
    0.3,
    2.1,
    4.2,
    3,
    0
  ],
  [
    "red pepper",
    31,
    1,
    6,
    0.3,
    2.1,
    4.2,
    3,
    0
  ],
  [
    "green pepper",
    20,
    0.9,
    4.6,
    0.2,
    1.7,
    2.6,
    3,
    0
  ],
  [
    "yellow pepper",
    27,
    1,
    6.3,
    0.2,
    0.9,
    5,
    2,
    0
  ],
  [
    "courgette",
    17,
    1.2,
    3.1,
    0.3,
    1,
    2.5,
    8,
    0.1
  ],
  [
    "aubergine",
    25,
    1,
    6,
    0.2,
    3,
    3.5,
    2,
    0
  ],
  [
    "cauliflower",
    25,
    1.9,
    5,
    0.3,
    2,
    1.9,
    30,
    0.1
  ],
  [
    "cabbage",
    25,
    1.3,
    5.8,
    0.1,
    2.5,
    3.2,
    18,
    0
  ],
  [
    "leeks",
    61,
    1.5,
    14,
    0.3,
    1.8,
    3.9,
    10,
    0
  ],
  [
    "asparagus",
    20,
    2.2,
    3.9,
    0.1,
    2.1,
    1.9,
    2,
    0
  ],
  [
    "frozen peas",
    81,
    5.4,
    14,
    0.4,
    5.1,
    5.7,
    5,
    0.1
  ],
  [
    "sweetcorn",
    86,
    3.3,
    19,
    1.4,
    2.7,
    3.2,
    15,
    0.2
  ],
  [
    "beetroot",
    43,
    1.6,
    10,
    0.2,
    2.8,
    6.8,
    78,
    0
  ],
  [
    "butternut squash",
    45,
    1,
    12,
    0.1,
    1.5,
    2.2,
    4,
    0
  ],
  [
    "pumpkin",
    26,
    1,
    6.5,
    0.1,
    0.5,
    2.8,
    1,
    0
  ],
  [
    "strawberries",
    32,
    0.7,
    7.7,
    0.3,
    2,
    4.9,
    1,
    0
  ],
  [
    "blueberries",
    57,
    0.7,
    14,
    0.3,
    2.4,
    10,
    1,
    0
  ],
  [
    "raspberries",
    52,
    1.2,
    12,
    0.7,
    6.5,
    4.4,
    1,
    0
  ],
  [
    "grapes",
    67,
    0.6,
    17,
    0.4,
    0.9,
    16,
    2,
    0.1
  ],
  [
    "pineapple",
    50,
    0.5,
    13,
    0.1,
    1.4,
    10,
    1,
    0
  ],
  [
    "watermelon",
    30,
    0.6,
    7.6,
    0.2,
    0.4,
    6.2,
    1,
    0
  ],
  [
    "avocado",
    160,
    2,
    9,
    15,
    7,
    0.7,
    7,
    2.1
  ],
  [
    "pear",
    57,
    0.4,
    15,
    0.1,
    3.1,
    10,
    1,
    0
  ],
  [
    "peach",
    39,
    0.9,
    10,
    0.3,
    1.5,
    8.4,
    0,
    0
  ],
  [
    "kiwi",
    61,
    1.1,
    15,
    0.5,
    3,
    9,
    3,
    0.1
  ],
  [
    "red lentils",
    116,
    9,
    20,
    0.4,
    7.9,
    1.8,
    2,
    0.1
  ],
  [
    "black beans",
    132,
    8.9,
    24,
    0.5,
    8.7,
    0.3,
    1,
    0.1
  ],
  [
    "kidney beans",
    127,
    8.7,
    22,
    0.5,
    6.4,
    0.3,
    2,
    0.1
  ],
  [
    "cannellini beans",
    93,
    6.6,
    17,
    0.2,
    3.3,
    0.3,
    5,
    0
  ],
  [
    "baked beans",
    94,
    5,
    18,
    0.4,
    3.7,
    5.2,
    530,
    0.1
  ],
  [
    "edamame",
    121,
    11,
    10,
    5.2,
    5.2,
    2.2,
    6,
    0.7
  ],
  [
    "tempeh",
    193,
    19,
    9.4,
    11,
    0,
    0,
    9,
    2.2
  ],
  [
    "walnuts",
    654,
    15,
    14,
    65,
    6.7,
    2.6,
    2,
    6.1
  ],
  [
    "cashews",
    553,
    18,
    30,
    44,
    3.3,
    5.9,
    12,
    7.8
  ],
  [
    "peanuts",
    567,
    26,
    16,
    49,
    8.5,
    4.7,
    18,
    6.9
  ],
  [
    "peanut butter",
    588,
    25,
    20,
    50,
    6,
    9,
    459,
    10
  ],
  [
    "chia seeds",
    486,
    17,
    42,
    31,
    34,
    0,
    16,
    3.3
  ],
  [
    "flaxseeds",
    534,
    18,
    29,
    42,
    27,
    1.5,
    30,
    3.7
  ],
  [
    "sunflower seeds",
    584,
    21,
    20,
    51,
    8.6,
    2.6,
    9,
    4.5
  ],
  [
    "pumpkin seeds",
    559,
    30,
    11,
    49,
    6,
    1.4,
    7,
    8.7
  ],
  [
    "sesame seeds",
    573,
    17,
    23,
    50,
    11,
    0.3,
    11,
    7
  ],
  [
    "vegetable oil",
    884,
    0,
    0,
    100,
    0,
    0,
    0,
    14
  ],
  [
    "coconut oil",
    862,
    0,
    0,
    100,
    0,
    0,
    0,
    87
  ],
  [
    "soy sauce",
    53,
    5.4,
    8,
    0.1,
    0.8,
    1.7,
    5720,
    0
  ],
  [
    "tomato puree",
    82,
    4.5,
    16,
    0.5,
    3.5,
    10,
    38,
    0.1
  ],
  [
    "passata",
    36,
    1.7,
    7.3,
    0.2,
    1.5,
    5.5,
    16,
    0
  ],
  [
    "coconut milk",
    230,
    2.3,
    5.5,
    23,
    2.2,
    3.3,
    15,
    20
  ],
  [
    "vegetable stock",
    7,
    0.5,
    1.2,
    0.1,
    0,
    0.8,
    280,
    0
  ],
  [
    "salt",
    0,
    0,
    0,
    0,
    0,
    0,
    38758,
    0
  ],
  [
    "sugar",
    387,
    0,
    100,
    0,
    0,
    100,
    1,
    0
  ],
  [
    "plain flour",
    364,
    10,
    76,
    1,
    2.7,
    0.3,
    2,
    0.2
  ],
  [
    "wholemeal flour",
    340,
    13,
    64,
    2.2,
    9,
    2.9,
    3,
    0.3
  ],
  [
    "whey protein",
    400,
    80,
    10,
    7,
    0,
    5,
    200,
    3
  ],
  [
    "cumin",
    375,
    18,
    44,
    22,
    10,
    2.3,
    168,
    1.5
  ],
  [
    "paprika",
    282,
    14,
    54,
    13,
    35,
    10,
    68,
    2.1
  ],
  [
    "turmeric",
    354,
    8,
    65,
    10,
    21,
    3.2,
    38,
    3.1
  ],
  [
    "cinnamon",
    247,
    4,
    81,
    1.2,
    53,
    2.2,
    10,
    0.3
  ],
  [
    "black pepper",
    251,
    10,
    64,
    3.3,
    25,
    0.6,
    20,
    1
  ],
  [
    "chilli flakes",
    282,
    12,
    50,
    14,
    27,
    10,
    30,
    2.5
  ],
  [
    "mixed herbs",
    259,
    13,
    42,
    6.4,
    37,
    2.7,
    77,
    1.5
  ],
  [
    "basil",
    23,
    3.2,
    2.7,
    0.6,
    1.6,
    0.3,
    4,
    0
  ],
  [
    "coriander",
    23,
    2.1,
    3.7,
    0.5,
    2.8,
    0.9,
    46,
    0
  ],
  [
    "parsley",
    36,
    3,
    6.3,
    0.8,
    3.3,
    0.9,
    56,
    0.1
  ],
  [
    "rosemary",
    131,
    3.3,
    21,
    5.9,
    14,
    0.7,
    26,
    2.8
  ],
  [
    "thyme",
    101,
    5.6,
    24,
    1.7,
    14,
    1.7,
    55,
    0.5
  ],
  // CoFID 11-742 "Breakfast cereal, cornflakes, fortified". Was 390 kcal and 2 g fat.
  [
    "cornflakes",
    376,
    7.1,
    90.9,
    0.8,
    2.6,
    7.3,
    450,
    0.14
  ],
  // CoFID 11-763 "Breakfast cereal, bran flakes, fortified". Was 400 kcal and 3 g fat.
  [
    "bran flakes",
    333,
    9.6,
    73.3,
    2.2,
    13.4,
    21,
    360,
    0.31
  ],
  // CoFID 11-750 "Breakfast cereal, rice, toasted/crisp, fortified". Was 372
  // kcal and 4 g fat.
  [
    "rice krispies",
    374,
    5.7,
    91.2,
    1,
    0.7,
    12.4,
    370,
    0.22
  ],
  [
    "coco pops",
    367,
    10,
    78,
    5,
    7,
    21,
    389,
    1
  ],
  // CoFID 11-749 "Breakfast cereal, cornflakes, frosted, fortified". Was 371
  // kcal and 6 g fat.
  [
    "frosties",
    350,
    4.7,
    87,
    0.5,
    2,
    38.3,
    300,
    0.09
  ],
  [
    "shreddies",
    381,
    7,
    80,
    7,
    5,
    18,
    415,
    2
  ],
  // CoFID 11-1019 "Breakfast cereal, multigrain hoops, fortified". Cheerios are multigrain
  // hoops. Was 385 kcal and 2 g fat.
  [
    "cheerios",
    368,
    7.9,
    80.7,
    3.8,
    5.7,
    22.4,
    330,
    0.7
  ],
  // CoFID 11-773 "Breakfast cereal, wheat biscuits, Weetabix type, fortified". Was
  // 369 kcal and 3 g fat.
  [
    "wheat biscuits",
    332,
    10.5,
    72.7,
    1.9,
    9.7,
    3.9,
    260,
    0.26
  ],
  // CoFID 11-780 "Muesli, Swiss style, unfortified". Was 393 kcal and 4 g fat.
  [
    "muesli",
    366,
    9.2,
    72.6,
    6.3,
    8.8,
    21.3,
    138,
    1.27
  ],
  [
    "granola bar base",
    389,
    11,
    76,
    5,
    5,
    22,
    467,
    1
  ],
  // CoFID 11-799 "Biscuits, digestive, plain". Was 470 kcal and 20 g fat.
  [
    "digestive biscuit",
    463,
    6.2,
    65.6,
    21.3,
    3.8,
    17.5,
    561,
    7.71
  ],
  // CoFID 11-797 "Biscuits, semi-sweet". CoFID files rich tea under semi-sweet biscuits.
  // Was 474 kcal and 21 g fat.
  [
    "rich tea biscuit",
    444,
    6.4,
    75.4,
    15.1,
    2.7,
    20.3,
    358,
    5.08
  ],
  // CoFID 11-739 "Jaffa cakes". Was 463 kcal and 22 g fat.
  [
    "jaffa cake",
    354,
    4.4,
    69.3,
    8.5,
    1.5,
    51.6,
    85,
    4.33
  ],
  // CoFID 11-802 "Shortbread". Was 470 kcal and 23 g fat.
  [
    "shortbread",
    515,
    5.3,
    62.2,
    29,
    2.2,
    15.6,
    321,
    17.45
  ],
  // CoFID 11-814 "Flapjacks, retail". Was 471 kcal and 24 g fat.
  [
    "flapjack",
    434,
    5.1,
    55.7,
    22.8,
    5.2,
    29.2,
    194,
    10.25
  ],
  // CoFID 11-813 "Biscuits, sandwich, cream". Was 493 kcal and 25 g fat.
  [
    "custard cream",
    477,
    5,
    65.8,
    23.3,
    3.1,
    29.9,
    188,
    13.31
  ],
  [
    "bourbon biscuit",
    465,
    5,
    65,
    20,
    4,
    29,
    358,
    10
  ],
  // CoFID 11-798 "Biscuits, ginger nuts". Was 498 kcal and 21 g fat.
  [
    "ginger nut",
    443,
    4.8,
    75.3,
    15.7,
    2.2,
    31.3,
    429,
    7.26
  ],
  [
    "malted milk",
    467,
    7,
    59,
    22,
    2,
    31,
    384,
    11
  ],
  [
    "fruit shortcake",
    486,
    8,
    60,
    23,
    3,
    32,
    397,
    10
  ],
  // CoFID 14-329 "Orange juice, chilled". Was 61 kcal and 0 g fat.
  [
    "orange juice",
    36,
    0.9,
    8.6,
    0,
    0,
    8.6,
    1,
    0
  ],
  // CoFID 14-331 "Apple juice, clear, ambient and chilled". Was 65 kcal and 0 g fat.
  [
    "apple juice",
    37,
    0.1,
    9.7,
    0,
    0,
    9.7,
    3,
    0
  ],
  // CoFID 17-744 "Cranberry fruit juice drink". Was 43 kcal and 0.1 g fat.
  [
    "cranberry juice",
    45,
    0,
    12.1,
    0,
    0,
    12.1,
    0,
    0
  ],
  // CoFID 17-745 "Grape juice, unsweetened". Was 38 kcal and 1.1 g fat.
  [
    "grape juice",
    62,
    0.3,
    16,
    0.1,
    0,
    16,
    7,
    0
  ],
  // CoFID 13-382 "Tomato juice". Was 48 kcal and 2.1 g fat.
  [
    "tomato juice",
    14,
    0.8,
    3,
    0,
    0.6,
    3,
    230,
    0
  ],
  // CoFID 17-175 "Cola". Was 31 kcal and 3.1 g fat.
  [
    "cola",
    41,
    0,
    10.9,
    0,
    0,
    10.9,
    5,
    0
  ],
  // CoFID 17-179 "Lemonade". Was 50 kcal and 0 g fat.
  [
    "lemonade",
    22,
    0,
    5.8,
    0,
    0,
    5.8,
    7,
    0
  ],
  [
    "ginger beer",
    25,
    0.5,
    15,
    0,
    3.2,
    12,
    96,
    0.5
  ],
  // CoFID 17-736 "Tonic water". Was 32 kcal and 0.1 g fat.
  [
    "tonic water",
    22,
    0,
    5.9,
    0,
    0,
    5.9,
    4,
    0
  ],
  // CoFID 17-377 "Water, distilled". CoFID has no sparkling water row; water is nil either
  // way. Was 51 kcal and 1.1 g fat.
  [
    "sparkling water",
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0
  ],
  // CoFID 11-988 "Croissants". Was 527 kcal and 30 g fat.
  [
    "croissant",
    373,
    8.3,
    43.3,
    19.7,
    3.1,
    5.3,
    330,
    9.76
  ],
  [
    "pain au chocolat",
    514,
    7,
    46,
    31,
    3,
    13,
    433,
    14.5
  ],
  // CoFID 11-841 "Pastries, Danish, retail". Was 512 kcal and 32 g fat.
  [
    "danish pastry",
    446,
    4.9,
    43.6,
    29.2,
    2.1,
    17.3,
    233,
    11.83
  ],
  // CoFID 11-738 "Muffins, American, not chocolate, retail". American style; "english
  // muffin" has its own row. Was 539 kcal and 33 g fat.
  [
    "muffin",
    375,
    5,
    47.8,
    19.5,
    1.8,
    27.7,
    250,
    2.4
  ],
  // CoFID 11-827 "Scones, plain, retail". Was 502 kcal and 34 g fat.
  [
    "scone",
    346,
    7.2,
    55.2,
    12.3,
    2.2,
    12.7,
    592,
    6.37
  ],
  // CoFID 11-1009 "Currant buns, retail": a Yorkshire teacake is a currant
  // bun, and CoFID has no teacake row. Was 518 kcal with 6 g protein and 35 g
  // fat.
  [
    "tea cake",
    280,
    8,
    52.6,
    5.6,
    2.9,
    16,
    230,
    1.86
  ],
  // CoFID 11-1084 "Hot cross buns, homemade". CoFID has no retail row. Was 540
  // kcal and 30 g fat.
  [
    "hot cross bun",
    312,
    7.3,
    58.3,
    5.8,
    1.9,
    23.4,
    77,
    1.95
  ],
  [
    "brioche",
    529,
    8,
    52,
    31,
    5,
    14,
    511,
    14.5
  ],
  // CoFID 11-973 "Bread, naan, retail". Was 504 kcal and 32 g fat.
  [
    "naan bread",
    285,
    7.8,
    50.2,
    7.3,
    2.9,
    3.1,
    360,
    0.97
  ],
  // CoFID 11-937 "Bread, garlic and herb, retail". Was 517 kcal and 33 g fat.
  [
    "garlic bread",
    348,
    7,
    45.1,
    16.7,
    2.7,
    2.9,
    476,
    8.63
  ],
  // CoFID 13-502 "Broccoli, green, raw". CoFID has no frozen broccoli row; raw green
  // broccoli. Was 164 kcal and 4 g fat.
  [
    "frozen broccoli",
    34,
    4.3,
    3.2,
    0.6,
    4,
    1.9,
    9,
    0.15
  ],
  // CoFID 13-458 "Spinach, frozen, boiled in unsalted water". Boiled; CoFID has no uncooked
  // frozen row. Was 168 kcal and 5 g fat.
  [
    "frozen spinach",
    21,
    3.1,
    0.5,
    0.8,
    2.1,
    0.3,
    16,
    0.1
  ],
  // CoFID 13-543 "Vegetables, mixed, frozen, boiled in unsalted water". Boiled; CoFID has
  // no uncooked frozen row. CoFID gives no fibre or saturated fat figure (0 here). Was 181
  // kcal and 6 g fat.
  [
    "frozen mixed veg",
    42,
    3.3,
    6.6,
    0.5,
    0,
    3.6,
    15,
    0
  ],
  // CoFID 13-487 "Potato chips, oven ready, no batter, baked". As baked; CoFID has no
  // uncooked oven-chip row. Was 176 kcal and 7 g fat.
  [
    "frozen chips",
    189,
    3.2,
    35.3,
    4.9,
    3.5,
    1,
    31,
    0.78
  ],
  // CoFID 16-405 "Fish fingers, cod, grilled/baked". As baked; CoFID has no uncooked row.
  // Was 183 kcal and 8 g fat.
  [
    "fish fingers",
    223,
    14.3,
    22,
    9.2,
    2,
    1.5,
    317,
    1.19
  ],
  [
    "hash browns",
    187,
    2,
    30,
    9,
    3,
    4,
    445,
    3
  ],
  [
    "onion rings",
    194,
    3,
    31,
    4,
    4,
    5,
    458,
    2
  ],
  // CoFID 11-937 "Bread, garlic and herb, retail". Was 184 kcal and 5 g fat.
  [
    "garlic bread frozen",
    348,
    7,
    45.1,
    16.7,
    2.7,
    2.9,
    476,
    8.63
  ],
  // CoFID 13-527 "Peas, frozen, raw". Was 167 kcal and 6 g fat.
  [
    "peas frozen",
    68,
    5.3,
    10.7,
    0.7,
    5.3,
    5.7,
    4,
    0.13
  ],
  // CoFID 13-622 "Sweetcorn, kernels, raw". CoFID has no frozen row; raw kernels. Was 189
  // kcal and 7 g fat.
  [
    "sweetcorn frozen",
    60,
    3.4,
    8.1,
    1.8,
    1.5,
    2,
    1,
    0.2
  ],
  // CoFID 13-530 "Tomatoes, canned, whole contents". Was 59 kcal and 0 g fat.
  [
    "canned tomatoes",
    19,
    1.1,
    3.8,
    0.1,
    0.8,
    3.8,
    5,
    0
  ],
  // CoFID 13-670 "Beans, chick peas, canned, re-heated, drained". Was 69 kcal
  // and 0.5 g fat.
  [
    "canned chickpeas",
    129,
    8.4,
    18.3,
    3,
    7.1,
    0.7,
    1,
    0.29
  ],
  // CoFID 13-660 "Beans, red kidney, canned in water, re-heated, drained". Was 85
  // kcal and 1.5 g fat.
  [
    "canned kidney beans",
    100,
    8.6,
    15.1,
    1,
    6.8,
    0.8,
    0,
    0.2
  ],
  // CoFID 13-529 "Sweetcorn kernels, canned in water, drained". Was 83 kcal and 2.5 g fat.
  [
    "canned sweetcorn",
    78,
    2.6,
    13.9,
    1.7,
    3.1,
    7.5,
    1,
    0.27
  ],
  // CoFID 16-417 "Tuna, canned in sunflower oil, drained". Was 55 kcal and 3.5 g fat.
  [
    "canned tuna in oil",
    159,
    25.4,
    0,
    6.4,
    0,
    0,
    368,
    0.78
  ],
  // CoFID 17-652 "Soup, cream of tomato, canned". Was 62 kcal and 4.5 g fat.
  [
    "canned soup tomato",
    51,
    0.9,
    7.8,
    2,
    0.6,
    5.5,
    245,
    0.27
  ],
  // CoFID 17-695 "Soup, chicken, cream of, canned". Was 72 kcal and 0 g fat.
  [
    "canned soup chicken",
    58,
    1.7,
    4.5,
    3.8,
    0,
    1.1,
    240,
    0.6
  ],
  [
    "coconut cream",
    61,
    6,
    14,
    0.5,
    5,
    4,
    401,
    1
  ],
  // CoFID 12-522 "Milk, evaporated, whole". Was 74 kcal and 1.5 g fat.
  [
    "evaporated milk",
    166,
    8.4,
    12.7,
    9.4,
    0,
    12.7,
    180,
    5.9
  ],
  // CoFID 12-520 "Milk, condensed, whole, sweetened". Was 78 kcal and 2.5 g fat.
  [
    "condensed milk",
    310,
    7.4,
    55.5,
    8,
    0,
    55.5,
    90,
    4.99
  ],
  // CoFID 19-543 "Turkey slices". Was 160 kcal and 6 g fat.
  [
    "turkey slices",
    114,
    23,
    1.2,
    1.9,
    0,
    0.4,
    590,
    0.6
  ],
  // CoFID 19-538 "Chicken slices". Was 161 kcal and 6 g fat.
  [
    "chicken slices",
    114,
    23.2,
    2,
    1.5,
    0.3,
    0.2,
    580,
    0.4
  ],
  // CoFID 18-043 "Beef, rump steak, raw, lean". Strips are cut from rump; CoFID's strip
  // rows are stir-fried, this is raw. Was 162 kcal and 6 g fat.
  [
    "beef strips",
    125,
    22,
    0,
    4.1,
    0,
    0,
    60,
    1.7
  ],
  // CoFID 18-489 "Duck, meat only, raw". Skinless; CoFID has no breast-only row. Was 163
  // kcal and 6 g fat.
  [
    "duck breast",
    137,
    19.7,
    0,
    6.5,
    0,
    0,
    110,
    2
  ],
  // CoFID 18-390 "Venison, meat only, raw". Was 164 kcal and 6 g fat.
  [
    "venison",
    103,
    22.2,
    0,
    1.6,
    0,
    0,
    55,
    0.8
  ],
  [
    "pheasant",
    165,
    22,
    0,
    6,
    0,
    0,
    125,
    0.6
  ],
  // CoFID 18-486 "Veal, escalope, raw". Was 166 kcal and 6 g fat.
  [
    "veal escalope",
    106,
    22.7,
    0,
    1.7,
    0,
    0,
    59,
    0.6
  ],
  [
    "ox cheek",
    167,
    22,
    0,
    6,
    0,
    0,
    159,
    0.6
  ],
  // CoFID 18-013 "Beef, brisket, raw, lean and fat". Was 168 kcal and 6 g fat.
  [
    "beef brisket",
    218,
    18.4,
    0,
    16,
    0,
    0,
    50,
    6.7
  ],
  // CoFID 18-419 "Oxtail, raw". Was 160 kcal and 6 g fat.
  [
    "oxtail",
    171,
    20,
    0,
    10.1,
    0,
    0,
    110,
    4.2
  ],
  // CoFID 13-348 "Spring greens, raw". Was 28 kcal and 0.3 g fat.
  [
    "spring greens",
    33,
    3,
    3.1,
    1,
    3.4,
    2.7,
    20,
    0.1
  ],
  // CoFID 13-516 "Pak choi, steamed". Steamed; CoFID has no raw row. Was 29
  // kcal and 0.3 g fat.
  [
    "pak choi",
    14,
    1.5,
    1.9,
    0.1,
    2,
    1.5,
    39,
    0.02
  ],
  // CoFID 13-122 "Peas, mange-tout, raw". CoFID gives no saturated fat figure (0 here). Was
  // 30 kcal and 0.3 g fat.
  [
    "mange tout",
    32,
    3.6,
    4.2,
    0.2,
    2.3,
    3.4,
    2,
    0
  ],
  // CoFID 13-143 "Peas, sugar-snap, raw". CoFID gives no saturated fat figure (0 here). Was
  // 31 kcal and 0.3 g fat.
  [
    "sugar snap peas",
    34,
    3.4,
    5,
    0.2,
    1.5,
    3.7,
    4,
    0
  ],
  // CoFID 13-634 "Sweetcorn, baby, boiled in unsalted water". Boiled; CoFID has no raw row.
  // Was 32 kcal and 0.3 g fat.
  [
    "baby corn",
    31,
    2.2,
    4.6,
    0.6,
    2.4,
    3.8,
    0,
    0.13
  ],
  // CoFID 13-514 "Beans, green, raw". Was 33 kcal and 0.3 g fat.
  [
    "fine beans",
    24,
    2.1,
    3.1,
    0.4,
    3.4,
    2.2,
    0,
    0.08
  ],
  // CoFID 13-223 "Chard, Swiss, raw". CoFID gives no fibre figure (0 here). Was 34
  // kcal and 0.3 g fat.
  [
    "chard",
    19,
    1.8,
    2.9,
    0.2,
    0,
    0.6,
    210,
    0
  ],
  // CoFID 13-656 "Radish, red, flesh and skin, raw". Was 35 kcal and 0.3 g fat.
  [
    "radish",
    12,
    0.7,
    1.4,
    0.4,
    1.1,
    1.4,
    21,
    0.2
  ],
  // CoFID 13-389 "Turnip, flesh only, raw". Was 36 kcal and 0.3 g fat.
  [
    "turnip",
    23,
    0.9,
    4.7,
    0.3,
    2.4,
    4.5,
    15,
    0
  ],
  // CoFID 13-312 "Parsnip, raw". Was 28 kcal and 0.3 g fat.
  [
    "parsnip",
    64,
    1.8,
    12.5,
    1.1,
    4.7,
    5.7,
    10,
    0.2
  ],
  // CoFID 13-219 "Celeriac, raw". CoFID gives no saturated fat figure (0 here). Was 29 kcal
  // and 0.3 g fat.
  [
    "celeriac",
    18,
    1.2,
    2.3,
    0.4,
    3.7,
    1.8,
    91,
    0
  ],
  // CoFID 13-359 "Swede, flesh only, raw". Was 30 kcal and 0.3 g fat.
  [
    "swede",
    24,
    0.7,
    5,
    0.3,
    1.9,
    4.9,
    15,
    0
  ],
  // CoFID 13-261 "Kohl rabi, raw". Was 31 kcal and 0.3 g fat.
  [
    "kohlrabi",
    23,
    1.6,
    3.7,
    0.2,
    2.2,
    3.6,
    4,
    0
  ],
  // CoFID 13-241 "Fennel, Florence, raw". Was 32 kcal and 0.3 g fat.
  [
    "fennel bulb",
    12,
    0.9,
    1.8,
    0.2,
    2.4,
    1.7,
    11,
    0
  ],
  // CoFID 13-669 "Watercress, raw". Was 33 kcal and 0.3 g fat.
  [
    "watercress",
    10,
    1.9,
    0,
    0.3,
    1.5,
    0,
    37,
    0.09
  ],
  [
    "plum",
    52,
    1,
    13,
    0.3,
    0,
    0,
    40,
    0.03
  ],
  // CoFID 14-025 "Apricots, raw, flesh and skin". Was 53 kcal and 0.3 g fat.
  [
    "apricot",
    31,
    0.9,
    7.2,
    0.1,
    1.7,
    7.2,
    2,
    0
  ],
  // CoFID 14-380 "Nectarines, flesh and skin, raw". Was 54 kcal and 0.3 g fat.
  [
    "nectarine",
    43,
    1,
    9.8,
    0.3,
    1.3,
    9.8,
    0,
    0.02
  ],
  // CoFID 14-388 "Blackberries, raw". Was 55 kcal and 0.3 g fat.
  [
    "blackberries",
    27,
    1.1,
    5.6,
    0.2,
    3.4,
    5.6,
    1,
    0
  ],
  // CoFID 14-382 "Cherries, flesh and skin, raw". Was 56 kcal and 0.3 g fat.
  [
    "cherries",
    63,
    1.2,
    14.6,
    0.4,
    1.9,
    14.6,
    0,
    0.08
  ],
  // CoFID 14-252 "Rhubarb, stems only, raw". Was 57 kcal and 0.3 g fat.
  [
    "rhubarb",
    7,
    0.9,
    0.8,
    0.1,
    1.4,
    0.8,
    3,
    0
  ],
  // CoFID 14-091 "Figs, whole green fruit, raw". Was 58 kcal and 0.3 g fat.
  [
    "fig",
    43,
    1.3,
    9.5,
    0.3,
    1.5,
    9.5,
    3,
    0.1
  ],
  // CoFID 14-394 "Dates, dried, flesh and skin". Dried, the kind sold pitted for baking and
  // snacks. Was 59 kcal and 0.3 g fat.
  [
    "dates",
    235,
    2.4,
    58.7,
    0.6,
    7.5,
    58,
    11,
    0.3
  ],
  // CoFID 14-393 "Raisins, dried". Was 60 kcal and 0.3 g fat.
  [
    "raisins",
    256,
    3,
    62.6,
    1,
    2.7,
    62.6,
    17,
    0.15
  ],
  // CoFID 14-263 "Sultanas". CoFID gives no saturated fat figure (0 here). Was 52
  // kcal and 0.3 g fat.
  [
    "sultanas",
    275,
    2.7,
    69.4,
    0.4,
    2,
    69.4,
    19,
    0
  ],
  // CoFID 14-074 "Currants". CoFID gives no saturated fat figure (0 here). Was 53
  // kcal and 0.3 g fat.
  [
    "currants",
    267,
    2.3,
    67.8,
    0.4,
    1.9,
    67.8,
    14,
    0
  ],
  // Mean of CoFID raw strawberries, raspberries, blackberries and blueberries
  // (14-324, 14-375, 14-388, 14-325). Was 54 kcal with 0 g fibre and 227 mg sodium.
  [
    "mixed berries",
    31,
    0.9,
    6.5,
    0.3,
    3.1,
    6.5,
    1,
    0.04
  ],
  // CoFID 14-249 "Redcurrants, raw". CoFID gives no saturated fat figure (0 here). Was 55
  // kcal and 0.3 g fat.
  [
    "redcurrants",
    21,
    1.1,
    4.4,
    0,
    3.4,
    4.4,
    2,
    0
  ],
  // CoFID 14-053 "Blackcurrants, raw". Was 56 kcal and 0.3 g fat.
  [
    "blackcurrants",
    28,
    0.9,
    6.6,
    0,
    3.6,
    6.6,
    3,
    0
  ],
  // CoFID 14-100 "Gooseberries, cooking, raw". CoFID gives no saturated fat figure (0
  // here). Was 57 kcal and 0.3 g fat.
  [
    "gooseberries",
    19,
    1.1,
    3,
    0.4,
    2.4,
    3,
    2,
    0
  ],
  // CoFID 12-496 "Cheese, Halloumi". Was 290 kcal and 23 g fat.
  [
    "halloumi",
    313,
    23.9,
    1.7,
    23.5,
    0,
    1.7,
    1200,
    16.58
  ],
  // CoFID 12-344 "Cheese, Brie, with outer rind removed". Was 291 kcal and 23 g fat.
  [
    "brie",
    343,
    20.3,
    0,
    29.1,
    0,
    0,
    556,
    18.2
  ],
  // CoFID 12-345 "Cheese, Camembert". Was 292 kcal and 23 g fat.
  [
    "camembert",
    290,
    21.5,
    0,
    22.7,
    0,
    0,
    605,
    14.2
  ],
  // CoFID 12-367 "Cheese, Stilton, blue". Was 293 kcal and 23 g fat.
  [
    "stilton",
    410,
    23.7,
    0.1,
    35,
    0,
    0.1,
    788,
    23.02
  ],
  // CoFID 12-485 "Cheese, Red Leicester". Was 294 kcal and 23 g fat.
  [
    "red leicester",
    403,
    25,
    0.1,
    33.6,
    0,
    0.1,
    665,
    21.1
  ],
  // CoFID 12-489 "Cheese, Wensleydale". Was 295 kcal and 23 g fat.
  [
    "wensleydale",
    381,
    23.7,
    0.1,
    31.8,
    0,
    0.1,
    440,
    19.7
  ],
  [
    "ricotta",
    296,
    18,
    3,
    23,
    0,
    0,
    142,
    2.3
  ],
  // CoFID 12-490 "Cheese, Mascarpone". Was 297 kcal and 23 g fat.
  [
    "mascarpone",
    435,
    4.6,
    4.3,
    44.5,
    0,
    4.3,
    70,
    29.48
  ],
  // CoFID 12-528 "Fromage frais, virtually fat free, natural". CoFID's only plain fromage
  // frais row is virtually fat free. Was 298 kcal and 23 g fat.
  [
    "fromage frais",
    49,
    7.7,
    4.6,
    0.1,
    0,
    4.4,
    37,
    0.1
  ],
  // Arla Skyr Natural UK label (61 kcal, 10 g protein, 0.2 g fat, 4 g sugars,
  // 0.14 g salt). Was a copy of halloumi: 290 kcal and 23 g fat.
  [
    "skyr",
    61,
    10,
    4,
    0.2,
    0,
    4,
    56,
    0.1
  ]
];

export const NUTRITION_DB_UK_EXPANSION: NutritionLookupEntry[] = ROWS.map(fromTuple);
