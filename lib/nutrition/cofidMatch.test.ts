import {
  cofidQueryVariants,
  isFatAddedPrepMismatch,
  isRawStapleMismatch,
  pickBestCofidCandidate,
  scoreCofidMatch,
  type CofidCandidate,
} from "@/lib/nutrition/cofidMatch";

function assertMatch(
  query: string,
  candidates: CofidCandidate[],
  expectedSubstring: string,
  forbidden: string[] = [],
): void {
  const best = pickBestCofidCandidate(query, candidates);
  if (!best) throw new Error(`no match for "${query}"`);
  const name = best.food_name.toLowerCase();
  if (!name.includes(expectedSubstring.toLowerCase())) {
    throw new Error(`"${query}" matched "${best.food_name}" — expected "${expectedSubstring}"`);
  }
  for (const bad of forbidden) {
    if (name.includes(bad.toLowerCase())) {
      throw new Error(`"${query}" wrongly matched "${best.food_name}" (forbidden: ${bad})`);
    }
  }
}

// banana → whole food, not banana bread
const bananaCandidates: CofidCandidate[] = [
  { food_code: "11-1029", food_name: "Banana bread, homemade", food_group: "AN", matchKind: "partial" },
  { food_code: "12-556", food_name: "Banana split, homemade", food_group: "BP", matchKind: "partial" },
  { food_code: "14-318", food_name: "Bananas, flesh only", food_group: "FA", matchKind: "partial" },
  {
    food_code: "14-347",
    food_name: "Bananas, raw, flesh only, weighed with skin",
    food_group: "FA",
    matchKind: "partial",
  },
];
assertMatch("banana", bananaCandidates, "flesh only", ["bread", "split"]);
assertMatch("Banana", bananaCandidates, "flesh only", ["bread"]);

// apple → eating apple, not sugar apple or juice
const appleCandidates: CofidCandidate[] = [
  { food_code: "11-1029", food_name: "Banana bread, homemade", food_group: "AN", matchKind: "partial" },
  { food_code: "14-319", food_name: "Apples, eating, raw, flesh and skin", food_group: "FA", matchKind: "partial" },
  { food_code: "14-331", food_name: "Apple juice, clear, ambient and chilled", food_group: "FC", matchKind: "partial" },
  { food_code: "11-1065", food_name: "Pudding, Eve's pudding, homemade", food_group: "AS", matchKind: "partial" },
];
assertMatch("apple", appleCandidates, "apples, eating, raw", ["juice", "pudding", "bread"]);

const sugarAppleCandidates: CofidCandidate[] = [
  { food_code: "14-319", food_name: "Apples, eating, raw, flesh and skin", food_group: "FA", matchKind: "partial" },
  { food_code: "14-500", food_name: "Sugar apple, flesh only", food_group: "FA", matchKind: "partial" },
  { food_code: "14-331", food_name: "Apple juice, clear, ambient and chilled", food_group: "FC", matchKind: "partial" },
];
assertMatch("apple", sugarAppleCandidates, "apples, eating", ["sugar apple", "juice"]);

// tomato → raw tomatoes, not baked beans in tomato sauce
const tomatoCandidates: CofidCandidate[] = [
  { food_code: "13-145", food_name: "Tomatoes, cherry, raw", food_group: "DA", matchKind: "partial" },
  { food_code: "13-146", food_name: "Tomatoes, standard, raw", food_group: "DA", matchKind: "partial" },
  {
    food_code: "11-501",
    food_name: "Beans, baked, in tomato sauce, canned",
    food_group: "G",
    matchKind: "partial",
  },
  { food_code: "13-147", food_name: "Tomato puree", food_group: "DA", matchKind: "partial" },
];
assertMatch("tomato", tomatoCandidates, "tomatoes", ["baked", "beans", "puree"]);

// tuna → canned tuna, not pate
const tunaCandidates: CofidCandidate[] = [
  { food_code: "16-458", food_name: "Tuna, canned in brine, drained", food_group: "MA", matchKind: "partial" },
  { food_code: "16-459", food_name: "Tuna, canned in oil, drained", food_group: "MA", matchKind: "partial" },
  { food_code: "16-460", food_name: "Pate, tuna", food_group: "MA", matchKind: "partial" },
];
assertMatch("tuna", tunaCandidates, "tuna, canned", ["pate"]);

// oats → porridge oats, not cookies/flapjack
const oatCandidates: CofidCandidate[] = [
  { food_code: "11-788", food_name: "Porridge oats, unfortified", food_group: "A", matchKind: "partial" },
  {
    food_code: "11-792",
    food_name: "Breakfast cereal, instant hot oat, plain, raw, fortified",
    food_group: "AI",
    matchKind: "partial",
  },
  { food_code: "11-814", food_name: "Flapjacks, retail", food_group: "AM", matchKind: "partial" },
  { food_code: "11-823", food_name: "Oatcakes, plain, retail", food_group: "AM", matchKind: "partial" },
];
assertMatch("oats", oatCandidates, "porridge oats", ["flapjack", "oatcake", "cereal"]);
assertMatch("oat", oatCandidates, "porridge oats", ["flapjack", "oatcake"]);

