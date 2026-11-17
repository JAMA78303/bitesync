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
  cofidSearchQuery,
  isChilliDishMismatch,
  isCompositeDishMismatch,
  isNutButterMismatch,
  isPlainWaterQuery,
  isPuffedCakeMismatch,
  isFatLevelMismatch,
  isStockConcentrateMismatch,
  isUnaskedDriedForm,
  isVarietyMismatch,
  normalizeCofidQuery,
} from "@/lib/nutrition/cofidMatch";
import { lookupNutrition } from "@/lib/nutrition/lookup";
{
  const row = (food_code: string, food_name: string, food_group: string, matchKind: "partial" | "fulltext" = "partial"): CofidCandidate => ({
    food_code,
    food_name,
    food_group,
    matchKind,
  });
  /** As the lookup calls it: on the search query. */
  const pick = (query: string, rows: CofidCandidate[]) => pickBestCofidCandidate(cofidSearchQuery(query), rows);
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

  // 16 Nov 2026: 29 stored recipes costed "green beans" on dried green beans
  // (246 kcal per 100 g), and "cashews" took cashew fruit (33 kcal).
  const greenBeanRows = [
    row("13-608", "Green beans, dried", "DI"),
    row("13-514", "Beans, green, raw", "DB", "fulltext"),
    row("13-515", "Beans, green, boiled in unsalted water", "DB", "fulltext"),
    row("15-024", "Bhaji, green bean", "DR", "fulltext"),
  ];
  expectPick("green beans", greenBeanRows, "13-514");
  expectPick("dried green beans", greenBeanRows, "13-608");
  // With no fresh row, the dried one still answers.
  expectPick("mixed herbs", [row("13-884", "Mixed herbs, dried", "H")], "13-884");
  expectPick("basil", [row("13-805", "Basil, dried, ground", "H"), row("13-804", "Basil, fresh", "H")], "13-804");
  expectPick("dried basil", [row("13-805", "Basil, dried, ground", "H"), row("13-804", "Basil, fresh", "H")], "13-805");
  // Pasta is still bought dry.
  expectPick("pasta", [
    row("11-1129", "Pasta, white, dried, boiled in unsalted water", "AD"),
    row("11-716", "Pasta, white, dried, raw", "AD"),
  ], "11-716");
  if (!isUnaskedDriedForm("green beans", "Green beans, dried")) throw new Error("dried: green beans");
  if (isUnaskedDriedForm("dried green beans", "Green beans, dried")) throw new Error("dried: asked for");
  if (isUnaskedDriedForm("pasta", "Pasta, white, dried, raw")) throw new Error("dried: pasta is bought dry");
  if (isUnaskedDriedForm("lentils", "Lentils, red, split, dried, raw")) throw new Error("dried: pulses use the staple rules");

  const cashewRows = [
    row("14-060", "Cashew fruit, flesh only", "FA", "fulltext"),
    row("14-811", "Cashew nuts, kernel only, plain", "GA", "fulltext"),
    row("14-812", "Cashew nuts, kernel only, roasted and salted", "GA", "fulltext"),
  ];
  expectPick("cashews", cashewRows, "14-811");
  expectPick("cashew", cashewRows, "14-811");
  expectPick("salted cashews", cashewRows, "14-812");
  for (const [query, expected] of [
    ["cashews", "cashew nuts"],
    ["roasted cashews", "roasted cashew nuts"],
    ["cashew nuts", "cashew nuts"],
    ["cashew butter", "cashew butter"],
    ["cashew milk", "cashew milk"],
    ["cashew fruit", "cashew fruit"],
  ]) {
    if (normalizeCofidQuery(query) !== expected) {
      throw new Error(`cashew rewrite: "${query}" → "${normalizeCofidQuery(query)}", expected "${expected}"`);
    }
  }

  // 16 Nov 2026, the rest of the audit's wrong matches. Rows in the order the
  // live lookup returned them, so ties resolve as they did in production.
  // Pasta: every "Pasta, …" row tied on the name and "dried" counted as
  // processing, so fresh egg pasta won.
  const pastaRows = [
    row("11-726", "Pasta, egg, fresh, raw", "AD"),
    row("11-715", "Pasta, egg, white, dried, raw", "AD"),
    row("11-716", "Pasta, white, dried, raw", "AD"),
    row("11-718", "Pasta, wholewheat, spaghetti, dried, raw", "AD"),
    row("11-735", "Pasta, spaghetti, canned, in tomato sauce", "AD"),
    row("11-1129", "Pasta, white, dried, boiled in unsalted water", "AD"),
    row("11-727", "Pasta, egg, white, tagliatelle, fresh, boiled in unsalted water", "AD"),
  ];
  for (const shape of ["pasta", "dried pasta", "spaghetti", "penne", "fusilli", "macaroni", "linguine", "orzo"]) {
    expectPick(shape, pastaRows, "11-716");
  }
  expectPick("tagliatelle", pastaRows, "11-715");
  expectPick("egg pasta", pastaRows, "11-715");
  expectPick("wholewheat penne", pastaRows, "11-718");
  for (const [query, expected] of [
    ["spaghetti", "pasta"],
    ["dried fusilli", "pasta"],
    ["penne pasta", "pasta"],
    ["wholewheat penne", "wholewheat pasta"],
    ["wholemeal spaghetti", "wholewheat pasta"],
    ["tagliatelle", "egg pasta"],
    ["egg spaghetti", "egg pasta"],
    // Not a bare shape: left to the rows that name them.
    ["spaghetti hoops", "pasta spaghetti canned"],
    ["cooked spaghetti", "boiled spaghetti"],
    ["fresh tagliatelle", "fresh tagliatelle"],
    ["spaghetti squash", "spaghetti squash"],
    ["macaroni cheese", "macaroni cheese"],
    // Water.
    ["boiling water", "water"],
    ["cold water", "water"],
    ["coconut water", "coconut water"],
    ["water chestnuts", "water chestnuts"],
    // Herbs and spices.
    ["coriander", "fresh coriander"],
    ["ground coriander", "coriander seeds"],
    ["coriander powder", "coriander seeds"],
    ["fresh coriander", "fresh coriander"],
    ["carrot and coriander soup", "carrot and coriander soup"],
    ["oregano", "dried oregano"],
    ["fresh oregano", "fresh oregano"],
    ["crunchy peanut butter", "peanut butter"],
  ]) {
    if (cofidSearchQuery(query) !== expected) {
      throw new Error(`search query: "${query}" → "${cofidSearchQuery(query)}", expected "${expected}"`);
    }
  }
  // Overrides and the cache stay on the name as written.
  if (normalizeCofidQuery("spaghetti") !== "spaghetti") throw new Error("override key: spaghetti");
  if (normalizeCofidQuery("coriander") !== "coriander") throw new Error("override key: coriander");

  // Mango: unripe and ripe tied on the name.
  const mangoRows = [
    row("13-273", "Mango, unripe, green flesh, raw", "DG"),
    row("14-378", "Mangoes, ripe, flesh only, raw", "FA"),
    row("14-379", "Mangoes, ripe, flesh only, raw, weighed with skin and stone", "FA"),
  ];
  expectPick("mango", mangoRows, "14-378");
  expectPick("mangoes", mangoRows, "14-378");
  expectPick("green mango", mangoRows, "13-273");

  // Chilli: CoFID's "Chilli, …" rows are the dish.
  const chilliRows = [
    row("15-720", "Chilli, Quorn, homemade", "DR"),
    row("15-640", "Chilli, vegetable, homemade", "DR"),
    row("15-719", "Chilli, bean and lentil, homemade", "DR"),
    row("19-478", "Chilli con carne, homemade", "MR"),
    row("13-316", "Peppers, capsicum, chilli, green, raw", "DG", "fulltext"),
    row("13-317", "Peppers, capsicum, chilli, red, raw", "DG", "fulltext"),
  ];
  expectNone("chilli flakes", chilliRows.slice(0, 3));
  expectPick("red chilli", chilliRows, "13-317");
  if (!/^Peppers, capsicum, chilli/.test(pick("chilli", chilliRows)?.food_name ?? "")) throw new Error("chilli: the pepper");
  expectPick("chilli con carne", chilliRows, "19-478");
  if (isChilliDishMismatch("vegetarian chilli", "Chilli, vegetable, homemade")) throw new Error("chilli: veggie dish asked for");
  if (!isChilliDishMismatch("chilli flakes", "Chilli, Quorn, homemade")) throw new Error("chilli: flakes");
  if (isChilliDishMismatch("chilli powder", "Chilli powder")) throw new Error("chilli: powder row is the spice");

  // Coriander: bare means the fresh leaf.
  const corianderRows = [
    row("13-875", "Coriander seeds", "H"),
    row("13-888", "Coriander leaves, fresh", "H"),
    row("13-818", "Coriander leaves, dried", "H"),
  ];
  expectPick("coriander", corianderRows, "13-888");
  expectPick("ground coriander", corianderRows, "13-875");
  expectPick("coriander seeds", corianderRows, "13-875");

  // Nut butters: never dairy butter.
  const butterRows = [
    row("17-685", "Butter, salted", "OB"),
    row("17-661", "Butter, unsalted", "OB"),
    row("17-655", "Butter, spreadable (75-80% fat)", "OB"),
    row("14-892", "Peanut butter, smooth", "GA", "fulltext"),
    row("14-811", "Cashew nuts, kernel only, plain", "GA", "fulltext"),
    row("14-812", "Cashew nuts, kernel only, roasted and salted", "GA", "fulltext"),
  ];
  expectPick("cashew butter", butterRows, "14-811");
  expectPick("peanut butter", butterRows, "14-892");
  expectPick("butter", butterRows, "17-685");
  expectPick("unsalted butter", butterRows, "17-661");
  // The dairy rows are all the lookup fetches for "softened butter".
  if (!pick("softened butter", butterRows.slice(0, 3))?.food_name.startsWith("Butter,")) {
    throw new Error("butter: softened is still butter");
  }
  if (!isNutButterMismatch("almond butter", "Peanut butter, smooth")) throw new Error("nut butter: other nut");
  if (isNutButterMismatch("almond butter", "Almonds, toasted")) throw new Error("nut butter: the nut itself");
  if (isNutButterMismatch("garlic butter", "Butter, salted")) throw new Error("nut butter: garlic butter is butter");

  // Water: plain water is water; a named water must be that drink.
  const waterRows = [
    row("14-873", "Coconut, desiccated", "GA"),
    row("17-377", "Water, distilled", "PA"),
    row("14-816", "Coconut, flesh only, fresh", "GA"),
    row("13-391", "Turnip, boiled in unsalted water", "DG", "fulltext"),
    row("13-669", "Watercress, raw", "DG"),
  ];
  expectNone("coconut water", waterRows);
  expectPick("water", waterRows, "17-377");
  expectPick("boiling water", waterRows, "17-377");
  for (const name of ["water", "Cold water", "boiling water", "tap water", "ice-cold water", "warm water"]) {
    if (!isPlainWaterQuery(name)) throw new Error(`plain water: ${name}`);
  }
  for (const name of ["coconut water", "sparkling water", "tonic water", "water chestnuts", "water biscuits", "watermelon"]) {
    if (isPlainWaterQuery(name)) throw new Error(`not plain water: ${name}`);
  }

  // The local table, which the live recipe preview uses on its own.
  const local = (name: string) => lookupNutrition(name)?.name ?? null;
  for (const [name, expected] of [
    ["water", "water"],
    ["boiling water", "water"],
    ["water biscuits", "water biscuit"],
    ["watermelon", "watermelon"],
    ["sparkling water", "sparkling water"],
    ["cashew butter", "cashews"],
    ["butter", "butter"],
    ["peanut butter", "peanut butter"],
    ["macaroni", "macaroni elbow"],
  ] as const) {
    if (local(name) !== expected) throw new Error(`local: "${name}" → ${local(name)}, expected ${expected}`);
  }
  if (lookupNutrition("water")?.per_100g.calories !== 0) throw new Error("local: water is 0 kcal");
  if (local("hazelnut butter") === "butter") throw new Error("local: hazelnut butter is not dairy butter");
}
console.log("OK: 15–16 Nov 2026 audit matches");

