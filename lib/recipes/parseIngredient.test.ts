import {
  parseIngredientLine,
  parsedIngredientToInput,
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

console.log("OK: ingredient parser regression tests passed");
