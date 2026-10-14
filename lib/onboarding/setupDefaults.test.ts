import {
  CALCULATOR_PREFILL_KEY,
  CALCULATOR_PREFILL_MAX_AGE_MS,
  clearCalculatorPrefill,
  readCalculatorPrefill,
  saveCalculatorPrefill,
  unitsForLocale,
} from "./setupDefaults";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

function memoryStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    raw: m,
  };
}

// Units
assert(JSON.stringify(unitsForLocale("en-US")) === JSON.stringify({ weight: "lb", height: "ft_in" }), "en-US → lb/ft");
assert(JSON.stringify(unitsForLocale("es_US")) === JSON.stringify({ weight: "lb", height: "ft_in" }), "es_US → lb/ft");
assert(unitsForLocale("en-GB").weight === "kg" && unitsForLocale("en-GB").height === "cm", "en-GB → kg/cm");
assert(unitsForLocale("de").weight === "kg", "no region → kg");
assert(unitsForLocale(undefined).weight === "kg", "unknown → kg");

// Prefill round trip
const values = { weightKg: 65, heightCm: 165, age: 30, sex: "female" as const, activityLevel: "moderate" as const, goal: "lose" as const };
const s = memoryStorage();
saveCalculatorPrefill(s, { values, units: "imperial" }, 1_000);
const back = readCalculatorPrefill(s, 2_000);
assert(back !== null && back.values.weightKg === 65 && back.units === "imperial", "prefill round trip");

// Expired → null and removed
assert(readCalculatorPrefill(s, 1_000 + CALCULATOR_PREFILL_MAX_AGE_MS + 1) === null, "expired prefill ignored");
assert(!s.raw.has(CALCULATOR_PREFILL_KEY), "expired prefill removed");

// Invalid values → null
const bad = memoryStorage();
bad.setItem(CALCULATOR_PREFILL_KEY, JSON.stringify({ values: { ...values, age: 12 }, units: "metric", savedAt: 1 }));
assert(readCalculatorPrefill(bad, 2) === null, "under-16 prefill rejected");
bad.setItem(CALCULATOR_PREFILL_KEY, "{not json");
assert(readCalculatorPrefill(bad, 2) === null, "corrupt prefill ignored");

// Clear
const c = memoryStorage();
saveCalculatorPrefill(c, { values, units: "metric" });
clearCalculatorPrefill(c);
assert(readCalculatorPrefill(c) === null, "cleared");

// Storage that throws (private mode)
const throwing = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); }, removeItem: () => { throw new Error("blocked"); } };
saveCalculatorPrefill(throwing, { values, units: "metric" });
assert(readCalculatorPrefill(throwing) === null, "blocked storage is harmless");

console.log("setupDefaults tests passed");
