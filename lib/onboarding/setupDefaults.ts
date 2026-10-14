import { tdeeSchema, type TDEEFormValues } from "@/lib/utils/tdee";

/**
 * Small conveniences for onboarding step 1 (targets). A third of sign-ups
 * left on that screen without entering anything (Oct 2026), so it asks for
 * less: the visitor's own units by default, and anything they already typed
 * into the public macro calculator carried over.
 */

export type WeightUnit = "kg" | "lb" | "st_lb";
export type HeightUnit = "cm" | "m" | "ft_in";

/**
 * Pounds and feet for US visitors (the only large market that measures
 * bodies in them), kilograms and centimetres for everyone else. A visitor
 * can still switch.
 */
export function unitsForLocale(locale: string | null | undefined): { weight: WeightUnit; height: HeightUnit } {
  const region = (locale ?? "").split(/[-_]/)[1]?.toUpperCase();
  return region === "US" ? { weight: "lb", height: "ft_in" } : { weight: "kg", height: "cm" };
}

export const CALCULATOR_PREFILL_KEY = "bitesync:calculator-prefill";
/** Long enough to sign up and confirm; short enough not to resurface months later. */
export const CALCULATOR_PREFILL_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type CalculatorPrefill = {
  values: TDEEFormValues;
  units: "metric" | "imperial";
};

/**
 * Kept in this browser only, and only when the visitor taps "Plan my week
 * free" on the calculator, so they don't type their stats twice. Never sent
 * anywhere. Errors (private mode, storage full) are ignored.
 */
export function saveCalculatorPrefill(storage: StorageLike, prefill: CalculatorPrefill, now = Date.now()): void {
  try {
    storage.setItem(CALCULATOR_PREFILL_KEY, JSON.stringify({ ...prefill, savedAt: now }));
  } catch {
    // Storage unavailable: setup just starts empty.
  }
}

/** The saved calculator answers if present, valid and recent; otherwise null. */
export function readCalculatorPrefill(storage: StorageLike, now = Date.now()): CalculatorPrefill | null {
  try {
    const raw = storage.getItem(CALCULATOR_PREFILL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { values?: unknown; units?: unknown; savedAt?: unknown };
    if (typeof parsed.savedAt !== "number" || now - parsed.savedAt > CALCULATOR_PREFILL_MAX_AGE_MS) {
      storage.removeItem(CALCULATOR_PREFILL_KEY);
      return null;
    }
    const values = tdeeSchema.safeParse(parsed.values);
    if (!values.success) return null;
    return { values: values.data, units: parsed.units === "imperial" ? "imperial" : "metric" };
  } catch {
    return null;
  }
}

/** Forget the calculator answers once they've been used to save targets. */
export function clearCalculatorPrefill(storage: StorageLike): void {
  try {
    storage.removeItem(CALCULATOR_PREFILL_KEY);
  } catch {
    // Nothing to do.
  }
}
