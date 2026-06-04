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

const mushrooms: CofidCandidate[] = [
  { food_code: "1", food_name: "Mushrooms, common, raw", food_group: "Vegetables", matchKind: "partial" },
  { food_code: "2", food_name: "Mushroom soup, canned", food_group: "Soups", matchKind: "partial" },
  { food_code: "3", food_name: "Mushrooms, fried in oil", food_group: "Vegetables", matchKind: "partial" },
];
assertMatch("mushrooms", mushrooms, "raw", ["soup", "fried"]);

const oliveOil: CofidCandidate[] = [
  { food_code: "4", food_name: "Oil, olive", food_group: "Fats", matchKind: "fulltext" },
  { food_code: "5", food_name: "Oil, vegetable", food_group: "Fats", matchKind: "partial" },
];
assertMatch("olive oil", oliveOil, "olive");

const exact = scoreCofidMatch("chicken breast", "Chicken breast", "exact");
const partial = scoreCofidMatch("chicken breast", "Chicken, breast, roasted", "partial");
if (exact <= partial) {
  throw new Error("exact match should outscore partial composite");
}

const bananaCandidates: CofidCandidate[] = [
  { food_code: "11-1029", food_name: "Banana bread, homemade", food_group: "AN", matchKind: "partial" },
  { food_code: "12-556", food_name: "Banana split, homemade", food_group: "BP", matchKind: "partial" },
  { food_code: "14-318", food_name: "Bananas, flesh only", food_group: "FA", matchKind: "partial" },
  { food_code: "14-347", food_name: "Bananas, raw, flesh only, weighed with skin", food_group: "FA", matchKind: "partial" },
];
assertMatch("banana", bananaCandidates, "flesh only", ["bread", "split"]);
assertMatch("Banana", bananaCandidates, "flesh only", ["bread"]);

const appleCandidates: CofidCandidate[] = [
  { food_code: "11-1029", food_name: "Banana bread, homemade", food_group: "AN", matchKind: "partial" },
  { food_code: "14-319", food_name: "Apples, eating, raw, flesh and skin", food_group: "FA", matchKind: "partial" },
  { food_code: "14-331", food_name: "Apple juice, clear, ambient and chilled", food_group: "FC", matchKind: "partial" },
  { food_code: "11-1065", food_name: "Pudding, Eve's pudding, homemade", food_group: "AS", matchKind: "partial" },
];
assertMatch("apple", appleCandidates, "apples, eating, raw", ["juice", "pudding", "bread"]);

const oatCandidates: CofidCandidate[] = [
  { food_code: "11-788", food_name: "Porridge oats, unfortified", food_group: "A", matchKind: "partial" },
  { food_code: "11-792", food_name: "Breakfast cereal, instant hot oat, plain, raw, fortified", food_group: "AI", matchKind: "partial" },
  { food_code: "11-814", food_name: "Flapjacks, retail", food_group: "AM", matchKind: "partial" },
  { food_code: "11-823", food_name: "Oatcakes, plain, retail", food_group: "AM", matchKind: "partial" },
];
assertMatch("oats", oatCandidates, "porridge oats", ["flapjack", "oatcake", "cereal"]);
assertMatch("oat", oatCandidates, "porridge oats", ["flapjack", "oatcake"]);

const chickenCandidates: CofidCandidate[] = [
  { food_code: "18-297", food_name: "Chicken, whole, raw, meat and skin", food_group: "MCA", matchKind: "partial" },
  { food_code: "18-501", food_name: "Chicken pieces, coated, takeaway", food_group: "MCA", matchKind: "partial" },
  { food_code: "18-504", food_name: "Chicken breast/steak, coated, baked", food_group: "MCA", matchKind: "partial" },
];
assertMatch("chicken", chickenCandidates, "chicken, whole, raw", ["coated", "takeaway"]);

const riceCandidates: CofidCandidate[] = [
  { food_code: "11-862", food_name: "Rice, white, long grain, boiled in unsalted water", food_group: "AC", matchKind: "partial" },
  { food_code: "11-865", food_name: "Rice, white, pudding, raw", food_group: "AC", matchKind: "partial" },
  { food_code: "11-869", food_name: "Rice, brown, wholegrain, boiled in unsalted water", food_group: "AC", matchKind: "partial" },
];
assertMatch("rice", riceCandidates, "rice, white, long grain", ["pudding"]);

const potatoCandidates: CofidCandidate[] = [
  { food_code: "13-489", food_name: "Potatoes, old, raw, flesh only", food_group: "DAM", matchKind: "partial" },
  { food_code: "13-618", food_name: "Potatoes, new and salad, flesh only, raw", food_group: "DAE", matchKind: "partial" },
  { food_code: "99-001", food_name: "Potato waffles, retail", food_group: "DR", matchKind: "partial" },
  { food_code: "99-002", food_name: "Potato croquettes, frozen, fried", food_group: "DR", matchKind: "partial" },
];
assertMatch("potato", potatoCandidates, "potatoes", ["waffle", "croquette"]);

console.log("OK: CoFID ranking picks whole foods over composites");
