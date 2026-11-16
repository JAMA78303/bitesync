/**
 * Volume units for foods far from water's density. Every cup used to be 240 g,
 * so "1 cup dry oats" was costed at 240 g (King Arthur Baking's chart: 89 g).
 */
import { gramsPerCup, toGrams } from "@/lib/nutrition/convert";

function assert(condition: boolean, label: string): void {
  if (!condition) throw new Error(label);
}

const near = (a: number | null, b: number) => a != null && Math.abs(a - b) < 0.01;

for (const [qty, unit, name, grams] of [
  // The recipe that found it: Protein Pancakes.
  [1, "cup", "Dry Oats", 89],
  [1, "cup", "Cottage Cheese", 226],
  [1, "cup", "Egg Whites", 240],
  // Flour, sugar, cocoa: the baking staples US recipes measure by the cup.
  [1, "cup", "plain flour", 120],
  [1, "cup", "All-purpose flour, sifted", 120],
  [2, "cup", "self-raising flour", 226],
  [1, "cup", "wholemeal flour", 113],
  [1, "cup", "almond flour", 96],
  [1, "cup", "granulated sugar", 198],
  [1, "cup", "light brown sugar (packed)", 213],
  [1, "cup", "icing sugar", 113],
  [2, "tbsp", "cocoa powder", 10.5],
  [1, "tbsp", "plain flour", 7.5],
  // Dense syrups weigh more than water.
  [1, "tbsp", "honey", 21],
  [0.5, "cup", "maple syrup", 156],
  [2, "tbsp", "peanut butter", 33.75],
  // Grains, nuts, seeds, cheese.
  [1, "cup", "basmati rice", 198],
  [1, "cup", "quinoa", 177],
  [1, "cup", "rolled oats", 89],
  [1, "cup", "chopped walnuts", 113],
  [0.25, "cup", "chia seeds", 37],
  [0.5, "cup", "grated parmesan", 50],
  [1, "cup", "grated cheddar", 113],
  [1, "cup", "panko breadcrumbs", 50],
  [3, "tsp", "chia seeds", 9.25],
  // UK sugars and syrups, and grains and pulses the first chart pass missed.
  [1, "cup", "caster sugar", 190],
  [1, "cup", "golden caster sugar", 190],
  [1, "cup", "demerara sugar", 220],
  [1, "tbsp", "golden syrup", 21],
  [0.5, "cup", "corn syrup", 156],
  [1, "cup", "couscous", 173],
  [1, "cup", "dried red lentils", 192],
  [1, "cup", "dry green lentils", 192],
  [1, "cup", "lentils", 198],
  [1, "cup", "red lentils", 198],
  [1, "cup", "pearl barley", 213],
  [0.5, "cup", "millet", 103],
  [1, "cup", "polenta", 163],
  [1, "cup", "semolina", 163],
  // Unlisted foods and liquids keep water's density.
  [1, "cup", "milk", 240],
  [1, "cup", "water", 240],
  [1, "cup", "cooked rice", 240],
  [1, "cup", "butter beans", 240],
  [1, "cup", "buttermilk", 240],
  [100, "ml", "milk", 100],
  // Existing rules still hold where no cup weight applies.
  [1, "tbsp", "olive oil", 13.5],
  [1, "tsp", "ground cumin", 2],
  [1, "tbsp", "tomato purée", 16],
  // Mass units never use cup weights.
  [100, "g", "plain flour", 100],
  [1, "oz", "rolled oats", 28.35],
] as const) {
  const got = toGrams(qty, unit, name);
  assert(near(got, grams), `${qty} ${unit} ${name}: ${got} g, expected ${grams}`);
}

for (const name of ["peanuts", "cocoa butter", "peanut", "brown rice", "oatmeal cookies", "rice noodles", "flour tortilla", "giant couscous", "lentil soup", "caster sugar syrup"]) {
  const perCup = gramsPerCup(name);
  if (name === "peanuts") assert(perCup === 142, "peanuts are listed");
  else assert(perCup === null, `${name} is not in the cup table (got ${perCup})`);
}

console.log("cupWeights.test.ts: volume units by food");
