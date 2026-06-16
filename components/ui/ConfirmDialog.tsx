"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { ds } from "@/lib/ui/classes";

type ConfirmOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

type PendingConfirm = ConfirmOptions & {
  resolve: (value: boolean) => void;
};

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...options, resolve });
    });
  }, []);

  const close = useCallback(
    (value: boolean) => {
      pending?.resolve(value);
      setPending(null);
    },
    [pending],
  );

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {pending ? (
        <ModalPortal>
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">
            <div
              role="alertdialog"
              aria-labelledby="confirm-dialog-title"
              aria-describedby="confirm-dialog-desc"
              className="w-full max-w-md rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 shadow-xl"
            >
              <h2 id="confirm-dialog-title" className="text-lg font-semibold text-[var(--text-primary)]">
                {pending.title}
              </h2>
              <p id="confirm-dialog-desc" className="mt-2 text-sm text-[var(--text-secondary)]">
                {pending.description}
              </p>
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => close(false)}
                  className="flex-1 rounded-lg border border-[var(--border-default)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
                >
                  {pending.cancelLabel ?? "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={() => close(true)}
                  className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold ${
                    pending.destructive
                      ? "border border-[var(--semantic-error-border)] bg-[var(--semantic-error-bg)] text-[var(--semantic-error-text)] hover:opacity-90"
                      : ds.primaryBtn
                  }`}
                >
                  {pending.confirmLabel ?? "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      ) : null}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within ConfirmProvider");
  }
  return ctx;
}