// --- 16 Nov 2026: sauces, peppers, teas and water ---
// Rows are real CoFID names; each query used to take the first one listed.
import {
  isSalsaMismatch,
  isSauceMismatch,
  isSourCreamDipMismatch,
  isSpicePepperMismatch,
  isTeaDrinkMismatch,
  isWaterFoodMismatch,
} from "@/lib/nutrition/cofidMatch";
{
  const row = (food_code: string, food_name: string, matchKind: "partial" | "fulltext" = "partial"): CofidCandidate => ({
    food_code,
    food_name,
    food_group: null,
    matchKind,
  });
  const pick = (query: string, rows: CofidCandidate[]) => pickBestCofidCandidate(normalizeCofidQuery(query), rows);
  const expectPick = (query: string, rows: CofidCandidate[], code: string | null) => {
    const best = pick(query, rows);
    if ((best?.food_code ?? null) !== code) {
      throw new Error(`"${query}" picked ${best ? `${best.food_code} ${best.food_name}` : "nothing"}; expected ${code ?? "nothing"}`);
    }
  };

  const sauceRows = [
    row("19-577", "Sauce, duck a l'orange"),
    row("17-628", "Sauce, Chinese cook in, sweet & sour"),
    row("17-625", "Sauce, pasta, carbonara type"),
    row("17-619", "Sauce, pasta, tomato based, napoletana"),
    row("17-631", "Sauce, traditional cook in, white sauce based"),
    row("17-626", "Sauce, Indian cook in, korma/tikka masala"),
    row("12-593", "Sauce, cheese, packet mix, dry"),
    row("17-719", "Chilli sauce", "fulltext"),
    row("17-705", "Barbecue sauce", "fulltext"),
    row("16-260", "Oysters, raw", "fulltext"),
    row("13-563", "Beans, butter, canned, re-heated, drained", "fulltext"),
    row("19-534", "Curry, chicken, made with cook-in sauce", "fulltext"),
    row("11-1065", "Pasta and sauce mixes, dried, raw", "fulltext"),
  ];
  // No CoFID row: the local table answers.
  for (const q of ["teriyaki sauce", "hoisin sauce", "hot sauce", "pizza sauce jar", "oyster sauce", "black bean sauce", "fish sauce", "sweet chilli sauce"]) {
    expectPick(q, sauceRows, null);
  }
  expectPick("bbq sauce", sauceRows, "17-705");
  expectPick("chilli sauce", sauceRows, "17-719");
  expectPick("carbonara sauce jar", sauceRows, "17-625");
  expectPick("white sauce jar", sauceRows, "17-631");
  expectPick("tikka masala sauce", sauceRows, "17-626");
  expectPick("korma sauce", sauceRows, "17-626");
  expectPick("pasta sauce", sauceRows, "17-619");
  expectPick("cheese sauce packet mix", sauceRows, "12-593");
  if (!isSauceMismatch("curry sauce", "Curry, chicken, made with cook-in sauce")) throw new Error("sauce: a curry dish is not curry sauce");
  if (!isSauceMismatch("cheese sauce", "Sauce, cheese, packet mix, dry")) throw new Error("sauce: dry mix not asked for");
  if (isSauceMismatch("reduced salt soy sauce", "Soy sauce, light and dark varieties")) throw new Error("sauce: salt level is not a different sauce");
  // A food in a sauce is the food.
  if (isSauceMismatch("sardines in tomato sauce", "Sardines, canned in tomato sauce, whole contents")) throw new Error("sauce: food in sauce");

  const pepperRows = [
    row("13-880", "Pepper, black"),
    row("13-524", "Pepper, capsicum, red, raw"),
    row("13-318", "Peppers, capsicum, green, raw"),
  ];
  expectPick("bell pepper", pepperRows, "13-524");
  expectPick("black pepper", pepperRows, "13-880");
  expectPick("ground black pepper", pepperRows, "13-880");
  expectPick("peppercorns", pepperRows, "13-880");
  if (!isSpicePepperMismatch("roasted peppers jar", "Pepper, black")) throw new Error("pepper: roasted peppers are capsicum");
  if (normalizeCofidQuery("pink peppercorns") !== "pink peppercorns") throw new Error("pepper: pink peppercorns aren't black pepper");

  const teaRows = [
    row("17-171", "Tea, green, infusion"),
    row("17-165", "Tea, black, infusion, average"),
    row("17-172", "Tea, herbal, infusion"),
    row("11-797", "Biscuits, semi-sweet", "fulltext"),
    row("11-1009", "Currant buns, retail", "fulltext"),
  ];
  expectPick("rich tea biscuit", teaRows, "11-797");
  expectPick("tea cake", teaRows, "11-1009");
  expectPick("earl grey tea", teaRows, "17-165");
  expectPick("peppermint tea", teaRows, "17-172");
  expectPick("green tea", teaRows, "17-171");
  if (!isTeaDrinkMismatch("tea loaf", "Tea, black, infusion, average")) throw new Error("tea: tea loaf is a cake");

  // "Water" in front of another word names a different food.
  const chestnutRows = [
    row("14-813", "Chestnuts, kernel only, raw"),
    row("13-394", "Water chestnuts, raw"),
    row("11-794", "Biscuits, cheese flavoured", "fulltext"),
  ];
  expectPick("water chestnuts tin", chestnutRows, "13-394");
  expectPick("chestnuts", chestnutRows, "14-813");
  expectPick("water biscuit", chestnutRows, null);
  if (isWaterFoodMismatch("tuna in water", "Tuna, canned in brine, drained")) throw new Error("water: packing liquid");
  if (isWaterFoodMismatch("watercress", "Watercress, raw")) throw new Error("water: watercress is one word");

  if (!isSourCreamDipMismatch("salsa dip", "Dips, sour-cream based, assorted flavours")) throw new Error("dip: salsa");
  if (isSourCreamDipMismatch("sour cream dip", "Dips, sour-cream based, assorted flavours")) throw new Error("dip: sour cream");
  if (!isSalsaMismatch("tomato salsa", "Tomatoes, cherry, raw")) throw new Error("salsa: CoFID has none");

  const refriedRows = [
    row("13-108", "Beans, pinto, re-fried beans"),
    row("15-854", "Re-fried beans"),
    row("13-045", "Beans, butter, canned, re-heated, drained"),
  ];
  expectPick("refried beans tin", refriedRows, "13-108");
  expectPick("refried beans", refriedRows, "13-108");
  expectPick("homemade refried beans", refriedRows, "15-854");
  if (normalizeCofidQuery("pinto refried beans") !== "pinto re-fried beans") throw new Error("refried: pinto doubled");
  if (normalizeCofidQuery("black coffee") !== "coffee infusion") throw new Error("coffee: black coffee is not Irish");
}
console.log("OK: 16 Nov 2026 sauces, peppers, teas and water");

