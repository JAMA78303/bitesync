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

// exact beats partial
const exact = scoreCofidMatch("chicken breast", "Chicken breast", "exact");
const partial = scoreCofidMatch("chicken breast", "Chicken, breast, roasted", "partial");
if (exact <= partial) {
  throw new Error("exact match should outscore partial composite");
}

console.log("OK: CoFID matcher regression tests passed");
