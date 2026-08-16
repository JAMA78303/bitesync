"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TDEEForm } from "@/components/settings/TDEEForm";
import { DietaryPreferencesPicker } from "@/components/settings/DietaryPreferencesPicker";
import { FillMyLibraryModal } from "@/components/recipes/FillMyLibraryModal";
import { ImportRecipeModal } from "@/components/recipes/ImportRecipeModal";
import { Button } from "@/components/ui/button";
import {
  finishOnboardingStep1,
  finishOnboardingStep2,
  generateFirstRunWeekAndGrocery,
  skipFirstRun,
} from "@/app/onboarding/actions";
import { initialDietaryPreferencesFromProfile } from "@/lib/dietary/constraints";
import {
  FIRST_RUN_STEP,
  FIRST_RUN_STEP_LABELS,
  clampFirstRunStep,
  firstRunLibraryCount,
} from "@/lib/onboarding/first-run";
import { trackFirstRunSkipped } from "@/lib/analytics/events";
import type { GoalContext } from "@/app/(app)/planner/ai-actions";
import type { TDEEFormValues } from "@/lib/utils/tdee";
import { ds } from "@/lib/ui/classes";

type ProfileSlice = {
  dietary_preferences?: string[] | null;
  follows_vegetarian?: boolean | null;
  follows_vegan?: boolean | null;
  follows_gluten_free?: boolean | null;
  weight_kg?: number | null;
  height_cm?: number | null;
  age?: number | null;
  sex?: string | null;
  activity_level?: string | null;
  goal?: string | null;
  daily_calorie_target?: number | null;
  daily_protein_target?: number | null;
  onboarding_step?: number | null;
};

type Props = {
  profile: ProfileSlice | null;
  isPro: boolean;
  recipeCount: number;
};