// --- 16 Nov 2026: names that found no row at all ---
// With AI estimates off, these cost 0 kcal. Rows are real CoFID names.
{
  const row = (food_code: string, food_name: string, matchKind: "partial" | "fulltext" = "partial"): CofidCandidate => ({
    food_code,
    food_name,
    food_group: null,
    matchKind,
  });
  const expectPick = (query: string, rows: CofidCandidate[], code: string | null) => {
    const best = pickBestCofidCandidate(cofidSearchQuery(query), rows);
    if ((best?.food_code ?? null) !== code) {
      throw new Error(`"${query}" picked ${best ? `${best.food_code} ${best.food_name}` : "nothing"}; expected ${code ?? "nothing"}`);
    }
  };

  // Cheddar is "Cheese, Cheddar, …" in CoFID, so only "%cheddar%" on the whole
  // name or full text on every word reached it: "grated cheddar" found nothing.
  for (const [query, expected] of [
    ["grated cheddar", "cheddar"],
    ["mature cheddar", "cheddar"],
    ["extra mature cheddar", "cheddar"],
    ["grated mild cheddar cheese", "cheddar cheese"],
    ["reduced fat cheddar", "cheddar 30 less fat"],
    ["reduced-fat mature cheddar", "cheddar 30 less fat"],
    ["lighter cheddar", "cheddar 30 less fat"],
    ["30% less fat cheddar", "cheddar 30 less fat"],
    ["low fat cheddar", "half fat cheddar"],
    ["half fat cheddar", "half fat cheddar"],
    ["cheddar", "cheddar"],
  ] as const) {
    const q = normalizeCofidQuery(query);
    if (q !== expected) throw new Error(`cheddar: "${query}" → "${q}", expected "${expected}"`);
    if (normalizeCofidQuery(q) !== q) throw new Error(`cheddar: "${q}" changes when normalised again`);
  }
  // Grated and strength words only go for cheddar.
  if (normalizeCofidQuery("grated carrot") !== "grated carrot") throw new Error("cheddar: grated carrot untouched");
  if (normalizeCofidQuery("medium egg") !== "medium egg") throw new Error("cheddar: medium egg untouched");

  const cheddarRows = [
    row("11-963", "Sandwich, white bread, cheddar cheese and pickle"),
    row("12-548", "Cheese, Cheddar type, '30% less fat'"),
    row("12-348", "Cheese, Cheddar type, half fat"),
    row("12-346", "Cheese, Cheddar, English"),
  ];
  expectPick("cheddar", cheddarRows, "12-346");
  expectPick("grated cheddar", cheddarRows, "12-346");
  expectPick("mature cheddar", cheddarRows, "12-346");
  expectPick("reduced fat cheddar", cheddarRows, "12-548");
  expectPick("half fat cheddar", cheddarRows, "12-348");
  expectPick("low fat cheddar", cheddarRows, "12-348");

  // CoFID has no borlotti beans, and the other varieties are different foods,
  // so the lookup returns nothing and the local row answers.
  const beanRows = [
    row("13-042", "Beans, aduki, whole, dried, boiled in unsalted water"),
    row("13-063", "Beans, blackeye, whole, dried, boiled in unsalted water"),
    row("13-559", "Beans, butter, canned, re-heated, drained"),
    row("13-107", "Beans, pinto, dried, boiled in unsalted water"),
    row("13-665", "Beans, haricot, canned, re-heated, drained"),
  ];
  expectPick("borlotti beans", beanRows, null);
  expectPick("tinned borlotti beans", beanRows, null);

  // The local table, which the recipe preview uses on its own and the full
  // chain falls back to.
  const local = (name: string) => lookupNutrition(name)?.name ?? null;
  for (const [name, expected] of [
    ["grated cheddar", "cheddar cheese"],
    ["mature cheddar", "cheddar cheese"],
    ["extra mature cheddar", "cheddar cheese"],
    ["grated cheddar cheese", "cheddar cheese"],
    ["cheddar", "cheddar cheese"],
    ["reduced fat cheddar", "reduced fat cheddar"],
    ["reduced-fat mature cheddar", "reduced fat cheddar"],
    ["lighter cheddar", "reduced fat cheddar"],
    ["borlotti beans", "borlotti beans"],
    ["tinned borlotti beans", "borlotti beans"],
    ["seitan", "seitan"],
    ["vegan mince", "meat free mince"],
    ["plant-based mince", "meat free mince"],
    ["plant based mince", "meat free mince"],
    ["meat-free mince", "meat free mince"],
    ["mince", "beef mince"],
  ] as const) {
    if (local(name) !== expected) throw new Error(`local: "${name}" → ${local(name)}, expected ${expected}`);
  }
  for (const name of ["borlotti beans", "seitan", "vegan mince", "reduced fat cheddar"]) {
    const kcal = lookupNutrition(name)?.per_100g.calories ?? 0;
    if (kcal <= 0) throw new Error(`local: "${name}" costs ${kcal} kcal`);
  }
}
console.log("OK: 16 Nov 2026 names that found no row");

