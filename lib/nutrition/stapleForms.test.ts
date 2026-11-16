/**
 * Dry vs cooked staples, dried vs fresh fruit, and names CoFID has no row for
 * (16 Nov 2026 audit leftovers). CoFID row choice runs on mock rows; the local
 * table is the one the recipe-form preview uses on its own.
 */
import { lookupPieceWeightGramsPerUnit } from "@/lib/nutrition/convert";
import {
  type CofidCandidate,
  cofidSearchQuery,
  isWrongFormRow,
  pickBestCofidCandidate,
} from "@/lib/nutrition/cofidMatch";
import { lookupNutrition } from "@/lib/nutrition/lookup";

function assert(condition: boolean, label: string): void {
  if (!condition) throw new Error(label);
}

// --- Whole-name rewrites for names CoFID lacks ---
for (const [name, expected] of [
  ["bird's eye chilli", "red chilli"],
  ["birds eye chillies", "red chilli"],
  ["Bird’s eye chillies", "red chilli"],
  ["thai chilli", "red chilli"],
  ["thai green chilli", "green chilli"],
  ["green bird's eye chilli", "green chilli"],
  ["chilli", "chilli"],
  ["garlic butter", "butter"],
  ["garlic & herb butter", "butter"],
  ["herb butter", "butter"],
  ["peanut butter", "peanut butter"],
  ["cooked rice", "boiled long grain rice"],
  ["steamed white rice", "boiled long grain rice"],
  ["leftover cooked rice", "boiled long grain rice"],
  ["egg fried rice", "egg fried rice"],
  ["cooked brown rice", "cooked brown rice"],
  ["cooked penne", "boiled pasta"],
  ["cooked spaghetti", "boiled spaghetti"],
  ["cooked wholewheat spaghetti", "boiled wholewheat pasta"],
  ["penne", "pasta"],
  ["uncooked penne", "pasta"],
  ["spaghetti hoops", "pasta spaghetti canned"],
  ["tinned spaghetti", "pasta spaghetti canned"],
  ["spaghetti bolognese", "spaghetti bolognese"],
] as const) {
  const got = cofidSearchQuery(name);
  assert(got === expected, `search query: "${name}" → "${got}", expected "${expected}"`);
}

// --- Rows in the wrong form ---
for (const [query, row, wrong] of [
  ["dried mango", "Mangoes, ripe, flesh only, raw", true],
  ["dried mango", "Mango, unripe, green flesh, raw", true],
  ["dried apricots", "Apricots, raw", true],
  ["dried apricots", "Apricots, dried", false],
  ["dried oregano", "Oregano, dried, ground", false],
  ["dried red lentils", "Lentils, red, split, dried, raw", false],
  ["dried rice noodles", "Noodles, rice, fine, dried, boiled in unsalted water", true],
  ["rice noodles", "Noodles, rice, fine, dried, boiled in unsalted water", false],
  ["cooked quinoa", "Quinoa, raw", true],
  ["quinoa", "Quinoa, raw", false],
  ["cooked lentils", "Lentils, red, split, dried, raw", true],
  ["cooked lentils", "Lentils, red, split, dried, boiled in unsalted water", false],
  ["uncooked rice", "Rice, white, long grain, raw", false],
  ["mango", "Mangoes, ripe, flesh only, raw", false],
  ["sun dried tomatoes", "Tomatoes, cherry, raw", true],
  ["sun dried tomatoes", "Tomatoes, stuffed with rice", true],
  ["dried mango", "Chutney, mango, sweet", true],
  ["dried rice noodles", "Rice, pilau, plain, homemade", true],
  ["egg noodles", "Noodles, egg, dried, raw", false],
] as const) {
  assert(isWrongFormRow(query, row) === wrong, `wrong form: "${query}" vs "${row}" should be ${wrong}`);
}

const row = (food_code: string, food_name: string, food_group: string): CofidCandidate => ({
  food_code,
  food_name,
  food_group,
  matchKind: "partial",
});
const pick = (query: string, rows: CofidCandidate[]) =>
  pickBestCofidCandidate(cofidSearchQuery(query), rows)?.food_code ?? null;

const mangoRows = [
  row("14-378", "Mangoes, ripe, flesh only, raw", "FA"),
  row("13-273", "Mango, unripe, green flesh, raw", "DG"),
  row("17-343", "Chutney, mango, sweet", "WC"),
];
assert(pick("dried mango", mangoRows) === null, `dried mango: CoFID has none, picked ${pick("dried mango", mangoRows)}`);
assert(pick("mango", mangoRows) === "14-378", "mango is still fresh mango");