// chicken → raw/cooked chicken, not nuggets
const chickenCandidates: CofidCandidate[] = [
  { food_code: "18-297", food_name: "Chicken, whole, raw, meat and skin", food_group: "MCA", matchKind: "partial" },
  { food_code: "18-501", food_name: "Chicken pieces, coated, takeaway", food_group: "MCA", matchKind: "partial" },
  { food_code: "18-504", food_name: "Chicken breast/steak, coated, baked", food_group: "MCA", matchKind: "partial" },
  { food_code: "18-510", food_name: "Chicken nuggets, takeaway", food_group: "MCA", matchKind: "partial" },
];
assertMatch("chicken", chickenCandidates, "chicken, whole, raw", ["coated", "takeaway", "nugget"]);

// rice → boiled rice, not rice pudding
const riceCandidates: CofidCandidate[] = [
  { food_code: "11-862", food_name: "Rice, white, long grain, boiled in unsalted water", food_group: "AC", matchKind: "partial" },
  { food_code: "11-865", food_name: "Rice, white, pudding, raw", food_group: "AC", matchKind: "partial" },
  { food_code: "11-869", food_name: "Rice, brown, wholegrain, boiled in unsalted water", food_group: "AC", matchKind: "partial" },
];
// Grains are bought dry and costed dry; the boiled rows lose to a raw one.
assertMatch(
  "rice",
  [...riceCandidates, { food_code: "11-860", food_name: "Rice, white, basmati, raw", food_group: "AC", matchKind: "partial" }],
  "basmati, raw",
  ["pudding", "boiled"],
);
// A raw pudding-rice row is still dry rice — the right basis — and beats boiled
// when it is the only raw row; the variety just loses to basmati when both exist.
assertMatch("rice", riceCandidates, "raw", ["boiled"]);
// Asking for cooked rice gets cooked rice.
assertMatch(
  "cooked rice",
  [...riceCandidates, { food_code: "11-860", food_name: "Rice, white, basmati, raw", food_group: "AC", matchKind: "partial" }],
  "boiled",
  ["raw", "pudding"],
);

// potato → boiled, NOT chips/roast (same-primary prep tie-break; manual-meal inflation bug)
const potatoCandidates: CofidCandidate[] = [
  { food_code: "13-700", food_name: "Potatoes, chips, retail, fried in vegetable oil", food_group: "DR", matchKind: "partial" },
  { food_code: "13-701", food_name: "Potatoes, old, roast in vegetable oil", food_group: "DR", matchKind: "partial" },
  { food_code: "13-702", food_name: "Potatoes, old, boiled in unsalted water", food_group: "DR", matchKind: "partial" },
  { food_code: "13-703", food_name: "Potatoes, old, raw, flesh only", food_group: "DR", matchKind: "partial" },
];
assertMatch("potato", potatoCandidates, "boiled", ["chips", "roast", "fried"]);

// sweet potato → boiled, NOT roasted
const sweetPotatoCandidates: CofidCandidate[] = [
  { food_code: "13-710", food_name: "Sweet potato, roasted, flesh only", food_group: "DR", matchKind: "partial" },
  { food_code: "13-711", food_name: "Sweet potato, boiled in unsalted water, flesh only", food_group: "DR", matchKind: "partial" },
];
assertMatch("sweet potato", sweetPotatoCandidates, "boiled", ["roast"]);

// pasta → boiled, NOT dried/raw (raw-grain trap: dried pasta is ~3x denser)
const pastaCandidates: CofidCandidate[] = [
  { food_code: "11-900", food_name: "Pasta, white, dried, raw", food_group: "AC", matchKind: "partial" },
  { food_code: "11-901", food_name: "Pasta, white, fresh, boiled in unsalted water", food_group: "AC", matchKind: "partial" },
];
assertMatch("pasta", pastaCandidates, "dried, raw", ["boiled"]);

// quinoa → raw is the as-bought form
const quinoaCandidates: CofidCandidate[] = [
  { food_code: "14-843", food_name: "Quinoa, raw", food_group: "GA", matchKind: "partial" },
];
assertMatch("quinoa", quinoaCandidates, "quinoa", ["bread"]);

// couscous → dry, as bought
const couscousCandidates: CofidCandidate[] = [
  { food_code: "11-901", food_name: "Couscous, plain, raw", food_group: "AT", matchKind: "partial" },
  { food_code: "11-902", food_name: "Couscous, plain, cooked", food_group: "AT", matchKind: "partial" },
];
assertMatch("couscous", couscousCandidates, "raw", ["cooked"]);

