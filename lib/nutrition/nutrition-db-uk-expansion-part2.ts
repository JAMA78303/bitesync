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

const ROWS: TupleRow[] = [
  // CoFID 17-491 "Chocolate, plain". UK plain chocolate is dark chocolate. Was 420
  // kcal and 10 g fat.
  [
    "dark chocolate",
    510,
    5,
    63.5,
    28,
    2.5,
    62.6,
    6,
    16.8
  ],
  // CoFID 17-648 "Chocolate, milk". Was 521 kcal and 25 g fat.
  [
    "milk chocolate",
    519,
    7.3,
    56,
    31.1,
    2.3,
    56,
    89,
    18.71
  ],
  // CoFID 17-091 "Chocolate, white". CoFID gives no fibre figure (0 here). Was 61
  // kcal and 0.2 g fat.
  [
    "white chocolate",
    529,
    8,
    58.3,
    30.9,
    0,
    58.3,
    110,
    18.4
  ],
  [
    "fruit nut chocolate",
    248,
    13,
    42,
    8,
    5,
    16,
    696,
    4.6
  ],
  [
    "caramel bar",
    181,
    17,
    29,
    7,
    3,
    13,
    505,
    2
  ],
  [
    "nougat bar",
    416,
    7,
    74,
    15,
    6,
    28,
    394,
    5.4
  ],
  // Grenade protein bar label (Ocado 622636011), per 100 g. Was 518 kcal and 23 g fat.
  [
    "protein bar",
    346,
    35,
    31,
    13,
    4.5,
    2.3,
    164,
    6
  ],
  [
    "cereal bar",
    56,
    1.2000000000000002,
    12.5,
    0,
    1.2,
    7,
    156,
    1.2000000000000002
  ],
  // Plain wholegrain rice cakes, UK label (Kallo lightly salted: 394 kcal, 8.5 g
  // protein, 82.3 g carbs, 2.7 g fat, 0.3 g salt; fibre ~3 g, which the energy
  // reconciles to). Was 293 kcal with 13 g sugar and 791 mg sodium.
  [
    "rice cake",
    394,
    8.5,
    82.3,
    2.7,
    3.1,
    0.5,
    120,
    0.7
  ],
  [
    "rice cakes salted",
    187,
    16,
    24,
    5,
    4,
    10,
    600,
    2
  ],
  // Snack a Jacks Caramel Jumbo Rice Cakes label (Tesco 317208034), per 100 g. Was 424
  // kcal and 13 g fat.
  [
    "rice cakes caramel",
    387,
    6.1,
    86,
    1.7,
    11,
    19,
    196,
    0.3
  ],
  [
    "popcorn sweet",
    520,
    5,
    56,
    28,
    3,
    32,
    568,
    12.8
  ],
  [
    "popcorn salted",
    60,
    0.20000000000000018,
    7.5,
    3.2,
    2.2,
    12,
    251,
    1.2000000000000002
  ],
  // Penn State Sea Salted Pretzels label (Tesco 254168775), per 100 g. Was 292 kcal and 4
  // g fat.
  [
    "pretzels",
    397,
    9.8,
    77,
    4.9,
    3.2,
    2.7,
    1000,
    0.6
  ],
  // CoFID 17-644 "Tortilla chips fried in sunflower oil". Was 184 kcal and 3 g fat.
  [
    "tortilla chips",
    504,
    7.2,
    60.8,
    27.4,
    5.9,
    2.5,
    636,
    2.89
  ],
  // CoFID 17-671 "Potato crisps, fried in sunflower oil". Was 419 kcal and 11 g fat.
  [
    "potato crisps",
    493,
    6.2,
    55.8,
    28.8,
    4.4,
    0.9,
    604,
    2.48
  ],
  [
    "cheese crisps",
    520,
    10,
    61,
    26,
    4,
    29,
    663,
    12.8
  ],
  // CoFID 11-1023 "Prawn crackers, takeaway". Was 60 kcal and 1.2 g fat.
  [
    "prawn crackers",
    570,
    0.3,
    58.2,
    39,
    0.9,
    2.2,
    767,
    3.64
  ],
  [
    "onion bhaji",
    240,
    10,
    47,
    9,
    8,
    15,
    981,
    4.6
  ],
  [
    "samosa",
    176,
    14,
    24,
    8,
    2,
    12,
    790,
    2
  ],
  // CoFID 19-327 "Spring rolls, meat, takeaway", the row CoFID answers spring rolls with.
  // Was 417 kcal and 69 g carbohydrate.
  [
    "spring roll",
    242,
    6.5,
    18.2,
    16.4,
    2,
    1.8,
    485,
    3.81
  ],
  // M&S 12 Vegetable Spring Rolls label (Ocado 511519011), per 100 g. CoFID's only spring
  // roll is meat. Was 528 kcal and 24 g fat.
  [
    "vegetable spring roll",
    218,
    4.2,
    28.5,
    9.1,
    2.7,
    4.4,
    400,
    1.4
  ],
  // CoFID 19-327 "Spring rolls, meat, takeaway". Was 62 kcal and 14 g sugar in 7.5 g
  // carbohydrate.
  [
    "duck spring roll",
    242,
    6.5,
    18.2,
    16.4,
    2,
    1.8,
    485,
    3.81
  ],
  [
    "mini sausage roll",
    246,
    9,
    42,
    7,
    5,
    12,
    676,
    4.6
  ],
  [
    "scotch egg",
    180,
    13,
    29,
    6,
    3,
    9,
    485,
    2
  ],
  [
    "pork pie",
    414,
    9,
    74,
    14,
    6,
    24,
    374,
    5.4
  ],
  [
    "cornish pasty",
    520,
    8,
    61,
    29,
    6,
    31,
    453,
    12.8
  ],
  // Tesco Steak Slice label (Tesco 320789147), per 100 g. Was 57 kcal and 0 g fat.
  [
    "steak slice",
    267,
    8.7,
    26.3,
    13.8,
    1.7,
    2.5,
    172,
    6.5
  ],
  [
    "chicken slice",
    242,
    14,
    47,
    5,
    6,
    17,
    771,
    4.6
  ],
  [
    "cheese onion pasty",
    188,
    12,
    24,
    4,
    4,
    14,
    580,
    2
  ],
  [
    "hummus",
    412,
    8,
    69,
    12,
    7,
    29,
    469,
    5.4
  ],
  // CoFID 12-547 "Tzatziki". Was 515 kcal and 27 g fat.
  [
    "tzatziki",
    76,
    3.4,
    3.4,
    5.5,
    0.3,
    3,
    369,
    3.58
  ],
  // CoFID 17-797 "Guacamole, homemade". Was 55 kcal and 2.2 g fat.
  [
    "guacamole",
    128,
    1.4,
    2.2,
    12.7,
    2.5,
    1.3,
    5,
    2.67
  ],
  // Jar salsa figures (Old El Paso mild, see "salsa mild jar"). Was 293 kcal
  // with 13 g protein and 10 g fat.
  [
    "salsa dip",
    37,
    1,
    6.9,
    0.5,
    2.2,
    5,
    0,
    0
  ],
  [
    "sour cream dip",
    184,
    17,
    29,
    2,
    5,
    11,
    675,
    2
  ],
  // CoFID 15-635 "Coleslaw, not low calorie, retail". Was 414 kcal and 10 g fat.
  [
    "coleslaw",
    173,
    0.8,
    6,
    16.3,
    1.2,
    6,
    296,
    1.65
  ],
  [
    "potato salad",
    519,
    6,
    61,
    25,
    4,
    33,
    643,
    12.8
  ],
  [
    "pasta salad",
    57,
    1.2000000000000002,
    12.5,
    0.20000000000000018,
    3.2,
    13,
    326,
    1.2000000000000002
  ],
  // CoFID 12-936 "Quiche, Lorraine, shortcrust pastry, retail". Was 244 kcal and 8 g fat.
  [
    "quiche lorraine",
    269,
    9.1,
    19.7,
    17.6,
    1.3,
    3.2,
    339,
    8.31
  ],
  [
    "spinach quiche",
    184,
    16,
    24,
    7,
    2,
    8,
    770,
    2
  ],
  [
    "cheese onion quiche",
    425,
    12,
    69,
    15,
    5,
    23,
    659,
    5.4
  ],
  [
    "scrambled egg mix",
    524,
    5,
    56,
    23,
    5,
    30,
    738,
    12.8
  ],
  // Tesco All Day Breakfast frozen ready meal label (Tesco 292400397), per 100 g oven
  // cooked. Was 65 kcal, 0 g fat and 10 g sugar in 7.5 g carbohydrate.
  [
    "full english frozen",
    131,
    7.3,
    12.8,
    4.9,
    3.1,
    2.3,
    312,
    1.4
  ],
  // Tesco Hash Browns label (Tesco 282059931), per 100 g oven cooked. Was 247 kcal and 6 g
  // fat.
  [
    "hash brown patties",
    176,
    2.7,
    22.4,
    7.9,
    2.2,
    0.3,
    172,
    0.9
  ],
  [
    "waffle potato",
    183,
    15,
    29,
    5,
    3,
    13,
    465,
    2
  ],
  // Tesco Curly Fries label (Tesco 282059879), per 100 g oven cooked. Was 417 kcal and 13
  // g fat.
  [
    "curly fries",
    209,
    3.3,
    32.7,
    6.1,
    4.8,
    0.6,
    120,
    0.7
  ],
  [
    "sweet potato fries",
    525,
    10,
    61,
    28,
    6,
    35,
    433,
    12.8
  ],
  [
    "cauliflower wings",
    63,
    0,
    12.5,
    3.2,
    1.2,
    7,
    116,
    1.2000000000000002
  ],
  [
    "veggie burger patty",
    248,
    10,
    47,
    4,
    6,
    13,
    751,
    4.6
  ],
  [
    "bean burger",
    181,
    14,
    24,
    3,
    4,
    10,
    560,
    2
  ],
  // Tesco Halloumi Fries label (Tesco 309482756), per 100 g cooked. Was 420 kcal and 11 g
  // fat.
  [
    "halloumi fries",
    343,
    14.2,
    22.4,
    21.6,
    0.9,
    2.2,
    788,
    9.7
  ],
  // Tesco Mozzarella Sticks label (Tesco 304401781), per 100 g cooked. Was 524 kcal and 26
  // g fat.
  [
    "mozzarella sticks",
    301,
    14.4,
    24,
    16.1,
    1.5,
    1.5,
    420,
    6.8
  ],
  // Tesco 2 Breaded Garlic Chicken Kievs label (Tesco 307733170), per 100 g oven cooked.
  // CoFID has no kiev. Was 58 kcal, 1.2 g fat and 12 g sugar in 7.5 g carbohydrate.
  [
    "chicken kiev",
    291,
    12.5,
    11,
    21.8,
    0.8,
    0.8,
    172,
    8.6
  ],
  [
    "fish cake",
    293,
    9,
    42,
    9,
    7,
    18,
    846,
    4.6
  ],
  [
    "salmon fishcake",
    185,
    13,
    29,
    8,
    5,
    15,
    655,
    2
  ],
  [
    "cod fishcake",
    418,
    9,
    74,
    9,
    4,
    22,
    544,
    5.4
  ],
  [
    "fish pie",
    515,
    8,
    61,
    24,
    4,
    29,
    623,
    12.8
  ],
  // CoFID 19-494 "Pie, Cottage/Shepherd's, reheated". Was 59 kcal and 0 g fat.
  [
    "shepherds pie",
    111,
    4.5,
    11.9,
    5.4,
    1.2,
    1.6,
    240,
    2.4
  ],
  // CoFID 19-494 "Pie, Cottage/Shepherd's, reheated". Was 240 kcal and 7 g fat.
  [
    "cottage pie",
    111,
    4.5,
    11.9,
    5.4,
    1.2,
    1.6,
    240,
    2.4
  ],
  // CoFID 19-481 "Lasagne, homemade". Was 182 kcal and 6 g fat.
  [
    "beef lasagne",
    180,
    9.6,
    15.2,
    9.6,
    1,
    2.8,
    235,
    4.18
  ],
  [
    "veg lasagne",
    417,
    8,
    69,
    14,
    5,
    27,
    639,
    5.4
  ],
  // CoFID 19-524 "Spaghetti bolognese, retail, reheated, with spaghetti". Was 537 kcal and
  // 29 g fat.
  [
    "spaghetti bolognese ready meal",
    126,
    6.6,
    20,
    2.8,
    1.2,
    1.9,
    182,
    1.06
  ],
  // CoFID 19-296 "Curry, chicken tikka masala, retail, reheated". Was 25 kcal and 0 g fat.
  [
    "chicken tikka masala ready meal",
    156,
    12.4,
    4.9,
    9.8,
    1.4,
    3.6,
    220,
    3.3
  ],
  [
    "beef stew ready meal",
    249,
    13,
    42,
    5,
    5,
    12,
    636,
    4.6
  ],
  [
    "macaroni cheese ready meal",
    196,
    17,
    29,
    4,
    3,
    9,
    445,
    2
  ],
  // CoFID 12-580 "Pudding, rice, canned". Was 418 kcal and 12 g fat.
  [
    "rice pudding",
    85,
    3.3,
    16.1,
    1.3,
    0.1,
    8.7,
    43,
    0.76
  ],
  [
    "semolina pudding",
    523,
    6,
    61,
    27,
    6,
    31,
    413,
    12.8
  ],
  // CoFID 12-543 "Custard, ready to eat, canned and tetra-pak". Ready to eat. Was 53 kcal
  // and 2.2 g fat.
  [
    "custard",
    98,
    2.7,
    16.3,
    2.9,
    0,
    12.8,
    41,
    1.89
  ],
  [
    "instant custard",
    244,
    12,
    47,
    10,
    6,
    17,
    731,
    4.6
  ],
  // CoFID 12-584 "Instant dessert powder, made up with whole milk". As made up with whole
  // milk. CoFID gives no fibre figure (0 here). Was 183 kcal and 2 g fat.
  [
    "angel delight",
    121,
    3.2,
    14.3,
    6,
    0,
    10.9,
    228,
    4.69
  ],
  [
    "jelly orange",
    418,
    12,
    69,
    10,
    7,
    29,
    429,
    5.4
  ],
  [
    "jelly raspberry",
    522,
    5,
    56,
    25,
    3,
    28,
    508,
    12.8
  ],
  [
    "trifle sponge",
    59,
    0.20000000000000018,
    7.5,
    0.20000000000000018,
    2.2,
    8,
    191,
    1.2000000000000002
  ],
  [
    "sponge cake",
    240,
    11,
    42,
    8,
    7,
    14,
    826,
    4.6
  ],
  // CoFID 11-831 "Cake, sponge, with jam and butter cream, retail". Was 185 kcal and 7 g
  // fat.
  [
    "victoria sponge",
    354,
    3.7,
    55.1,
    14.8,
    1.2,
    37.6,
    220,
    6.96
  ],
  [
    "carrot cake",
    417,
    11,
    74,
    15,
    4,
    26,
    524,
    5.4
  ],
  // CoFID 11-830 "Cake, chocolate, with filling and icing, retail". Was 527
  // kcal and 23 g fat.
  [
    "chocolate cake slice",
    413,
    4.5,
    48.6,
    23.7,
    2.9,
    36.6,
    259,
    9.46
  ],
  [
    "lemon drizzle",
    59,
    0,
    12.5,
    0,
    3.2,
    13,
    286,
    1.2000000000000002
  ],
  // Tesco Sliced Fruit Loaf label (Tesco 254946102), per 100 g. Was 294 kcal and 6 g fat.
  [
    "fruit loaf",
    281,
    7.9,
    52.6,
    3.6,
    3.2,
    18.7,
    164,
    0.9
  ],
  [
    "tea biscuit chocolate",
    191,
    14,
    24,
    5,
    2,
    8,
    730,
    2
  ],
  // CoFID 11-803 "Biscuits, digestive, with oats, plain". Hobnobs are oat biscuits. Was
  // 412 kcal and 13 g fat.
  [
    "hobnob",
    480,
    6.4,
    66.4,
    22.9,
    7.2,
    25.9,
    328,
    5.94
  ],
  // CoFID 11-815 "Biscuits, cookies, chocolate chip, standard". Was 528 kcal and 28 g fat.
  [
    "cookie chocolate chip",
    471,
    5.4,
    60,
    24.9,
    3,
    30,
    298,
    12.15
  ],
  // CoFID 11-803 "Biscuits, digestive, with oats, plain". The oat biscuit row. Was 60 kcal
  // and 3.2 g fat.
  [
    "cookie oatmeal",
    480,
    6.4,
    66.4,
    22.9,
    7.2,
    25.9,
    328,
    5.94
  ],
  // CoFID 11-1127 "Brownies, chocolate, homemade". Was 291 kcal and 4 g fat.
  [
    "brownie",
    506,
    6.2,
    54.3,
    30.8,
    1.7,
    46.1,
    187,
    16.43
  ],
  // Mr Kipling Vanilla & White Chocolate Blondie label (Tesco 316950780), per 100 g as
  // baked. Was 177 kcal and 3 g fat.
  [
    "blondie",
    398,
    4,
    60.1,
    15.4,
    1.7,
    46,
    44,
    9.3
  ],
  // CoFID 11-837 "Shortcake, caramel, chocolate covered, retail". Was 428 kcal and 11 g
  // fat.
  [
    "millionaire shortbread",
    466,
    4.7,
    53.6,
    27.3,
    2.3,
    36.2,
    258,
    15.18
  ],
  [
    "rock cake",
    516,
    8,
    61,
    26,
    6,
    35,
    393,
    12.8
  ],
  [
    "scone fruit",
    57,
    3.2,
    12.5,
    1.2000000000000002,
    1.2,
    7,
    76,
    1.2000000000000002
  ],
  // CoFID 11-989 "Crumpets, toasted". Toasted; CoFID has no untoasted row. Was 291
  // kcal and 9 g fat.
  [
    "crumpet",
    207,
    6.9,
    45.4,
    1,
    3.1,
    3.1,
    1029,
    0.1
  ],
  // CoFID 11-541 "Muffins, English style, white". Was 184 kcal and 8 g fat.
  [
    "english muffin",
    223,
    10,
    44.2,
    1.9,
    2.6,
    3.4,
    431,
    0.38
  ],
  // CoFID 11-970 "Bagels, plain". CoFID gives no saturated fat figure (0 here). Was 417
  // kcal and 9 g fat.
  [
    "bagel plain",
    273,
    10,
    57.8,
    1.8,
    3,
    4.8,
    400,
    0
  ],
  [
    "bagel sesame",
    519,
    7,
    56,
    24,
    3,
    32,
    488,
    12.8
  ],
  [
    "bagel everything",
    62,
    2.2,
    7.5,
    0,
    2.2,
    12,
    171,
    1.2000000000000002
  ],
  [
    "wrap spinach",
    241,
    13,
    42,
    7,
    7,
    18,
    806,
    4.6
  ],
  [
    "wrap beetroot",
    183,
    17,
    29,
    6,
    5,
    15,
    615,
    2
  ],
  // Tesco Greek Style Folded Flatbreads label (Tesco 313742138), per 100 g. Was 415 kcal
  // and 14 g fat.
  [
    "flatbread",
    284,
    9.5,
    49.4,
    4.4,
    4.2,
    2.8,
    252,
    0.6
  ],
  // Tesco Finest Durum Wheat Piadinas label (Tesco 323928993), per 100 g. Was 514 kcal and
  // 29 g fat.
  [
    "piadina",
    290,
    9,
    51.4,
    5.2,
    1.2,
    1.8,
    392,
    1.2
  ],
  [
    "matzo crackers",
    60,
    1.2000000000000002,
    12.5,
    0,
    3.2,
    9,
    266,
    1.2000000000000002
  ],
  // M&S High Bake Water Biscuits label, per 100 g (salt 1.03 g). CoFID has no
  // water biscuit. Was 242 kcal with 12 g protein (template row).
  [
    "water biscuit",
    405,
    9.6,
    76.1,
    6.2,
    3.1,
    2.1,
    412,
    2.7
  ],
  [
    "cheese crackers",
    185,
    16,
    24,
    4,
    2,
    12,
    710,
    2
  ],
  [
    "ritz style crackers",
    425,
    12,
    69,
    12,
    5,
    27,
    599,
    5.4
  ],
  // CoFID 11-820 "Cream crackers". Was 521 kcal and 27 g fat.
  [
    "cream crackers",
    445,
    8.9,
    69.7,
    16.4,
    3.9,
    1.5,
    384,
    7.38
  ],
  // CoFID 11-826 "Breadsticks, plain". Was 57 kcal and 2.2 g fat.
  [
    "breadsticks",
    389,
    10.9,
    72.9,
    8.1,
    3.7,
    3.3,
    817,
    6.01
  ],
  // CoFID 11-826 "Breadsticks, plain". Was 292 kcal and 10 g fat.
  [
    "grissini",
    389,
    10.9,
    72.9,
    8.1,
    3.7,
    3.3,
    817,
    6.01
  ],
  // Trimlyne Melba Toast label (Tesco 330771394), per 100 g. Was 181 kcal and 2 g fat.
  [
    "melba toast",
    384,
    12,
    77,
    2.4,
    3.9,
    3.2,
    520,
    1.3
  ],
  // CoFID 11-822 "Crispbread, rye". Was 412 kcal and 10 g fat.
  [
    "ryvita",
    284,
    8.6,
    63.4,
    1.4,
    20,
    3.4,
    264,
    0.16
  ],
  // Ryvita Crackerbread label (Tesco 254926368), per 100 g. Was 519 kcal and 25 g fat.
  [
    "crackerbread",
    390,
    10.5,
    77.5,
    3.7,
    2.5,
    1.2,
    352,
    0.6
  ],
  // Biona Organic Pumpernickel label (Ocado 51387011), per 100 g. Was 58 kcal and 0.2 g
  // fat.
  [
    "pumpernickel",
    196,
    4.6,
    36,
    1.7,
    9.6,
    4,
    400,
    0.2
  ],
  [
    "rye bread",
    293,
    10,
    47,
    8,
    6,
    17,
    691,
    4.6
  ],
  // CoFID 11-969 "Bread, ciabatta". Was 178 kcal and 7 g fat.
  [
    "ciabatta",
    271,
    10.2,
    52,
    3.9,
    3.3,
    3.1,
    350,
    0.57
  ],
  // Tesco Finest Rosemary & Sea Salt Focaccia label (Tesco 322997888), per 100 g. Was 414
  // kcal and 15 g fat.
  [
    "focaccia",
    309,
    9.2,
    46.3,
    9.1,
    2.2,
    1.8,
    420,
    1.2
  ],
  [
    "focaccia rosemary",
    524,
    9,
    56,
    23,
    3,
    28,
    468,
    12.8
  ],
  [
    "garlic knot",
    57,
    4.2,
    7.5,
    0,
    2.2,
    8,
    151,
    1.2000000000000002
  ],
  // CoFID 11-1016 "Pizza base, raw". CoFID gives no saturated fat figure (0 here). Was 245
  // kcal and 6 g fat.
  [
    "pizza base fresh",
    290,
    7.8,
    57.5,
    4.8,
    2.5,
    3.4,
    400,
    0
  ],
  [
    "pizza dough ball",
    186,
    13,
    29,
    5,
    5,
    11,
    595,
    2
  ],
  [
    "gnocchi potato",
    420,
    9,
    74,
    13,
    4,
    26,
    484,
    5.4
  ],
  [
    "gnocchi spinach",
    522,
    8,
    61,
    28,
    4,
    33,
    563,
    12.8
  ],
  // CoFID 11-728 "Pasta, egg, fresh, filled with cheese only, boiled in unsalted water".
  // Boiled; CoFID has no uncooked filled-pasta row. Was 60 kcal and 3.2 g fat.
  [
    "ravioli cheese",
    216,
    10.5,
    30.2,
    6.7,
    2.2,
    2.2,
    242,
    3.54
  ],
  [
    "ravioli mushroom",
    245,
    14,
    47,
    4,
    8,
    19,
    881,
    4.6
  ],
  [
    "tortellini ham",
    184,
    12,
    24,
    3,
    2,
    8,
    690,
    2
  ],
  // CoFID 11-728 "Pasta, egg, fresh, filled with cheese only, boiled in unsalted water".
  // Boiled; CoFID has no uncooked filled-pasta row. Was 423 kcal and 11 g fat.
  [
    "tortellini cheese",
    216,
    10.5,
    30.2,
    6.7,
    2.2,
    2.2,
    242,
    3.54
  ],
  // CoFID 11-726 "Pasta, egg, fresh, raw". Was 524 kcal and 26 g fat.
  [
    "tagliatelle fresh",
    282,
    10.6,
    57,
    2.9,
    3.3,
    2.1,
    24,
    0.71
  ],
  // CoFID 11-715 "Pasta, egg, white, dried, raw". Dry, as bought. Was 58 kcal
  // and 1.2 g fat.
  [
    "linguine egg",
    365,
    12.9,
    74.8,
    3.6,
    3.9,
    2.1,
    51,
    0.89
  ],
  // CoFID 11-716 "Pasta, white, dried, raw". Dry, as bought. Was 294 kcal and 9 g fat.
  [
    "orzo pasta",
    343,
    11.3,
    75.6,
    1.6,
    3.7,
    2.1,
    2,
    0.23
  ],
  // CoFID 11-716 "Pasta, white, dried, raw". Dry, as bought. Was 184 kcal and 8 g fat.
  [
    "macaroni elbow",
    343,
    11.3,
    75.6,
    1.6,
    3.7,
    2.1,
    2,
    0.23
  ],
  // CoFID 11-716 "Pasta, white, dried, raw". Dry, as bought. Was 417 kcal and 9 g fat.
  [
    "tubes pasta",
    343,
    11.3,
    75.6,
    1.6,
    3.7,
    2.1,
    2,
    0.23
  ],
  // CoFID 11-716 "Pasta, white, dried, raw". Dry, as bought. Was 522 kcal and 24 g fat.
  [
    "stellette pasta",
    343,
    11.3,
    75.6,
    1.6,
    3.7,
    2.1,
    2,
    0.23
  ],
  [
    "couscous giant",
    60,
    1.2000000000000002,
    12.5,
    0,
    1.2,
    7,
    36,
    1.2000000000000002
  ],
  // Belazu Cracked Freekeh label (Ocado 448125011), per 100 g dry. Was 291 kcal and 7 g
  // fat.
  [
    "freekeh",
    368,
    13.1,
    63,
    5.8,
    5.9,
    0,
    40,
    0.6
  ],
  [
    "farro",
    175,
    16,
    24,
    6,
    4,
    10,
    480,
    2
  ],
  // CoFID 11-002 "Barley, pearl, raw". CoFID gives no fibre or saturated fat figure (0
  // here). Was 418 kcal and 14 g fat.
  [
    "barley pearl",
    360,
    7.9,
    83.6,
    1.7,
    0,
    0,
    3,
    0
  ],
  [
    "spelt grain",
    518,
    5,
    56,
    29,
    3,
    32,
    448,
    12.8
  ],
  // Minton & Donello Millet Grain label (Ocado 656610011), per 100 g dry. Was 58 kcal and
  // 0 g fat.
  [
    "millet grain",
    378,
    11,
    72.1,
    4.5,
    8.8,
    0.8,
    4,
    0.8
  ],
  [
    "amaranth grain",
    243,
    11,
    42,
    5,
    7,
    18,
    766,
    4.6
  ],
  // CoFID 11-006 "Buckwheat, groats". CoFID gives no saturated fat figure (0 here). Was 186
  // kcal and 4 g fat.
  [
    "buckwheat groats",
    364,
    8.1,
    84.9,
    1.5,
    2.1,
    0.4,
    1,
    0
  ],
  [
    "wild rice blend",
    421,
    11,
    74,
    12,
    4,
    22,
    464,
    5.4
  ],
  // CoFID 11-875 "Rice, Thai fragrant, boiled in unsalted water". Was 526
  // kcal and 27 g fat.
  [
    "jasmine rice cooked",
    133,
    2.3,
    32.1,
    0.4,
    0,
    0,
    4,
    0.09
  ],
  // CoFID 11-878 "Rice, white, Italian Arborio risotto, raw". Was 58 kcal and 2.2 g fat.
  [
    "arborio rice",
    354,
    6.4,
    85.2,
    1,
    1.4,
    0.2,
    1,
    0.21
  ],
  // CoFID 11-878 "Rice, white, Italian Arborio risotto, raw". Was 241 kcal and 10 g fat.
  [
    "risotto rice",
    354,
    6.4,
    85.2,
    1,
    1.4,
    0.2,
    1,
    0.21
  ],
  [
    "paella rice",
    181,
    14,
    24,
    2,
    2,
    12,
    670,
    2
  ],
  [
    "sushi rice seasoned",
    425,
    10,
    69,
    10,
    5,
    27,
    559,
    5.4
  ],
  [
    "rice paper",
    517,
    9,
    56,
    25,
    5,
    34,
    638,
    12.8
  ],
  // Spring Home TYJ Spring Roll Pastry label (Tesco 259494478), per 100 g. The label gives
  // no fibre figure (0 here). Was 65 kcal and 14 g sugar in 7.5 g carbohydrate.
  [
    "spring roll wrapper",
    307,
    7.4,
    58,
    4.9,
    0,
    1.4,
    376,
    3.9
  ],
  [
    "wonton wrapper",
    243,
    9,
    42,
    8,
    5,
    12,
    956,
    4.6
  ],
  // CoFID 11-855 "Pastry, filo, retail, uncooked". Was 180 kcal and 7 g fat.
  [
    "fil pastry",
    278,
    7.6,
    58.9,
    2.9,
    3.4,
    2.4,
    350,
    0.32
  ],
  // CoFID 11-851 "Pastry, shortcrust, retail, uncooked". Was 423 kcal and 15 g fat.
  [
    "shortcrust pastry",
    453,
    5.7,
    39.4,
    31.4,
    3.4,
    0.9,
    224,
    11.68
  ],
  // CoFID 11-852 "Pastry, flaky/puff, retail, uncooked". Was 531 kcal and 23 g fat.
  [
    "puff pastry ready rolled",
    384,
    5.3,
    33.7,
    26.2,
    2.8,
    1.5,
    337,
    12.56
  ],
  [
    "suet pastry",
    57,
    3.2,
    12.5,
    0,
    1.2,
    11,
    16,
    1.2000000000000002
  ],
  [
    "dumpling mix",
    241,
    14,
    47,
    6,
    6,
    17,
    651,
    4.6
  ],
  [
    "stuffing mix sage",
    187,
    12,
    24,
    5,
    4,
    14,
    460,
    2
  ],
  [
    "stuffing mix cranberry",
    428,
    8,
    69,
    13,
    7,
    29,
    349,
    5.4
  ],
  // Dry mix as sold: Schwartz Luxury Bread Sauce Mix label, per 100 g (salt
  // 5.53 g; sugars, fibre and saturates not listed, so 0). Was 525 kcal with
  // 28 g fat (template row).
  [
    "bread sauce packet",
    375,
    10.7,
    71.3,
    4,
    0,
    0,
    2212,
    0
  ],
  [
    "bread crumbs fresh",
    64,
    2.2,
    7.5,
    3.2,
    2.2,
    8,
    111,
    1.2000000000000002
  ],
  // Yutaka Panko Breadcrumbs label (Ocado 408222011), per 100 g. Fibre isn't listed. Was
  // 246 kcal and 4 g fat.
  [
    "panko breadcrumbs",
    362,
    15,
    70,
    1.7,
    0,
    3.8,
    308,
    0.4
  ],
  // CoFID 11-1045 "Flour, corn". UK cornflour is the starch. Was 179 kcal and 3 g fat.
  [
    "cornflour",
    354,
    0.6,
    92,
    0.7,
    0.1,
    0,
    11,
    0.1
  ],
  // CoFID 11-1045 "Flour, corn". Was 417 kcal and 11 g fat.
  [
    "corn starch",
    354,
    0.6,
    92,
    0.7,
    0.1,
    0,
    11,
    0.1
  ],
  // CoFID 17-062 "Sugar, icing". Was 518 kcal and 26 g fat.
  [
    "icing sugar",
    393,
    0,
    104.9,
    0,
    0,
    103.8,
    12,
    0
  ],
  // CoFID 17-063 "Sugar, white". Caster sugar is white sugar. Was 58 kcal and 1.2 g fat.
  [
    "caster sugar",
    394,
    0,
    105,
    0,
    0,
    105,
    5,
    0
  ],
  // CoFID 17-060 "Sugar, brown". Was 246 kcal and 9 g fat.
  [
    "brown sugar light",
    380,
    0.1,
    101.3,
    0,
    0,
    101.3,
    31,
    0
  ],
  // CoFID 17-060 "Sugar, brown". CoFID has one brown sugar row. Was 186 kcal and 8 g fat.
  [
    "brown sugar dark",
    380,
    0.1,
    101.3,
    0,
    0,
    101.3,
    31,
    0
  ],
  // CoFID 17-059 "Molasses". Was 414 kcal and 9 g fat.
  [
    "molasses",
    266,
    0,
    68.8,
    0.1,
    0,
    59.4,
    37,
    0
  ],
  // CoFID 17-065 "Syrup, golden". Was 519 kcal and 24 g fat.
  [
    "golden syrup",
    298,
    0.3,
    79,
    0,
    0,
    79,
    270,
    0
  ],
  // CoFID 17-826 "Treacle, black". Was 59 kcal and 0 g fat.
  [
    "black treacle",
    257,
    1.2,
    67.2,
    0,
    0,
    66.8,
    180,
    0
  ],
  // CoFID 17-073 "Jam, fruit with edible seeds". CoFID gives no fibre figure (0 here). Was
  // 243 kcal and 7 g fat.
  [
    "jam strawberry",
    261,
    0.6,
    69,
    0,
    0,
    69,
    29,
    0
  ],
  // CoFID 17-073 "Jam, fruit with edible seeds". CoFID gives no fibre figure (0 here). Was
  // 183 kcal and 6 g fat.
  [
    "jam raspberry",
    261,
    0.6,
    69,
    0,
    0,
    69,
    29,
    0
  ],
  // CoFID 17-078 "Marmalade". Was 415 kcal and 14 g fat.
  [
    "marmalade",
    261,
    0.1,
    69.5,
    0,
    0.5,
    69.5,
    64,
    0
  ],
  // CoFID 17-762 "Lemon curd". Was 517 kcal and 29 g fat.
  [
    "lemon curd",
    266,
    0.6,
    58.4,
    4.9,
    0.2,
    52.5,
    65,
    1.52
  ],
  // CoFID 17-659 "Chocolate spread". Was 66 kcal and 0 g fat.
  [
    "nutella style spread",
    575,
    3.3,
    59.4,
    37.7,
    2,
    59.4,
    58,
    8.13
  ],
  // CoFID 14-892 "Peanut butter, smooth". CoFID has smooth only. Was 250 kcal and 5 g fat.
  [
    "peanut butter crunchy",
    607,
    22.8,
    13.1,
    51.8,
    6.6,
    6.7,
    350,
    12.78
  ],
  [
    "almond butter",
    183,
    14,
    24,
    4,
    4,
    10,
    440,
    2
  ],
  [
    "seed butter mix",
    421,
    10,
    69,
    12,
    7,
    25,
    329,
    5.4
  ],
  // CoFID 14-847 "Tahini paste". Was 519 kcal and 27 g fat.
  [
    "tahini paste",
    607,
    18.5,
    0.9,
    58.9,
    8,
    0.4,
    20,
    8.4
  ],
  // CoFID 17-623 "Pesto, red". Was 59 kcal and 2.2 g fat.
  [
    "pesto jar red",
    317,
    5,
    5.9,
    30.6,
    3.3,
    5.2,
    770,
    4.68
  ],
  // CoFID 17-622 "Pesto, green". Was 244 kcal and 10 g fat.
  [
    "pesto jar green",
    420,
    5.6,
    3.9,
    42.5,
    1.1,
    2.3,
    840,
    6.5
  ],
  [
    "pesto vegan",
    181,
    13,
    29,
    2,
    5,
    15,
    535,
    2
  ],
  // CoFID 17-709 "Tomato ketchup". Was 420 kcal and 10 g fat.
  [
    "tomato ketchup",
    115,
    1.6,
    28.6,
    0.1,
    0.9,
    27.5,
    800,
    0
  ],
  // CoFID 17-678 "Brown sauce, reduced salt/sugar". CoFID has the reduced salt/sugar row
  // only. Was 518 kcal and 25 g fat.
  [
    "brown sauce",
    88,
    0.7,
    20,
    0.1,
    0.7,
    14.1,
    390,
    0
  ],
  [
    "mayonnaise light",
    62,
    3.2,
    12.5,
    0.20000000000000018,
    3.2,
    9,
    186,
    1.2000000000000002
  ],
  // CoFID 17-654 "Mayonnaise, standard, retail". Was 248 kcal and 8 g fat.
  [
    "mayonnaise full fat",
    686,
    1.1,
    2.4,
    74.8,
    0,
    2.4,
    131,
    5.65
  ],
  [
    "salad cream",
    181,
    12,
    24,
    7,
    2,
    12,
    630,
    2
  ],
  [
    "french dressing",
    421,
    8,
    69,
    15,
    5,
    27,
    519,
    5.4
  ],
  [
    "caesar dressing",
    522,
    7,
    56,
    23,
    5,
    34,
    598,
    12.8
  ],
  // CoFID 17-715 "Dressing, blue cheese". Was 66 kcal and 0 g fat.
  [
    "blue cheese dressing",
    368,
    2,
    9.8,
    35.9,
    1.3,
    7.7,
    840,
    6.59
  ],
  // CoFID 17-705 "Barbecue sauce". Was 293 kcal and 6 g fat.
  [
    "bbq sauce",
    140,
    1,
    36.1,
    0.1,
    1.2,
    29.9,
    630,
    0
  ],
  // Blue Dragon Sweet Chilli Dipping Sauce label (Tesco), per 100 ml: 230
  // kcal, 55.1 g carbohydrate (54.7 g sugars), 4.3 g salt. Protein and fat
  // aren't listed; 0.5 g each. Was 188 kcal with 17 g protein and 5 g fat.
  [
    "sweet chilli sauce",
    230,
    0.5,
    55.1,
    0.5,
    0,
    54.7,
    1720,
    0
  ],
  // Flying Goose Sriracha, per 100 g (Fitatu listing; the brand's NZ label
  // states 140 kcal from 7 g carbohydrate, which doesn't add up). Salt isn't
  // listed. Was 420 kcal with 7 g protein and 13 g fat.
  [
    "sriracha sauce",
    122,
    1.8,
    23,
    1.3,
    0,
    18,
    0,
    0
  ],
  // Tabasco Original label (Ocado, Tesco), per 100 ml: 16 kcal, 0.7 g fat;
  // 1.6 g carbohydrate and 1 g protein from other retailer listings. Salt
  // isn't listed. Was 524 kcal with 6 g protein and 28 g fat.
  [
    "hot sauce tabasco",
    16,
    1,
    1.6,
    0.7,
    0,
    0,
    0,
    0
  ],
  // CoFID 17-723 "Worcestershire sauce". Was 66 kcal and 3.2 g fat.
  [
    "worcestershire sauce",
    113,
    1.4,
    28.3,
    0.1,
    0,
    21.5,
    1500,
    0
  ],
  // CoFID 17-707 "Mint sauce". CoFID gives no fibre figure (0 here). Was 294
  // kcal and 4 g fat.
  [
    "mint sauce",
    101,
    1.6,
    21.5,
    0,
    0,
    21.5,
    480,
    0
  ],
  // Colman's Bramley Apple Sauce label (Tesco, Sainsbury's), per 100 g: 115
  // kcal, 28 g carbohydrate (26 g sugars), protein and fat under 0.5 g. Was
  // 185 kcal with 16 g protein and 3 g fat.
  [
    "apple sauce jar",
    115,
    0,
    28,
    0,
    0,
    26,
    0,
    0
  ],
  // Ocean Spray Smooth Cranberry Sauce label, per 100 g: 150 kcal, 37 g
  // carbohydrate (33 g sugars), fat and fibre under 0.5 g. Was 425 kcal with
  // 12 g protein and 11 g fat.
  [
    "cranberry sauce jar",
    150,
    0,
    37,
    0,
    0,
    33,
    0,
    0
  ],
  // CoFID 13-309 "Onions, pickled, drained". Was 521 kcal and 26 g fat.
  [
    "pickled onions",
    24,
    0.9,
    4.9,
    0.2,
    1.6,
    3.5,
    450,
    0
  ],
  // CoFID 13-246 "Gherkins, pickled, drained". Was 62 kcal and 1.2 g fat.
  [
    "pickled gherkins",
    14,
    0.9,
    2.6,
    0.1,
    1.5,
    2.4,
    690,
    0
  ],
  // CoFID 13-336 "Sauerkraut". Was 243 kcal and 9 g fat.
  [
    "sauerkraut jar",
    9,
    1.1,
    1.1,
    0,
    2.2,
    1.1,
    590,
    0
  ],
  // Blueville Mat Korean Cabbage Kimchi label (Ocado 675710011), per 100 g. Was 180 kcal
  // and 8 g fat.
  [
    "kimchi jar",
    38,
    2.1,
    7.2,
    0.6,
    2.3,
    2.2,
    760,
    0.2
  ],
  // CoFID 14-340 "Olives, green, in brine, drained, flesh and skin". Was 422
  // kcal and 9 g fat.
  [
    "olives green jar",
    103,
    0.9,
    0,
    11,
    2.9,
    0,
    1330,
    1.7
  ],
  [
    "olives black jar",
    523,
    10,
    61,
    24,
    4,
    33,
    483,
    12.8
  ],
  // Cooks&Co Capers label (Ocado 701927011), per 100 g drained; fat is "<0.5 g". Was 56
  // kcal and 0 g fat.
  [
    "capers jar",
    26,
    2,
    2.4,
    0.4,
    3,
    0,
    2252,
    0.1
  ],
  // Tesco Sun Dried Tomatoes 285 g jar in sunflower and olive oil (drained
  // 145 g), label per 100 g "as sold, drained" (tesco.com product 265335941,
  // read 16 Nov 2026). Salt 2.58 g = 1,032 mg sodium. CoFID has no dried
  // tomato. Every sun-dried tomato name finds this row (lookup.ts). Was 251
  // kcal, 10 g protein and 47 g carbohydrate.
  [
    "sun dried tomatoes jar",
    183,
    3,
    7,
    14.1,
    7.9,
    6.4,
    1032,
    1.6
  ],
  [
    "roasted peppers jar",
    189,
    14,
    24,
    6,
    2,
    8,
    610,
    2
  ],
  [
    "artichoke hearts jar",
    426,
    10,
    69,
    14,
    5,
    23,
    499,
    5.4
  ],
  // CoFID 13-426 "Beansprouts, mung, raw". Was 525 kcal and 29 g fat.
  [
    "bean sprouts fresh",
    31,
    2.9,
    4,
    0.5,
    1.5,
    2.2,
    5,
    0.1
  ],
  [
    "soy bean sprouts",
    62,
    4.2,
    7.5,
    0,
    4.2,
    10,
    261,
    1.2000000000000002
  ],
  [
    "mixed stir fry veg",
    247,
    9,
    42,
    5,
    5,
    16,
    896,
    4.6
  ],
  // Blue Dragon Black Bean Stir Fry Sauce label, per 100 g. Was 195 kcal with
  // 13 g protein (template row).
  [
    "stir fry sauce black bean",
    123,
    2.1,
    24,
    2.1,
    0,
    20,
    520,
    0.2
  ],
  // Blue Dragon Sweet & Sour Stir Fry Sauce label, per 100 g (salt 1.2 g).
  // Was 431 kcal with 9 g protein and 12 g fat (template row).
  [
    "stir fry sauce sweet sour",
    132,
    0.2,
    32.7,
    0.1,
    0,
    28.2,
    480,
    0
  ],
  [
    "curry paste red thai",
    527,
    8,
    61,
    27,
    6,
    35,
    673,
    12.8
  ],
  [
    "curry paste green thai",
    25,
    3.2,
    12.5,
    2.2,
    1.2,
    7,
    356,
    1.2000000000000002
  ],
  [
    "curry paste tikka",
    246,
    14,
    47,
    10,
    6,
    13,
    991,
    4.6
  ],
  [
    "curry powder mild",
    187,
    12,
    24,
    2,
    4,
    10,
    800,
    2
  ],
  // CoFID 13-829 "Garam masala". CoFID gives no fibre or sugars or saturated fat figure (0
  // here). Was 425 kcal and 10 g fat.
  [
    "garam masala powder",
    379,
    15.6,
    45.2,
    15.1,
    0,
    0,
    97,
    0
  ],
  [
    "curry leaves dried",
    525,
    7,
    56,
    25,
    3,
    32,
    368,
    12.8
  ],
  // CoFID 17-364 "Mustard, smooth". Smooth mustard. CoFID gives no fibre figure (0 here).
  // Was 59 kcal and 0.2 g fat.
  [
    "mustard dijon",
    139,
    7.1,
    9.7,
    8.2,
    0,
    7.8,
    2950,
    0.5
  ],
  // CoFID 17-364 "Mustard, smooth". Smooth mustard. CoFID gives no fibre figure (0 here).
  // Was 244 kcal and 8 g fat.
  [
    "mustard english",
    139,
    7.1,
    9.7,
    8.2,
    0,
    7.8,
    2950,
    0.5
  ],
  // CoFID 17-365 "Mustard, wholegrain". Was 188 kcal and 7 g fat.
  [
    "mustard wholegrain",
    140,
    8.2,
    4.2,
    10.2,
    4.9,
    3.9,
    1620,
    0.6
  ],
  // CoFID 17-314 "Horseradish sauce". Was 423 kcal and 15 g fat.
  [
    "horseradish sauce",
    153,
    2.5,
    17.9,
    8.4,
    2.5,
    15,
    910,
    1.1
  ],
  // CoFID 17-339 "Vinegar". Was 526 kcal and 23 g fat.
  [
    "apple cider vinegar",
    22,
    0.4,
    0.6,
    0,
    0,
    0.6,
    5,
    0
  ],
  // Filippo Berio Balsamic Vinegar label (Ocado 75692011), per 100 ml. Was 62 kcal and 0 g
  // fat.
  [
    "balsamic vinegar",
    126,
    0,
    27,
    0,
    0,
    27,
    20,
    0
  ],
  // CoFID 17-339 "Vinegar". Was 247 kcal and 6 g fat.
  [
    "white wine vinegar",
    22,
    0.4,
    0.6,
    0,
    0,
    0.6,
    5,
    0
  ],
  // CoFID 17-339 "Vinegar". Was 182 kcal and 5 g fat.
  [
    "malt vinegar",
    22,
    0.4,
    0.6,
    0,
    0,
    0.6,
    5,
    0
  ],
  // CoFID 17-339 "Vinegar". Was 418 kcal and 13 g fat.
  [
    "rice vinegar",
    22,
    0.4,
    0.6,
    0,
    0,
    0.6,
    5,
    0
  ],
  // Blue Dragon Mirin label (Ocado 207601011), per 100 ml; protein and fat are "<0.5 g".
  // Was 512 kcal and 28 g fat.
  [
    "mirin",
    272,
    0.4,
    68,
    0.4,
    0,
    35,
    4,
    0.05
  ],
  // Hinode Ryorishu Cooking Sake label (Ocado 491295011), per 100 ml. Its energy is the
  // alcohol. Was 58 kcal and 3.2 g fat.
  [
    "cooking sake",
    84,
    0.4,
    1.6,
    0,
    0,
    0.9,
    800,
    0
  ],
  // CoFID 17-755 "Wine, white, dry". Was 247 kcal and 4 g fat.
  [
    "white wine cooking",
    75,
    0.1,
    0.6,
    0,
    0,
    0.6,
    4,
    0
  ],
  // CoFID 17-752 "Wine, red". Was 186 kcal and 3 g fat.
  [
    "red wine cooking",
    76,
    0.1,
    0.2,
    0,
    0,
    0.2,
    7,
    0
  ],
  // CoFID 17-247 "Spirits, 40% volume". Its energy is the alcohol. Was 420 kcal and 11 g
  // fat.
  [
    "brandy cooking",
    222,
    0,
    0,
    0,
    0,
    0,
    0,
    0
  ],
  [
    "rum essence",
    518,
    10,
    61,
    26,
    6,
    31,
    653,
    12.8
  ],
  // Dr. Oetker Madagascan Vanilla Extract label (Ocado 388825011), per 100 ml. Was 61 kcal
  // and 1.2 g fat.
  [
    "vanilla extract",
    287,
    0,
    72,
    0,
    0,
    55,
    12,
    0
  ],
  [
    "almond extract",
    243,
    10,
    47,
    9,
    6,
    17,
    971,
    4.6
  ],
  // CoFID 17-355 "Baking powder". Was 183 kcal and 8 g fat.
  [
    "baking powder",
    163,
    5.2,
    37.8,
    0,
    0,
    0,
    11800,
    0
  ],
  // CoFID 17-356 "Bicarbonate of soda". Was 422 kcal and 9 g fat.
  [
    "bicarbonate soda",
    0,
    0,
    0,
    0,
    0,
    0,
    27380,
    0
  ],
  // CoFID 17-379 "Yeast, dried". CoFID gives no fibre or saturated fat figure (0 here). Was
  // 518 kcal and 24 g fat.
  [
    "yeast dried",
    169,
    35.6,
    3.5,
    1.5,
    0,
    0,
    50,
    0
  ],
  // CoFID 17-360 "Gelatine". Was 61 kcal and 0 g fat.
  [
    "gelatine powder",
    338,
    84.4,
    0,
    0,
    0,
    0,
    330,
    0
  ],
  // CoFID 11-1138 "Custard powder". Was 243 kcal and 7 g fat.
  [
    "custard powder",
    354,
    0.6,
    92,
    0.7,
    0.1,
    0,
    378,
    0.1
  ],
  // CoFID 12-507 "Cornetto type ice cream cone". Was 189 kcal and 6 g fat.
  [
    "cornetto style cone",
    292,
    3.5,
    39.6,
    14.4,
    1.2,
    27.9,
    90,
    11.04
  ],
  // CoFID 12-508 "Ice cream, dairy, vanilla, soft scoop". Was 423 kcal and 14 g fat.
  [
    "ice cream vanilla",
    169,
    3.2,
    22,
    8.2,
    0.2,
    22,
    63,
    5.19
  ],
  [
    "ice cream chocolate",
    526,
    8,
    61,
    29,
    4,
    33,
    443,
    12.8
  ],
  // Remeo Pistachio Gelato label (Ocado 349403011), per 100 ml. Was 62 kcal and 0 g fat.
  [
    "gelato pistachio",
    132,
    2.8,
    17,
    5.6,
    0.5,
    13,
    80,
    2.3
  ],
  [
    "frozen yoghurt",
    243,
    14,
    47,
    5,
    8,
    19,
    761,
    4.6
  ],
  // CoFID 12-393 "Sorbet, fruit". Fruit sorbet. CoFID gives no saturated fat figure (0
  // here). Was 182 kcal and 4 g fat.
  [
    "sorbet lemon",
    97,
    0.2,
    24.8,
    0.3,
    1,
    23.3,
    10,
    0
  ],
  // CoFID 12-390 "Lollies, containing ice-cream". Was 422 kcal and 12 g fat.
  [
    "solero style ice",
    118,
    1.4,
    20.9,
    3.8,
    0,
    20.9,
    31,
    2.07
  ],
  [
    "mini milk ice",
    520,
    7,
    56,
    27,
    5,
    30,
    538,
    12.8
  ],
  // CoFID 12-510 "Ice cream bars/choc ices, chocolate coated, luxury". Was 63 kcal and 2.2
  // g fat.
  [
    "mini magnum style",
    336,
    3.9,
    34.9,
    21.1,
    0,
    32.9,
    64,
    14.21
  ],
  [
    "plant cream",
    240,
    13,
    42,
    10,
    5,
    16,
    856,
    4.6
  ],
  [
    "oat cream",
    179,
    17,
    29,
    2,
    3,
    13,
    665,
    2
  ],
  [
    "cashew cream",
    418,
    7,
    74,
    10,
    6,
    28,
    554,
    5.4
  ],
  // CoFID 12-336 "Creme fraiche, half fat". Creme legere is light creme fraiche. Was 519
  // kcal and 25 g fat.
  [
    "creme legere",
    162,
    2.7,
    4.4,
    15,
    0,
    3,
    36,
    10.16
  ],
  // CoFID 12-332 "Cream, fresh, single". Was 58 kcal and 0.2 g fat.
  [
    "single cream",
    193,
    3.3,
    2.2,
    19.1,
    0,
    2.2,
    29,
    12.15
  ],
  // CoFID 12-334 "Cream, fresh, double, including Jersey cream". Was 241 kcal and 8 g fat.
  [
    "double cream",
    496,
    1.6,
    1.7,
    53.7,
    0,
    1.7,
    22,
    33.39
  ],
  // CoFID 12-592 "Cream, fresh, clotted". Was 183 kcal and 7 g fat.
  [
    "clotted cream",
    586,
    1.6,
    2.3,
    63.5,
    0,
    2.3,
    18,
    39.7
  ],
  [
    "mascarpone light",
    422,
    12,
    69,
    15,
    7,
    25,
    649,
    5.4
  ],
  // CoFID 12-174 "Cheese, Quark". Was 519 kcal and 23 g fat.
  [
    "quark cheese",
    74,
    14.6,
    4,
    0,
    0,
    4,
    45,
    0
  ],
  // Piatnica Semi-Fat Curd Cheese label (Tesco 314593807), per 100 g; the label gives no
  // fibre figure (0 here). CoFID has no curd cheese. Was 57 kcal and 12 g sugar in 7.5 g
  // carbohydrate.
  [
    "curd cheese",
    115,
    16,
    3.8,
    4,
    0,
    3.8,
    44,
    2.4
  ],
  // CoFID 12-495 "Cheese, Paneer". Was 290 kcal and 6 g fat.
  [
    "paneer",
    328,
    26,
    0.9,
    24.5,
    0,
    0.9,
    19,
    15.43
  ],
  // M&S Light Cypriot Grilling Cheese label (Ocado 552746011), per 100 g. Was 183 kcal and
  // 5 g fat.
  [
    "halloumi lite",
    236,
    25.5,
    0.8,
    14.5,
    0,
    0.6,
    932,
    9.7
  ],
  [
    "smoked cheese",
    419,
    11,
    74,
    13,
    4,
    22,
    344,
    5.4
  ],
  [
    "applewood cheese",
    523,
    10,
    61,
    28,
    4,
    29,
    423,
    12.8
  ],
  [
    "cheese strings",
    60,
    0,
    12.5,
    3.2,
    3.2,
    9,
    106,
    1.2000000000000002
  ],
  [
    "babybel cheese",
    243,
    10,
    47,
    4,
    8,
    15,
    741,
    4.6
  ],
  // CoFID 12-540 "Cheese spread, plain". Was 193 kcal and 3 g fat.
  [
    "cheese spread triangles",
    237,
    11.3,
    6.5,
    18.6,
    0,
    6.5,
    730,
    12.91
  ],
  // CoFID 12-551 "Cheese, spreadable, full fat, soft, white". Was 431 kcal and 11 g fat.
  [
    "philadelphia style spread",
    252,
    5.3,
    3,
    24.4,
    0,
    3,
    260,
    15.97
  ],
  // CoFID 12-540 "Cheese spread, plain". Was 525 kcal and 26 g fat.
  [
    "laughing cow style",
    237,
    11.3,
    6.5,
    18.6,
    0,
    6.5,
    730,
    12.91
  ],
  // CoFID 12-540 "Cheese spread, plain". Was 65 kcal and 14 g sugar in 7.5 g carbohydrate.
  [
    "primula cheese tube",
    237,
    11.3,
    6.5,
    18.6,
    0,
    6.5,
    730,
    12.91
  ],
  [
    "squirty cream",
    242,
    9,
    42,
    9,
    5,
    12,
    836,
    4.6
  ],
  [
    "squirty cream dairy",
    189,
    13,
    29,
    8,
    3,
    9,
    645,
    2
  ],
  [
    "squirty cream soy",
    423,
    9,
    74,
    9,
    6,
    24,
    534,
    5.4
  ],
  // CoFID 12-543 "Custard, ready to eat, canned and tetra-pak". Was 527 kcal and 24 g fat.
  [
    "custard carton fresh",
    98,
    2.7,
    16.3,
    2.9,
    0,
    12.8,
    41,
    1.89
  ],
  [
    "yoghurt drink strawberry",
    25,
    3.2,
    12.5,
    0,
    1.2,
    11,
    296,
    1.2000000000000002
  ],
  [
    "yoghurt drink mango",
    248,
    14,
    47,
    7,
    6,
    17,
    931,
    4.6
  ],
  [
    "kefir milk",
    180,
    12,
    24,
    6,
    4,
    14,
    740,
    2
  ],
  [
    "kefir coconut",
    419,
    8,
    69,
    14,
    7,
    29,
    629,
    5.4
  ],
  // CoFID 17-747 "Smoothies". Was 529 kcal and 29 g fat.
  [
    "smoothie berry bottled",
    49,
    0.5,
    12.2,
    0.1,
    1,
    11.6,
    0,
    0
  ],
  // CoFID 17-747 "Smoothies". Was 25 kcal and 0 g fat.
  [
    "smoothie green bottled",
    49,
    0.5,
    12.2,
    0.1,
    1,
    11.6,
    0,
    0
  ],
  // UFIT Vanilla Protein Milkshake label (Ocado 343978011), per 100 ml. Was 250 kcal and 5
  // g fat.
  [
    "protein shake bottled",
    56,
    10,
    3.6,
    0.1,
    0,
    3.6,
    60,
    0.1
  ],
  [
    "meal replacement shake",
    192,
    17,
    29,
    4,
    5,
    11,
    435,
    2
  ],
  [
    "energy drink",
    418,
    7,
    74,
    12,
    4,
    26,
    324,
    5.4
  ],
  [
    "isotonic drink",
    521,
    6,
    61,
    27,
    4,
    33,
    403,
    12.8
  ],
  // M&S Vitamin Water label (Ocado 648764011), per 100 ml. Was 59 kcal and 2.2 g fat.
  [
    "vitamin water",
    20,
    0,
    4.9,
    0,
    0,
    4.9,
    0,
    0
  ],
  [
    "flavoured sparkling lemon",
    254,
    12,
    47,
    10,
    8,
    19,
    721,
    4.6
  ],
  [
    "flavoured sparkling berry",
    195,
    16,
    24,
    2,
    2,
    8,
    530,
    2
  ],
  [
    "cordial blackcurrant",
    426,
    12,
    69,
    10,
    5,
    23,
    419,
    5.4
  ],
  [
    "cordial orange squash",
    528,
    5,
    56,
    25,
    5,
    30,
    498,
    12.8
  ],
  // CoFID 17-498 "Drinking chocolate, powder". CoFID gives no fibre figure (0 here). Was 66
  // kcal and 0.2 g fat.
  [
    "hot chocolate powder",
    377,
    6.4,
    79.7,
    5.8,
    0,
    77.7,
    228,
    3.41
  ],
  [
    "chai latte powder",
    246,
    11,
    42,
    8,
    5,
    16,
    816,
    4.6
  ],
  // CoFID 17-158 "Coffee, powder, instant". Was 184 kcal and 7 g fat.
  [
    "instant coffee",
    75,
    14.6,
    4.5,
    0,
    0,
    0,
    81,
    0
  ],
  [
    "ground coffee",
    419,
    11,
    74,
    15,
    6,
    28,
    514,
    5.4
  ],
  [
    "coffee pods generic",
    526,
    10,
    61,
    23,
    6,
    35,
    593,
    12.8
  ],
  [
    "decaf coffee instant",
    66,
    0,
    12.5,
    0,
    1.2,
    7,
    276,
    1.2000000000000002
  ],
  // CoFID 17-165 "Tea, black, infusion, average". Brewed tea. Was 242 kcal and 6 g fat.
  [
    "earl grey tea",
    0,
    0.1,
    0,
    0,
    0,
    0,
    0,
    0
  ],
  // CoFID 17-165 "Tea, black, infusion, average". Brewed tea. Was 191 kcal and 5 g fat.
  [
    "english breakfast tea",
    0,
    0.1,
    0,
    0,
    0,
    0,
    0,
    0
  ],
  // CoFID 17-171 "Tea, green, infusion". Brewed tea. Was 420 kcal and 13 g fat.
  [
    "green tea bags",
    0,
    0.1,
    0,
    0,
    0,
    0,
    1,
    0
  ],
  // CoFID 17-172 "Tea, herbal, infusion". Brewed tea. Was 521 kcal and 28 g fat.
  [
    "peppermint tea",
    1,
    0,
    0.2,
    0,
    0,
    0,
    0,
    0
  ],
  // CoFID 17-172 "Tea, herbal, infusion". Brewed tea. Was 57 kcal and 3.2 g fat.
  [
    "rooibos tea",
    1,
    0,
    0.2,
    0,
    0,
    0,
    0,
    0
  ],
  // CoFID 17-172 "Tea, herbal, infusion". Brewed tea. Was 244 kcal and 4 g fat.
  [
    "fruit tea mixed",
    1,
    0,
    0.2,
    0,
    0,
    0,
    0,
    0
  ],
  [
    "hot chocolate sachet",
    190,
    13,
    29,
    3,
    5,
    15,
    415,
    2
  ],
  [
    "horlicks style",
    420,
    9,
    74,
    11,
    4,
    22,
    304,
    5.4
  ],
  [
    "ovaltine style",
    521,
    8,
    61,
    26,
    4,
    29,
    383,
    12.8
  ],
  // CoFID 17-514 "Beef extract". Bovril is a beef extract. CoFID gives no saturated fat
  // figure (0 here). Was 52 kcal and 1.2 g fat.
  [
    "bovril",
    179,
    40.4,
    3.2,
    0.6,
    0,
    0.4,
    4370,
    0
  ],
  // CoFID 17-517 "Yeast extract". CoFID gives no saturated fat figure (0 here). Was 291
  // kcal and 9 g fat.
  [
    "marmite",
    180,
    40.7,
    3.5,
    0.4,
    0,
    1.6,
    4300,
    0
  ],
  // CoFID 17-517 "Yeast extract". CoFID gives no saturated fat figure (0 here). Was 178
  // kcal and 8 g fat.
  [
    "vegemite",
    180,
    40.7,
    3.5,
    0.4,
    0,
    1.6,
    4300,
    0
  ],
  // CoFID 17-724 "Gravy instant granules". Granules as sold. Was 428 kcal and 9 g fat.
  [
    "gravy granules chicken",
    407,
    4.4,
    65.2,
    16.1,
    1.6,
    5.3,
    5300,
    10.66
  ],
  // CoFID 17-724 "Gravy instant granules". Granules as sold. Was 526 kcal and 24 g fat.
  [
    "gravy granules beef",
    407,
    4.4,
    65.2,
    16.1,
    1.6,
    5.3,
    5300,
    10.66
  ],
  // CoFID 17-724 "Gravy instant granules". Granules as sold. Was 66 kcal and 0 g fat.
  [
    "gravy granules onion",
    407,
    4.4,
    65.2,
    16.1,
    1.6,
    5.3,
    5300,
    10.66
  ],
  // CoFID 17-727 "Stock cubes, vegetable", with the carbohydrate CoFID left
  // unmeasured filled by difference (see cofidEnergyGaps.ts). CoFID gives no
  // saturated fat. Was 249 kcal with 13 g protein and 7 g fat.
  [
    "stock cube vegetable",
    292,
    13.5,
    19.7,
    17.3,
    1.8,
    0,
    16800,
    0
  ],
  // CoFID 17-515 "Stock cubes, beef", with the carbohydrate CoFID left
  // unmeasured filled by difference (see cofidEnergyGaps.ts). Was 185 kcal
  // with 17 g protein and 6 g fat.
  [
    "stock cube beef",
    276,
    16.8,
    31.5,
    9.2,
    0,
    0,
    14560,
    3.51
  ],
  // CoFID 17-726 "Stock cubes, chicken", with the carbohydrate CoFID left
  // unmeasured filled by difference (see cofidEnergyGaps.ts). CoFID gives no
  // saturated fat. Was 424 kcal with 7 g protein and 14 g fat.
  [
    "stock cube chicken",
    289,
    15.4,
    22,
    15.4,
    0.6,
    0,
    16300,
    0
  ],
  // Marigold Swiss Vegetable Bouillon Powder label (Ocado 71131011), per 100 g dry. Fibre
  // isn't listed. Was 522 kcal and 29 g fat.
  [
    "bouillon powder",
    240,
    9.6,
    30.8,
    8.3,
    0,
    4,
    17520,
    0.9
  ],
  [
    "demi glace paste",
    62,
    1.2000000000000002,
    12.5,
    0,
    1.2,
    11,
    256,
    1.2000000000000002
  ],
  [
    "red wine jus",
    241,
    12,
    47,
    5,
    6,
    17,
    891,
    4.6
  ],
  // Dry mix as sold: Colman's White Sauce Mix label, per 100 g unprepared
  // (salt 9.2 g; fibre not listed, so 0). Was 188 kcal with 16 g protein
  // (template row).
  [
    "white sauce packet",
    413,
    8.1,
    55,
    17,
    0,
    8.4,
    3680,
    9.8
  ],
  [
    "cheese sauce packet",
    425,
    12,
    69,
    12,
    7,
    29,
    589,
    5.4
  ],
  // CoFID 17-631 "Sauce, traditional cook in, white sauce based". Was 522
  // kcal with 5 g protein and 27 g fat.
  [
    "white sauce jar",
    105,
    1.6,
    5.7,
    8.6,
    2.3,
    2.8,
    370,
    1.69
  ],
  // CoFID 17-631 "Sauce, traditional cook in, white sauce based". Was 58 kcal and 2.2 g
  // fat.
  [
    "bechamel jar",
    105,
    1.6,
    5.7,
    8.6,
    2.3,
    2.8,
    370,
    1.69
  ],
  // CoFID 17-625 "Sauce, pasta, carbonara type". Was 248 kcal and 10 g fat.
  [
    "carbonara sauce jar",
    151,
    4.9,
    3.8,
    13,
    1.3,
    0.8,
    340,
    7.67
  ],
  [
    "pesto cream sauce",
    187,
    15,
    29,
    2,
    5,
    11,
    795,
    2
  ],
  // Heinz Tomato & Vodka pasta sauce label (Waitrose), per 100 g: 66 kcal, 2
  // g protein, 4.9 g carbohydrate (3.8 g sugars), 3.3 g fat. Salt isn't
  // listed. Was 421 kcal with 11 g protein and 10 g fat.
  [
    "vodka sauce jar",
    66,
    2,
    4.9,
    3.3,
    0,
    3.8,
    0,
    0
  ],
  // CoFID 17-619 "Sauce, pasta, tomato based, napoletana": arrabbiata is
  // napoletana with chilli. Was 527 kcal with 10 g protein and 25 g fat.
  [
    "arrabbiata sauce jar",
    65,
    1.5,
    6.5,
    3.8,
    2.3,
    6.3,
    290,
    0.54
  ],
  // CoFID 17-619 "Sauce, pasta, tomato based, napoletana". Was 62 kcal with 0
  // g protein and 0.20000000000000018 g fat.
  [
    "napoli sauce jar",
    65,
    1.5,
    6.5,
    3.8,
    2.3,
    6.3,
    290,
    0.54
  ],
  // CoFID 17-619 "Sauce, pasta, tomato based, napoletana": pizza sauce is the
  // same tomato-and-oil sauce. Was 244 kcal with 10 g protein and 8 g fat.
  [
    "pizza sauce jar",
    65,
    1.5,
    6.5,
    3.8,
    2.3,
    6.3,
    290,
    0.54
  ],
  // Old El Paso Mild Enchilada Sauce label (Australia), per 100 g: 38 kcal, 1
  // g protein, 7.2 g carbohydrate (6.2 g sugars), 1 g fat, 1.2 g fibre. Salt
  // isn't listed. Was 185 kcal with 14 g protein and 7 g fat.
  [
    "enchilada sauce",
    38,
    1,
    7.2,
    1,
    1.2,
    6.2,
    0,
    0
  ],
  // Santa Maria Taco Seasoning Mix label (Ocado 632700011), per 100 g. Was 427 kcal and 15
  // g fat.
  [
    "taco seasoning packet",
    297,
    10,
    44,
    6,
    12,
    20,
    6320,
    0.7
  ],
  [
    "fajita seasoning",
    523,
    9,
    56,
    23,
    5,
    30,
    458,
    12.8
  ],
  // Old El Paso Garlic & Paprika Taco Seasoning Mix label (Ocado 380863011), per 100 g.
  // Tesco, Sainsbury's and Ocado sell no burrito-named mix; this is the same kind of
  // sachet. Was 63 kcal and 10 g sugar in 7.5 g carbohydrate.
  [
    "burrito seasoning",
    291,
    8.8,
    40.2,
    6.9,
    16.3,
    4.6,
    6608,
    0.8
  ],
  // Doritos Nacho Cheese Dip label (Ocado 56366011), per 100 g. Was 247 kcal and 6 g fat.
  [
    "nacho cheese sauce",
    206,
    2.8,
    8.9,
    18,
    0.5,
    3.1,
    360,
    3.2
  ],
  // Old El Paso Chunky Salsa (mild) label, 238 g bottle, per 100 g: 37 kcal,
  // 6.9 g carbohydrate (5 g sugars), 2.2 g fibre; 0.5 g fat from the 226 g
  // jar. Protein and salt aren't listed; 1 g protein, as in tomatoes. Was 184
  // kcal with 13 g protein and 5 g fat.
  [
    "salsa mild jar",
    37,
    1,
    6.9,
    0.5,
    2.2,
    5,
    0,
    0
  ],
  // Old El Paso Thick 'N' Chunky Hot Salsa (Sainsbury's): 35 kcal per 100 g;
  // other figures as the mild. Was 419 kcal with 9 g protein and 13 g fat.
  [
    "salsa hot jar",
    35,
    1,
    6.9,
    0.5,
    2.2,
    5,
    0,
    0
  ],
  [
    "refried beans tin",
    524,
    8,
    61,
    28,
    6,
    35,
    553,
    12.8
  ],
  [
    "black bean dip",
    60,
    3.2,
    12.5,
    3.2,
    1.2,
    7,
    236,
    1.2000000000000002
  ],
  [
    "guacamole chilled pot",
    250,
    14,
    47,
    4,
    6,
    13,
    871,
    4.6
  ],
  // CoFID 12-547 "Tzatziki". Was 190 kcal and 3 g fat.
  [
    "tzatziki chilled pot",
    76,
    3.4,
    3.4,
    5.5,
    0.3,
    3,
    369,
    3.58
  ],
  [
    "houmous caramelised onion",
    431,
    8,
    69,
    11,
    7,
    25,
    569,
    5.4
  ],
  [
    "houmous red pepper",
    525,
    7,
    56,
    26,
    3,
    32,
    648,
    12.8
  ],
  [
    "snacking olives",
    61,
    2.2,
    7.5,
    1.2000000000000002,
    2.2,
    12,
    331,
    1.2000000000000002
  ],
  [
    "antipasti mix",
    242,
    13,
    42,
    9,
    7,
    18,
    966,
    4.6
  ],
  // CoFID 19-496 "Ham". Was 192 kcal and 8 g fat.
  [
    "charcuterie ham slices",
    107,
    18.4,
    1,
    3.3,
    0.1,
    1,
    800,
    1.1
  ],
  [
    "parma ham slices",
    422,
    7,
    74,
    9,
    4,
    22,
    664,
    5.4
  ],
  // CoFID 19-517 "Salami". Was 520 kcal and 24 g fat.
  [
    "salami slices",
    438,
    20.9,
    0.5,
    39.2,
    0.4,
    0.5,
    1530,
    14.6
  ],
  // Unearthed Italian Pepperoni label (Ocado 528380011), per 100 g. Was 62 kcal and 0 g
  // fat.
  [
    "pepperoni slices",
    425,
    24,
    0.4,
    37,
    0,
    0.4,
    1160,
    15
  ],
  [
    "pastrami beef",
    242,
    12,
    47,
    7,
    8,
    15,
    661,
    4.6
  ],
  [
    "salt beef slices",
    186,
    16,
    24,
    6,
    2,
    12,
    470,
    2
  ],
  // CoFID 19-128 "Corned beef, canned". Was 421 kcal and 14 g fat.
  [
    "corned beef tin",
    205,
    25.9,
    1,
    10.9,
    0,
    1,
    860,
    5.7
  ],
  [
    "spam lite",
    516,
    5,
    56,
    29,
    5,
    34,
    438,
    12.8
  ],
  // CoFID 19-495 "Frankfurter". Was 66 kcal and 0 g fat.
  [
    "hot dogs frankfurter",
    287,
    13.6,
    1.1,
    25.4,
    0.1,
    1.1,
    730,
    9.2
  ],
  [
    "burger bun brioche",
    247,
    11,
    42,
    5,
    5,
    12,
    756,
    4.6
  ],
  [
    "burger bun seeded",
    187,
    15,
    29,
    4,
    3,
    9,
    565,
    2
  ],
  // CoFID 11-1006 "Bread rolls, white, soft". Was 417 kcal and 12 g fat.
  [
    "hot dog bun",
    254,
    9.3,
    51.5,
    2.6,
    2.6,
    2.6,
    400,
    0.62
  ],
  // CoFID 11-1006 "Bread rolls, white, soft". Was 515 kcal and 27 g fat.
  [
    "sub roll",
    254,
    9.3,
    51.5,
    2.6,
    2.6,
    2.6,
    400,
    0.62
  ],
  // CoFID 11-1006 "Bread rolls, white, soft". Was 58 kcal and 2.2 g fat.
  [
    "finger rolls",
    254,
    9.3,
    51.5,
    2.6,
    2.6,
    2.6,
    400,
    0.62
  ],
  // CoFID 11-980 "Bread, white, sliced". A batch loaf is a white loaf. Was 294 kcal and 10
  // g fat.
  [
    "batch loaf",
    219,
    7.9,
    46.1,
    1.6,
    2.5,
    3.4,
    400,
    0.29
  ],
  // CoFID 11-977 "Bread, white, farmhouse or split tin". Was 184 kcal and 2 g fat.
  [
    "farmhouse loaf",
    241,
    9,
    49.9,
    2,
    2.9,
    2.9,
    400,
    0.49
  ],
  // CoFID 11-923 "Bread, white, crusty bloomer, unsliced, fresh, large". Was
  // 419 kcal and 10 g fat.
  [
    "bloomer white",
    247,
    9.2,
    52.3,
    1.6,
    2.8,
    2.8,
    400,
    0.39
  ],
  // CoFID 11-971 "Bread, brown, average". Was 520 kcal and 25 g fat.
  [
    "bloomer brown",
    207,
    7.9,
    42.1,
    2,
    5,
    3.4,
    400,
    0.43
  ],
  // CoFID 11-985 "Bread rolls, white, crusty". Was 57 kcal and 0.2 g fat.
  [
    "crusty roll",
    262,
    9.2,
    54.9,
    2.2,
    2.9,
    2.7,
    400,
    0.51
  ],
  // CoFID 11-1006 "Bread rolls, white, soft". Was 240 kcal and 8 g fat.
  [
    "bridge roll",
    254,
    9.3,
    51.5,
    2.6,
    2.6,
    2.6,
    400,
    0.62
  ],
  [
    "scotch bun",
    180,
    13,
    29,
    7,
    5,
    11,
    755,
    2
  ],
  [
    "empire biscuit",
    420,
    9,
    74,
    15,
    4,
    26,
    644,
    5.4
  ],
  [
    "custard cream biscuit",
    528,
    8,
    61,
    23,
    4,
    33,
    723,
    12.8
  ],
  [
    "nice biscuit",
    58,
    3.2,
    12.5,
    0,
    3.2,
    13,
    6,
    1.2000000000000002
  ],
  [
    "pink wafer",
    294,
    14,
    47,
    6,
    8,
    19,
    641,
    4.6
  ],
  // CoFID 11-808 "Biscuits, iced". Was 181 kcal and 5 g fat.
  [
    "party rings",
    406,
    4.8,
    77.1,
    10.8,
    0.6,
    44.6,
    274,
    4.98
  ],
  // CoFID 11-808 "Biscuits, iced". Was 415 kcal and 13 g fat.
  [
    "iced gems",
    406,
    4.8,
    77.1,
    10.8,
    0.6,
    44.6,
    274,
    4.98
  ],
  [
    "chocolate fingers",
    524,
    7,
    56,
    28,
    5,
    30,
    418,
    12.8
  ],
  // CoFID 17-690 "Chocolate, fancy and filled". Was 57 kcal and 3.2 g fat.
  [
    "matchmakers",
    447,
    4.9,
    62.9,
    21.3,
    1.3,
    60,
    88,
    11.3
  ],
  // CoFID 17-690 "Chocolate, fancy and filled". Was 251 kcal and 4 g fat.
  [
    "quality street generic",
    447,
    4.9,
    62.9,
    21.3,
    1.3,
    60,
    88,
    11.3
  ],
  // CoFID 17-690 "Chocolate, fancy and filled". Was 190 kcal and 3 g fat.
  [
    "celebrations generic",
    447,
    4.9,
    62.9,
    21.3,
    1.3,
    60,
    88,
    11.3
  ],
  // CoFID 17-690 "Chocolate, fancy and filled". Was 420 kcal and 11 g fat.
  [
    "heroes generic",
    447,
    4.9,
    62.9,
    21.3,
    1.3,
    60,
    88,
    11.3
  ],
  // CoFID 17-690 "Chocolate, fancy and filled". Was 520 kcal and 26 g fat.
  [
    "roses generic",
    447,
    4.9,
    62.9,
    21.3,
    1.3,
    60,
    88,
    11.3
  ],
  [
    "fruit pastilles",
    61,
    1.2000000000000002,
    12.5,
    1.2000000000000002,
    1.2,
    7,
    196,
    1.2000000000000002
  ],
  [
    "wine gums",
    293,
    12,
    47,
    9,
    6,
    13,
    831,
    4.6
  ],
  [
    "jelly babies",
    182,
    16,
    24,
    8,
    4,
    10,
    640,
    2
  ],
  [
    "love hearts",
    417,
    12,
    69,
    9,
    7,
    25,
    529,
    5.4
  ],
  [
    "skittles generic",
    523,
    5,
    56,
    24,
    3,
    32,
    608,
    12.8
  ],
  // CoFID 17-096 "Smartie-type sweets". CoFID gives no fibre figure (0 here). Was 62 kcal
  // and 0 g fat.
  [
    "m and ms generic",
    456,
    5.4,
    73.9,
    17.5,
    0,
    70.8,
    58,
    10.4
  ],
  // CoFID 17-096 "Smartie-type sweets". CoFID gives no fibre figure (0 here). Was 245 kcal
  // and 7 g fat.
  [
    "smarties generic",
    456,
    5.4,
    73.9,
    17.5,
    0,
    70.8,
    58,
    10.4
  ],
  // CoFID 17-096 "Smartie-type sweets". CoFID gives no fibre figure (0 here). Was 187 kcal
  // and 6 g fat.
  [
    "minstrels generic",
    456,
    5.4,
    73.9,
    17.5,
    0,
    70.8,
    58,
    10.4
  ],
  // CoFID 17-651 "Maltesers and similar products". Was 420 kcal and 14 g fat.
  [
    "revels generic",
    476,
    7.6,
    63,
    23.3,
    1.7,
    55.5,
    156,
    14.16
  ],
  // CoFID 17-651 "Maltesers and similar products". Was 524 kcal and 29 g fat.
  [
    "maltesers generic",
    476,
    7.6,
    63,
    23.3,
    1.7,
    55.5,
    156,
    14.16
  ],
  // CoFID 11-848 "Mince pies, retail". Was 55 kcal and 0 g fat.
  [
    "mince pie",
    377,
    3.8,
    60.7,
    14.9,
    2.6,
    35.5,
    101,
    5.97
  ],
  // CoFID 11-1022 "Pudding, Christmas, retail". Was 252 kcal and 5 g fat.
  [
    "christmas pudding slice",
    285,
    3,
    56.3,
    6.9,
    4,
    46.2,
    100,
    3.57
  ],
  // M&S Classic Panettone label (Ocado 528933011), per 100 g. Was 185 kcal and 4 g fat.
  [
    "panettone slice",
    364,
    7.4,
    51.5,
    13.7,
    2.4,
    27.6,
    152,
    8
  ],
  // M&S Collection Stollen Slices label (Ocado 566772011), per 100 g. Was 419 kcal and 12
  // g fat.
  [
    "stollen slice",
    350,
    5.1,
    51.6,
    11.9,
    3.1,
    40.7,
    132,
    4.1
  ],
  [
    "hot cross bun chocolate",
    530,
    9,
    56,
    27,
    5,
    34,
    398,
    12.8
  ],
  // CoFID 11-991 "Cake, fruit, rich, iced, homemade"; simnel cake is a rich fruit cake
  // with marzipan. Was 57 kcal and 14 g sugar in 7.5 g carbohydrate.
  [
    "simnel cake",
    355,
    3.7,
    67,
    9.6,
    1.3,
    58.9,
    98,
    4.53
  ],
  // CoFID 11-1028 "Tart, bakewell, homemade". Was 242 kcal and 10 g fat.
  [
    "bakewell tart",
    454,
    6.9,
    40.8,
    30.4,
    1.5,
    22.7,
    212,
    8.8
  ],
  // CoFID 11-846 "Jam tarts, retail". Was 178 kcal and 2 g fat.
  [
    "jam tart",
    353,
    3.2,
    58.2,
    13.5,
    1.4,
    32.1,
    26,
    5.54
  ],
  // CoFID 12-461 "Tarts, custard, individual". Was 418 kcal and 10 g fat.
  [
    "custard tart",
    263,
    6.7,
    28.7,
    14.3,
    1.1,
    14.2,
    114,
    5.87
  ],
  [
    "lemon tart",
    517,
    8,
    61,
    25,
    6,
    31,
    493,
    12.8
  ],
  // CoFID 11-1126 "Treacle tart, homemade". Was 58 kcal and 0.2 g fat.
  [
    "treacle tart",
    380,
    3.8,
    59.2,
    15.9,
    1.7,
    33.8,
    258,
    5.84
  ],
  // CoFID 12-580 "Pudding, rice, canned". Was 245 kcal and 8 g fat.
  [
    "rice pudding tin",
    85,
    3.3,
    16.1,
    1.3,
    0.1,
    8.7,
    43,
    0.76
  ],
  // CoFID 11-1122 "Pudding, spotted dick, homemade". CoFID has no tinned figure. Was 186
  // kcal and 7 g fat.
  [
    "spotted dick tin",
    344,
    4.5,
    48.3,
    16.1,
    1.2,
    19.1,
    226,
    9.02
  ],
  [
    "bread pudding slice",
    425,
    8,
    69,
    15,
    7,
    29,
    509,
    5.4
  ],
  [
    "clootie dumpling",
    523,
    7,
    56,
    23,
    3,
    28,
    588,
    12.8
  ],
  [
    "snowball cake",
    59,
    2.2,
    7.5,
    0,
    2.2,
    8,
    271,
    1.2000000000000002
  ],
  // M&S Rocky Road label (Ocado 510667011), per 100 g. Was 245 kcal and 6 g fat.
  [
    "rocky road slice",
    425,
    5.4,
    66,
    14.9,
    2.6,
    58.6,
    52,
    9
  ],
  [
    "flapjack oats syrup",
    189,
    17,
    29,
    5,
    5,
    11,
    715,
    2
  ],
  [
    "millionaires flapjack",
    427,
    7,
    74,
    13,
    4,
    26,
    604,
    5.4
  ],
  [
    "energy ball date",
    523,
    6,
    61,
    28,
    4,
    33,
    683,
    12.8
  ],
  [
    "trail mix nut",
    59,
    1.2000000000000002,
    12.5,
    3.2,
    3.2,
    13,
    366,
    1.2000000000000002
  ],
  // CoFID 14-849 "Trail mix". CoFID gives no saturated fat figure (0 here). Was 244 kcal
  // and 4 g fat.
  [
    "trail mix fruit",
    432,
    9.1,
    37.2,
    28.5,
    5.1,
    37.1,
    27,
    0
  ],
  [
    "sun maid raisins snack",
    192,
    16,
    24,
    3,
    2,
    8,
    410,
    2
  ],
  [
    "yoghurt raisins",
    421,
    12,
    69,
    11,
    5,
    23,
    299,
    5.4
  ],
  [
    "chocolate raisins",
    524,
    5,
    56,
    26,
    5,
    30,
    378,
    12.8
  ],
  // Minton & Donello Yoghurt Coated Peanuts label (Tesco 330696073), per 100 g. Was 65
  // kcal and 1.2 g fat.
  [
    "yoghurt coated nuts",
    554,
    12.6,
    41.7,
    36.4,
    4.5,
    36.2,
    72,
    11.9
  ],
  [
    "dark chocolate almonds",
    251,
    11,
    42,
    9,
    5,
    16,
    696,
    4.6
  ],
  [
    "milk chocolate brazil nuts",
    196,
    15,
    29,
    8,
    3,
    13,
    505,
    2
  ],
  [
    "student noodle pot chicken",
    432,
    11,
    74,
    9,
    6,
    28,
    394,
    5.4
  ],
  [
    "student noodle pot curry",
    531,
    10,
    61,
    24,
    6,
    35,
    473,
    12.8
  ],
  [
    "instant ramen beef",
    64,
    0,
    12.5,
    0,
    1.2,
    7,
    156,
    1.2000000000000002
  ],
  [
    "instant ramen chicken",
    250,
    10,
    47,
    7,
    6,
    13,
    791,
    4.6
  ],
  [
    "pot noodle curry",
    186,
    14,
    24,
    6,
    4,
    10,
    600,
    2
  ],
  [
    "pot noodle bbq",
    420,
    10,
    69,
    14,
    7,
    25,
    489,
    5.4
  ],
  [
    "couscous cup spicy",
    525,
    9,
    56,
    29,
    3,
    32,
    568,
    12.8
  ],
  [
    "couscous cup lemon",
    64,
    4.2,
    7.5,
    0,
    2.2,
    12,
    251,
    1.2000000000000002
  ],
  [
    "microwave rice jasmine",
    251,
    9,
    42,
    5,
    7,
    18,
    886,
    4.6
  ],
  [
    "microwave rice pilau",
    190,
    13,
    29,
    4,
    5,
    15,
    695,
    2
  ],
  [
    "microwave rice mexican",
    428,
    9,
    74,
    12,
    4,
    22,
    584,
    5.4
  ],
  [
    "rice pouch coconut",
    525,
    8,
    61,
    27,
    4,
    29,
    663,
    12.8
  ],
  [
    "rice pouch lemon herb",
    67,
    3.2,
    12.5,
    2.2,
    3.2,
    9,
    346,
    1.2000000000000002
  ],
  [
    "microwave jacket potato cheese",
    259,
    14,
    47,
    10,
    8,
    15,
    981,
    4.6
  ],
  [
    "microwave mac cheese",
    190,
    12,
    24,
    2,
    2,
    12,
    790,
    2
  ],
  // Heinz Spaghetti Hoops label (Ocado 412783011), per 100 g. Was 431 kcal and 10 g fat.
  [
    "microwave spaghetti hoops",
    52,
    1.7,
    10.6,
    0.2,
    0.6,
    3.9,
    160,
    0.05
  ],
  // CoFID 13-535 "Baked beans, canned in tomato sauce, reduced sugar, reduced salt". Was
  // 532 kcal and 25 g fat.
  [
    "baked beans reduced sugar",
    75,
    5,
    13.5,
    0.5,
    4.9,
    3.3,
    190,
    0.09
  ],
  // Heinz Baked Beans & Richmond Sausages label (Ocado 639922011), per 100 g; Tesco and
  // Ocado sell no beans with chorizo. CoFID 13-579 (beans with pork sausages, 98 kcal)
  // answers for this name and has no saturated-fat figure, which this row supplies. Was 65
  // kcal and 14 g sugar in 7.5 g carbohydrate.
  [
    "baked beans chorizo",
    79,
    4,
    11,
    2.1,
    0.9,
    3.9,
    320,
    0.7
  ],
  // CoFID 11-735 "Pasta, spaghetti, canned, in tomato sauce". Was 248 kcal and 8 g fat.
  [
    "spaghetti hoops tin",
    72,
    2.1,
    16.2,
    0.3,
    0.9,
    5.5,
    190,
    0.05
  ],
  // CoFID 11-735 "Pasta, spaghetti, canned, in tomato sauce". Was 192 kcal and 7 g fat.
  [
    "alphabet spaghetti tin",
    72,
    2.1,
    16.2,
    0.3,
    0.9,
    5.5,
    190,
    0.05
  ],
  // CoFID 11-736 "Pasta, ravioli, meat filling, canned in tomato sauce". Was
  // 424 kcal and 15 g fat.
  [
    "ravioli tin tomato",
    77,
    2.3,
    14.8,
    1.4,
    1.1,
    3.4,
    260,
    0.46
  ],
  [
    "macaroni cheese tin",
    526,
    6,
    61,
    23,
    6,
    31,
    453,
    12.8
  ],
  // CoFID 19-208 "Chilli con carne, retail, reheated". Was 66 kcal and 0 g fat.
  [
    "chilli con carne tin",
    96,
    7.7,
    7.1,
    4.3,
    1.4,
    2.7,
    310,
    1.9
  ],
  [
    "hot dog tin",
    240,
    12,
    47,
    6,
    6,
    17,
    771,
    4.6
  ],
  [
    "corned beef hash tin",
    190,
    16,
    24,
    5,
    4,
    14,
    580,
    2
  ],
  // CoFID 17-652 "Soup, cream of tomato, canned". Was 430 kcal and 13 g fat.
  [
    "cream of tomato soup tin",
    51,
    0.9,
    7.8,
    2,
    0.6,
    5.5,
    245,
    0.27
  ],
  // CoFID 17-695 "Soup, chicken, cream of, canned". Was 523 kcal and 28 g fat.
  [
    "chicken soup tin",
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
    "mushroom soup tin",
    63,
    0.20000000000000018,
    7.5,
    3.2,
    2.2,
    8,
    231,
    1.2000000000000002
  ],
  [
    "veg soup tin",
    241,
    11,
    42,
    4,
    7,
    14,
    866,
    4.6
  ],
  // CoFID 17-711 "Soup, minestrone, canned". Was 184 kcal and 3 g fat.
  [
    "minestrone tin",
    31,
    1.1,
    6.6,
    0.2,
    0.9,
    1.8,
    200,
    0.1
  ],
  // CoFID 17-698 "Soup, lentil, canned". CoFID gives no saturated fat figure (0 here). Was
  // 421 kcal and 11 g fat.
  [
    "lentil soup tin",
    46,
    3.1,
    8.5,
    0.2,
    1.2,
    1.2,
    200,
    0
  ],
  [
    "pea ham soup tin",
    523,
    10,
    61,
    26,
    4,
    33,
    643,
    12.8
  ],
  // CoFID 17-835 "Scotch broth, homemade". CoFID has no tinned figure. Was 62 kcal and 1.2
  // g fat.
  [
    "scotch broth tin",
    74,
    6.8,
    4,
    3.5,
    0.9,
    1.6,
    22,
    1.6
  ],
  // CoFID 17-700 "Soup, oxtail, canned". Was 244 kcal and 9 g fat.
  [
    "oxtail soup tin",
    44,
    2.4,
    5.1,
    1.7,
    0.1,
    0.9,
    220,
    0.6
  ],
  // CoFID 17-795 "Soup, gazpacho, homemade". Was 186 kcal and 8 g fat.
  [
    "gazpacho chilled",
    46,
    0.8,
    2.9,
    3.6,
    0.7,
    2.5,
    128,
    0.5
  ],
  // CoFID 17-831 "Soup, potato and leek, homemade". Vichyssoise is potato and leek soup.
  // Was 425 kcal and 9 g fat.
  [
    "vichyssoise chilled",
    56,
    1.5,
    6.2,
    2.2,
    0.8,
    1.5,
    47,
    1.32
  ],
  [
    "salmorejo chilled",
    524,
    9,
    56,
    24,
    5,
    30,
    738,
    12.8
  ],
  // CoFID 12-547 "Tzatziki". Was 66 kcal and 0 g fat.
  [
    "tzatziki dip chilled",
    76,
    3.4,
    3.4,
    5.5,
    0.3,
    3,
    369,
    3.58
  ],
  [
    "guacamole snack pot",
    248,
    9,
    42,
    7,
    5,
    16,
    656,
    4.6
  ],
  // Jar salsa figures (Old El Paso mild, see "salsa mild jar"). Was 185 kcal
  // with 13 g protein and 6 g fat.
  [
    "salsa snack pot",
    37,
    1,
    6.9,
    0.5,
    2.2,
    5,
    0,
    0
  ],
  [
    "baby cucumber snack",
    425,
    9,
    74,
    14,
    6,
    28,
    354,
    5.4
  ],
  [
    "baby carrot snack",
    524,
    8,
    61,
    29,
    6,
    35,
    433,
    12.8
  ],
  [
    "fruit pot melon",
    61,
    3.2,
    12.5,
    0,
    1.2,
    7,
    116,
    1.2000000000000002
  ],
  // CoFID 14-336 "Fruit cocktail, canned in juice, whole contents". Was 247 kcal and 5 g
  // fat.
  [
    "fruit pot tropical",
    45,
    0.4,
    11.7,
    0,
    1,
    11.7,
    3,
    0
  ],
  [
    "fruit salad pot",
    185,
    12,
    24,
    4,
    4,
    10,
    560,
    2
  ],
  [
    "grape snack punnet",
    424,
    8,
    69,
    12,
    7,
    25,
    449,
    5.4
  ],
  [
    "apple slices snack",
    525,
    7,
    56,
    27,
    3,
    32,
    528,
    12.8
  ],
  // CoFID 12-346 "Cheese, Cheddar, English"; snack cubes are cheddar. Was 64 kcal and 2.2
  // g fat.
  [
    "cheese cubes snack",
    416,
    25.4,
    0.1,
    34.9,
    0,
    0.1,
    723,
    21.68
  ],
  [
    "cheese ham skewer snack",
    252,
    13,
    42,
    10,
    7,
    18,
    846,
    4.6
  ],
  [
    "protein pot chicken",
    189,
    17,
    29,
    2,
    5,
    15,
    655,
    2
  ],
  [
    "protein pot tuna",
    422,
    7,
    74,
    10,
    4,
    22,
    544,
    5.4
  ],
  [
    "egg mayo sandwich filler",
    531,
    6,
    61,
    25,
    4,
    29,
    623,
    12.8
  ],
  [
    "coronation chicken filler",
    25,
    1.2000000000000002,
    12.5,
    0.20000000000000018,
    3.2,
    9,
    306,
    1.2000000000000002
  ],
  [
    "tuna sweetcorn filler",
    250,
    12,
    47,
    8,
    8,
    15,
    941,
    4.6
  ],
  [
    "prawn marie rose filler",
    193,
    16,
    24,
    7,
    2,
    12,
    750,
    2
  ],
  [
    "houmous carrot sticks",
    427,
    12,
    69,
    15,
    5,
    27,
    639,
    5.4
  ],
  [
    "cheese crackers snack box",
    532,
    5,
    56,
    23,
    5,
    34,
    718,
    12.8
  ],
  // Dairylea Lunchers Ham and Cheese Snacks label (Ocado 654952011), per 100 g. Was 25
  // kcal and 0 g fat.
  [
    "cracker cheese ham snack",
    289,
    16,
    26,
    13,
    1.4,
    2.4,
    480,
    6
  ],
  // CoFID 11-939 "Breakfast cereal, crunchy/crispy muesli type cereal, with nuts,
  // unfortified". Was 251 kcal and 6 g fat.
  [
    "yoghurt granola topper",
    450,
    8.4,
    61.9,
    20.5,
    7.9,
    23.1,
    138,
    4.61
  ],
  [
    "overnight oats pot",
    188,
    15,
    29,
    5,
    3,
    9,
    445,
    2
  ],
  [
    "bircher muesli pot",
    424,
    11,
    74,
    13,
    6,
    24,
    334,
    5.4
  ],
  [
    "porridge pot golden syrup",
    532,
    10,
    61,
    28,
    6,
    31,
    413,
    12.8
  ],
  [
    "porridge pot apple",
    64,
    0,
    12.5,
    3.2,
    1.2,
    11,
    96,
    1.2000000000000002
  ],
  [
    "instant oats apple cinnamon",
    256,
    10,
    47,
    4,
    6,
    17,
    731,
    4.6
  ],
  [
    "bagel cream cheese portion",
    196,
    14,
    24,
    3,
    4,
    14,
    540,
    2
  ],
  [
    "smoked salmon trimmings",
    429,
    10,
    69,
    11,
    7,
    29,
    429,
    5.4
  ],
  [
    "duck legs confit",
    523,
    9,
    56,
    26,
    3,
    28,
    508,
    12.8
  ],
  [
    "goose fat jar",
    59,
    4.2,
    7.5,
    1.2000000000000002,
    2.2,
    8,
    191,
    1.2000000000000002
  ],
  // CoFID 18-170 "Lamb, shoulder, raw, lean and fat". Was 248 kcal and 9 g fat.
  [
    "lamb shoulder diced",
    235,
    17.6,
    0,
    18.3,
    0,
    0,
    63,
    8.5
  ],
  // CoFID 18-077 "Beef, stewing steak, raw, lean and fat". Shin is sold as stewing steak.
  // Was 185 kcal and 8 g fat.
  [
    "beef shin diced",
    146,
    22.1,
    0,
    6.4,
    0,
    0,
    66,
    2.6
  ],
  // The Butcher's Board Beef Cheeks label (Ocado 708120011), per 100 g raw. Was 420 kcal
  // and 9 g fat.
  [
    "ox cheek diced",
    123,
    20.9,
    0.1,
    4.3,
    0,
    0.1,
    80,
    1.8
  ],
  [
    "bone marrow beef",
    523,
    8,
    61,
    24,
    4,
    33,
    603,
    12.8
  ],
  // CoFID 18-429 "Pork, trotters and tails, boiled with added salt". CoFID gives no
  // saturated fat figure (0 here). Was 58 kcal and 0 g fat.
  [
    "trotters pig",
    280,
    19.8,
    0,
    22.3,
    0,
    0,
    1620,
    0
  ],
  [
    "chicken feet",
    241,
    14,
    47,
    7,
    8,
    19,
    921,
    4.6
  ],
  // CoFID 18-411 "Liver, chicken, raw". Was 183 kcal and 6 g fat.
  [
    "chicken liver",
    92,
    17.7,
    0,
    2.3,
    0,
    0,
    76,
    0.7
  ],
  [
    "duck liver",
    416,
    8,
    69,
    14,
    5,
    23,
    619,
    5.4
  ],
  [
    "veal escalopes",
    521,
    7,
    56,
    29,
    5,
    30,
    698,
    12.8
  ],
  // CoFID 18-349 "Turkey, light meat, raw"; escalopes are sliced breast. Was 62 kcal and
  // 7.5 g carbohydrate.
  [
    "turkey escalopes",
    105,
    24.4,
    0,
    0.8,
    0,
    0,
    50,
    0.3
  ],
  [
    "turkey crown roast",
    247,
    13,
    42,
    5,
    5,
    16,
    1016,
    4.6
  ],
  [
    "goose breast",
    182,
    17,
    29,
    4,
    3,
    13,
    425,
    2
  ],
  [
    "pheasant breast",
    421,
    7,
    74,
    12,
    6,
    28,
    314,
    5.4
  ],
  [
    "rabbit joint",
    519,
    6,
    61,
    27,
    6,
    35,
    393,
    12.8
  ],
  [
    "venison steak diced",
    65,
    1.2000000000000002,
    12.5,
    2.2,
    1.2,
    7,
    76,
    1.2000000000000002
  ],
  [
    "boar sausages",
    242,
    12,
    47,
    10,
    6,
    13,
    711,
    4.6
  ],
  // CoFID 19-113 "Black pudding, raw". CoFID gives no fibre figure (0 here). Was 189
  // kcal and 2 g fat.
  [
    "black pudding slice",
    277,
    9.1,
    14.8,
    20.6,
    0,
    0.2,
    830,
    7.7
  ],
  [
    "white pudding slice",
    425,
    12,
    69,
    10,
    7,
    25,
    409,
    5.4
  ],
  // CoFID 19-132 "Haggis, boiled". Was 519 kcal and 25 g fat.
  [
    "haggis slice",
    310,
    10.7,
    19.2,
    21.7,
    0.2,
    0,
    770,
    7.6
  ],
  // CoFID 11-1006 "Bread rolls, white, soft". Was 65 kcal and 0.2 g fat.
  [
    "morning rolls batch",
    254,
    9.3,
    51.5,
    2.6,
    2.6,
    2.6,
    400,
    0.62
  ],
  // CoFID 11-544 "Scotch pancakes, retail". Was 243 kcal and 8 g fat.
  [
    "scotch pancake",
    270,
    5.6,
    43,
    9.6,
    1.9,
    21.5,
    418,
    0.74
  ],
  // CoFID 11-544 "Scotch pancakes, retail". A drop scone is a Scotch pancake. Was 180
  // kcal and 7 g fat.
  [
    "drop scone",
    270,
    5.6,
    43,
    9.6,
    1.9,
    21.5,
    418,
    0.74
  ],
  // CoFID 11-1131 "Welsh cakes, homemade". Was 416 kcal and 15 g fat.
  [
    "welsh cake",
    432,
    5.5,
    61.9,
    17.8,
    1.7,
    31.5,
    238,
    10.8
  ],
  [
    "bara brith slice",
    523,
    10,
    61,
    23,
    4,
    29,
    583,
    12.8
  ],
  [
    "teisen lap cake",
    61,
    0,
    12.5,
    0,
    3.2,
    9,
    266,
    1.2000000000000002
  ],
  // CoFID 11-838 "Eccles cakes, retail". Was 240 kcal and 6 g fat.
  [
    "eccles cake",
    365,
    4.4,
    48.8,
    18.3,
    3.6,
    34,
    221,
    9.4
  ],
  [
    "bakewell pudding",
    186,
    14,
    24,
    5,
    2,
    12,
    710,
    2
  ],
  [
    "staffordshire oatcake",
    427,
    10,
    69,
    13,
    5,
    27,
    599,
    5.4
  ],
  // CoFID 11-823 "Oatcakes, plain, retail". Was 523 kcal and 28 g fat.
  [
    "oatcake scottish",
    453,
    9.3,
    62.8,
    20,
    9.4,
    3.2,
    796,
    5.67
  ],
  // Jacob's Biscuits for Cheese selection, Waitrose listing per 100 g (salt
  // 1.4 g; fibre, sugars and saturates not listed, so 0). Was 25 kcal.
  [
    "water biscuit cheese selection",
    479,
    8.9,
    63.1,
    20.4,
    0,
    0,
    560,
    0
  ],
  [
    "cracker selection festive",
    254,
    9,
    42,
    4,
    5,
    12,
    996,
    4.6
  ],
  [
    "after dinner mints",
    188,
    13,
    29,
    3,
    3,
    9,
    805,
    2
  ],
  [
    "liqueur chocolates",
    424,
    9,
    74,
    11,
    6,
    24,
    294,
    5.4
  ],
  [
    "turkish delight chocolate",
    532,
    8,
    61,
    26,
    6,
    31,
    373,
    12.8
  ],
  [
    "fudge vanilla",
    59,
    3.2,
    12.5,
    1.2000000000000002,
    1.2,
    11,
    56,
    1.2000000000000002
  ],
  [
    "fudge clotted cream",
    248,
    14,
    47,
    9,
    6,
    17,
    691,
    4.6
  ],
  // CoFID 17-683 "Fudge, homemade". Tablet is a firm fudge. Was 185 kcal and 8 g fat.
  [
    "tablet scottish",
    435,
    3.4,
    80.8,
    13.1,
    0,
    80.8,
    156,
    8.29
  ],
  [
    "coconut ice",
    417,
    8,
    69,
    9,
    7,
    29,
    389,
    5.4
  ],
  [
    "nougat bar soft",
    522,
    7,
    56,
    24,
    3,
    28,
    468,
    12.8
  ],
  [
    "halva sesame",
    58,
    2.2,
    7.5,
    0,
    2.2,
    8,
    151,
    1.2000000000000002
  ],
  // CoFID 17-122 "Turkish delight, without nuts". Was 249 kcal and 7 g fat.
  [
    "turkish delight rose",
    295,
    0.6,
    77.9,
    0,
    0,
    68.6,
    31,
    0
  ],
  // CoFID 17-593 "Turkish delight, with nuts, homemade". Was 185 kcal and 6 g fat.
  [
    "lokum pistachio",
    348,
    4.1,
    82,
    2.6,
    0.3,
    81.8,
    85,
    0.35
  ],
  // CoFID 11-842 "Pastries, Greek, baklava, retail". Was 419 kcal and 14 g fat.
  [
    "baklava piece",
    456,
    6.7,
    54.1,
    25.1,
    2,
    29,
    163,
    9.65
  ],
  [
    "kanafeh slice",
    520,
    6,
    61,
    29,
    4,
    33,
    563,
    12.8
  ],
  [
    "kulfi mango",
    57,
    1.2000000000000002,
    12.5,
    0,
    3.2,
    13,
    246,
    1.2000000000000002
  ],
  [
    "lassi mango drink",
    246,
    12,
    47,
    5,
    8,
    19,
    881,
    4.6
  ],
  [
    "lassi salted drink",
    188,
    16,
    24,
    4,
    2,
    8,
    690,
    2
  ],
  [
    "chai concentrate",
    422,
    12,
    69,
    12,
    5,
    23,
    579,
    5.4
  ],
  // Green Origins Vanilla Matcha drink powder label (Ocado 686179011), per 100 g. Was 526
  // kcal and 27 g fat.
  [
    "matcha latte powder",
    341,
    6.8,
    71,
    0,
    15,
    28,
    84,
    0
  ],
  [
    "turmeric latte powder",
    67,
    0.20000000000000018,
    7.5,
    2.2,
    4.2,
    10,
    341,
    1.2000000000000002
  ],
  [
    "golden milk powder",
    247,
    11,
    42,
    10,
    5,
    16,
    976,
    4.6
  ],
  // Freja Chicken Bone Broth label (Ocado 622691011), per 100 g. Was 187 kcal and 2 g fat.
  [
    "bone broth liquid",
    13,
    3.2,
    0.2,
    0,
    0,
    0.2,
    240,
    0
  ],
  [
    "bone broth powder",
    423,
    11,
    74,
    10,
    6,
    28,
    674,
    5.4
  ],
  [
    "collagen powder generic",
    530,
    10,
    61,
    25,
    6,
    35,
    353,
    12.8
  ],
  [
    "vitamin d drops",
    61,
    0,
    12.5,
    0.20000000000000018,
    1.2,
    7,
    36,
    1.2000000000000002
  ],
  // CoFID 17-488 "Oil, cod liver". Fish oil. Was 256 kcal and 8 g fat.
  [
    "omega 3 capsules",
    899,
    0,
    0,
    99.9,
    0,
    0,
    0,
    21.1
  ],
  // Naturya Organic Spirulina Powder label (Ocado 87735011), per 100 g. Was 186 kcal and 7
  // g fat.
  [
    "spirulina powder",
    345,
    67,
    15,
    0.9,
    3.5,
    0.4,
    480,
    0.4
  ],
  // Naturya Organic Wheatgrass Powder label (Ocado 87736011), per 100 g. Was 423 kcal and
  // 15 g fat.
  [
    "wheatgrass powder",
    266,
    20,
    20,
    1.4,
    47,
    5,
    76,
    0.2
  ],
  [
    "brewers yeast flakes",
    527,
    9,
    56,
    23,
    3,
    32,
    448,
    12.8
  ],
  // Marigold Engevita B12 Nutritional Yeast Flakes label (Ocado 594317011), per 100 g. Was
  // 25 kcal and 4.2 g protein.
  [
    "nutritional yeast flakes",
    349,
    47,
    19,
    5,
    20,
    1,
    100,
    1
  ],
  // Clearspring Organic Soya Mince 250 g, dried (organic textured soya meal),
  // label per 100 g (ocado.com product 424750011, read 16 Nov 2026). Salt
  // <0.01 g, so sodium is under 4 mg. TVP is the same textured soya. Was 255
  // kcal and 9 g protein.
  [
    "textured vegetable protein",
    369,
    50,
    21,
    8.5,
    5.5,
    8,
    4,
    2
  ],
  // Clearspring Organic Soya Mince, as above. Was 186 kcal and 13 g protein.
  [
    "soya mince dried",
    369,
    50,
    21,
    8.5,
    5.5,
    8,
    4,
    2
  ],
  // Clearspring Organic Soya Chunks 200 g, dried (organic textured soya meal),
  // label per 100 g (ocado.com product 424749011, read 16 Nov 2026). Salt
  // 0.02 g = 8 mg sodium. Was 423 kcal and 9 g protein.
  [
    "soya chunks dried",
    399,
    52,
    17,
    11,
    17,
    7.7,
    8,
    2.3
  ],
  [
    "jackfruit tin young",
    526,
    8,
    61,
    28,
    4,
    29,
    543,
    12.8
  ],
  [
    "hearts palm tin",
    61,
    3.2,
    12.5,
    3.2,
    3.2,
    9,
    226,
    1.2000000000000002
  ],
  // Water chestnuts, canned, drained (McCance & Widdowson via patient.info):
  // fat trace; fibre and sodium not given, so 0. Was 248 kcal with 14 g
  // protein (template row).
  [
    "water chestnuts tin",
    31,
    0.9,
    7.4,
    0,
    0,
    3.4,
    0,
    0
  ],
  // Kingfisher Bamboo Shoots in Water label (Ocado 56488011), per 100 g drained. Was 187
  // kcal and 3 g fat.
  [
    "bamboo shoots tin",
    13,
    1.5,
    0.7,
    0,
    1.4,
    0.7,
    0,
    0
  ],
  // CoFID 13-634 "Sweetcorn, baby, boiled in unsalted water". Was 419 kcal and 11 g fat.
  [
    "baby corn tin",
    31,
    2.2,
    4.6,
    0.6,
    2.4,
    3.8,
    0,
    0.13
  ],
  // USDA SR Legacy 169301 water spinach (water convolvulus), raw: 3.1 g total
  // carbohydrate less 2.1 g fibre. No canned figure; sodium not taken, so 0.
  // Was 524 kcal with 26 g fat (template row).
  [
    "water spinach tin",
    19,
    2.6,
    1,
    0.2,
    2.1,
    0,
    0,
    0
  ],
  // CoFID 13-271 "Lotus tubers, raw". CoFID gives no fibre figure (0 here). Was 63 kcal
  // and 1.2 g fat.
  [
    "lotus root slices",
    51,
    2.1,
    11,
    0.1,
    0,
    5.5,
    29,
    0
  ],
  // CoFID 13-667 "Beans, edamame, frozen, boiled in unsalted water". The shelled beans.
  // Was 248 kcal and 9 g fat.
  [
    "edamame pods frozen",
    142,
    12.2,
    6.5,
    7.6,
    5.9,
    2.6,
    5,
    0.85
  ],
  [
    "edamame salted snack",
    190,
    17,
    29,
    8,
    3,
    9,
    765,
    2
  ],
  [
    "seaweed snack crispy",
    426,
    7,
    74,
    9,
    6,
    24,
    654,
    5.4
  ],
  // CoFID 13-340 "Seaweed, nori, dried, raw". Was 524 kcal and 24 g fat.
  [
    "nori sheets sushi",
    136,
    30.7,
    0,
    1.5,
    44.4,
    0,
    790,
    0.4
  ],
  // CoFID 13-341 "Seaweed, wakame, dried, raw". Was 58 kcal and 0 g fat.
  [
    "wakame dried",
    71,
    12.4,
    0,
    2.4,
    47.1,
    0,
    3220,
    0.3
  ],
  // CoFID 13-339 "Seaweed, kombu, dried, raw". Was 240 kcal and 7 g fat.
  [
    "kombu dried",
    43,
    7.1,
    0,
    1.6,
    58.7,
    0,
    1830,
    0.5
  ],
  // Miso Tasty Shiro White Miso label (Ocado 339642011), per 100 g. Was 186 kcal and 6 g
  // fat.
  [
    "miso paste white",
    189,
    10.3,
    18,
    6.2,
    4.9,
    13.6,
    4600,
    1
  ],
  // Miso Tasty Red Aka Miso label (Ocado 339643011), per 100 g. Was 420 kcal and 14 g fat.
  [
    "miso paste red",
    208,
    10,
    25.3,
    5.6,
    4.1,
    13.6,
    4680,
    0.9
  ],
  // Blue Dragon Mirin label (Ocado 207601011), per 100 ml; protein and fat are "<0.5 g".
  // Was 522 kcal and 29 g fat.
  [
    "mirin seasoning",
    272,
    0.4,
    68,
    0.4,
    0,
    35,
    4,
    0.05
  ],
  // Kikkoman Ponzu (lemon) label (UK retailer), per 100 ml: 122 kcal, 3.3 g
  // protein, 23 g carbohydrate (all sugars), no fat, 6.6 g salt. Was 57 kcal
  // with 0.20000000000000018 g protein and 0 g fat.
  [
    "ponzu sauce",
    122,
    3.3,
    23,
    0,
    0,
    23,
    2640,
    0
  ],
  // Kikkoman Teriyaki Marinade label (Sainsbury's), per 100 ml: 99 kcal, 6.7
  // g protein, 12 g carbohydrate (11 g sugars), under 0.1 g fat, 10.2 g salt.
  // Its wine carries the energy the macros don't. Was 250 kcal with 11 g
  // protein and 5 g fat.
  [
    "teriyaki sauce bottle",
    99,
    6.7,
    12,
    0.1,
    0,
    11,
    4080,
    0
  ],
  // Otafuku Yakisoba Sauce (Japanese food retailer listing), per 100 g: 133
  // kcal, 1.7 g protein, 31.4 g carbohydrate, 0.1 g fat. Sugars and salt
  // aren't listed. Was 184 kcal with 15 g protein and 4 g fat.
  [
    "yakisoba sauce",
    133,
    1.7,
    31.4,
    0.1,
    0,
    0,
    0,
    0
  ],
  // Otafuku Okonomi Sauce (Fitatu listing), per 100 g: 152 kcal, 2.5 g
  // protein, 35 g carbohydrate (30 g sugars). Fat and salt aren't listed. Was
  // 423 kcal with 11 g protein and 12 g fat.
  [
    "okonomiyaki sauce",
    152,
    2.5,
    35,
    0,
    0,
    30,
    0,
    0
  ],
  // Sempio Gochujang Bulgogi Sauce label (Ocado 689826011), per 100 g. Was 523 kcal and 27
  // g fat.
  [
    "bulgogi marinade",
    169,
    2,
    38.7,
    0.5,
    0,
    29,
    2200,
    0.1
  ],
  // Sempio Gochujang label (Ocado 675677011), per 100 g. Fibre isn't listed. Was 61 kcal
  // and 2.2 g fat.
  [
    "gochujang paste",
    233,
    5,
    42,
    2.2,
    0,
    25,
    2640,
    0.5
  ],
  // Korean Gochugaru Red Pepper Powder label (Ocado 675685011), per 100 g. The label's
  // 56.1 g carbohydrate includes the 34.4 g fibre. Was 245 kcal and 10 g fat.
  [
    "gochugaru flakes",
    275,
    14.7,
    21.7,
    6.8,
    34.4,
    13.1,
    280,
    1.7
  ],
  // Sempio Doenjang label (Ocado 677281011), per 100 g. Was 184 kcal and 2 g fat.
  [
    "doenjang paste",
    154,
    14,
    6.8,
    6.4,
    0,
    3.5,
    4800,
    1.7
  ],
  [
    "kimchi paste",
    418,
    10,
    69,
    10,
    5,
    23,
    539,
    5.4
  ],
  // Sempio Ssamjang label (Ocado 675675011), per 100 g. Was 521 kcal and 25 g fat.
  [
    "ssamjang paste",
    204,
    7,
    32.3,
    4.5,
    0,
    21.4,
    2240,
    0.6
  ],
  // Lee Kum Kee Seasoned Rice Vinegar label (Ocado 586093011), per 100 ml; fat is "<0.5 g"
  // (0 here) and there is no fibre figure. Acetic acid carries the energy the macros
  // don't. Was 67 kcal and 10 g sugar in 7.5 g carbohydrate.
  [
    "rice vinegar seasoned",
    96,
    3.6,
    16,
    0,
    0,
    13,
    800,
    0
  ],
  [
    "black vinegar chinese",
    250,
    9,
    42,
    8,
    5,
    16,
    936,
    4.6
  ],
  [
    "chinese cooking wine",
    190,
    13,
    29,
    7,
    3,
    13,
    745,
    2
  ],
  [
    "shaoxing wine",
    419,
    9,
    74,
    15,
    6,
    28,
    634,
    5.4
  ],
  [
    "sesame oil toasted",
    525,
    8,
    61,
    23,
    6,
    35,
    713,
    12.8
  ],
  [
    "chilli oil crisp",
    62,
    3.2,
    12.5,
    0,
    1.2,
    7,
    396,
    1.2000000000000002
  ],
  // CoFID 13-813 "Chinese 5 spice". CoFID gives no carbohydrate, fibre, sugars or
  // saturated fat figure: carbohydrate and energy as filled in cofidEnergyGaps.ts
  // (Schwartz label). Was 246 kcal and 6 g fat.
  [
    "five spice powder",
    332,
    9.5,
    54,
    8.7,
    0,
    0,
    63,
    0
  ],
  [
    "szechuan peppercorns",
    190,
    12,
    24,
    5,
    4,
    10,
    440,
    2
  ],
  [
    "star anise whole",
    422,
    8,
    69,
    13,
    7,
    25,
    329,
    5.4
  ],
  // CoFID 13-874 "Cinnamon, ground": cassia is the cinnamon most shops sell. Energy as
  // filled in cofidEnergyGaps.ts (USDA). Was 518 kcal and 28 g fat.
  [
    "cassia bark",
    247,
    4,
    27.5,
    1.2,
    53.1,
    2.2,
    10,
    0.4
  ],
  // CoFID 13-827 "Fennel seeds", with the carbohydrate, fibre and energy CoFID lacks from
  // USDA SR Legacy 171323, as cofidEnergyGaps.ts fills them. CoFID gives no sugar figure
  // (0 here). Was 64 kcal and 3.2 g fat.
  [
    "fennel seeds whole",
    345,
    15.8,
    12.5,
    14.9,
    39.8,
    0,
    88,
    0.5
  ],
  [
    "fenugreek seeds",
    244,
    13,
    42,
    4,
    7,
    18,
    726,
    4.6
  ],
  [
    "mustard seeds black",
    189,
    17,
    29,
    3,
    5,
    15,
    535,
    2
  ],
  [
    "mustard seeds yellow",
    426,
    7,
    74,
    11,
    4,
    22,
    424,
    5.4
  ],
  [
    "nigella seeds",
    520,
    6,
    61,
    26,
    4,
    29,
    503,
    12.8
  ],
  [
    "caraway seeds",
    59,
    1.2000000000000002,
    12.5,
    1.2000000000000002,
    3.2,
    9,
    186,
    1.2000000000000002
  ],
  [
    "sumac powder",
    241,
    12,
    47,
    9,
    8,
    15,
    821,
    4.6
  ],
  // Schwartz Za'atar Seasoning label (Ocado 484746011), per 100 g. Fibre isn't listed. Was
  // 182 kcal and 8 g fat.
  [
    "zaatar blend",
    470,
    14,
    26.7,
    31.2,
    0,
    2.1,
    2656,
    4.5
  ],
  // Belazu Rose Harissa label (Ocado 279413011), per 100 g. Was 423 kcal and 9 g fat.
  [
    "harissa paste jar",
    459,
    2.9,
    9.5,
    44.2,
    7.3,
    4.1,
    1600,
    11
  ],
  [
    "ras el hanout",
    520,
    5,
    56,
    24,
    5,
    34,
    598,
    12.8
  ],
  [
    "berbere spice",
    59,
    0.20000000000000018,
    7.5,
    0,
    4.2,
    14,
    281,
    1.2000000000000002
  ],
  [
    "jerk seasoning dry",
    247,
    11,
    42,
    7,
    5,
    12,
    916,
    4.6
  ],
  [
    "pimento allspice ground",
    193,
    15,
    29,
    6,
    3,
    9,
    725,
    2
  ],
  // AMA's Jerk Marinade label (Ocado 694687011), per 100 g. Was 426 kcal and 14 g fat.
  [
    "jerk marinade bottle",
    160,
    2.7,
    13.8,
    10,
    3.6,
    9.2,
    1404,
    1.9
  ],
  [
    "curry goat seasoning",
    527,
    10,
    61,
    29,
    6,
    31,
    693,
    12.8
  ],
  [
    "oxtail seasoning",
    62,
    0,
    12.5,
    0,
    1.2,
    11,
    376,
    1.2000000000000002
  ],
  [
    "plantain chips",
    243,
    10,
    47,
    5,
    6,
    17,
    1011,
    4.6
  ],
  [
    "cassava chips",
    183,
    14,
    24,
    4,
    4,
    14,
    420,
    2
  ],
  [
    "yam fries frozen",
    422,
    10,
    69,
    12,
    7,
    29,
    309,
    5.4
  ],
  [
    "attieke couscous cassava",
    531,
    9,
    56,
    27,
    3,
    28,
    388,
    12.8
  ],
  [
    "jollof rice mix",
    61,
    4.2,
    7.5,
    2.2,
    2.2,
    8,
    71,
    1.2000000000000002
  ],
  // CoFID 14-826 "Melon seeds". Egusi is melon seed. CoFID gives no fibre or sugars figure
  // (0 here). Was 247 kcal and 10 g fat.
  [
    "egusi seeds ground",
    583,
    28.5,
    9.9,
    47.7,
    0,
    0,
    99,
    12
  ],
  [
    "palm oil red",
    182,
    13,
    29,
    2,
    5,
    11,
    515,
    2
  ],
  [
    "groundnut oil peanut",
    426,
    9,
    74,
    10,
    4,
    26,
    404,
    5.4
  ],
  [
    "shea butter refined",
    537,
    8,
    61,
    25,
    4,
    33,
    483,
    12.8
  ],
  // Lee Kum Kee Hoisin Sauce label, 210 g jar (Dunnes Stores; salt from
  // Colruyt), per 100 g: 228 kcal, 1.8 g protein, 53 g carbohydrate (47 g
  // sugars), 0.7 g fat, 6.4 g salt.
  [
    "hoisin sauce",
    228,
    1.8,
    53,
    0.7,
    0,
    47,
    2560,
    0.1
  ],
  // Lee Kum Kee Panda Oyster Sauce label (Sainsbury's), per 100 g: 113 kcal,
  // 1.2 g protein, 27 g carbohydrate (21 g sugars), fat under 0.5 g, 11.5 g
  // salt.
  [
    "oyster sauce",
    113,
    1.2,
    27,
    0,
    0,
    21,
    4600,
    0
  ],
  // Blue Dragon Fish Sauce label (Tesco), per 100 ml: 73 kcal, 6.6 g protein,
  // 11.6 g carbohydrate (9.1 g sugars), 0.5 g fat, 26.7 g salt.
  [
    "fish sauce",
    73,
    6.6,
    11.6,
    0.5,
    0,
    9.1,
    10680,
    0
  ],
  // Blue Dragon Black Bean Stir Fry Sauce label (Dunnes Stores, Tesco), per
  // 100 g: 123 kcal, 2.1 g protein, 24 g carbohydrate (20 g sugars), 2.1 g
  // fat, 1.3 g salt.
  [
    "black bean sauce",
    123,
    2.1,
    24,
    2.1,
    0,
    20,
    520,
    0.2
  ],
  // Lee Kum Kee Plum Sauce (Albion Fine Foods listing), per 100 g: 60 g
  // carbohydrate (all sugars), 3 g salt. Energy isn't listed: 240 kcal from
  // the carbohydrate.
  [
    "plum sauce",
    240,
    0,
    60,
    0,
    0,
    60,
    1200,
    0
  ],
  // Vita Coco Original label (Ocado, Waitrose), per 100 ml: 18 kcal, 4.5 g
  // carbohydrate (4 g sugars), no fat or protein.
  [
    "coconut water",
    18,
    0,
    4.5,
    0,
    0,
    4,
    0,
    0
  ]
];

export const NUTRITION_DB_UK_EXPANSION_PART2: NutritionLookupEntry[] = ROWS.map(fromTuple);