const quinoaRows = [row("14-843", "Quinoa, raw", "AA")];
assert(pick("cooked quinoa", quinoaRows) === null, "cooked quinoa: no cooked row in CoFID");
assert(pick("quinoa", quinoaRows) === "14-843", "quinoa is still raw quinoa");

const butterRows = [
  row("13-244", "Garlic, raw", "DG"),
  row("17-685", "Butter, salted", "OB"),
  row("17-686", "Butter, unsalted", "OB"),
];
assert(pick("garlic butter", butterRows) === "17-685", `garlic butter picked ${pick("garlic butter", butterRows)}`);
assert(pick("garlic", butterRows) === "13-244", "garlic is still garlic");

const riceRows = [
  row("11-885", "Rice, egg fried, ready cooked, re-heated, retail, not takeaway", "AC"),
  row("11-884", 'Rice, ready-cooked, "plain", re-heated', "AC"),
  row("11-862", "Rice, white, long grain, boiled in unsalted water", "AC"),
  row("11-861", "Rice, white, long grain, raw", "AC"),
];
assert(pick("cooked rice", riceRows) === "11-862", `cooked rice picked ${pick("cooked rice", riceRows)}`);
assert(pick("rice", riceRows) === "11-861", "rice is still the dry row");

const chilliRows = [
  row("13-316", "Peppers, capsicum, chilli, green, raw", "DG"),
  row("13-317", "Peppers, capsicum, chilli, red, raw", "DG"),
];
assert(pick("bird's eye chilli", chilliRows) === "13-317", "bird's eye chilli is a red chilli");

// --- Local table: bare staples dry, cooked names cooked ---
const local = (name: string) => lookupNutrition(name);
for (const name of ["spaghetti", "penne", "wholemeal pasta", "white rice", "brown rice", "basmati rice", "noodles", "bulgur wheat"]) {
  const kcal = local(name)?.per_100g.calories ?? 0;
  assert(kcal > 300, `local "${name}" is dry (${kcal} kcal per 100 g)`);
}
for (const [name, expected] of [
  ["cooked spaghetti", "cooked pasta"],
  ["cooked penne", "cooked pasta"],
  ["boiled basmati rice", "cooked basmati rice"],
  ["leftover cooked rice", "cooked rice"],
  ["steamed rice", "cooked rice"],
  ["cooked brown rice", "cooked brown rice"],
  ["cooked wholemeal spaghetti", "cooked wholewheat pasta"],
  ["cooked egg noodles", "cooked egg noodles"],
  ["cooked rice noodles", "cooked rice noodles"],
  ["cooked couscous", "cooked couscous"],
  ["cooked quinoa", "cooked quinoa"],
  ["cooked bulgur wheat", "cooked bulgur wheat"],
  ["spaghetti hoops", "spaghetti hoops tin"],
  ["tinned spaghetti", "spaghetti hoops tin"],
  ["udon noodles", "cooked egg noodles"],
  ["straight to wok noodles", "cooked egg noodles"],
  ["dried mango", "dried mango"],
  ["dried mango slices", "dried mango"],
  ["mango", "mango"],
  ["bird's eye chilli", "fresh red chilli"],
  ["bird’s eye chillies", "fresh red chilli"],
  ["thai green chilli", "fresh green chilli"],
  ["red chilli", "fresh red chilli"],
  ["chilli", "fresh red chilli"],
  ["green chilli", "fresh green chilli"],
  ["chilli flakes", "chilli flakes"],
  ["garlic butter", "butter"],
  ["tagliatelle", "linguine egg"],
  ["egg noodles", "noodles"],
] as const) {
  const got = local(name)?.name ?? null;
  assert(got === expected, `local: "${name}" → ${got}, expected ${expected}`);
}
for (const name of ["egg fried rice", "rice pudding", "macaroni cheese", "pasta salad"]) {
  const got = local(name)?.name ?? "";
  assert(!got.startsWith("cooked "), `local: "${name}" is not a plain cooked staple (got ${got})`);
}

// --- Piece weights: a plural hid "chilli" from the whole-word match ---
for (const name of ["green chillies", "bird's eye chillies", "red chillies", "chilli"]) {
  assert(lookupPieceWeightGramsPerUnit(name) === 15, `piece weight: ${name}`);
}

console.log("OK: staple forms, dried fruit and names CoFID lacks");
