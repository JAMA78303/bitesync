"use client";

import { BRANDED_ERROR_MESSAGE, BRANDED_ERROR_TITLE } from "@/lib/errors/userFacing";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/** Route error boundary — renders inside the root layout (no html/body here). */
export default function RouteError({ error, reset }: ErrorPageProps) {
  console.error("[RouteError]", error);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--surface-page)] p-6 text-[var(--text-primary)]">
      <div className="max-w-md rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-8 text-center shadow-sm">
        <p className="mb-2 text-lg font-bold">{BRANDED_ERROR_TITLE}</p>
        <p className="mb-2 text-sm text-[var(--text-muted)]">{BRANDED_ERROR_MESSAGE}</p>
        {error.message || error.digest ? (
          <p className="mb-6 break-words font-mono text-2xs text-[var(--text-muted)]">
            {[error.message, error.digest ? `digest ${error.digest}` : null].filter(Boolean).join(" · ")}
          </p>
        ) : (
          <div className="mb-6" />
        )}
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-[var(--btn-primary-bg)] px-5 py-2.5 text-sm font-semibold text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