// lentils → boiled, NOT dried raw
const lentilCandidates: CofidCandidate[] = [
  { food_code: "13-089", food_name: "Lentils, green and brown, whole, dried, raw", food_group: "DB", matchKind: "partial" },
  { food_code: "13-661", food_name: "Lentils, green and brown, whole, dried, boiled in unsalted water", food_group: "DB", matchKind: "partial" },
];
assertMatch("lentils", lentilCandidates, "boiled", ["dried, raw"]);

// kidney beans → boiled/canned, NOT dried raw
const kidneyBeanCandidates: CofidCandidate[] = [
  { food_code: "13-109", food_name: "Beans, red kidney, dried, raw", food_group: "DB", matchKind: "partial" },
  { food_code: "13-659", food_name: "Beans, red kidney, dried, boiled in unsalted water", food_group: "DB", matchKind: "partial" },
  { food_code: "13-660", food_name: "Beans, red kidney, canned in water, re-heated, drained", food_group: "DB", matchKind: "partial" },
];
assertMatch("kidney beans", kidneyBeanCandidates, "boiled", ["dried, raw"]);

// chickpeas → boiled, NOT dried raw
const chickpeaCandidates: CofidCandidate[] = [
  { food_code: "13-074", food_name: "Beans, chick peas, Kabuli, whole, dried, raw", food_group: "DB", matchKind: "partial" },
  { food_code: "13-662", food_name: "Beans, chick peas, Kabuli, whole, dried, boiled in unsalted water", food_group: "DB", matchKind: "partial" },
];
assertMatch("chickpeas", chickpeaCandidates, "boiled", ["dried, raw"]);

// bulgur → when only raw in CoFID, matcher picks raw (local DB override handles cooked values)
const bulgurCandidates: CofidCandidate[] = [
  { food_code: "11-904", food_name: "Wheat, bulgur, raw", food_group: "AA", matchKind: "partial" },
];
assertMatch("bulgur", bulgurCandidates, "bulgur", []);

// explicit "raw rice" should still prefer raw when user asked
const rawRiceCandidates: CofidCandidate[] = [
  { food_code: "11-865", food_name: "Rice, white, pudding, raw", food_group: "AC", matchKind: "partial" },
  { food_code: "11-862", food_name: "Rice, white, long grain, boiled in unsalted water", food_group: "AC", matchKind: "partial" },
];
assertMatch("raw rice", rawRiceCandidates, "raw", []);

// exact beats partial
const exact = scoreCofidMatch("chicken breast", "Chicken breast", "exact");
const partial = scoreCofidMatch("chicken breast", "Chicken, breast, roasted", "partial");
if (exact <= partial) {
  throw new Error("exact match should outscore partial composite");
}

// chicken mince → raw average chicken or mince, not casseroled chicken with skin
const chickenMinceCandidates: CofidCandidate[] = [
  { food_code: "X1", food_name: "Chicken, skin, casseroled", food_group: "MC", matchKind: "partial" },
  { food_code: "X2", food_name: "Turkey, mince, stewed", food_group: "MC", matchKind: "partial" },
  {
    food_code: "X3",
    food_name: "Chicken, meat, average, raw",
    food_group: "MC",
    matchKind: "partial",
  },
];
assertMatch("chicken mince", chickenMinceCandidates, "average", ["casseroled", "skin"]);

// breadcrumbs → not fish in breadcrumbs
const breadcrumbCandidates: CofidCandidate[] = [
  { food_code: "B1", food_name: "Kofta, lamb, coated with breadcrumbs, homemade", food_group: "MC", matchKind: "partial" },
  { food_code: "B2", food_name: "Bread, white, average", food_group: "BA", matchKind: "partial" },
];
assertMatch("breadcrumbs", breadcrumbCandidates, "bread", ["plaice"]);

// spaghetti → pasta, not spaghetti squash
const spaghettiCandidates: CofidCandidate[] = [
  { food_code: "S1", food_name: "Squash, spaghetti, baked", food_group: "DG", matchKind: "partial" },
  {
    food_code: "S2",
    food_name: "Pasta, white, spaghetti, dried, boiled in unsalted water",
    food_group: "AC",
    matchKind: "partial",
  },
];
assertMatch("spaghetti or tagliatelle", spaghettiCandidates, "spaghetti", ["squash"]);

// fresh tagliatelle → dried spaghetti boiled for generic pasta queries
const pastaFormCandidates: CofidCandidate[] = [
  {
    food_code: "P1",
    food_name: "Pasta, egg, white, tagliatelle, fresh, boiled",
    food_group: "AC",
    matchKind: "partial",
  },
  {
    food_code: "P2",
    food_name: "Pasta, white, spaghetti, dried, boiled in unsalted water",
    food_group: "AC",
    matchKind: "partial",
  },
];
assertMatch("spaghetti or tagliatelle", pastaFormCandidates, "spaghetti", ["fresh"]);

