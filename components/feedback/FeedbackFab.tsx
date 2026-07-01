"use client";

import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare, X } from "lucide-react";
import { submitFeedback } from "@/app/(app)/feedback/actions";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { Button } from "@/components/ui/button";
import { ds } from "@/lib/ui/classes";

export function FeedbackFab() {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [expected, setExpected] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (pathname.startsWith("/onboarding")) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitFeedback({
        screen: pathname,
        message,
        expected: expected || undefined,
      });
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      setSent(true);
      setMessage("");
      setExpected("");
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setSent(false);
          setError(null);
        }}
        className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 z-40 flex items-center gap-1.5 rounded-full border border-[var(--border-default)] bg-[var(--surface-card)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] shadow-lg hover:bg-[var(--surface-muted)] md:bottom-6"
        aria-label="Send feedback"
      >
        <MessageSquare className="h-4 w-4" />
        Feedback
      </button>

      {open ? (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center">
            <div className="w-full max-w-md rounded-2xl bg-[var(--surface-card)] p-5 shadow-xl">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Send feedback</h2>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Screen: <span className="font-mono">{pathname}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1 hover:bg-[var(--surface-muted)]"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {sent ? (
                <p className={`rounded-xl px-3 py-2 text-sm ${ds.successCallout}`}>
                  Thanks — we got it. This helps a lot during testing.
                </p>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <label className="block text-sm font-medium text-[var(--text-secondary)]">
                    What happened?
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      rows={3}
                      className="mt-1 w-full rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] px-3 py-2 text-sm"
                      placeholder="Describe what you were trying to do…"
                    />
                  </label>
                  <label className="block text-sm font-medium text-[var(--text-secondary)]">
                    What did you expect? <span className="font-normal text-[var(--text-muted)]">(optional)</span>
                    <textarea
                      value={expected}
                      onChange={(e) => setExpected(e.target.value)}
                      rows={2}
                      className="mt-1 w-full rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] px-3 py-2 text-sm"
                    />
                  </label>
                  {error ? (
                    <p className="text-sm text-[var(--semantic-error-text)]">{error}</p>
                  ) : null}
                  <Button type="submit" disabled={isPending} className="w-full">
                    {isPending ? "Sending…" : "Send feedback"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </ModalPortal>
      ) : null}
    </>
  );
}
