"use client";

import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { submitFeedback } from "@/app/(app)/feedback/actions";
import { Button } from "@/components/ui/button";

export function FeedbackForm() {
  const pathname = usePathname() ?? "/settings";
  const [message, setMessage] = useState("");
  const [expected, setExpected] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

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
    });
  }

  if (sent) {
    return <p className="px-4 py-3 text-sm text-[var(--semantic-success-text)]">Thanks — feedback received.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 px-4 py-3">
      <p className="text-xs text-[var(--text-muted)]">
        Includes app version and current screen automatically.
      </p>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
        rows={3}
        placeholder="What happened?"
        className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] px-3 py-2 text-sm"
      />
      <textarea
        value={expected}
        onChange={(e) => setExpected(e.target.value)}
        rows={2}
        placeholder="What did you expect? (optional)"
        className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] px-3 py-2 text-sm"
      />
      {error ? <p className="text-sm text-[var(--semantic-error-text)]">{error}</p> : null}
      <Button type="submit" disabled={isPending} size="sm">
        {isPending ? "Sending…" : "Send"}
      </Button>
    </form>
  );
}
