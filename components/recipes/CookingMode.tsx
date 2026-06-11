"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, List, Pause, Play, X } from "lucide-react";
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
  const suggestedMinutes = useMemo(() => parseStepDurationMinutes(currentStep), [currentStep]);

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
    void requestWakeLock();
    return () => {
      cancelled = true;
      void wakeLockRef.current?.release();
      wakeLockRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!timerRunning || timerSeconds == null) return;
    if (timerSeconds <= 0) {
      setTimerRunning(false);
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
      <header className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1 text-sm font-medium text-[var(--text-muted)]"
          aria-label="Exit cooking mode"
        >
          <X className="h-5 w-5" />
          Exit
        </button>
        <p className="max-w-[50%] truncate text-sm font-semibold">{recipeName}</p>
        <button
          type="button"
          onClick={() => setShowIngredients((v) => !v)}
          className="flex items-center gap-1 text-sm font-medium text-[var(--brand-primary)]"
          aria-expanded={showIngredients}
        >
          <List className="h-4 w-4" />
          Ingredients
        </button>
      </header>

      <div className="flex flex-1 flex-col px-4 py-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Step {stepIndex + 1} of {safeSteps.length}
        </p>
        <p className="mb-6 flex-1 text-lg leading-relaxed">{currentStep}</p>

        {timerSeconds != null ? (
          <div className="mb-4 flex items-center justify-between rounded-2xl bg-[var(--surface-muted)] px-4 py-3">
            <span className="text-2xl font-bold tabular-nums">{formatTimerDisplay(timerSeconds)}</span>
            <button
              type="button"
              onClick={() => setTimerRunning((r) => !r)}
              className={`${ds.secondaryBtn} px-4 py-2`}
            >
              {timerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
          </div>
        ) : suggestedMinutes ? (
          <button
            type="button"
            onClick={() => startTimer()}
            className={`${ds.secondaryBtn} mb-4 w-full py-3`}
          >
            Start {suggestedMinutes} min timer
          </button>
        ) : null}

        <div className="flex gap-3">
          <button
            type="button"
            disabled={stepIndex === 0}
            onClick={() => {
              setStepIndex((i) => Math.max(0, i - 1));
              setTimerSeconds(null);
              setTimerRunning(false);
            }}
            className={`${ds.secondaryBtn} flex-1 py-3 disabled:opacity-40`}
          >
            <ChevronLeft className="mx-auto h-5 w-5" />
          </button>
          <button
            type="button"
            disabled={stepIndex >= safeSteps.length - 1}
            onClick={() => {
              setStepIndex((i) => Math.min(safeSteps.length - 1, i + 1));
              setTimerSeconds(null);
              setTimerRunning(false);
            }}
            className={`${ds.primaryBtn} flex-1 py-3 disabled:opacity-40`}
          >
            <ChevronRight className="mx-auto h-5 w-5" />
          </button>
        </div>
      </div>

      {showIngredients ? (
        <div
          className="absolute inset-x-0 bottom-0 max-h-[55%] overflow-y-auto rounded-t-2xl border-t border-[var(--border-default)] bg-[var(--surface-card)] p-4 shadow-lg"
          role="dialog"
          aria-label="Ingredients"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold">Ingredients (serves {servings})</h2>
            <button type="button" onClick={() => setShowIngredients(false)} className="text-sm text-[var(--text-muted)]">
              Close
            </button>
          </div>
          <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
            {ingredients.map((ing) => (
              <li key={`${ing.name}-${ing.quantity}`}>
                {ing.quantity} {ing.unit} {ing.name}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
