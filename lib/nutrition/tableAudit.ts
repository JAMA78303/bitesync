/**
 * Plausibility checks for the local nutrition table (per-100 g rows).
 *
 * Much of `nutrition-db-uk-expansion*.ts` was generated from a handful of
 * templates rather than sourced: every row in part 2 cycles through five
 * value sets, so hummus had 412 kcal and simnel cake 57. These checks find
 * rows like that mechanically. They are shared by `scripts/audit-local-nutrition.ts`
 * (a full report) and `tableEnergy.test.ts` (a ratchet on energy).
 */
import type { NutritionLookupEntry } from "@/types";
import { UK_LABEL_KCAL_PER_G as KCAL_PER_G } from "@/lib/nutrition/cofidEnergyGaps";

/** Expected energy when carbohydrate excludes fibre (UK / CoFID convention). */
export function atwaterKcal(entry: NutritionLookupEntry): number {
  const p = entry.per_100g;
  return (
    KCAL_PER_G.protein * p.protein_g +
    KCAL_PER_G.carbs * p.carbs_g +
    KCAL_PER_G.fat * p.fat_g +
    KCAL_PER_G.fibre * p.fibre_g
  );
}

/**
 * Expected energy when carbohydrate includes fibre (US "by difference", which
 * the USDA-derived rows use). Without this, high-fibre spices like cinnamon
 * look 80% over.
 */
export function atwaterKcalTotalCarbs(entry: NutritionLookupEntry): number {
  const p = entry.per_100g;
  const available = Math.max(p.carbs_g - p.fibre_g, 0);
  return (
    KCAL_PER_G.protein * p.protein_g +
    KCAL_PER_G.carbs * available +
    KCAL_PER_G.fat * p.fat_g +
    KCAL_PER_G.fibre * p.fibre_g
  );
}

export type EnergyCheck = {
  stated: number;
  /** The convention closer to the stated figure. */
  expected: number;
  /** stated − expected, kcal per 100 g. */
  gap: number;
};

export function energyCheck(entry: NutritionLookupEntry): EnergyCheck {
  const stated = entry.per_100g.calories;
  const uk = atwaterKcal(entry);
  const us = atwaterKcalTotalCarbs(entry);
  const expected = Math.abs(stated - uk) <= Math.abs(stated - us) ? uk : us;
  return { stated, expected, gap: stated - expected };
}

/**
 * Rounding, fibre factors and sugar-alcohol/organic-acid energy explain small
 * gaps; a template row is typically off by 30–500%.
 */
export const ENERGY_TOLERANCE = { kcal: 15, fraction: 0.15 } as const;

export function energyReconciles(entry: NutritionLookupEntry): boolean {
  const { stated, expected, gap } = energyCheck(entry);
  const allowed = Math.max(ENERGY_TOLERANCE.kcal, ENERGY_TOLERANCE.fraction * Math.max(stated, expected));
  return Math.abs(gap) <= allowed;
}

/* ------------------------------------------------------------------ */
/* Food-class checks                                                    */
/* ------------------------------------------------------------------ */

/** Names that cannot be (near) fat-free. Matched as whole words. */
const FATTY_NAME =
  /\b(oil|butter|ghee|lard|dripping|suet|mayonnaise|mayo|pesto|cheese|cheddar|brie|halloumi|paneer|cream|chocolate|nuts?|almonds?|walnuts?|cashews?|peanuts?|pecans?|pistachios?|hazelnuts?|seeds|tahini|avocado|coconut|bacon|sausages?|salami|chorizo|pepperoni|pastry|croissant|kiev|spring rolls?|samosa|bhaji|crisps|chips|fries|doughnut|shortbread|brownie|fudge|houmous|hummus|guacamole|egg yolk)\b/;

/** Words that make a fatty-looking name legitimately fat-free. */
const FAT_FREE_OK = /\b(fat free|fat-free|0%|virtually fat free|light|lite|quark|cream crackers?|cream of tartar|ice cream wafers?|nutritional yeast|cocoa)\b/;

type ClassBand = { name: string; test: RegExp; min?: number; max?: number; unless?: RegExp };

