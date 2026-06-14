import {
  parseIngredientLine,
  parsedIngredientToInput,
  type ParsedIngredient,
} from "@/lib/recipes/parseIngredient";

const cases: { raw: string; check: (r: ParsedIngredient) => void }[] = [
  {
    raw: "½ Tbsp Olive Oil Plus An Extra Drizzle",
    check: (r) => {
      if (r.unit !== "tbsp") throw new Error(`unit: ${r.unit}`);
      if (r.quantity !== 0.5) throw new Error(`qty: ${r.quantity}`);
      if (!r.name.includes("olive oil")) throw new Error(`name: ${r.name}`);
      if (r.grams == null || r.grams > 10) throw new Error(`grams: ${r.grams}`);
      if (r.name.includes("piece")) throw new Error("name contains piece");
    },
  },
  {
    raw: "Garlic Clove Grated",
    check: (r) => {
      if (r.unit !== "clove") throw new Error(`unit: ${r.unit}`);
      if (!r.name.includes("garlic")) throw new Error(`name: ${r.name}`);
    },
  },
  {
    raw: "0.5 Small Onion Chopped",
    check: (r) => {
      if (r.unit != null) throw new Error(`unit should be null: ${r.unit}`);
      if (r.quantity !== 0.5) throw new Error(`qty: ${r.quantity}`);
      if (!r.name.includes("onion")) throw new Error(`name: ${r.name}`);
    },
  },
  {
    raw: "2 Red Peppers (about 220g)",
    check: (r) => {
      if (r.grams !== 220) throw new Error(`grams: ${r.grams}`);
      if (r.gramsSource !== "explicit") throw new Error(`source: ${r.gramsSource}`);
      if (!r.name.includes("red pepper")) throw new Error(`name: ${r.name}`);
    },
  },
  {
    raw: "3-4 Mushrooms Sliced",
    check: (r) => {
      if (r.quantity !== 3) throw new Error(`qty: ${r.quantity}`);
      if (r.name.includes("piece") || r.name.includes("-4")) throw new Error(`name: ${r.name}`);
    },
  },
];

for (const { raw, check } of cases) {
  const parsed = parseIngredientLine(raw);
  if (!parsed) throw new Error(`expected parse result for: ${raw}`);
  const input = parsedIngredientToInput(parsed);
  console.log(JSON.stringify({ raw, parsed, input }));
  check(parsed);
  if (JSON.stringify(input).includes("piece")) throw new Error("input contains piece");
}

console.log("All parser checks passed.");