// --- 16 Nov 2026: soya, sun-dried tomatoes, rice noodles, dried borlotti ---
// Each was costed as another food or form. Rows are real CoFID names.
import { isTexturedSoyaMismatch } from "@/lib/nutrition/cofidMatch";
{
  const row = (food_code: string, food_name: string, matchKind: "partial" | "fulltext" = "partial"): CofidCandidate => ({
    food_code,
    food_name,
    food_group: null,
    matchKind,
  });
  const expectPick = (query: string, rows: CofidCandidate[], code: string | null) => {
    const best = pickBestCofidCandidate(cofidSearchQuery(query), rows);
    if ((best?.food_code ?? null) !== code) {
      throw new Error(`"${query}" picked ${best ? `${best.food_code} ${best.food_name}` : "nothing"}; expected ${code ?? "nothing"}`);
    }
  };

  // CoFID has no textured soya; "textured vegetable protein" took mixed veg (42 kcal).
  const vegRows = [
    row("13-543", "Vegetables, mixed, frozen, boiled in unsalted water"),
    row("15-364", "Vegetables, stir-fried, takeaway"),
    row("13-115", "Beans, soya, dried, raw", "fulltext"),
  ];
  for (const query of ["textured vegetable protein", "tvp", "soya mince", "dried soya mince", "soya chunks"]) {
    expectPick(query, vegRows, null);
  }
  if (isTexturedSoyaMismatch("soya beans", "Beans, soya, dried, raw")) throw new Error("soya: beans are not TVP");

  // CoFID has no dried tomato; "sun dried tomatoes" took grilled (17 kcal).
  const tomatoRows = [
    row("13-518", "Tomatoes, standard, grilled, flesh and seeds only"),
    row("13-603", "Tomatoes, standard, fried in corn oil"),
    row("13-519", "Tomatoes, cherry, raw"),
    row("13-517", "Tomatoes, standard, raw"),
    row("15-321", "Tomatoes, stuffed with rice"),
    row("13-530", "Tomatoes, canned, whole contents"),
  ];
  for (const query of ["sun dried tomatoes", "sundried tomatoes", "sun-dried tomatoes in oil", "dried cherry tomatoes"]) {
    expectPick(query, tomatoRows, null);
  }
  if (normalizeCofidQuery("sundried tomatoes") !== "sun dried tomatoes") throw new Error("sun dried: one spelling");
  if (!pickBestCofidCandidate(cofidSearchQuery("tomatoes"), tomatoRows)) throw new Error("sun dried: fresh tomatoes still match");

  // Names that only come dry can't take CoFID's only rice noodle row, which is
  // boiled; flat noodles and vermicelli took raw rice grain. Bare "rice
  // noodles" keeps the boiled row (Tesco's own are ready to wok).
  const noodleRows = [
    row("11-725", "Noodles, rice, fine, dried, boiled in unsalted water", "fulltext"),
    row("11-866", "Rice, brown, basmati, raw"),
    row("11-968", "Rice, pilau, plain, homemade"),
    row("11-719", "Noodles, egg, dried, raw"),
  ];
  for (const query of ["dried rice noodles", "flat rice noodles", "rice vermicelli", "rice sticks", "pad thai rice noodles"]) {
    expectPick(query, noodleRows, null);
  }
  for (const query of ["rice noodles", "cooked rice noodles", "fresh rice noodles", "straight to wok rice noodles"]) {
    expectPick(query, noodleRows, "11-725");
  }
  expectPick("egg noodles", noodleRows, "11-719");
  expectPick("rice", noodleRows, "11-866");

  // The local table: sourced rows, reached by every everyday name.
  const local = (name: string) => lookupNutrition(name);
  for (const [name, expected, minKcal] of [
    ["soya mince", "soya mince dried", 350],
    ["dried soya mince", "soya mince dried", 350],
    ["tvp", "textured vegetable protein", 350],
    ["textured vegetable protein", "textured vegetable protein", 350],
    ["soya chunks", "soya chunks dried", 350],
    ["sun dried tomatoes", "sun dried tomatoes jar", 150],
    ["sundried tomatoes", "sun dried tomatoes jar", 150],
    ["sun-dried tomatoes in oil", "sun dried tomatoes jar", 150],
    ["chopped sun dried tomatoes", "sun dried tomatoes jar", 150],
    ["dried rice noodles", "dried rice noodles", 340],
    ["dry rice noodles", "dried rice noodles", 340],
    ["flat rice noodles", "dried rice noodles", 340],
    ["rice vermicelli", "dried rice noodles", 340],
    ["pad thai noodles", "dried rice noodles", 340],
    ["rice noodle", "rice noodles", 80],
    ["fresh rice noodles", "cooked rice noodles", 80],
    ["cooked rice noodles", "cooked rice noodles", 80],
    ["dried borlotti beans", "dried borlotti beans", 300],
    ["dry borlotti beans", "dried borlotti beans", 300],
    ["borlotti", "borlotti beans", 90],
    ["tinned borlotti beans", "borlotti beans", 90],
  ] as const) {
    const entry = local(name);
    if (entry?.name !== expected) throw new Error(`local: "${name}" → ${entry?.name ?? null}, expected ${expected}`);
    if (entry.per_100g.calories < minKcal) throw new Error(`local: "${name}" is ${entry.per_100g.calories} kcal`);
  }
  for (const name of ["soya mince", "tvp", "soya chunks"]) {
    if ((local(name)?.per_100g.protein_g ?? 0) < 45) throw new Error(`local: "${name}" is textured soya, about 50 g protein`);
  }
  // Fresh tomatoes and sun-dried tomato pesto are other foods.
  if (local("tomatoes")?.name === "sun dried tomatoes jar") throw new Error("local: fresh tomatoes");
  if (local("sun dried tomato pesto")?.name === "sun dried tomatoes jar") throw new Error("local: pesto is not the tomatoes");
}
console.log("OK: 16 Nov 2026 soya, sun-dried tomatoes, rice noodles, dried borlotti");

