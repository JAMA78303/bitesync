"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastVariant = "default" | "destructive";

export type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
};

type ToastRecord = ToastInput & { id: string };

type ToastContextValue = {
  toast: (input: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION_MS = 6000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id =
        typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto
          ? globalThis.crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const record: ToastRecord = { ...input, id };
      setToasts((prev) => [...prev.slice(-4), record]);
      const duration = input.durationMs ?? DEFAULT_DURATION_MS;
      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] z-[80] flex flex-col items-center gap-2 px-4 md:bottom-6"
      >
        {toasts.map((t) => {
          const destructive = t.variant === "destructive";
          return (
            <div
              key={t.id}
              role={destructive ? "alert" : "status"}
              className={`pointer-events-auto w-full max-w-md rounded-2xl border px-4 py-3 shadow-2xl ${
                destructive
                  ? "border-[var(--semantic-error-border)] bg-[var(--semantic-error-bg)] text-[var(--semantic-error-text)]"
                  : "border-[var(--border-default)] bg-[var(--surface-elevated)] text-[var(--text-primary)]"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{t.title}</p>
                  {t.description ? (
                    <p
                      className={`mt-1 text-sm ${
                        destructive
                          ? "text-[var(--semantic-error-text)]/90"
                          : "text-[var(--text-secondary)]"
                      }`}
                    >
                      {t.description}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  className={`flex-shrink-0 rounded-lg px-2 py-1 text-xs font-semibold ${
                    destructive
                      ? "text-[var(--semantic-error-text)] hover:bg-[var(--semantic-error-border)]/30"
                      : "text-[var(--brand-primary)] hover:bg-[var(--surface-brand-subtle)]"
                  }`}
                >
                  Close
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

const NOOP_TOAST: ToastContextValue = { toast: () => {} };

export function useToastContext(): ToastContextValue {
  return useContext(ToastContext) ?? NOOP_TOAST;
}
