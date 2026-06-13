"use client";

import { useState, useTransition } from "react";
import { deleteAccount } from "@/app/(app)/settings/actions";

type Props = {
  email: string;
};

export function DeleteAccountSection({ email }: Props) {
  const [confirmEmail, setConfirmEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canSubmit = confirmEmail.trim().toLowerCase() === email.toLowerCase() && !isPending;

  return (
    <div className="rounded-2xl border border-[var(--semantic-error-border)] bg-[var(--semantic-error-bg)] p-4">
      <p className="text-sm font-semibold text-[var(--semantic-error-text)]">Delete account</p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
        Permanently delete your account, recipes, meal plans, grocery lists, and profile data. This cannot be
        undone. Active subscriptions are cancelled at the end of the current billing period.
      </p>
      <label className="mt-4 block">
        <span className="text-xs font-medium text-[var(--text-muted)]">
          Type <span className="font-semibold text-[var(--text-primary)]">{email}</span> to confirm
        </span>
        <input
          type="email"
          value={confirmEmail}
          onChange={(e) => {
            setConfirmEmail(e.target.value);
            setError(null);
          }}
          autoComplete="off"
          className="mt-1.5 w-full rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--semantic-error-border)]"
          placeholder={email}
        />
      </label>
      {error ? <p className="mt-2 text-xs text-[var(--semantic-error-text)]">{error}</p> : null}
      <button
        type="button"
        disabled={!canSubmit}
        onClick={() => {
          startTransition(async () => {
            const result = await deleteAccount(confirmEmail);
            if (result?.error) setError(result.error);
          });
        }}
        className="mt-4 w-full rounded-xl border border-[var(--semantic-error-border)] bg-[var(--surface-card)] py-3 text-sm font-semibold text-[var(--semantic-error-text)] transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isPending ? "Deleting…" : "Delete my account permanently"}
      </button>
    </div>
  );
}
