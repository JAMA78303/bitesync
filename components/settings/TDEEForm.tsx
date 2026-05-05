"use client";

import { useState, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Calculator, Info, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { saveTDEEProfile } from "@/lib/supabase/profile";
import {
  cmToFtIn,
  cmToM,
  ftInToCm,
  kgToLb,
  kgToStLb,
  lbToKg,
  mToCm,
  stLbToKg,
} from "@/lib/utils/body-measures";
import {
  ACTIVITY_OPTIONS,
  GOAL_OPTIONS,
  calculateBMI,
  calculateNutritionTargetsWithSafety,
  getBMICategory,
  getBMIColour,
  getBMILabel,
  getMinimumCalories,
  isSafeToLoseWeight,
  tdeeSchema,
  type TDEEFormValues,
  type TDEEResult,
} from "@/lib/utils/tdee";

type WeightUnit = "kg" | "lb" | "st_lb";
type HeightUnit = "cm" | "m" | "ft_in";

type Props = {
  defaultValues?: Partial<TDEEFormValues>;
};

export function TDEEForm({ defaultValues }: Props) {
  const [isPending, startTransition] = useTransition();
  const [preview, setPreview] = useState<(TDEEResult & { bmi: number; rawDailyCalories: number }) | null>(null);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [heightUnit, setHeightUnit] = useState<HeightUnit>("cm");
  const [stStr, setStStr] = useState("");
  const [lbStr, setLbStr] = useState("");
  const [ftStr, setFtStr] = useState("");
  const [inStr, setInStr] = useState("");
  const { toast } = useToast();

  const form = useForm<TDEEFormValues>({
    resolver: zodResolver(tdeeSchema) as Resolver<TDEEFormValues>,
    defaultValues,
    mode: "onBlur",
  });

  const weightKg = form.watch("weightKg");
  const heightCm = form.watch("heightCm");
  const goal = form.watch("goal");
  const sex = form.watch("sex");

  function onWeightUnitChange(next: WeightUnit) {
    const kg = Number(form.getValues("weightKg"));
    setWeightUnit(next);
    if (next === "st_lb" && Number.isFinite(kg) && kg > 0) {
      const { st, lb } = kgToStLb(kg);
      setStStr(String(st));
      setLbStr(lb % 1 === 0 ? String(lb) : String(Math.round(lb * 10) / 10));
    }
  }

  function onHeightUnitChange(next: HeightUnit) {
    const cm = Number(form.getValues("heightCm"));
    setHeightUnit(next);
    if (next === "ft_in" && Number.isFinite(cm) && cm > 0) {
      const { ft, inch } = cmToFtIn(cm);
      setFtStr(String(ft));
      setInStr(inch % 1 === 0 ? String(inch) : String(Math.round(inch * 10) / 10));
    }
  }

  function updatePreview() {
    const parsed = tdeeSchema.safeParse(form.getValues());
    if (!parsed.success) {
      setPreview(null);
      return;
    }
    const safe = calculateNutritionTargetsWithSafety(parsed.data);
    const { result } = safe;
    setPreview({
      ...result,
      bmi: safe.bmi,
      rawDailyCalories: safe.rawDailyCalories,
    });
  }

  function onSubmit(values: TDEEFormValues) {
    startTransition(async () => {
      const result = await saveTDEEProfile(values);
      if (result && "error" in result) {
        toast({ title: "Failed to save", description: result.error, variant: "destructive" });
        return;
      }
      if (result?.targets) {
        const parsed = tdeeSchema.safeParse(values);
        const rawCal =
          parsed.success ? calculateNutritionTargetsWithSafety(parsed.data).rawDailyCalories : result.targets.dailyCalories;
        setPreview({
          bmr: result.targets.bmr,
          tdee: result.targets.tdee,
          dailyCalories: result.targets.dailyCalories,
          dailyProtein: result.targets.dailyProtein,
          bmi: result.targets.bmi,
          rawDailyCalories: rawCal,
        });
      }
      const desc =
        result?.overrideApplied && result.overrideReason === "underweight"
          ? "Goal saved as maintain — weight loss is not recommended below BMI 18.5."
          : result?.overrideApplied && result.overrideReason === "minimum_calories"
            ? `Calorie target raised to at least ${getMinimumCalories(values.sex)} kcal/day for safety.`
            : `${result?.targets?.dailyCalories} kcal · ${result?.targets?.dailyProtein}g protein per day`;

      toast({
        title: result?.overrideApplied ? "Targets saved (safety adjusted)" : "Targets saved",
        description: desc,
      });
    });
  }

  const bmiPreview =
    weightKg && heightCm ? calculateBMI(Number(weightKg), Number(heightCm)) : null;
  const bmiCategory = bmiPreview != null && bmiPreview > 0 ? getBMICategory(bmiPreview) : null;
  const showLoseSafety =
    weightKg && heightCm && sex && goal === "lose" && bmiPreview != null && bmiPreview > 0;
  const minCal = sex === "male" || sex === "female" ? getMinimumCalories(sex) : null;
  const floorHit =
    preview &&
    minCal != null &&
    preview.rawDailyCalories < minCal &&
    preview.dailyCalories >= minCal;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} onChange={updatePreview} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Weight</label>
          <select
            value={weightUnit}
            onChange={(e) => onWeightUnitChange(e.target.value as WeightUnit)}
            className="theme-aware-select h-10 w-full rounded-md border border-gray-300 px-3 text-sm"
          >
            <option value="kg">Kilograms (kg)</option>
            <option value="lb">Pounds (lb)</option>
            <option value="st_lb">Stones + pounds</option>
          </select>
          {weightUnit === "kg" ? (
            <>
              <Input
                {...form.register("weightKg")}
                type="number"
                placeholder="75"
                min="30"
                max="300"
                step="0.1"
                onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
              />
              <p className="text-[11px] text-slate-500">Stored internally as kg for TDEE.</p>
            </>
          ) : weightUnit === "lb" ? (
            <>
              <Input
                type="number"
                placeholder="165"
                min={66}
                max={661}
                step="0.1"
                value={
                  Number.isFinite(Number(weightKg)) && Number(weightKg) >= 30
                    ? Math.round(kgToLb(Number(weightKg)) * 10) / 10
                    : ""
                }
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "") return;
                  const lb = Number.parseFloat(raw);
                  if (Number.isFinite(lb)) {
                    form.setValue("weightKg", lbToKg(lb), { shouldValidate: true, shouldDirty: true });
                  }
                }}
                onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
              />
              <p className="text-[11px] text-slate-500">1 lb ≈ 0.454 kg</p>
            </>
          ) : (
            <>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-slate-500">Stones</label>
                  <Input
                    type="number"
                    placeholder="12"
                    min={4}
                    max={47}
                    step={1}
                    value={stStr}
                    onChange={(e) => {
                      const v = e.target.value;
                      setStStr(v);
                      const st = Number.parseFloat(v);
                      const lb = Number.parseFloat(lbStr) || 0;
                      if (Number.isFinite(st)) {
                        form.setValue("weightKg", stLbToKg(st, lb), { shouldValidate: true, shouldDirty: true });
                      }
                    }}
                    onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-slate-500">Pounds</label>
                  <Input
                    type="number"
                    placeholder="4"
                    min={0}
                    max={13.99}
                    step={0.1}
                    value={lbStr}
                    onChange={(e) => {
                      const v = e.target.value;
                      setLbStr(v);
                      const lb = Number.parseFloat(v);
                      const st = Number.parseFloat(stStr) || 0;
                      if (Number.isFinite(lb)) {
                        form.setValue("weightKg", stLbToKg(st, lb), { shouldValidate: true, shouldDirty: true });
                      }
                    }}
                    onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500">14 lb = 1 stone</p>
            </>
          )}
          {form.formState.errors.weightKg ? (
            <p className="mt-1 text-xs text-red-500">{form.formState.errors.weightKg.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Height</label>
          <select
            value={heightUnit}
            onChange={(e) => onHeightUnitChange(e.target.value as HeightUnit)}
            className="theme-aware-select h-10 w-full rounded-md border border-gray-300 px-3 text-sm"
          >
            <option value="cm">Centimetres (cm)</option>
            <option value="m">Metres (m)</option>
            <option value="ft_in">Feet + inches</option>
          </select>
          {heightUnit === "cm" ? (
            <>
              <Input
                {...form.register("heightCm")}
                type="number"
                placeholder="175"
                min="100"
                max="250"
                step={1}
                onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
              />
              <p className="text-[11px] text-slate-500">Stored internally as cm for TDEE.</p>
            </>
          ) : heightUnit === "m" ? (
            <>
              <Input
                type="number"
                placeholder="1.75"
                min={1}
                max={2.5}
                step={0.01}
                value={
                  Number.isFinite(Number(heightCm)) && Number(heightCm) >= 100
                    ? cmToM(Number(heightCm))
                    : ""
                }
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "") return;
                  const m = Number.parseFloat(raw);
                  if (Number.isFinite(m)) {
                    form.setValue("heightCm", mToCm(m), { shouldValidate: true, shouldDirty: true });
                  }
                }}
                onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
              />
              <p className="text-[11px] text-slate-500">1 m = 100 cm</p>
            </>
          ) : (
            <>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-slate-500">Feet</label>
                  <Input
                    type="number"
                    placeholder="5"
                    min={3}
                    max={8}
                    step={1}
                    value={ftStr}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFtStr(v);
                      const ft = Number.parseFloat(v);
                      const inch = Number.parseFloat(inStr) || 0;
                      if (Number.isFinite(ft)) {
                        form.setValue("heightCm", ftInToCm(ft, inch), { shouldValidate: true, shouldDirty: true });
                      }
                    }}
                    onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-slate-500">Inches</label>
                  <Input
                    type="number"
                    placeholder="9"
                    min={0}
                    max={11.99}
                    step={0.1}
                    value={inStr}
                    onChange={(e) => {
                      const v = e.target.value;
                      setInStr(v);
                      const inch = Number.parseFloat(v);
                      const ft = Number.parseFloat(ftStr) || 0;
                      if (Number.isFinite(inch)) {
                        form.setValue("heightCm", ftInToCm(ft, inch), { shouldValidate: true, shouldDirty: true });
                      }
                    }}
                    onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500">12 inches = 1 foot</p>
            </>
          )}
          {form.formState.errors.heightCm ? (
            <p className="mt-1 text-xs text-red-500">{form.formState.errors.heightCm.message}</p>
          ) : null}
        </div>
      </div>

      {bmiPreview != null && bmiPreview > 0 && bmiCategory ? (
        <div className={`rounded-xl border border-slate-200 p-4 ${getBMIColour(bmiCategory)}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Your BMI</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{bmiPreview}</p>
            </div>
            <ShieldCheck className="h-6 w-6 shrink-0 opacity-80" aria-hidden />
          </div>
          <p className="mt-2 text-sm font-medium">{getBMILabel(bmiCategory)}</p>
          <p className="mt-0.5 text-[11px] opacity-80">WHO classification</p>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Age</label>
          <Input
            {...form.register("age")}
            type="number"
            placeholder="28"
            min="16"
            max="100"
            onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
          />
          {form.formState.errors.age ? <p className="mt-1 text-xs text-red-500">{form.formState.errors.age.message}</p> : null}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Sex</label>
          <select
            {...form.register("sex")}
            className="theme-aware-select h-10 w-full rounded-md border border-gray-300 px-3 text-sm"
            defaultValue={defaultValues?.sex}
          >
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          {form.formState.errors.sex ? <p className="mt-1 text-xs text-red-500">{form.formState.errors.sex.message}</p> : null}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Activity level</label>
        <select
          {...form.register("activityLevel")}
          className="theme-aware-select h-10 w-full rounded-md border border-gray-300 px-3 text-sm"
          defaultValue={defaultValues?.activityLevel}
        >
          <option value="">How active are you?</option>
          {ACTIVITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {form.formState.errors.activityLevel ? (
          <p className="mt-1 text-xs text-red-500">{form.formState.errors.activityLevel.message}</p>
        ) : null}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Goal</label>
        <select
          {...form.register("goal")}
          className="theme-aware-select h-10 w-full rounded-md border border-gray-300 px-3 text-sm"
          defaultValue={defaultValues?.goal}
        >
          <option value="">What is your goal?</option>
          {GOAL_OPTIONS.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.value === "lose" && bmiPreview != null && bmiPreview > 0 && !isSafeToLoseWeight(bmiPreview)}
            >
              {option.label}
            </option>
          ))}
        </select>
        {form.formState.errors.goal ? <p className="mt-1 text-xs text-red-500">{form.formState.errors.goal.message}</p> : null}
      </div>

      {bmiPreview != null && bmiPreview > 0 && !isSafeToLoseWeight(bmiPreview) ? (
        <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <div className="space-y-1 text-sm">
            <p className="font-semibold">Weight loss not recommended</p>
            <p className="text-xs leading-relaxed opacity-95">
              Your BMI is below 18.5 (underweight per WHO). The &quot;Lose weight&quot; goal is disabled; if you save with
              another goal, we never apply a calorie deficit while you are underweight.
              Please speak to your GP or a registered dietitian for personal advice.
            </p>
            <a
              href="https://www.nhs.uk/live-well/healthy-weight/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs font-medium underline underline-offset-2"
            >
              NHS healthy weight guidance →
            </a>
          </div>
        </div>
      ) : null}

      {showLoseSafety && isSafeToLoseWeight(bmiPreview!) ? (
        <div className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/35 dark:text-emerald-50">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-300" aria-hidden />
          <div className="text-sm">
            <p className="font-semibold text-emerald-900 dark:text-emerald-100">NHS safe weight loss guideline</p>
            <p className="mt-1 text-xs leading-relaxed text-emerald-900/90 dark:text-emerald-100/90">
              We follow the NHS recommendation of up to about{" "}
              <strong>0.5 kg loss per week</strong>. A <strong>500 kcal</strong> daily deficit is applied to your calorie
              target.
            </p>
          </div>
        </div>
      ) : null}

      {floorHit && minCal != null ? (
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/35 dark:text-amber-50">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden />
          <p className="text-xs leading-relaxed">
            Your calculated target was below the minimum safe intake of <strong>{minCal} kcal/day</strong> for your sex.
            We&apos;ve set your target to <strong>{minCal} kcal</strong>. Consult your GP before going lower.
          </p>
        </div>
      ) : null}

      {preview ? (
        <div className="space-y-3 rounded-xl border border-[#6EE7B7] bg-[#F0FDF4] p-4 dark:border-emerald-900/40 dark:bg-emerald-950/30">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-[#1A4731] dark:text-emerald-300" />
            <span className="text-sm font-semibold text-[#1A4731] dark:text-emerald-100">Your estimates</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500">BMR</p>
              <p className="text-base font-semibold text-slate-700 dark:text-slate-200">{Math.round(preview.bmr)} kcal</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500">TDEE</p>
              <p className="text-base font-semibold text-slate-700 dark:text-slate-200">{preview.tdee} kcal</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500">Daily target</p>
              <p className="text-base font-semibold text-[#1A4731] dark:text-emerald-200">{preview.dailyCalories} kcal</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500">Protein target</p>
              <p className="text-base font-semibold text-[#1A4731] dark:text-emerald-200">{preview.dailyProtein} g</p>
            </div>
          </div>
        </div>
      ) : null}

      <Button type="submit" disabled={isPending} className="h-10 w-full bg-[#1A4731] text-white hover:bg-[#153928]">
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save my targets"
        )}
      </Button>
    </form>
  );
}