/** Deliberately loose bounds: anything outside is wrong, not merely unusual. */
const CLASS_BANDS: ClassBand[] = [
  { name: "cake / bake", test: /\b(cakes?|sponge|scones?|muffins?|brownies?|flapjacks?|tarts?|pies?|pasty|pastries|croissants?|brioche|buns?|teacakes?|tea cake|doughnuts?)\b/, min: 150, unless: /\b(rice cakes?|fish ?cakes?|fishcakes?|crab cakes?|potato cakes?|cottage pie|shepherds pie|fish pie|pancakes?|cheesecake)\b/ },
  { name: "biscuit / cracker", test: /\b(biscuits?|cookies?|crackers?|shortbread|digestives?|oatcakes?|hobnobs?|wafers?)\b/, min: 330, unless: /\b(prawn crackers|crackers? cheese ham snack|cheese crackers snack box)\b/ },
  { name: "chocolate / sweets", test: /\b(chocolate|fudge|toffee|nougat|truffles?|caramel bar)\b/, min: 330, unless: /\b(hot chocolate|chocolate milk|drink|cake|mousse|pudding|sauce|almonds|brazil|raisins|ice cream|powder|sachet|spread)\b/ },
  { name: "fried or pastry savoury", test: /\b(kiev|spring rolls?|samosas?|bhajis?|sausage rolls?|scotch eggs?|nuggets|pakoras?|pasty|pasties)\b/, min: 150 },
  { name: "oil / fat", test: /\b(oil|lard|ghee|dripping|suet)\b/, min: 700, unless: /\b(in oil|chilli oil crisp|tuna|sardines|mackerel|oil crisp|spray)\b/ },
  { name: "nuts / seeds", test: /\b(almonds|walnuts|cashews|peanuts|pecans|pistachios|hazelnuts|brazil nuts|macadamia|sunflower seeds|pumpkin seeds|sesame seeds|chia seeds|flaxseeds?|linseeds?)\b/, min: 450, unless: /\b(milk|drink|chocolate|yoghurt|raisins)\b/ },
  { name: "fresh vegetable", test: /\b(broccoli|spinach|cabbage|kale|carrots?|courgettes?|cauliflower|celery|cucumber|lettuce|peppers?|tomato(es)?|onions?|leeks?|mushrooms?|aubergine|asparagus|radish|turnip|swede|celeriac|kohlrabi|fennel bulb|watercress|chard|pak choi|spring greens|mange tout|sugar snap peas|green beans|fine beans|runner beans|baby corn|beansprouts|bean sprouts)\b/, max: 120, unless: /\b(soup|sauce|ketchup|puree|paste|sun dried|dried|crisps|rings|bhaji|quiche|chutney|pickle|powder|flakes|stuffed|pizza|fried|roast|juice|chips|cheese|pasty|gravy|granules|black pepper|peppercorns|seasoning)\b/ },
  { name: "fresh fruit", test: /\b(apples?|pears?|oranges?|bananas?|berries|strawberries|raspberries|blueberries|blackberries|cherries|grapes|plums?|peach(es)?|nectarines?|apricots?|melon|mango|pineapple|kiwi|rhubarb|gooseberries|currants|redcurrants|blackcurrants)\b/, max: 120, unless: /\b(dried|juice|jam|sauce|pie|crumble|tart|cake|chips|yoghurt|drink|smoothie|concentrate|crisps|cordial|squash|raisins|sultanas|bar|lassi|sorbet|ice|loaf|bun|scone|chocolate|muffin|pastilles|gums|tea|vinegar|chutney|curd|cider|currants$)\b/ },
  { name: "drink", test: /\b(juice|cola|lemonade|squash|tonic|sparkling water|water|tea|coffee|smoothie|drink|kefir milk)\b/, max: 110, unless: /\b(concentrate|powder|granules|sachet|bags?|pods|instant|cordial|tea cake|teacake|tea biscuit|chestnuts?|watercress|watermelon|water biscuits?|biscuit|ground|latte|chai|spinach|tin)\b/ },
  { name: "tinned / jarred vegetable", test: /\b(tin|canned|jar)\b/, max: 150, unless: /\b(fish|tuna|sardines?|mackerel|salmon|beef|corned|ham|spam|meat|hot dog|chicken|chilli|pudding|custard|fruit|syrup|sauce|pesto|curry|paste|jam|honey|spread|butter|mayonnaise|olives|ravioli|macaroni|spaghetti|beans|lentils|chickpeas|soup|treacle|peanut|nut|dumpling|tomatoes? jar|sun dried|antipasti|artichoke|goose fat|refried|coconut)\b/ },
];

