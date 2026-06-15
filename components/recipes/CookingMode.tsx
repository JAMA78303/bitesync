"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { List, Pause, Play, X } from "lucide-react";
import { formatTimerDisplay, parseStepDurationMinutes } from "@/lib/recipes/stepTimers";
import { ds } from "@/lib/ui/classes";

type Ingredient = {
  name: string;
  quantity: number;
  unit: string;
};

type Props = {
  recipeName: string;
  steps: string[];
  ingredients: Ingredient[];
  servings: number;
  onClose: () => void;
};

type WakeLockSentinel = {
  release: () => Promise<void>;
};

export function CookingMode({ recipeName, steps, ingredients, servings, onClose }: Props) {
  const safeSteps = steps.length ? steps : ["Follow the recipe as written."];
  const [stepIndex, setStepIndex] = useState(0);
  const [showIngredients, setShowIngredients] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const currentStep = safeSteps[stepIndex] ?? safeSteps[0]!;
  const nextStep = stepIndex < safeSteps.length - 1 ? safeSteps[stepIndex + 1] : null;
  const isLastStep = stepIndex >= safeSteps.length - 1;
  const suggestedMinutes = useMemo(() => parseStepDurationMinutes(currentStep), [currentStep]);

  const goToStep = useCallback((index: number) => {
    setStepIndex(index);
    setTimerSeconds(null);
    setTimerRunning(false);
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function requestWakeLock() {
      try {
        const nav = navigator as Navigator & {
          wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinel> };
        };
        if (!nav.wakeLock) return;
        wakeLockRef.current = await nav.wakeLock.request("screen");
        if (cancelled) {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
        }
      } catch {
        /* wake lock optional */
      }
    }
    const onVisibility = () => {
      if (document.visibilityState === "visible") void requestWakeLock();
    };
    void requestWakeLock();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      void wakeLockRef.current?.release();
      wakeLockRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!timerRunning || timerSeconds == null) return;
    if (timerSeconds <= 0) {
      setTimerRunning(false);
      try {
        navigator.vibrate?.(300);
      } catch {
        /* vibration optional */
      }
      return;
    }
    const id = window.setInterval(() => {
      setTimerSeconds((s) => (s == null ? null : Math.max(0, s - 1)));
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning, timerSeconds]);

  const startTimer = useCallback(
    (minutes?: number) => {
      const mins = minutes ?? suggestedMinutes;
      if (!mins) return;
      setTimerSeconds(mins * 60);
      setTimerRunning(true);
    },
    [suggestedMinutes],
  );

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[var(--surface-page)] text-[var(--text-primary)]">
      <header className="flex shrink-0 items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="flex min-h-11 min-w-11 items-center justify-center gap-1 text-sm font-medium text-[var(--text-muted)]"
          aria-label="Exit cooking mode"
        >
          <X className="h-5 w-5" />
          <span className="sr-only sm:not-sr-only">Exit</span>
        </button>
        <p className="max-w-[45%] truncate text-center text-sm font-semibold">{recipeName}</p>
        <button
          type="button"
          onClick={() => setShowIngredients((v) => !v)}
          className="flex min-h-11 items-center gap-1 text-sm font-medium text-[var(--brand-primary)]"
          aria-expanded={showIngredients}
        >
          <List className="h-4 w-4" />
          <span className="hidden sm:inline">Ingredients</span>
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col px-4">
        {/* Progress */}
        <div className="shrink-0 pt-5 pb-2 text-center">
          <p className="text-sm font-semibold text-[var(--text-secondary)]">
            Step {stepIndex + 1} of {safeSteps.length}
          </p>
          <div
            className="mx-auto mt-3 flex max-w-xs justify-center gap-2"
            role="progressbar"
            aria-valuenow={stepIndex + 1}
            aria-valuemin={1}
            aria-valuemax={safeSteps.length}
            aria-label={`Step ${stepIndex + 1} of ${safeSteps.length}`}
          >
            {safeSteps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${
                  i <= stepIndex ? "bg-[var(--brand-action)]" : "bg-[var(--surface-muted)]"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Hero step — centered, large, arm's-length readable */}
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center py-4">
          <p className="max-w-lg text-center text-2xl font-semibold leading-snug tracking-tight sm:text-3xl md:max-w-xl md:text-4xl md:leading-snug">
            {currentStep}
          </p>
          {nextStep ? (
            <p className="mt-6 max-w-md text-center text-sm leading-relaxed text-[var(--text-muted)]">
              <span className="font-medium text-[var(--text-secondary)]">Up next: </span>
              {nextStep.length > 120 ? `${nextStep.slice(0, 117)}…` : nextStep}
            </p>
          ) : null}
        </div>

        {/* Timer / step tools */}
        <div className="shrink-0 pb-3">
          {timerSeconds === 0 ? (
            <div
              className={`${ds.successCallout} flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3`}
            >
              <span className="text-sm font-semibold">Timer done — ready for the next step</span>
              <button
                type="button"
                onClick={() => setTimerSeconds(null)}
                className={`${ds.secondaryBtn} min-h-11 px-4 py-2`}
              >
                Dismiss
              </button>
            </div>
          ) : timerSeconds != null ? (
            <div className="flex items-center justify-between rounded-2xl bg-[var(--surface-muted)] px-4 py-3">
              <span className="text-2xl font-bold tabular-nums">{formatTimerDisplay(timerSeconds)}</span>
              <button
                type="button"
                onClick={() => setTimerRunning((r) => !r)}
                aria-label={timerRunning ? "Pause timer" : "Resume timer"}
                className={`${ds.secondaryBtn} min-h-11 px-4 py-2`}
              >
                {timerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
            </div>
          ) : suggestedMinutes ? (
            <button
              type="button"
              onClick={() => startTimer()}
              className={`${ds.secondaryBtn} min-h-11 w-full py-3`}
            >
              Start {suggestedMinutes} min timer
            </button>
          ) : null}
        </div>
      </div>

      {/* Balanced navigation */}
      <footer className="shrink-0 border-t border-[var(--border-subtle)] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-lg gap-3">
          <button
            type="button"
            disabled={stepIndex === 0}
            onClick={() => goToStep(stepIndex - 1)}
            className={`${ds.secondaryBtn} min-h-11 flex-1 py-3 disabled:opacity-40`}
          >
            Back
          </button>
          {isLastStep ? (
            <button type="button" onClick={onClose} className={`${ds.primaryBtn} min-h-11 flex-1 py-3`}>
              Finish
            </button>
          ) : (
            <button
              type="button"
              onClick={() => goToStep(stepIndex + 1)}
              className={`${ds.primaryBtn} min-h-11 flex-1 py-3`}
            >
              Next
            </button>
          )}
        </div>
      </footer>

      {showIngredients ? (
        <div
          className="absolute inset-x-0 bottom-0 max-h-[55%] overflow-y-auto rounded-t-2xl border-t border-[var(--border-default)] bg-[var(--surface-card)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lg"
          role="dialog"
          aria-label="Ingredients"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold">Ingredients (serves {servings})</h2>
            <button
              type="button"
              onClick={() => setShowIngredients(false)}
              className="min-h-11 text-sm text-[var(--text-muted)]"
            >
              Close
            </button>
          </div>
          <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
            {ingredients.map((ing, i) => (
              <li key={`${ing.name}-${i}`}>
                {ing.quantity} {ing.unit} {ing.name}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
