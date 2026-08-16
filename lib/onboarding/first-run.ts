/** Guided first-run step indices stored on `profiles.onboarding_step`. */
export const FIRST_RUN_STEP = {
  GOAL: 1,
  LIBRARY: 2,
  WEEK: 3,
  DONE: 4,
} as const;

export type FirstRunStep = (typeof FIRST_RUN_STEP)[keyof typeof FIRST_RUN_STEP];

export const FIRST_RUN_STEP_LABELS: Record<1 | 2 | 3, string> = {
  1: "Set your goal",
  2: "Fill your library",
  3: "Generate your week",
};

/**
 * Onboarding seed sizes. The first generated week is the make-or-break moment, and its
 * quality is capped by library depth: 3 main slots/day at ≤2 uses per week needs ~10+
 * mains before meals stop repeating, plus enough distinct snacks to fill every slot.
 * Pro seeds 16 (4 per meal type); free seeds 10 — its recipe cap — split 3/3/2/2.
 */
export const FIRST_RUN_LIBRARY_COUNT_PRO = 16;
export const FIRST_RUN_LIBRARY_COUNT_FREE = 10;

export function firstRunLibraryCount(isPro: boolean): number {
  return isPro ? FIRST_RUN_LIBRARY_COUNT_PRO : FIRST_RUN_LIBRARY_COUNT_FREE;
}

export function clampFirstRunStep(step: number | null | undefined): FirstRunStep {
  if (step === 2) return FIRST_RUN_STEP.LIBRARY;
  if (step === 3) return FIRST_RUN_STEP.WEEK;
  if (step === 4) return FIRST_RUN_STEP.DONE;
  return FIRST_RUN_STEP.GOAL;
}

export function isFirstRunActive(profile: {
  first_run_completed?: boolean | null;
  first_run_skipped?: boolean | null;
} | null): boolean {
  if (!profile) return false;
  if (profile.first_run_completed) return false;
  return true;
}

export function shouldShowFirstRunResume(profile: {
  first_run_completed?: boolean | null;
  first_run_skipped?: boolean | null;
  has_completed_onboarding?: boolean | null;
} | null): boolean {
  if (!profile) return false;
  if (profile.first_run_completed) return false;
  return profile.first_run_skipped === true || profile.has_completed_onboarding === true;
}

export function firstRunResumeFromProfile(
  profile: {
    first_run_completed?: boolean | null;
    first_run_skipped?: boolean | null;
    has_completed_onboarding?: boolean | null;
    onboarding_step?: number | null;
  } | null,
): { show: boolean; step: number } {
  return {
    show: shouldShowFirstRunResume(profile),
    step: profile?.onboarding_step ?? 1,
  };
}
