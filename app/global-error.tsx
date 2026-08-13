"use client";

import { BRANDED_ERROR_MESSAGE, BRANDED_ERROR_TITLE } from "@/lib/errors/userFacing";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/** Root-layout error boundary — must render its own html/body. */
export default function GlobalError({ error, reset }: ErrorPageProps) {
  console.error("[GlobalError]", error);

  return (
    <html lang="en">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          background: "#f8faf8",
          color: "#111827",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: "28rem",
            borderRadius: "1rem",
            border: "1px solid #e5e7eb",
            background: "#ffffff",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <p style={{ marginBottom: "0.5rem", fontSize: "1.125rem", fontWeight: 700 }}>
            {BRANDED_ERROR_TITLE}
          </p>
          <p style={{ marginBottom: "0.5rem", fontSize: "0.875rem", color: "#6b7280" }}>
            {BRANDED_ERROR_MESSAGE}
          </p>
          {error.message ? (
            <p style={{ marginBottom: "1.5rem", fontSize: "0.75rem", color: "#9ca3af", wordBreak: "break-word" }}>
              {error.message}
            </p>
          ) : (
            <div style={{ marginBottom: "1.5rem" }} />
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              borderRadius: "0.75rem",
              background: "#3a5a40",
              padding: "0.625rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#ffffff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
