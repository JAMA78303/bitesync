"use client";

import { useState, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calculator, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { saveTDEEProfile } from "@/lib/supabase/profile";
import {
  ACTIVITY_OPTIONS,
  GOAL_OPTIONS,
  calculateNutritionTargets,
  tdeeSchema,
  type TDEEFormValues,
} from "@/lib/utils/tdee";

type Props = {
  defaultValues?: Partial<TDEEFormValues>;
};

export function TDEEForm({ defaultValues }: Props) {
  const [isPending, startTransition] = useTransition();
  const [preview, setPreview] = useState<{
    bmr: number;
    tdee: number;
    dailyCalories: number;
    dailyProtein: number;
  } | null>(null);
  const { toast } = useToast();

  const form = useForm<TDEEFormValues>({
    resolver: zodResolver(tdeeSchema) as Resolver<TDEEFormValues>,
    defaultValues,
    mode: "onBlur",
  });

  function updatePreview() {
    const result = tdeeSchema.safeParse(form.getValues());
    if (result.success) setPreview(calculateNutritionTargets(result.data));
  }

  function onSubmit(values: TDEEFormValues) {
    startTransition(async () => {
      const result = await saveTDEEProfile(values);
      if (result && "error" in result) {
        toast({ title: "Failed to save", description: result.error, variant: "destructive" });
        return;
      }
      if (result?.targets) setPreview(result.targets);
      toast({
        title: "Targets saved",
        description: `${result?.targets?.dailyCalories} kcal · ${result?.targets?.dailyProtein}g protein per day`,
      });
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} onChange={updatePreview} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Weight (kg)</label>
          <Input
            {...form.register("weightKg")}
            type="number"
            placeholder="75"
            min="30"
            max="300"
            step="0.1"
            onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
          />
          {form.formState.errors.weightKg ? (
            <p className="mt-1 text-xs text-red-500">{form.formState.errors.weightKg.message}</p>
          ) : null}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Height (cm)</label>
          <Input
            {...form.register("heightCm")}
            type="number"
            placeholder="175"
            min="100"
            max="250"
            onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
          />
          {form.formState.errors.heightCm ? (
            <p className="mt-1 text-xs text-red-500">{form.formState.errors.heightCm.message}</p>
          ) : null}
        </div>
      </div>

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
            className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
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
          className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
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
          className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
          defaultValue={defaultValues?.goal}
        >
          <option value="">What is your goal?</option>
          {GOAL_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {form.formState.errors.goal ? <p className="mt-1 text-xs text-red-500">{form.formState.errors.goal.message}</p> : null}
      </div>

      {preview ? (
        <div className="space-y-3 rounded-xl border border-[#6EE7B7] bg-[#F0FDF4] p-4">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-[#1A4731]" />
            <span className="text-sm font-semibold text-[#1A4731]">Your estimates</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-400">BMR</p>
              <p className="text-base font-semibold text-slate-700">{Math.round(preview.bmr)} kcal</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">TDEE</p>
              <p className="text-base font-semibold text-slate-700">{preview.tdee} kcal</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Daily target</p>
              <p className="text-base font-semibold text-[#1A4731]">{preview.dailyCalories} kcal</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Protein target</p>
              <p className="text-base font-semibold text-[#1A4731]">{preview.dailyProtein} g</p>
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
