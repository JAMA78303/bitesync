import { formatPantryAmount, toBasePantryAmount } from "@/lib/pantry/units";

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}
const eq = (a: unknown, b: unknown, msg: string) => assert(JSON.stringify(a) === JSON.stringify(b), `${msg}: got ${JSON.stringify(a)}`);

// The grocery list subtracts on an exact unit match, so kg and litres must land as g and ml.
eq(toBasePantryAmount(1, "kg"), { quantity: 1000, unit: "g" }, "1 kg → 1000 g");
eq(toBasePantryAmount(1.5, "kg"), { quantity: 1500, unit: "g" }, "1.5 kg → 1500 g");
eq(toBasePantryAmount(2, "l"), { quantity: 2000, unit: "ml" }, "2 l → 2000 ml");
eq(toBasePantryAmount(500, "g"), { quantity: 500, unit: "g" }, "500 g stays");
eq(toBasePantryAmount(6, ""), { quantity: 6, unit: "piece" }, "bare count → pieces");
eq(toBasePantryAmount(6, "each"), { quantity: 6, unit: "piece" }, "each → pieces");
eq(toBasePantryAmount(2, "tins"), { quantity: 2, unit: "tins" }, "unknown unit kept as typed");
assert(toBasePantryAmount(0, "g") === null && toBasePantryAmount(-1, "g") === null, "non-positive rejected");

eq(formatPantryAmount(1000, "g"), "1 kg", "1000 g shows as kg");
eq(formatPantryAmount(750, "g"), "750 g", "750 g stays in g");
eq(formatPantryAmount(1, "piece"), "1 piece", "singular piece");
eq(formatPantryAmount(6, "piece"), "6 pieces", "plural pieces");

console.log("units.test.ts: all assertions passed");