// 16 Nov 2026: pesto, five spice and cassia, and the template rows a new
// recipe would reach. "sun dried tomato pesto" took grilled tomatoes (17 kcal),
// "tomato pesto" took green pesto, "basil pesto" took fresh basil (40 kcal) and
// "chinese five spice" found nothing at all.
{
  if (cofidSearchQuery("sun dried tomato pesto") !== "red pesto") throw new Error("pesto: sun-dried tomato pesto is red pesto");
  for (const query of ["sundried tomato pesto", "sun-dried tomato pesto", "tomato pesto", "pesto rosso"]) {
    if (cofidSearchQuery(query) !== "red pesto") throw new Error(`pesto: "${query}" → "${cofidSearchQuery(query)}"`);
  }
  for (const query of ["basil pesto", "pesto genovese"]) {
    if (cofidSearchQuery(query) !== "green pesto") throw new Error(`pesto: "${query}" → "${cofidSearchQuery(query)}"`);
  }
  if (cofidSearchQuery("pesto") !== "pesto") throw new Error("pesto: bare pesto is unchanged");
  for (const query of ["chinese five spice", "five spice powder", "five-spice"]) {
    if (cofidSearchQuery(query) !== "chinese 5 spice") throw new Error(`five spice: "${query}" → "${cofidSearchQuery(query)}"`);
  }
  if (cofidSearchQuery("cassia bark") !== "cinnamon") throw new Error("cassia is cinnamon");

  const local = (name: string) => lookupNutrition(name);
  for (const [name, expected, minKcal] of [
    ["sun dried tomato pesto", "pesto jar red", 300],
    ["sundried tomato pesto", "pesto jar red", 300],
    ["red pesto", "pesto jar red", 300],
    ["pesto", "pesto jar green", 400],
    ["basil pesto", "pesto jar green", 400],
    ["chinese five spice", "five spice powder", 300],
    ["cornflour", "cornflour", 340],
    ["mirin", "mirin", 250],
    ["panko breadcrumbs", "panko breadcrumbs", 340],
    ["gochujang paste", "gochujang paste", 200],
    ["white miso paste", "miso paste white", 150],
    ["balsamic vinegar", "balsamic vinegar", 100],
  ] as const) {
    const entry = local(name);
    if (entry?.name !== expected) throw new Error(`local: "${name}" → ${entry?.name ?? null}, expected ${expected}`);
    if (entry.per_100g.calories < minKcal) throw new Error(`local: "${name}" is ${entry.per_100g.calories} kcal`);
  }
  // Fresh tomatoes are not pesto.
  if (local("tomatoes")?.name?.includes("pesto")) throw new Error("local: tomatoes are not pesto");
}
console.log("OK: 16 Nov 2026 pesto, five spice, cassia and sourced template rows");