export type Flag = { check: string; detail: string };

export function classFlags(entry: NutritionLookupEntry): Flag[] {
  const name = entry.name.toLowerCase();
  const p = entry.per_100g;
  const flags: Flag[] = [];
  for (const band of CLASS_BANDS) {
    if (!band.test.test(name)) continue;
    if (band.unless?.test(name)) continue;
    if (band.min != null && p.calories < band.min) {
      flags.push({ check: "class", detail: `${band.name} at ${p.calories} kcal (expected ≥ ${band.min})` });
    }
    if (band.max != null && p.calories > band.max) {
      flags.push({ check: "class", detail: `${band.name} at ${p.calories} kcal (expected ≤ ${band.max})` });
    }
  }
  if (p.fat_g < 0.5 && FATTY_NAME.test(name) && !FAT_FREE_OK.test(name)) {
    flags.push({ check: "zero-fat", detail: `${p.fat_g} g fat for a food that has fat` });
  }
  if (p.sugar_g > p.carbs_g + 0.5) {
    flags.push({ check: "impossible", detail: `sugar ${p.sugar_g} g > carbohydrate ${p.carbs_g} g` });
  }
  if (p.saturated_fat_g > p.fat_g + 0.05) {
    flags.push({ check: "impossible", detail: `saturated fat ${p.saturated_fat_g} g > fat ${p.fat_g} g` });
  }
  return flags;
}

/* ------------------------------------------------------------------ */
/* Template clusters                                                    */
/* ------------------------------------------------------------------ */

function round(n: number, dp = 1): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

/**
 * Rows that look generated rather than sourced. `rows` must be in file order.
 *  - same-profile: ≥ 4 differently named rows with identical protein, carbs,
 *    fat and fibre (e.g. ten meats all 22 / 0 / 6).
 *  - sodium ladder: ≥ 4 consecutive rows whose sodium climbs by one fixed step
 *    (cereals at 350, 363, 376 … mg).
 *  - repeated default: a saturated-fat value of ≥ 1 g shared by ≥ 20 rows.
 */
export function templateClusters(rows: NutritionLookupEntry[]): Map<string, string[]> {
  const out = new Map<string, string[]>();
  const add = (name: string, why: string) => {
    const list = out.get(name) ?? [];
    if (!list.includes(why)) list.push(why);
    out.set(name, list);
  };

  const byProfile = new Map<string, NutritionLookupEntry[]>();
  for (const r of rows) {
    const p = r.per_100g;
    const key = [p.protein_g, p.carbs_g, p.fat_g, p.fibre_g].map((n) => round(n)).join("/");
    if (key === "0/0/0/0") continue;
    byProfile.set(key, [...(byProfile.get(key) ?? []), r]);
  }
  for (const [key, group] of byProfile) {
    if (group.length >= 4) for (const r of group) add(r.name, `same-profile ${key} (${group.length} rows)`);
  }

  const sodiumStep = (i: number) => round(rows[i + 1].per_100g.sodium_mg - rows[i].per_100g.sodium_mg);
  for (let i = 0; i < rows.length - 1; ) {
    const step = sodiumStep(i);
    if (Math.abs(step) < 5) {
      i += 1;
      continue;
    }
    let end = i + 1;
    while (end + 1 < rows.length && sodiumStep(end) === step) end += 1;
    const len = end - i + 1;
    if (len >= 4) {
      for (let j = i; j <= end; j += 1) add(rows[j].name, `sodium ladder +${step} mg (${len} rows)`);
    }
    i = end;
  }

  const bySat = new Map<number, NutritionLookupEntry[]>();
  for (const r of rows) {
    const s = round(r.per_100g.saturated_fat_g, 2);
    if (s < 1) continue;
    bySat.set(s, [...(bySat.get(s) ?? []), r]);
  }
  for (const [sat, group] of bySat) {
    if (group.length >= 20) for (const r of group) add(r.name, `saturated fat ${sat} g shared by ${group.length} rows`);
  }
  return out;
}
