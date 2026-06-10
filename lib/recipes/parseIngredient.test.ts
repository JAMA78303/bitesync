import {
  parseIngredientLine,
  parsedIngredientToInput,
  scaleParsedIngredients,
} from "@/lib/recipes/parseIngredient";

function assertNoPieceUnit(value: unknown): void {
  if (JSON.stringify(value).includes('"piece"')) {
    throw new Error(`unexpected piece unit in ${JSON.stringify(value)}`);
  }
}

// ½ Tbsp Olive Oil Plus An Extra Drizzle → qty 0.5, unit tbsp, name olive oil, grams ≈ 7
{
  const parsed = parseIngredientLine("½ Tbsp Olive Oil Plus An Extra Drizzle");
  if (parsed.unit !== "tbsp") throw new Error(`unit: ${parsed.unit}`);
  if (parsed.quantity !== 0.5) throw new Error(`qty: ${parsed.quantity}`);
  if (!parsed.name.includes("olive oil")) throw new Error(`name: ${parsed.name}`);
  if (parsed.grams == null || parsed.grams > 10) throw new Error(`grams: ${parsed.grams}`);
  if (parsed.name.includes("piece")) throw new Error("name contains piece");
  assertNoPieceUnit(parsedIngredientToInput(parsed));
}

// Red Peppers (about 220g) → grams 220, source explicit
{
  const parsed = parseIngredientLine("Red Peppers (about 220g)");
  if (parsed.grams !== 220) throw new Error(`grams: ${parsed.grams}`);
  if (parsed.gramsSource !== "explicit") throw new Error(`source: ${parsed.gramsSource}`);
  assertNoPieceUnit(parsedIngredientToInput(parsed));
}

// 3-4 Mushrooms Sliced → qty 3, no piece -4 artifact
{
  const parsed = parseIngredientLine("3-4 Mushrooms Sliced");
  if (parsed.quantity !== 3) throw new Error(`qty: ${parsed.quantity}`);
  if (parsed.name.includes("piece") || parsed.name.includes("-4")) {
    throw new Error(`name: ${parsed.name}`);
  }
  assertNoPieceUnit(parsedIngredientToInput(parsed));
}

// 1 Garlic Clove → unit clove
{
  const parsed = parseIngredientLine("1 Garlic Clove");
  if (parsed.unit !== "clove") throw new Error(`unit: ${parsed.unit}`);
  if (!parsed.name.includes("garlic")) throw new Error(`name: ${parsed.name}`);
  assertNoPieceUnit(parsedIngredientToInput(parsed));
}

// BBC-style dual metric/imperial weights → metric grams only, clean name
{
  const chicken = parseIngredientLine("250g/9oz chicken mince");
  if (chicken.grams !== 250) throw new Error(`chicken grams: ${chicken.grams}`);
  if (chicken.gramsSource !== "explicit") throw new Error("chicken source");
  if (!chicken.name.includes("chicken mince")) throw new Error(`chicken name: ${chicken.name}`);
  if (chicken.unit != null || chicken.quantity != null) {
    throw new Error(`chicken should be weight-only: ${JSON.stringify(chicken)}`);
  }

  const ricotta = parseIngredientLine("100g/3½oz ricotta");
  if (ricotta.grams !== 100) throw new Error(`ricotta grams: ${ricotta.grams}`);
  if (!ricotta.name.includes("ricotta")) throw new Error(`ricotta name: ${ricotta.name}`);
  if (ricotta.unit === "oz") throw new Error("ricotta should not keep oz unit");
}

// Descriptive amounts
{
  const drizzle = parseIngredientLine("drizzle olive oil");
  if (drizzle.unit !== "tbsp") throw new Error(`drizzle unit: ${drizzle.unit}`);
  if (!drizzle.name.includes("olive oil")) throw new Error(`drizzle name: ${drizzle.name}`);

  const taste = parseIngredientLine("salt and freshly ground black pepper, to taste");
  if (taste.unit !== "pinch") throw new Error(`to taste unit: ${taste.unit}`);
  if (taste.quantity !== 1) throw new Error(`to taste qty: ${taste.quantity}`);
}

// Halving scaled import (2 servings → 1 person)
{
  const scaled = scaleParsedIngredients([parseIngredientLine("250g/9oz chicken mince")], 0.5);
  if (scaled[0]?.grams !== 125) throw new Error(`scaled grams: ${scaled[0]?.grams}`);
}

console.log("OK: ingredient parser regression tests passed");