// 17 Nov 2026: chicken kiev. CoFID has no kiev, so "chicken kiev" took
// "Chicken, meat, average, raw" (108 kcal), and the local row it would have
// fallen back to was a template at 58 kcal with 12 g sugar in 7.5 g
// carbohydrate. "Garlic chicken kiev" found the "garlic" row.
import { isKievMismatch } from "@/lib/nutrition/cofidMatch";
{
  for (const query of ["chicken kiev", "chicken kievs", "garlic chicken kiev"]) {
    if (!isKievMismatch(query, "Chicken, meat, average, raw")) throw new Error(`kiev: "${query}" may not take raw chicken`);
    if (scoreCofidMatch(query, "Chicken, meat, average, raw", "partial") !== -Infinity) {
      throw new Error(`kiev: "${query}" scored raw chicken`);
    }
    if (scoreCofidMatch(query, "Garlic, raw", "partial") !== -Infinity) throw new Error(`kiev: "${query}" scored garlic`);
  }
  if (isKievMismatch("chicken thighs", "Chicken, meat, average, raw")) throw new Error("kiev: plain chicken is unchanged");

  for (const name of ["chicken kiev", "chicken kievs", "garlic chicken kiev", "breaded garlic chicken kievs", "2 garlic & herb chicken kievs"]) {
    const entry = lookupNutrition(name);
    if (entry?.name !== "chicken kiev") throw new Error(`local: "${name}" → ${entry?.name ?? null}, expected chicken kiev`);
    const p = entry.per_100g;
    if (p.calories < 250) throw new Error(`local: chicken kiev is ${p.calories} kcal`);
    if (p.sugar_g > p.carbs_g) throw new Error("local: chicken kiev sugar exceeds carbohydrate");
  }
  if (lookupNutrition("garlic")?.name !== "garlic") throw new Error("local: garlic is still garlic");
  if (lookupNutrition("chicken breast")?.name !== "chicken breast") throw new Error("local: chicken breast is unchanged");
}
console.log("OK: 17 Nov 2026 chicken kiev");
