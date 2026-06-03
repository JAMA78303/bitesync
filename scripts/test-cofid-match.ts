import { pickBestCofidCandidate, scoreCofidMatch, type CofidCandidate } from "@/lib/nutrition/cofidMatch";

const mushrooms: CofidCandidate[] = [
  { food_code: "1", food_name: "Mushrooms, common, raw", food_group: "Vegetables", matchKind: "fulltext" },
  { food_code: "2", food_name: "Mushroom soup, canned", food_group: "Soups", matchKind: "partial" },
  { food_code: "3", food_name: "Mushrooms, fried in oil", food_group: "Vegetables", matchKind: "partial" },
];

const bestMushroom = pickBestCofidCandidate("mushrooms", mushrooms);
if (!bestMushroom || !bestMushroom.food_name.includes("raw")) {
  throw new Error(`expected raw mushrooms, got ${bestMushroom?.food_name}`);
}

const oliveOil: CofidCandidate[] = [
  { food_code: "4", food_name: "Oil, olive", food_group: "Fats", matchKind: "fulltext" },
  { food_code: "5", food_name: "Oil, vegetable", food_group: "Fats", matchKind: "partial" },
];
const bestOil = pickBestCofidCandidate("olive oil", oliveOil);
if (!bestOil || !bestOil.food_name.toLowerCase().includes("olive")) {
  throw new Error(`expected olive oil match, got ${bestOil?.food_name}`);
}

const exact = scoreCofidMatch("chicken breast", "Chicken breast", "exact");
const partial = scoreCofidMatch("chicken breast", "Chicken, breast, roasted", "partial");
if (exact <= partial) {
  throw new Error("exact match should outscore partial composite");
}

console.log("OK: CoFID ranking picks sensible matches");
