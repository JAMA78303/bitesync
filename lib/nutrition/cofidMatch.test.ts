import {
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
assertMatch("rice", riceCandidates, "rice, white, long grain", ["pudding"]);

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
assertMatch("pasta", pastaCandidates, "boiled", ["dried"]);

// quinoa → penalise raw when cooked variant exists; only-raw falls through to local DB
const quinoaCandidates: CofidCandidate[] = [
  { food_code: "14-843", food_name: "Quinoa, raw", food_group: "GA", matchKind: "partial" },
];
assertMatch("quinoa", quinoaCandidates, "quinoa", ["bread"]);

// couscous → cooked, NOT raw (class rule)
const couscousCandidates: CofidCandidate[] = [
  { food_code: "11-901", food_name: "Couscous, plain, raw", food_group: "AT", matchKind: "partial" },
  { food_code: "11-902", food_name: "Couscous, plain, cooked", food_group: "AT", matchKind: "partial" },
];
assertMatch("couscous", couscousCandidates, "cooked", ["raw"]);

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

console.log("OK: CoFID matcher regression tests passed");
