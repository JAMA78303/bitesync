"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PLAN_MY_WEEK_CTA } from "@/components/calculator/cta";
import {
  calculateMacros,
  cmToFtIn,
  ftInToCm,
  kgToLb,
  lbToKg,
  parseCalculatorInput,
} from "@/lib/calculator/macroCalculator";
import { saveCalculatorPrefill } from "@/lib/onboarding/setupDefaults";
import { ds } from "@/lib/ui/classes";
import {
  ACTIVITY_OPTIONS,
  GOAL_OPTIONS,
  getMinimumCalories,
  type ActivityLevel,
  type Goal,
  type Sex,
} from "@/lib/utils/tdee";

type Units = "metric" | "imperial";

const num = (v: string) => (v.trim() === "" ? undefined : Number(v));

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | null;
  options: readonly { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex gap-2">
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={`min-h-11 flex-1 rounded-xl border px-3 text-sm font-semibold transition-colors ${
              on
                ? "border-[var(--btn-primary-bg)] bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]"
                : "border-[var(--border-default)] bg-[var(--surface-input)] text-[var(--text-secondary)] hover:border-[var(--brand-action)]"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string | null; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <span className={ds.label}>{label}</span>
      {children}
      {error ? (
        <p className={`text-xs ${ds.errorText}`}>{error}</p>
      ) : hint ? (
        <p className="text-xs text-[var(--text-muted)]">{hint}</p>
      ) : null}
    </div>
  );
}

function rangeError(value: number | undefined, min: number, max: number, message: string): string | null {
  if (value === undefined || Number.isNaN(value)) return null;
  return value < min || value > max ? message : null;
}

export function MacroCalculator() {
  const [units, setUnits] = useState<Units>("metric");
  const [sex, setSex] = useState<Sex | null>(null);
  const [age, setAge] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [weight, setWeight] = useState("");
  const [activity, setActivity] = useState<ActivityLevel | "">("");
  const [goal, setGoal] = useState<Goal | null>(null);

  const weightKg = useMemo(() => {
    const w = num(weight);
    if (w === undefined) return undefined;
    return units === "metric" ? w : lbToKg(w);
  }, [weight, units]);

  const heightInCm = useMemo(() => {
    if (units === "metric") return num(heightCm);
    const ft = num(heightFt);
    if (ft === undefined) return undefined;
    return ftInToCm(ft, num(heightIn) ?? 0);
  }, [units, heightCm, heightFt, heightIn]);

  const input = parseCalculatorInput({
    weightKg,
    heightCm: heightInCm,
    age: num(age),
    sex: sex ?? undefined,
    activityLevel: activity || undefined,
    goal: goal ?? undefined,
  });
  const result = input ? calculateMacros(input) : null;

  const ageError = rangeError(num(age), 16, 100, "This calculator is for ages 16 to 100.");
  const weightError = rangeError(
    weightKg,
    30,
    300,
    units === "metric" ? "Enter a weight between 30 and 300 kg." : "Enter a weight between 66 and 661 lb.",
  );
  const heightError = rangeError(
    heightInCm,
    100,
    250,
    units === "metric" ? "Enter a height between 100 and 250 cm." : "Enter a height between 3 ft 4 in and 8 ft 2 in.",
  );

  // Switching units converts what's already entered, so 65 kg doesn't become 65 lb.
  function switchUnits(next: Units) {
    if (next === units) return;
    const w = num(weight);
    const hasWeight = w !== undefined && !Number.isNaN(w);
    const hasHeight = heightInCm !== undefined && !Number.isNaN(heightInCm);
    if (next === "imperial") {
      if (hasWeight) setWeight(String(Math.round(kgToLb(w))));
      if (hasHeight) {
        const { feet, inches } = cmToFtIn(heightInCm);
        setHeightFt(String(feet));
        setHeightIn(String(inches));
      }
    } else {
      if (hasWeight) setWeight(String(Math.round(lbToKg(w) * 10) / 10));
      if (hasHeight) setHeightCm(String(Math.round(heightInCm)));
    }
    setUnits(next);
  }

  const pct = (g: number, kcalPerG: number) => (result ? Math.round(((g * kcalPerG) / result.calories) * 100) : 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-start">
      <form className={ds.formCard} onSubmit={(e) => e.preventDefault()} aria-label="Your details">
        <Field label="Units">
          <Segmented
            label="Units"
            value={units}
            onChange={switchUnits}
            options={[
              { value: "metric", label: "kg / cm" },
              { value: "imperial", label: "lb / ft" },
            ]}
          />
        </Field>

        <Field label="Sex" hint="The calorie equation differs slightly by sex.">
          <Segmented
            label="Sex"
            value={sex}
            onChange={setSex}
            options={[
              { value: "female", label: "Female" },
              { value: "male", label: "Male" },
            ]}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Age" error={ageError}>
            <input
              className={ds.input}
              inputMode="numeric"
              aria-label="Age in years"
              placeholder="Years"
              value={age}
              onChange={(e) => setAge(e.target.value.replace(/[^\d]/g, ""))}
            />
          </Field>
          <Field label="Weight" error={weightError}>
            <input
              className={ds.input}
              inputMode="decimal"
              aria-label={units === "metric" ? "Weight in kilograms" : "Weight in pounds"}
              placeholder={units === "metric" ? "kg" : "lb"}
              value={weight}
              onChange={(e) => setWeight(e.target.value.replace(/[^\d.]/g, ""))}
            />
          </Field>
        </div>

        <Field label="Height" error={heightError}>
          {units === "metric" ? (
            <input
              className={ds.input}
              inputMode="decimal"
              aria-label="Height in centimetres"
              placeholder="cm"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value.replace(/[^\d.]/g, ""))}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <input
                className={ds.input}
                inputMode="numeric"
                aria-label="Height, feet"
                placeholder="ft"
                value={heightFt}
                onChange={(e) => setHeightFt(e.target.value.replace(/[^\d]/g, ""))}
              />
              <input
                className={ds.input}
                inputMode="numeric"
                aria-label="Height, inches"
                placeholder="in"
                value={heightIn}
                onChange={(e) => setHeightIn(e.target.value.replace(/[^\d.]/g, ""))}
              />
            </div>
          )}
        </Field>

        <Field label="Activity">
          <select
            className={ds.input}
            aria-label="Activity level"
            value={activity}
            onChange={(e) => setActivity(e.target.value as ActivityLevel | "")}
          >
            <option value="">Choose how active you are…</option>
            {ACTIVITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label} — {o.description}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Goal">
          <Segmented
            label="Goal"
            value={goal}
            onChange={setGoal}
            options={GOAL_OPTIONS.map((o) => ({ value: o.value, label: o.label.replace(" weight", "") }))}
          />
        </Field>
      </form>

      <section
        aria-live="polite"
        aria-label="Your daily targets"
        className={`${ds.card} p-5 sm:p-6 lg:sticky lg:top-6`}
      >
        {result ? (
          <>
            <span className={ds.sectionKicker}>Your daily targets</span>
            <p className="font-display text-5xl font-extrabold tabular-nums tracking-[-0.04em] text-[var(--text-primary)]">
              {result.calories.toLocaleString("en-GB")}
              <span className="ml-2 text-lg font-semibold tracking-normal text-[var(--text-muted)]">kcal a day</span>
            </p>
            {result.effectiveGoal !== "maintain" ? (
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Maintenance: {result.maintenance.toLocaleString("en-GB")} kcal a day
              </p>
            ) : null}

            <dl className="mt-5 grid grid-cols-2 gap-3">
              {[
                { label: "Protein", grams: result.protein, share: pct(result.protein, 4) },
                { label: "Carbs", grams: result.carbs, share: pct(result.carbs, 4) },
                { label: "Fat", grams: result.fat, share: pct(result.fat, 9) },
                { label: "Fibre", grams: result.fibre, share: null },
              ].map((m) => (
                <div key={m.label} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-3">
                  <dt className={ds.statLabel}>{m.label}</dt>
                  <dd className={ds.statValue}>
                    {m.grams}
                    <span className={`ml-0.5 ${ds.statUnit}`}>g</span>
                  </dd>
                  <dd className="text-xs text-[var(--text-muted)]">
                    {m.share === null ? "a day" : `${m.share}% of calories`}
                  </dd>
                </div>
              ))}
            </dl>

            {result.adjustedFor === "underweight" ? (
              <p className={`mt-4 rounded-xl px-3 py-2 text-sm ${ds.warnCallout}`}>
                Your BMI is {result.bmi}, which is under 18.5, so these are maintenance targets rather than weight
                loss. If you want to lose weight, please talk to your GP or a dietitian first.
              </p>
            ) : result.adjustedFor === "minimum_calories" && input ? (
              <p className={`mt-4 rounded-xl px-3 py-2 text-sm ${ds.warnCallout}`}>
                We&apos;ve raised this to {getMinimumCalories(input.sex).toLocaleString("en-GB")} kcal, the lowest we
                recommend without medical supervision.
              </p>
            ) : null}

            <div className="mt-6 rounded-2xl bg-[var(--surface-muted)] p-4">
              <p className="font-display text-base font-bold text-[var(--text-primary)]">
                Now plan a week that hits these numbers
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                BiteSync sets these same targets for you, plans your meals to hit them before you shop, and turns the
                week into one grocery list.
              </p>
              <Link
                href="/signup"
                // Kept in this browser only, so setup can start with these answers
                // filled in. Nothing is sent anywhere (see the page's FAQ).
                onClick={() => {
                  if (input) saveCalculatorPrefill(window.localStorage, { values: input, units });
                }}
                className={`${ds.primaryBtn} mt-3 w-full gap-2`}
              >
                {PLAN_MY_WEEK_CTA}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </>
        ) : (
          <div className="py-6 text-center">
            <span className={ds.sectionKicker}>Your daily targets</span>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Fill in your details to see your daily calories, protein, carbs and fat.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