// mushrooms → white raw, not oyster
const mushroomCandidates: CofidCandidate[] = [
  { food_code: "M1", food_name: "Mushrooms, oyster, raw", food_group: "DG", matchKind: "partial" },
  { food_code: "M2", food_name: "Mushrooms, white, raw", food_group: "DG", matchKind: "partial" },
];
assertMatch("closed cup mushrooms", mushroomCandidates, "white", ["oyster"]);

// rapeseed oil → pure oil, not asparagus roasted in rapeseed oil
const oilCandidates: CofidCandidate[] = [
  { food_code: "O1", food_name: "Asparagus, roasted in rapeseed oil", food_group: "DG", matchKind: "partial" },
  { food_code: "O2", food_name: "Oil, rapeseed", food_group: "OC", matchKind: "partial" },
];
assertMatch("rapeseed oil", oilCandidates, "rapeseed", ["asparagus"]);

// Plant drinks must never resolve to dairy milk: dairy has ~3x the protein and,
// for almond, ~4x the calories, and it models a vegan ingredient as an animal product.
const dairyRows: CofidCandidate[] = [
  { food_code: "K1", food_name: "Milk, whole, pasteurised, average", food_group: "MA", matchKind: "exact" },
  { food_code: "K2", food_name: "Milk, semi-skimmed, pasteurised, average", food_group: "MA", matchKind: "exact" },
];

// With a real plant row present, it wins.
assertMatch(
  "oat milk",
  [...dairyRows, { food_code: "P1", food_name: "Oat drink, unsweetened, fortified", food_group: "MA", matchKind: "partial" }],
  "oat drink",
  ["milk, whole"],
);
assertMatch(
  "almond milk",
  [...dairyRows, { food_code: "P2", food_name: "Almond drink, unsweetened", food_group: "MA", matchKind: "partial" }],
  "almond drink",
  ["milk, whole"],
);

// With only dairy rows, CoFID must decline so the local DB's plant values are used.
for (const query of ["oat milk", "almond milk", "soya milk", "soy milk"]) {
  if (pickBestCofidCandidate(query, dairyRows) !== null) {
    throw new Error(`${query} must not resolve to a dairy CoFID row`);
  }
}

// …and must never resolve to the SOLID food the drink is made from. Blocking dairy
// alone left this open, and it is the worse error: 110g of almond drink is ~17 kcal,
// 110g of almonds is ~637. Seen in production as a 762 kcal "Raspberry Porridge".
const solidBaseRows: CofidCandidate[] = [
  { food_code: "N1", food_name: "Almonds, flaked", food_group: "GB", matchKind: "partial" },
  { food_code: "N2", food_name: "Almonds, kernel only", food_group: "GB", matchKind: "partial" },
  { food_code: "N3", food_name: "Porridge oats, unfortified", food_group: "A", matchKind: "partial" },
  { food_code: "N4", food_name: "Soya beans, dried", food_group: "G", matchKind: "partial" },
];
for (const query of ["almond milk", "oat milk", "soya milk"]) {
  if (pickBestCofidCandidate(query, [...solidBaseRows, ...dairyRows]) !== null) {
    throw new Error(`${query} must not resolve to the solid base food or dairy`);
  }
}
// A real plant drink still wins even when the solid food is also a candidate.
assertMatch(
  "almond milk",
  [...solidBaseRows, { food_code: "D1", food_name: "Almond drink, unsweetened", food_group: "MA", matchKind: "partial" }],
  "almond drink",
  ["almonds,"],
);

// Real dairy queries are unaffected.
for (const query of ["milk", "whole milk", "semi skimmed milk"]) {
  if (!pickBestCofidCandidate(query, dairyRows)) {
    throw new Error(`${query} should still match a dairy CoFID row`);
  }
}