function ProgressDots({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Step ${step} of 3`}>
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          className={`h-1.5 rounded-full transition-all ${
            n === step ? "w-6 bg-[var(--brand-primary)]" : n < step ? "w-1.5 bg-[var(--brand-primary)]/60" : "w-1.5 bg-[var(--progress-track)]"
          }`}
        />
      ))}
    </div>
  );
}

export function FirstRunWizard({ profile, isPro, recipeCount }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(() => {
    const s = clampFirstRunStep(profile?.onboarding_step);
    if (s >= FIRST_RUN_STEP.WEEK) return 3;
    if (s === FIRST_RUN_STEP.LIBRARY) return 2;
    return 1;
  });
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [libraryDone, setLibraryDone] = useState(recipeCount > 0);

  const dietary = initialDietaryPreferencesFromProfile(profile);
  const tdeeDefaults: Partial<TDEEFormValues> | undefined = profile?.weight_kg
    ? {
        weightKg: Number(profile.weight_kg),
        heightCm: Number(profile.height_cm),
        age: Number(profile.age),
        sex: profile.sex as "male" | "female",
        activityLevel: profile.activity_level as TDEEFormValues["activityLevel"],
        goal: profile.goal as TDEEFormValues["goal"],
      }
    : undefined;

  const goals: GoalContext = {
    calorieTarget: profile?.daily_calorie_target ? Number(profile.daily_calorie_target) : null,
    proteinTarget: profile?.daily_protein_target ? Number(profile.daily_protein_target) : null,
    followsVegetarian: profile?.follows_vegetarian ?? false,
    followsVegan: profile?.follows_vegan ?? false,
    followsGlutenFree: profile?.follows_gluten_free ?? false,
  };

  function handleSkip() {
    startTransition(async () => {
      trackFirstRunSkipped(step);
      const result = await skipFirstRun(step);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      router.push("/today");
      router.refresh();
    });
  }

  function onStep1Complete() {
    startTransition(async () => {
      const result = await finishOnboardingStep1();
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      setStep(2);
      setError(null);
    });
  }

  function onLibraryComplete() {
    startTransition(async () => {
      const result = await finishOnboardingStep2();
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      setLibraryDone(true);
      setStep(3);
      setError(null);
      router.refresh();
    });
  }

  function onGenerateWeek() {
    setError(null);
    startTransition(async () => {
      try {
        await generateFirstRunWeekAndGrocery({ isPro, goals });
      } catch (err) {
        if (err && typeof err === "object" && "digest" in err) return;
        setError(err instanceof Error ? err.message : "Could not generate your week.");
      }
    });
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[var(--header-from)] to-[var(--surface-page)]">
      <div className="flex h-40 items-center justify-center sm:h-48">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--surface-overlay)]/20 text-4xl backdrop-blur-sm sm:h-24 sm:w-24 sm:text-5xl">
          🥗
        </div>
      </div>

      <div className="flex flex-1 flex-col rounded-t-3xl bg-[var(--surface-card)] px-6 pt-8 pb-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              Step {step} of 3
            </p>
            <h1 className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
              {FIRST_RUN_STEP_LABELS[step]}
            </h1>
          </div>
          <button
            type="button"
            onClick={handleSkip}
            disabled={isPending}
            className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          >
            Skip for now
          </button>
        </div>

        {error ? (
          <p className="mb-4 rounded-xl bg-[var(--semantic-error-bg)] px-3 py-2 text-sm text-[var(--semantic-error-text)]">
            {error}
          </p>
        ) : null}

        {step === 1 ? (
          <div className="space-y-6">
            <div>
              <h2 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Food preferences</h2>
              <p className="mb-3 text-sm text-[var(--text-muted)]">
                Used for recipe suggestions and your meal plan.
              </p>
              <DietaryPreferencesPicker
                initialSelected={dietary}
                submitLabel="Save preferences"
                onSaved={() => setError(null)}
              />
            </div>
            <div>
              <h2 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Calorie &amp; protein targets</h2>
              <p className="mb-3 text-sm text-[var(--text-muted)]">
                {isPro
                  ? "Based on your body stats and goal — powers Fill My Library and planning."
                  : "Set your targets for this session. Pro unlocks saving and editing them anytime in Goals."}
              </p>
              <TDEEForm
                defaultValues={tdeeDefaults}
                onboardingMode
                onSaved={onStep1Complete}
              />
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-muted)]">
              Add recipes sized to your diet — or import one you already love from a URL.
            </p>
            <div className="rounded-2xl border border-[var(--border-default)] p-4">
              <FillMyLibraryModal
                firstRunCount={firstRunLibraryCount(isPro)}
                embedded
                firstRun
                onComplete={onLibraryComplete}
                onClose={() => {}}
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => setShowImport(true)} className="flex-1">
                Import from URL instead
              </Button>
              {libraryDone || recipeCount > 0 ? (
                <Button type="button" onClick={onLibraryComplete} disabled={isPending} className="flex-1">
                  Continue with {Math.max(recipeCount, 1)} recipe{recipeCount === 1 ? "" : "s"}
                </Button>
              ) : null}
            </div>
            {showImport ? (
              <ImportRecipeModal
                embedded
                onClose={() => setShowImport(false)}
                onImport={async () => {
                  setShowImport(false);
                  onLibraryComplete();
                }}
              />
            ) : null}
            {!isPro ? (
              <p className="text-xs text-[var(--text-muted)]">
                Free plan: up to 10 recipes. Pro adds unlimited library + AI weekly plans.
              </p>
            ) : null}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-muted)]">
              {isPro
                ? "We’ll generate a full week from your library and build your grocery list."
                : "We’ll fill your week from your library using smart matching, then build your grocery list. Pro adds one-tap AI weekly plans."}
            </p>
            <Button
              type="button"
              onClick={onGenerateWeek}
              disabled={isPending || recipeCount === 0}
              className={`${ds.primaryBtn} w-full`}
            >
              {isPending ? "Planning your week…" : isPro ? "Generate AI week + grocery list" : "Plan my week + grocery list"}
            </Button>
            {recipeCount === 0 ? (
              <p className="text-sm text-[var(--semantic-warn-text)]">Add at least one recipe in step 2 first.</p>
            ) : null}
            <Link href="/sample-week" className="block text-center text-sm font-medium text-[var(--brand-primary)] hover:underline">
              Not ready? See a sample week first →
            </Link>
          </div>
        ) : null}

        <div className="mt-8 flex items-center justify-between">
          <ProgressDots step={step} />
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((step - 1) as 1 | 2 | 3)}
              className="text-sm font-medium text-[var(--brand-primary)]"
            >
              ← Back
            </button>
          ) : (
            <Link href="/sample-week" className="text-sm font-medium text-[var(--brand-primary)]">
              See a sample week
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
