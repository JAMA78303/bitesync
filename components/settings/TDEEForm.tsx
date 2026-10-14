"use client";

import { useState, useTransition, useEffect, type ReactNode } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Calculator, Info, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ds } from "@/lib/ui/classes";
import { useToast } from "@/components/ui/use-toast";
import { saveTDEEProfile } from "@/lib/supabase/profile-actions";
import {
 clearCalculatorPrefill,
 readCalculatorPrefill,
 unitsForLocale,
 type HeightUnit,
 type WeightUnit,
} from "@/lib/onboarding/setupDefaults";
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

type Props = {
 defaultValues?: Partial<TDEEFormValues>;
 /** First-run onboarding — allows free users to set targets once. */
 onboardingMode?: boolean;
 onSaved?: () => void;
 /**
 * Onboarding only: rendered just above the submit button (the optional
 * dietary-needs chips), so the one call to action stays at the bottom.
 */
 beforeSubmit?: ReactNode;
};

export function TDEEForm({ defaultValues, onboardingMode = false, onSaved, beforeSubmit }: Props) {
 const [isPending, startTransition] = useTransition();
 const [preview, setPreview] = useState<(TDEEResult & { bmi: number; rawDailyCalories: number }) | null>(null);
 const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
 const [heightUnit, setHeightUnit] = useState<HeightUnit>("cm");
 const [stStr, setStStr] = useState("");
 const [lbStr, setLbStr] = useState("");
 const [ftStr, setFtStr] = useState("");
 const [inStr, setInStr] = useState("");
 // Pounds-only and metres held as raw strings for the same reason stones and
 // feet are: deriving the field's value from the stored kg/cm fights the typist.
 // Every keystroke round-trips through the canonical number, so "1" in pounds
 // became 0.45 kg, failed the >= 30 guard and blanked the field, and "1." in
 // metres parsed to 1 and lost the decimal point before "1.75" could be typed.
 const [lbOnlyStr, setLbOnlyStr] = useState("");
 const [mStr, setMStr] = useState("");
 const { toast } = useToast();

 const form = useForm<TDEEFormValues>({
 resolver: zodResolver(tdeeSchema) as Resolver<TDEEFormValues>,
 defaultValues,
 mode:"onBlur",
 });

 const weightKg = form.watch("weightKg");
 const heightCm = form.watch("heightCm");
 const goal = form.watch("goal");
 const sex = form.watch("sex");

 function onWeightUnitChange(next: WeightUnit) {
 const kg = Number(form.getValues("weightKg"));
 setWeightUnit(next);
 if (next ==="st_lb" && Number.isFinite(kg) && kg > 0) {
 const { st, lb } = kgToStLb(kg);
 setStStr(String(st));
 setLbStr(lb % 1 === 0 ? String(lb) : String(Math.round(lb * 10) / 10));
 }
 if (next ==="lb" && Number.isFinite(kg) && kg > 0) {
 setLbOnlyStr(String(Math.round(kgToLb(kg) * 10) / 10));
 }
 }

 function onHeightUnitChange(next: HeightUnit) {
 const cm = Number(form.getValues("heightCm"));
 setHeightUnit(next);
 if (next ==="ft_in" && Number.isFinite(cm) && cm > 0) {
 const { ft, inch } = cmToFtIn(cm);
 setFtStr(String(ft));
 setInStr(inch % 1 === 0 ? String(inch) : String(Math.round(inch * 10) / 10));
 }
 if (next ==="m" && Number.isFinite(cm) && cm > 0) {
 setMStr(String(cmToM(cm)));
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

 useEffect(() => {
 // Onboarding with nothing saved yet: start in the visitor's own units, and
 // carry over anything they typed into the public macro calculator.
 if (onboardingMode && !defaultValues?.weightKg) {
 form.register("sex");
 form.register("goal");
 const prefill = typeof window !== "undefined" ? readCalculatorPrefill(window.localStorage) : null;
 const units = prefill
 ? prefill.units === "imperial"
 ? { weight: "lb" as const, height: "ft_in" as const }
 : { weight: "kg" as const, height: "cm" as const }
 : unitsForLocale(typeof navigator !== "undefined" ? navigator.language : undefined);
 if (prefill) form.reset(prefill.values);
 const kg = Number(form.getValues("weightKg"));
 const cm = Number(form.getValues("heightCm"));
 setWeightUnit(units.weight);
 setHeightUnit(units.height);
 if (units.weight === "lb" && kg > 0) setLbOnlyStr(String(Math.round(kgToLb(kg))));
 if (units.height === "ft_in" && cm > 0) {
 const { ft, inch } = cmToFtIn(cm);
 setFtStr(String(ft));
 setInStr(String(Math.round(inch)));
 }
 }
 updatePreview();
 // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount
 }, []);

 function onSubmit(values: TDEEFormValues) {
 startTransition(async () => {
 const result = await saveTDEEProfile(values);
 if (result &&"error" in result) {
 toast({ title:"Failed to save", description: result.error, variant:"destructive" });
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
 if (onboardingMode && onSaved) {
 if (typeof window !== "undefined") clearCalculatorPrefill(window.localStorage);
 onSaved();
 return;
 }
 const desc =
 result?.overrideApplied && result.overrideReason ==="underweight"
 ?"Goal saved as maintain — weight loss is not recommended below BMI 18.5."
 : result?.overrideApplied && result.overrideReason ==="minimum_calories"
 ? `Calorie target raised to at least ${getMinimumCalories(values.sex)} kcal/day for safety.`
 : `${result?.targets?.dailyCalories} kcal · ${result?.targets?.dailyProtein}g protein per day`;

 toast({
 title: result?.overrideApplied ?"Targets saved (safety adjusted)" :"Targets saved",
 description: desc,
 });
 });
 }

 const bmiPreview =
 weightKg && heightCm ? calculateBMI(Number(weightKg), Number(heightCm)) : null;
 const bmiCategory = bmiPreview != null && bmiPreview > 0 ? getBMICategory(bmiPreview) : null;
 const showLoseSafety =
 weightKg && heightCm && sex && goal ==="lose" && bmiPreview != null && bmiPreview > 0;
 const minCal = sex ==="male" || sex ==="female" ? getMinimumCalories(sex) : null;
 const floorHit =
 preview &&
 minCal != null &&
 preview.rawDailyCalories < minCal &&
 preview.dailyCalories >= minCal;

 const weightField = (
 <div className="space-y-2">
 <div className="flex items-center justify-between gap-3">
 <label className="block text-sm font-medium text-[var(--text-secondary)]">Weight</label>
 <select
 value={weightUnit}
 onChange={(e) => onWeightUnitChange(e.target.value as WeightUnit)}
 aria-label="Weight units"
 className="theme-aware-select h-8 rounded-md border border-[var(--border-default)] px-2 text-xs"
 >
 <option value="kg">kg</option>
 <option value="lb">lb</option>
 <option value="st_lb">st + lb</option>
 </select>
 </div>
 {weightUnit ==="kg" ? (
 <>
 <Input
 {...form.register("weightKg")}
 type="number"
 placeholder="75"
 min="30"
 max="300"
 step="0.1"
 onKeyDown={(e) => ["e","E","+","-"].includes(e.key) && e.preventDefault()}
 />
 </>
 ) : weightUnit ==="lb" ? (
 <>
 <Input
 type="number"
 placeholder="165"
 min={66}
 max={661}
 step="0.1"
 value={lbOnlyStr}
 onChange={(e) => {
 const v = e.target.value;
 setLbOnlyStr(v);
 const lb = Number.parseFloat(v);
 if (Number.isFinite(lb)) {
 form.setValue("weightKg", lbToKg(lb), { shouldValidate: true, shouldDirty: true });
 }
 }}
 onKeyDown={(e) => ["e","E","+","-"].includes(e.key) && e.preventDefault()}
 />
 <p className="text-2xs text-[var(--text-muted)]">1 lb ≈ 0.454 kg</p>
 </>
 ) : (
 <>
 <div className="flex gap-2">
 <div className="flex-1">
 <label className="mb-1 block text-xs text-[var(--text-muted)]">Stones</label>
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
 onKeyDown={(e) => ["e","E","+","-"].includes(e.key) && e.preventDefault()}
 />
 </div>
 <div className="flex-1">
 <label className="mb-1 block text-xs text-[var(--text-muted)]">Pounds</label>
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
 onKeyDown={(e) => ["e","E","+","-"].includes(e.key) && e.preventDefault()}
 />
 </div>
 </div>
 <p className="text-2xs text-[var(--text-muted)]">14 lb = 1 stone</p>
 </>
 )}
 {form.formState.errors.weightKg ? (
 <p className={`mt-1 text-xs ${ds.errorText}`}>{form.formState.errors.weightKg.message}</p>
 ) : null}
 </div>
 );

 const heightField = (
 <div className="space-y-2">
 <div className="flex items-center justify-between gap-3">
 <label className="block text-sm font-medium text-[var(--text-secondary)]">Height</label>
 <select
 value={heightUnit}
 onChange={(e) => onHeightUnitChange(e.target.value as HeightUnit)}
 aria-label="Height units"
 className="theme-aware-select h-8 rounded-md border border-[var(--border-default)] px-2 text-xs"
 >
 <option value="cm">cm</option>
 <option value="m">m</option>
 <option value="ft_in">ft + in</option>
 </select>
 </div>
 {heightUnit ==="cm" ? (
 <>
 <Input
 {...form.register("heightCm")}
 type="number"
 placeholder="175"
 min="100"
 max="250"
 step={1}
 onKeyDown={(e) => ["e","E","+","-"].includes(e.key) && e.preventDefault()}
 />
 </>
 ) : heightUnit ==="m" ? (
 <>
 <Input
 type="number"
 placeholder="1.75"
 min={1}
 max={2.5}
 step={0.01}
 value={mStr}
 onChange={(e) => {
 const v = e.target.value;
 setMStr(v);
 const m = Number.parseFloat(v);
 if (Number.isFinite(m)) {
 form.setValue("heightCm", mToCm(m), { shouldValidate: true, shouldDirty: true });
 }
 }}
 onKeyDown={(e) => ["e","E","+","-"].includes(e.key) && e.preventDefault()}
 />
 <p className="text-2xs text-[var(--text-muted)]">1 m = 100 cm</p>
 </>
 ) : (
 <>
 <div className="flex gap-2">
 <div className="flex-1">
 <label className="mb-1 block text-xs text-[var(--text-muted)]">Feet</label>
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
 onKeyDown={(e) => ["e","E","+","-"].includes(e.key) && e.preventDefault()}
 />
 </div>
 <div className="flex-1">
 <label className="mb-1 block text-xs text-[var(--text-muted)]">Inches</label>
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
 onKeyDown={(e) => ["e","E","+","-"].includes(e.key) && e.preventDefault()}
 />
 </div>
 </div>
 <p className="text-2xs text-[var(--text-muted)]">12 inches = 1 foot</p>
 </>
 )}
 {form.formState.errors.heightCm ? (
 <p className={`mt-1 text-xs ${ds.errorText}`}>{form.formState.errors.heightCm.message}</p>
 ) : null}
 </div>
 );

 const bmiCard = bmiPreview != null && bmiPreview > 0 && bmiCategory ? (
 <div className={`rounded-xl border border-[var(--border-default)] p-4 ${getBMIColour(bmiCategory)}`}>
 <div className="flex items-start justify-between gap-3">
 <div>
 <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Your BMI</p>
 <p className="mt-1 text-2xl font-bold tabular-nums">{bmiPreview}</p>
 </div>
 <ShieldCheck className="h-6 w-6 shrink-0 opacity-80" aria-hidden />
 </div>
 <p className="mt-2 text-sm font-medium">{getBMILabel(bmiCategory)}</p>
 <p className="mt-0.5 text-2xs opacity-80">WHO classification</p>
 <p className="mt-2 text-xs leading-relaxed opacity-90">
 BMI is a rough guide and doesn&apos;t account for muscle mass or body composition.
 </p>
 </div>
 ) : null;

 const ageField = (
 <div>
 <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">Age</label>
 <Input
 {...form.register("age")}
 type="number"
 placeholder="28"
 min="16"
 max="100"
 onKeyDown={(e) => ["e","E","+","-"].includes(e.key) && e.preventDefault()}
 />
 {form.formState.errors.age ? <p className={`mt-1 text-xs ${ds.errorText}`}>{form.formState.errors.age.message}</p> : null}
 </div>
 );

 const sexSelect = (
 <div>
 <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">Sex</label>
 <select
 {...form.register("sex")}
 className="theme-aware-select h-10 w-full rounded-md border border-[var(--border-default)] px-3 text-sm"
 defaultValue={defaultValues?.sex}
 >
 <option value="">Select</option>
 <option value="male">Male</option>
 <option value="female">Female</option>
 </select>
 {form.formState.errors.sex ? <p className={`mt-1 text-xs ${ds.errorText}`}>{form.formState.errors.sex.message}</p> : null}
 </div>
 );

 const activityField = (
 <div>
 <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">Activity level</label>
 <select
 {...form.register("activityLevel")}
 className="theme-aware-select h-10 w-full rounded-md border border-[var(--border-default)] px-3 text-sm"
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
 <p className={`mt-1 text-xs ${ds.errorText}`}>{form.formState.errors.activityLevel.message}</p>
 ) : null}
 </div>
 );

 const goalSelect = (
 <div>
 <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">Goal</label>
 <select
 {...form.register("goal")}
 className="theme-aware-select h-10 w-full rounded-md border border-[var(--border-default)] px-3 text-sm"
 defaultValue={defaultValues?.goal}
 >
 <option value="">What is your goal?</option>
 {GOAL_OPTIONS.map((option) => (
 <option
 key={option.value}
 value={option.value}
 disabled={option.value ==="lose" && bmiPreview != null && bmiPreview > 0 && !isSafeToLoseWeight(bmiPreview)}
 >
 {option.label}
 </option>
 ))}
 </select>
 {form.formState.errors.goal ? <p className={`mt-1 text-xs ${ds.errorText}`}>{form.formState.errors.goal.message}</p> : null}
 </div>
 );

 const underweightCallout = bmiPreview != null && bmiPreview > 0 && !isSafeToLoseWeight(bmiPreview) ? (
 <div className={`flex gap-3 rounded-xl p-4 ${ds.errorCallout}`}>
 <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
 <div className="space-y-1 text-sm">
 <p className="font-semibold">Weight loss not recommended</p>
 <p className="text-xs leading-relaxed opacity-95">
 Your BMI is below 18.5 (underweight per WHO), so we won&apos;t set a weight-loss target: your targets
 will be for maintaining your weight. Please speak to your GP or a registered dietitian for personal
 advice.
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
 ) : null;

 const loseSafetyCallout = showLoseSafety && isSafeToLoseWeight(bmiPreview!) ? (
 <div className={`flex gap-3 rounded-xl p-4 ${ds.successCallout}`}>
 <Info className="mt-0.5 h-5 w-5 shrink-0 text-[var(--semantic-success-text)]" aria-hidden />
 <div className="text-sm">
 <p className="font-semibold text-[var(--semantic-success-text)]">NHS safe weight loss guideline</p>
 <p className="mt-1 text-xs leading-relaxed text-[var(--semantic-success-text)]/90">
 We follow the NHS recommendation of up to about{""}
 <strong>0.5 kg loss per week</strong>. Your target sits <strong>20% below</strong> your estimated daily
 energy needs, so the deficit scales with your body rather than being the same for everyone.
 </p>
 </div>
 </div>
 ) : null;

 const floorCallout = floorHit && minCal != null ? (
 <div className={`flex gap-3 rounded-xl p-4 ${ds.warnCallout}`}>
 <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--semantic-warn-text)]" aria-hidden />
 <p className="text-xs leading-relaxed">
 Your calculated target was below the minimum safe intake of <strong>{minCal} kcal/day</strong> for your sex.
 We&apos;ve set your target to <strong>{minCal} kcal</strong>. Consult your GP before going lower.
 </p>
 </div>
 ) : null;

 const previewCard = preview ? (
 <div className="space-y-3 rounded-xl border border-[var(--brand-primary)] bg-[var(--surface-brand-subtle)] p-4">
 <div className="flex items-center gap-2">
 <Calculator className="h-4 w-4 text-[var(--brand-primary)]" />
 <span className="text-sm font-semibold text-[var(--brand-primary)]">Your estimates</span>
 </div>
 {/* The four numbers used to sit in an even 2x2 grid as bare acronyms, which
 read as four alternatives rather than a calculation ending in one answer.
 Targets lead; BMR and TDEE follow as the working behind them. */}
 <div className="grid grid-cols-2 gap-3">
 <div>
 <p className="text-xs text-[var(--text-muted)]">Eat this each day</p>
 <p className="text-2xl font-bold text-[var(--brand-primary)]">{preview.dailyCalories} kcal</p>
 </div>
 <div>
 <p className="text-xs text-[var(--text-muted)]">Protein target</p>
 <p className="text-2xl font-bold text-[var(--brand-primary)]">{preview.dailyProtein} g</p>
 </div>
 </div>

 <div className="border-t border-[var(--border-subtle)] pt-3">
 <p className="mb-2 text-xs font-medium text-[var(--text-muted)]">How we got there</p>
 <dl className="space-y-1.5 text-xs">
 <div className="flex items-baseline justify-between gap-3">
 <dt className="text-[var(--text-muted)]">
 At rest <span className="opacity-70">(BMR)</span> — burned doing nothing
 </dt>
 <dd className="font-medium text-[var(--text-secondary)]">{Math.round(preview.bmr)} kcal</dd>
 </div>
 <div className="flex items-baseline justify-between gap-3">
 <dt className="text-[var(--text-muted)]">
 Maintenance <span className="opacity-70">(TDEE)</span> — with your activity
 </dt>
 <dd className="font-medium text-[var(--text-secondary)]">{preview.tdee} kcal</dd>
 </div>
 <div className="flex items-baseline justify-between gap-3">
 <dt className="text-[var(--text-muted)]">Adjusted for your goal</dt>
 <dd className="font-medium text-[var(--text-secondary)]">
 {preview.dailyCalories > preview.tdee ? "+" : ""}
 {preview.dailyCalories - preview.tdee} kcal
 </dd>
 </div>
 </dl>
 </div>
 </div>
 ) : null;

 const submitButton = (
 <Button type="submit" disabled={isPending} className="h-10 w-full bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)]">
 {isPending ? (
 <>
 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
 Saving...
 </>
 ) : onboardingMode ? (
 // In the wizard this is the only button that advances; it should say so.
"Save and continue"
 ) : (
"Save my targets"
 )}
 </Button>
 );

 // Onboarding only: big tap targets for the two choices, goal first because
 // it's the reason people came. A third of sign-ups left step 1 having
 // entered nothing (Oct 2026), when the goal sat last in a long form.
 const loseBlocked = bmiPreview != null && bmiPreview > 0 && !isSafeToLoseWeight(bmiPreview);
 const choiceClass = (on: boolean) =>
 `min-h-12 rounded-xl border px-2 text-sm font-semibold transition-colors disabled:opacity-40 ${
 on
 ? "border-[var(--btn-primary-bg)] bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]"
 : "border-[var(--border-default)] bg-[var(--surface-input)] text-[var(--text-secondary)] hover:border-[var(--brand-action)]"
 }`;

 const goalButtons = (
 <div>
 <p className="mb-2 text-sm font-medium text-[var(--text-secondary)]">What&apos;s your goal?</p>
 <div role="group" aria-label="Goal" className="grid grid-cols-3 gap-2">
 {GOAL_OPTIONS.map((option) => (
 <button
 key={option.value}
 type="button"
 aria-pressed={goal === option.value}
 disabled={option.value === "lose" && loseBlocked}
 onClick={() => {
 form.setValue("goal", option.value, { shouldValidate: true, shouldDirty: true });
 updatePreview();
 }}
 className={choiceClass(goal === option.value)}
 >
 {option.label}
 </button>
 ))}
 </div>
 {form.formState.errors.goal ? <p className={`mt-1 text-xs ${ds.errorText}`}>Choose a goal</p> : null}
 </div>
 );

 const sexButtons = (
 <div>
 <p className="mb-1.5 text-sm font-medium text-[var(--text-secondary)]">Sex</p>
 <div role="group" aria-label="Sex" className="grid grid-cols-2 gap-2">
 {(
 [
 ["female", "Female"],
 ["male", "Male"],
 ] as const
 ).map(([value, label]) => (
 <button
 key={value}
 type="button"
 aria-pressed={sex === value}
 onClick={() => {
 form.setValue("sex", value, { shouldValidate: true, shouldDirty: true });
 updatePreview();
 }}
 className={choiceClass(sex === value)}
 >
 {label}
 </button>
 ))}
 </div>
 {form.formState.errors.sex ? <p className={`mt-1 text-xs ${ds.errorText}`}>Choose one</p> : null}
 </div>
 );

 const compactPreview = preview ? (
 <div
 aria-live="polite"
 className="rounded-2xl border border-[var(--brand-primary)] bg-[var(--surface-brand-subtle)] p-4"
 >
 <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-primary)]">Your daily targets</p>
 <div className="mt-1 flex flex-wrap items-baseline gap-x-5 gap-y-1">
 <p className="text-2xl font-bold tabular-nums text-[var(--text-primary)]">
 {preview.dailyCalories.toLocaleString("en-GB")}
 <span className="ml-1 text-sm font-medium text-[var(--text-muted)]">kcal</span>
 </p>
 <p className="text-2xl font-bold tabular-nums text-[var(--text-primary)]">
 {preview.dailyProtein} g<span className="ml-1 text-sm font-medium text-[var(--text-muted)]">protein</span>
 </p>
 </div>
 <p className="mt-1 text-xs text-[var(--text-muted)]">
 Every plan and grocery list is built to hit these. You can change them any time.
 </p>
 </div>
 ) : null;

 if (onboardingMode) {
 return (
 <form onSubmit={form.handleSubmit(onSubmit)} onChange={updatePreview} className="space-y-5">
 {goalButtons}
 <div className="grid grid-cols-2 gap-3">
 {sexButtons}
 {ageField}
 </div>
 {heightField}
 {weightField}
 {activityField}
 {underweightCallout}
 {floorCallout}
 {beforeSubmit}
 {compactPreview}
 {submitButton}
 </form>
 );
 }

 return (
 <form onSubmit={form.handleSubmit(onSubmit)} onChange={updatePreview} className="space-y-4">
 <div className="grid gap-3 sm:grid-cols-2">
 {weightField}
 {heightField}
 </div>
 {bmiCard}
 <div className="grid grid-cols-2 gap-3">
 {ageField}
 {sexSelect}
 </div>
 {activityField}
 {goalSelect}
 {underweightCallout}
 {loseSafetyCallout}
 {floorCallout}
 {previewCard}
 {submitButton}
 </form>
 );
}