// A bare staple must not inherit a chip/roast row's cooking fat, nor a raw
// grain's density. 295g of potato read as fried chips is ~+300 kcal / +14g fat.
for (const [query, food] of [
  ["potato", "Potatoes, chips, retail, fried in vegetable oil"],
  ["potato", "Potatoes, old, roast in vegetable oil"],
] as const) {
  if (!isFatAddedPrepMismatch(query, food)) {
    throw new Error(`"${query}" vs "${food}" should be a fat-added mismatch`);
  }
}
// The raw-staple veto is for pulses (the tin); grains are bought dry.
for (const [query, food] of [
  ["lentils", "Lentils, red, split, dried, raw"],
  ["chickpeas", "Chick peas, whole, dried, raw"],
] as const) {
  if (!isRawStapleMismatch(query, food)) {
    throw new Error(`"${query}" vs "${food}" should be a raw-staple mismatch`);
  }
}
for (const [query, food] of [
  ["quinoa", "Quinoa, raw"],
  ["pasta", "Pasta, white, dried, raw"],
] as const) {
  if (isRawStapleMismatch(query, food)) {
    throw new Error(`"${query}" vs "${food}" is a dry grain, not a raw-staple mismatch`);
  }
}
// Asking for the preparation explicitly must still resolve to it.
for (const [query, food] of [
  ["roast potatoes", "Potatoes, old, roast in vegetable oil"],
  ["chips", "Potatoes, chips, retail, fried in vegetable oil"],
] as const) {
  if (isFatAddedPrepMismatch(query, food)) {
    throw new Error(`"${query}" explicitly requests that preparation`);
  }
}
if (isRawStapleMismatch("raw quinoa", "Quinoa, raw")) {
  throw new Error('"raw quinoa" explicitly requests the raw form');
}
// Correct rows and non-staples are untouched.
if (isFatAddedPrepMismatch("potato", "Potatoes, old, boiled in unsalted water")) {
  throw new Error("boiled potato is the right match");
}
if (isFatAddedPrepMismatch("chicken breast", "Chicken, breast, roasted")) {
  throw new Error("roasted chicken is not a fat-added staple mismatch");
}
// A boiled sibling must outrank chips/roast for a bare staple query.
assertMatch(
  "potato",
  [
    { food_code: "P1", food_name: "Potatoes, chips, retail, fried in vegetable oil", food_group: "DR", matchKind: "partial" },
    { food_code: "P2", food_name: "Potatoes, old, roast in vegetable oil", food_group: "DR", matchKind: "partial" },
    { food_code: "P3", food_name: "Potatoes, old, boiled in unsalted water", food_group: "DR", matchKind: "partial" },
  ],
  "boiled",
  ["chips", "roast"],
);

// --- query variants must reach CoFID's plural row names via the prefix fetch ---
// "tomato" produced only "tomatos", which prefix-matches nothing; the lookup
// then fell to a 35-row alphabetical net that never reached "Tomatoes, raw",
// and fifteen recipes costed fresh tomato as tomato chutney.
function assertVariant(query: string, expected: string) {
  const v = cofidQueryVariants(query);
  if (!v.includes(expected)) {
    throw new Error(`cofidQueryVariants("${query}") should include "${expected}", got ${JSON.stringify(v)}`);
  }
}
assertVariant("tomato", "tomatoes");
assertVariant("potato", "potatoes");
assertVariant("avocado", "avocados");
assertVariant("strawberry", "strawberries");
assertVariant("cherry", "cherries");
assertVariant("radish", "radishes");
assertVariant("carrot", "carrots");
assertVariant("sweet potato", "sweet potatoes");
assertVariant("tomatoes", "tomato");
assertVariant("strawberries", "strawberry");
assertVariant("cherry tomatoes", "cherry tomato");

console.log("OK: CoFID matcher regression tests passed");

// --- dairy-free and plant-milk queries must never take a dairy row ---
import { isDairyFreeMismatch, isPlantMilkMismatch } from "@/lib/nutrition/cofidMatch";
{
  const bad = (q: string, f: string, fn: (a: string, b: string) => boolean, expect: boolean) => {
    if (fn(q, f) !== expect) throw new Error(`${fn.name}("${q}", "${f}") should be ${expect}`);
  };
  bad("dairy-free cottage cheese alternative", "Cheese, Caerphilly", isDairyFreeMismatch, true);
  bad("vegan cheese", "Cheese, Cheddar, average", isDairyFreeMismatch, true);
  bad("dairy-free yoghurt", "Yogurt, soya, non-dairy alternative to yogurt, fruit, fortified", isDairyFreeMismatch, false);
  bad("cottage cheese", "Cheese, cottage, plain", isDairyFreeMismatch, false);
  // Oat milk is not porridge, however many of the words match.
  bad("oat milk", "Porridge oats, unfortified, cooked, made up with semi-skimmed milk", isPlantMilkMismatch, true);
  bad("soya milk", "Milk, soya, non-dairy alternative to milk, unsweetened, fortified", isPlantMilkMismatch, false);
  bad("oat milk", "Milk, semi-skimmed, pasteurised, average", isPlantMilkMismatch, true);
}
console.log("OK: dairy-free / plant-milk guards");

