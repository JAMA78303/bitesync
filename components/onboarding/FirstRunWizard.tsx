"use client";

import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TDEEForm } from "@/components/settings/TDEEForm";
import { DietaryPreferencesPicker } from "@/components/settings/DietaryPreferencesPicker";
import { FillMyLibraryModal } from "@/components/recipes/FillMyLibraryModal";
import { ImportRecipeModal } from "@/components/recipes/ImportRecipeModal";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/Logo";
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
import { trackFirstRunSkipped, trackFirstRunStepViewed } from "@/lib/analytics/events";
import { firstRunWeeks } from "@/lib/onboarding/firstWeeks";
import { toLocalISO } from "@/lib/utils/dates";
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
  /** First few recipe names, oldest first, for the step 2 summary. */
  recipePreview?: string[];
};

const subscribeNever = () => () => {};

/**
 * The browser's date, or null while rendering on the server. The server runs
 * on UTC and the user may not, so anything that depends on "today" is read
 * here after hydration rather than baked into the server HTML.
 */
function useLocalDateISO(): string | null {
  return useSyncExternalStore(subscribeNever, () => toLocalISO(new Date()), () => null);
}

/** Thursday to Sunday the first plan is next week plus the rest of this one — say so. */
function lateWeekNoteFor(localISO: string | null): string | null {
  if (!localISO) return null;
  const today = new Date(`${localISO}T12:00:00`);
  const weeks = firstRunWeeks(today);
  if (!weeks.nextWeekStart) return null;
  const weekday = today.toLocaleDateString("en-GB", { weekday: "long" });
  const monday = new Date(`${weeks.nextWeekStart}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
  });
  return `It’s ${weekday}, so your plan is for next week, starting Monday ${monday}. We’ll fill the rest of this week too, so you’ve got meals in the meantime.`;
}

const busyNoteClass =
  "rounded-xl bg-[var(--surface-brand-subtle)] px-3 py-2 text-sm text-[var(--text-secondary)]";

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

export function FirstRunWizard({ profile, isPro, recipeCount, recipePreview = [] }: Props) {
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
  const [showMoreRecipes, setShowMoreRecipes] = useState(false);
  const [libraryCount, setLibraryCount] = useState(recipeCount);
  // Finishing step 1 revalidates the page, which usually remounts this wizard
  // (its key is the saved step) — recipePreview covers that case.
  const [starterNames, setStarterNames] = useState<string[]>(recipePreview);
  // Both of these now take a few seconds (starter recipes, and for skip a
  // planned week), so say what is happening rather than just greying out.
  // The ref stops a second tap from starting a second seed.
  const [busy, setBusy] = useState<"step1" | "skip" | null>(null);
  const busyRef = useRef(false);
  const lateWeekNote = lateWeekNoteFor(useLocalDateISO());

  useEffect(() => {
    trackFirstRunStepViewed(step);
  }, [step]);

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

  function runBusy(kind: "step1" | "skip", work: () => Promise<void>) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(kind);
    startTransition(async () => {
      try {
        await work();
      } finally {
        busyRef.current = false;
        setBusy(null);
      }
    });
  }

  function handleSkip() {
    runBusy("skip", async () => {
      trackFirstRunSkipped(step);
      const result = await skipFirstRun(step, toLocalISO(new Date()));
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      router.push("/today");
      router.refresh();
    });
  }

  function onStep1Complete() {
    runBusy("step1", async () => {
      const result = await finishOnboardingStep1();
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      if ("starter" in result && result.starter?.seeded) {
        setLibraryCount((n) => n + result.starter.seeded);
        setStarterNames(result.starter.names);
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
      setStep(3);
      setError(null);
      router.refresh();
    });
  }

  function onGenerateWeek() {
    setError(null);
    startTransition(async () => {
      try {
        await generateFirstRunWeekAndGrocery({ goals, localDate: toLocalISO(new Date()) });
      } catch (err) {
        if (err && typeof err === "object" && "digest" in err) return;
        setError(err instanceof Error ? err.message : "Could not generate your week.");
      }
    });
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[var(--header-from)] to-[var(--surface-page)]">
      {/* Slim, so step 1's form starts near the top of a phone screen. The old
          160px emoji header pushed the first question below the fold. */}
      <div className="px-6 py-5">
        <Logo size="sm" href="" onDark />
      </div>

      <div className="flex flex-1 flex-col rounded-t-3xl bg-[var(--surface-card)] px-6 pt-8 pb-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              Step {step} of 3
            </p>
            <h1 className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
              {step === 2 && libraryCount > 0 ? "Your starter recipes" : FIRST_RUN_STEP_LABELS[step]}
            </h1>
          </div>
          <button
            type="button"
            onClick={handleSkip}
            disabled={isPending}
            className="shrink-0 whitespace-nowrap text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          >
            {busy === "skip" ? "Setting up…" : "Skip for now"}
          </button>
        </div>

        {error ? (
          <p className="mb-4 rounded-xl bg-[var(--semantic-error-bg)] px-3 py-2 text-sm text-[var(--semantic-error-text)]">
            {error}
          </p>
        ) : null}

        {busy === "skip" ? (
          <p role="status" className={`mb-4 ${busyNoteClass}`}>
            Adding starter recipes and planning your week — a few seconds…
          </p>
        ) : null}

        {step === 1 ? (
          <div className="space-y-5">
            {/* One short screen, goal first, targets shown as soon as they can be
                worked out. A third of sign-ups left this step having entered
                nothing (Oct 2026) when it opened with eight diet tiles and the
                button sat two screens down. Dietary needs are optional chips
                just above the button: they still save before starter recipes
                are made, which is what step 1 completing triggers. */}
            <p className="text-sm text-[var(--text-muted)]">
              About 30 seconds. We use this to size every plan and grocery list to you.
            </p>
            <TDEEForm
              defaultValues={tdeeDefaults}
              onboardingMode
              onSaved={onStep1Complete}
              beforeSubmit={
                <div>
                  <p className="mb-2 text-sm font-medium text-[var(--text-secondary)]">
                    Any dietary needs? <span className="font-normal text-[var(--text-muted)]">(optional)</span>
                  </p>
                  <DietaryPreferencesPicker initialSelected={dietary} compact />
                </div>
              }
            />
            {/* Under the button just pressed. */}
            {busy === "step1" ? (
              <p role="status" className={busyNoteClass}>
                Adding starter recipes sized to your targets…
              </p>
            ) : null}
          </div>
        ) : null}

        {step === 2 && libraryCount > 0 ? (
          <div className="space-y-4">
            <div className={`rounded-2xl px-4 py-3 text-sm ${ds.successCallout}`}>
              <p className="font-semibold">
                {libraryCount} recipe{libraryCount === 1 ? " is" : "s are"} ready in your library
              </p>
              <p className="mt-1 text-xs leading-relaxed">
                Sized to your calorie and protein targets and your food preferences. Edit, swap or remove
                any of them later in Recipes.
              </p>
              {starterNames.length ? (
                <ul className="mt-2 space-y-0.5 text-xs">
                  {starterNames.slice(0, 4).map((name) => (
                    <li key={name}>• {name}</li>
                  ))}
                  {libraryCount > Math.min(starterNames.length, 4) ? (
                    <li>and {libraryCount - Math.min(starterNames.length, 4)} more</li>
                  ) : null}
                </ul>
              ) : null}
            </div>
            <Button type="button" onClick={onLibraryComplete} disabled={isPending} className="w-full">
              Continue with {libraryCount} recipe{libraryCount === 1 ? "" : "s"}
            </Button>
            {/* Free starter sets fill the 10-recipe cap, so there is nothing more
                to add on free. On Pro the AI generator is an optional extra now,
                not the only way past this step. */}
            {isPro ? (
              showMoreRecipes ? (
                <div className="rounded-2xl border border-[var(--border-default)] p-4">
                  <FillMyLibraryModal
                    embedded
                    onComplete={onLibraryComplete}
                    onClose={() => setShowMoreRecipes(false)}
                  />
                </div>
              ) : (
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm">
                  <button
                    type="button"
                    onClick={() => setShowMoreRecipes(true)}
                    className="font-medium text-[var(--brand-primary)] underline underline-offset-2"
                  >
                    Add more, written by AI
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowImport(true)}
                    className="font-medium text-[var(--brand-primary)] underline underline-offset-2"
                  >
                    Import one from a URL
                  </button>
                </div>
              )
            ) : (
              <p className="text-center text-xs text-[var(--text-muted)]">
                Free plan: up to 10 recipes. Pro adds unlimited library + AI weekly plans.
              </p>
            )}
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
          </div>
        ) : null}

        {step === 2 && libraryCount === 0 ? (
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
            {lateWeekNote ? <p className="text-sm text-[var(--text-secondary)]">{lateWeekNote}</p> : null}
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