// --- meat and fish are costed raw, as bought ---
import { isBareMeatOrFishQuery, isCookedMeatRow } from "@/lib/nutrition/cofidMatch";
{
  const chickenRows: CofidCandidate[] = [
    { food_code: "C1", food_name: "Chicken, breast, grilled without skin, meat only", food_group: "MC", matchKind: "partial" },
    { food_code: "C2", food_name: "Chicken, corn-fed, raw, light meat only", food_group: "MC", matchKind: "partial" },
    { food_code: "C3", food_name: "Chicken, skin, raw", food_group: "MC", matchKind: "partial" },
  ];
  assertMatch("chicken breast", chickenRows, "raw, light meat", ["grilled", "skin, raw"]);

  const minceRows: CofidCandidate[] = [
    { food_code: "M1", food_name: "Beef, mince, microwaved", food_group: "MA", matchKind: "partial" },
    { food_code: "M2", food_name: "Beef, mince, stewed", food_group: "MA", matchKind: "partial" },
    { food_code: "M3", food_name: "Beef, mince, raw", food_group: "MA", matchKind: "partial" },
    { food_code: "M4", food_name: "Beef, mince, raw, extra lean", food_group: "MA", matchKind: "partial" },
  ];
  assertMatch("beef mince", minceRows, "beef, mince, raw", ["microwaved", "stewed", "extra lean"]);

  const baconRows: CofidCandidate[] = [
    { food_code: "B1", food_name: "Bacon, fat only, average, cooked", food_group: "MA", matchKind: "partial" },
    { food_code: "B2", food_name: "Bacon rashers, back, raw", food_group: "MA", matchKind: "partial" },
  ];
  assertMatch("bacon", baconRows, "back, raw", ["fat only"]);

  // A query that names its preparation gets that preparation.
  const tunaRows: CofidCandidate[] = [
    { food_code: "T1", food_name: "Tuna, raw", food_group: "JC", matchKind: "partial" },
    { food_code: "T2", food_name: "Tuna, canned in brine, drained", food_group: "JC", matchKind: "partial" },
  ];
  assertMatch("tuna canned", tunaRows, "canned in brine", ["tuna, raw"]);
  assertMatch("smoked mackerel", [
    { food_code: "K1", food_name: "Mackerel, flesh only, raw", food_group: "JC", matchKind: "partial" },
    { food_code: "K2", food_name: "Mackerel, flesh only, smoked", food_group: "JC", matchKind: "partial" },
  ], "smoked", ["raw"]);

  if (!isBareMeatOrFishQuery("chicken breast") || isBareMeatOrFishQuery("smoked mackerel") || isBareMeatOrFishQuery("rice")) {
    throw new Error("isBareMeatOrFishQuery");
  }
  if (!isCookedMeatRow("Chicken, breast, grilled without skin, meat only") || isCookedMeatRow("Prawns, king, purchased cooked") || isCookedMeatRow("Beef, mince, raw")) {
    throw new Error("isCookedMeatRow");
  }
}
console.log("OK: meat and fish costed raw");

// --- 15 Nov 2026: wrong matches found while writing the vegetarian meal plan ---
// Rows are real CoFID names, as the lookup collects them for each query.
import {
  isCompositeDishMismatch,
  isPuffedCakeMismatch,
  isFatLevelMismatch,
  isStockConcentrateMismatch,
  isVarietyMismatch,
  normalizeCofidQuery,
} from "@/lib/nutrition/cofidMatch";
{
  const row = (food_code: string, food_name: string, food_group: string, matchKind: "partial" | "fulltext" = "partial"): CofidCandidate => ({
    food_code,
    food_name,
    food_group,
    matchKind,
  });
  /** As the lookup calls it: on the normalised key. */
  const pick = (query: string, rows: CofidCandidate[]) => pickBestCofidCandidate(normalizeCofidQuery(query), rows);
  const expectPick = (query: string, rows: CofidCandidate[], code: string) => {
    const best = pick(query, rows);
    if (best?.food_code !== code) {
      throw new Error(`"${query}" picked ${best ? `${best.food_code} ${best.food_name}` : "nothing"}; expected ${code}`);
    }
  };
  const expectNone = (query: string, rows: CofidCandidate[]) => {
    const best = pick(query, rows);
    if (best) throw new Error(`"${query}" should find no CoFID row (local DB answers); picked ${best.food_name}`);
  };

  // Black beans are not in CoFID. Every row the lookup finds is another bean
  // or a dish, so it must hand over to the local DB.
  const blackBeanRows = [
    row("15-735", "Curry, black gram, whole and red kidney bean, homemade", "DR", "fulltext"),
    row("15-738", "Curry, black-eye bean, homemade", "DR", "fulltext"),
    row("19-570", "Chicken, stir-fried with peppers in black bean sauce, homemade", "MR", "fulltext"),
    row("13-063", "Beans, blackeye, whole, dried, boiled in unsalted water", "DB"),
    row("13-559", "Beans, butter, canned, re-heated, drained", "DB"),
    row("13-067", "Beans, broad, dried, raw", "DB"),
    row("13-042", "Beans, aduki, whole, dried, boiled in unsalted water", "DB"),
  ];
  expectNone("black beans", blackBeanRows);
  expectNone("canned black beans", blackBeanRows);
  expectNone("black turtle beans", blackBeanRows);

  // Frozen soya beans are edamame, not raw broad beans.
  if (normalizeCofidQuery("frozen soya beans") !== "frozen edamame beans") {
    throw new Error(`soya beans rewrite: ${normalizeCofidQuery("frozen soya beans")}`);
  }
  expectPick("frozen soya beans", [
    row("13-067", "Beans, broad, dried, raw", "DB"),
    row("13-042", "Beans, aduki, whole, dried, boiled in unsalted water", "DB"),
    row("13-667", "Beans, edamame, frozen, boiled in unsalted water", "DB", "fulltext"),
  ], "13-667");

  // Bean sprouts are CoFID's "Beansprouts, mung", not broad beans.
  if (normalizeCofidQuery("bean sprouts") !== "beansprouts") throw new Error("bean sprouts rewrite");
  const sprout = pick("bean sprouts", [
    row("13-067", "Beans, broad, dried, raw", "DB"),
    row("13-426", "Beansprouts, mung, raw", "DB"),
    row("13-580", "Beansprouts, mung, boiled in unsalted water", "DB"),
  ]);
  if (!sprout?.food_name.startsWith("Beansprouts, mung")) throw new Error(`bean sprouts → ${sprout?.food_name}`);

  // Butter beans: canned or boiled, never dried raw (3× the calories).
  const butter = pick("butter beans", [
    row("13-070", "Beans, butter, dried, raw", "DB", "fulltext"),
    row("13-559", "Beans, butter, canned, re-heated, drained", "DB", "fulltext"),
    row("13-663", "Beans, butter, dried, boiled in unsalted water", "DB", "fulltext"),
    row("17-685", "Butter, salted", "OA"),
  ]);
  if (!butter || /dried, raw|^Butter,/.test(butter.food_name)) throw new Error(`butter beans → ${butter?.food_name}`);

  // Vegetable stock in ml is the made-up liquid, not 100 g of dry cube; with no
  // vegetable stock liquid in CoFID it goes to the local DB.
  const stockRows = [
    row("17-727", "Stock cubes, vegetable", "WY", "fulltext"),
    row("13-543", "Vegetables, mixed, frozen, boiled in unsalted water", "DG"),
    row("15-621", "Vegetables, mixed, cooked with onion, spice and tomatoes, homemade", "DR"),
    row("17-681", "Stock, chicken, ready made, retail", "WY"),
  ];
  expectNone("vegetable stock", stockRows);
  expectPick("vegetable stock cube", stockRows, "17-727");
  const chickenStock = pick("chicken stock", [
    row("17-726", "Stock cubes, chicken", "WY", "fulltext"),
    row("17-774", "Stock cubes, chicken, made up with water", "WY", "fulltext"),
    row("17-681", "Stock, chicken, ready made, retail", "WY", "fulltext"),
    row("18-488", "Chicken, meat, average, raw", "MCA"),
  ]);
  if (!chickenStock || !/made up|ready made/.test(chickenStock.food_name)) {
    throw new Error(`chicken stock → ${chickenStock?.food_name}`);
  }
  if (!isStockConcentrateMismatch("vegetable stock", "Stock cubes, vegetable")) throw new Error("stock vs cube");
  if (isStockConcentrateMismatch("chicken stock cube", "Stock cubes, chicken")) throw new Error("cube query keeps cube");

  // Fat-free, 0% and low-fat Greek yoghurt never take a full-fat row.
  for (const q of ["fat-free greek yoghurt", "0% greek yoghurt", "0% fat greek yogurt", "nonfat greek yogurt", "low fat greek yoghurt"]) {
    if (!/\b(fat free|low fat)\b/.test(normalizeCofidQuery(q))) throw new Error(`fat level lost: "${q}" → "${normalizeCofidQuery(q)}"`);
    expectNone(q, [
      row("12-555", "Yogurt, Greek style, plain", "BN", "fulltext"),
      row("12-374", "Yogurt, whole milk, plain", "BN", "fulltext"),
    ]);
  }
  if (!isFatLevelMismatch("0% greek yoghurt", "Yogurt, Greek style, plain")) throw new Error("0% vs full fat");
  if (isFatLevelMismatch("greek yoghurt", "Yogurt, Greek style, plain")) throw new Error("plain greek is fine");
  // "200g yoghurt" style quantities still strip; "0%" is a fat level, not a quantity.
  if (normalizeCofidQuery("0% greek yoghurt") !== "fat free greek yoghurt") {
    throw new Error(`0% rewrite: ${normalizeCofidQuery("0% greek yoghurt")}`);
  }
  // Low fat yoghurt is the plain one, not fruit or toffee.
  expectPick("low fat yoghurt", [
    row("12-380", "Yogurt, low fat, fruit", "BN", "fulltext"),
    row("12-904", "Yogurt, low fat, hazelnut", "BNH", "fulltext"),
    row("12-379", "Yogurt, low fat, plain", "BN", "fulltext"),
    row("12-905", "Yogurt, low fat, toffee", "BNH", "fulltext"),
  ], "12-379");

  // Wholemeal pasta is CoFID's wholewheat pasta, not pasta salad with mayonnaise.
  expectPick("wholemeal pasta", [
    row("15-294", "Salad, wholemeal pasta, with vegetables and mayonnaise", "DR"),
    row("11-729", "Pasta, egg, fresh, filled with cheese and tomato, boiled in unsalted water", "AD"),
    row("11-718", "Pasta, wholewheat, spaghetti, dried, raw", "AD", "fulltext"),
    row("11-723", "Pasta, wholewheat, spaghetti, dried, boiled in unsalted water", "AD", "fulltext"),
  ], "11-718");
  // Wholewheat noodles are not egg or rice noodles.
  expectNone("wholewheat noodles", [
    row("11-719", "Noodles, egg, dried, raw", "AD"),
    row("11-724", "Noodles, egg, medium, dried, boiled in unsalted water", "AD"),
    row("11-725", "Noodles, rice, fine, dried, boiled in unsalted water", "AD"),
  ]);

  // Mushrooms are white mushrooms, not cooked shiitake.
  const mushroomRows = [
    row("13-295", "Mushrooms, shiitake, cooked", "DG"),
    row("13-288", "Mushrooms, Chinese, dried, raw", "DG"),
    row("13-505", "Mushrooms, white, raw", "DG"),
    row("13-506", "Mushrooms, white, stewed in unsalted water", "DG"),
    row("19-569", "Chicken, stir-fried with mushrooms and cashew nuts, homemade", "MR"),
  ];
  expectPick("mushrooms", mushroomRows, "13-505");
  expectPick("button mushrooms", mushroomRows, "13-505");
  expectPick("chestnut mushrooms", mushroomRows, "13-505");
  expectPick("shiitake mushrooms", mushroomRows, "13-295");

  // Rice cakes are not raw rice, Rice Krispie cakes or fudge cake.
  const riceCakeRows = [
    row("11-866", "Rice, brown, basmati, raw", "AC"),
    row("11-867", "Rice, brown, basmati, boiled in unsalted water", "AC"),
    row("11-868", "Rice, brown, wholegrain, raw", "AC"),
    row("11-990", "Cakes, crispie, homemade", "AN"),
    row("11-839", "Cakes, fancy iced, individual, retail", "AN"),
    row("11-527", "Cake, chocolate fudge", "AN"),
  ];
  expectNone("rice cakes", riceCakeRows);
  expectNone("rice cake", riceCakeRows);
  expectPick("chocolate fudge cake", riceCakeRows, "11-527");
  if (!isPuffedCakeMismatch("rice cakes", "Rice, brown, basmati, raw")) throw new Error("rice cakes vs rice");
  if (!isPuffedCakeMismatch("rice cakes salted", "Cakes, crispie, homemade")) throw new Error("rice cakes vs crispie");
  if (isPuffedCakeMismatch("rice cakes", "Rice cakes, plain")) throw new Error("a rice cake row is fine");
  // Pasta shapes are the same food: orzo is not vetoed off CoFID's dried pasta.
  if (isVarietyMismatch("orzo pasta", "Pasta, white, dried, raw")) throw new Error("orzo is pasta");
  // CoFID files black-eyed beans as "Beans, blackeye".
  if (normalizeCofidQuery("black-eyed beans") !== "blackeye beans") throw new Error(`blackeye: ${normalizeCofidQuery("black-eyed beans")}`);
  expectPick("black-eyed beans", [
    row("15-736", "Rice and black-eye beans", "DR"),
    row("13-063", "Beans, blackeye, whole, dried, boiled in unsalted water", "DB"),
    row("13-062", "Beans, blackeye, whole, dried, raw", "DB"),
  ], "13-063");

  // An apple is an eating apple as bought (flesh and skin), not a cooking apple
  // or a weight that includes the core.
  expectPick("apple", [
    row("14-321", "Apples, cooking, raw, flesh only", "FA"),
    row("14-346", "Apples, eating, raw, flesh and skin, weighed with core", "FA"),
    row("14-319", "Apples, eating, raw, flesh and skin", "FA"),
    row("14-320", "Apples, cooking, stewed without sugar, flesh only", "FA"),
  ], "14-319");
  expectPick("bramley apple", [
    row("14-321", "Apples, cooking, raw, flesh only", "FA"),
    row("14-319", "Apples, eating, raw, flesh and skin", "FA"),
  ], "14-321");

  // The rules on their own.
  if (!isVarietyMismatch("black beans", "Beans, butter, canned, re-heated, drained")) throw new Error("variety: butter");
  if (isVarietyMismatch("black beans", "Beans, black, canned")) throw new Error("variety: black ok");
  if (!isCompositeDishMismatch("black beans", "Curry, black gram, whole and red kidney bean, homemade")) throw new Error("dish: curry");
  if (isCompositeDishMismatch("tuna", "Tuna, canned in brine, drained")) throw new Error("dish: brine is prep");
  if (isCompositeDishMismatch("chicken stock", "Stock cubes, chicken, made up with water")) throw new Error("dish: made up with water");
}
console.log("OK: 15 Nov 2026 vegetarian plan matches");
