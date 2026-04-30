"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { createClient } from "@/lib/supabase/client";

export default function ResetConfirmPage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setIsSaving(false);
      return;
    }

    setMessage("Password updated. You can now log in.");
    setPassword("");
    setIsSaving(false);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full flex-col justify-center px-6">
      <div className="mx-auto w-full max-w-md space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-2 text-center">
          <Logo size="sm" href="/" className="mx-auto" />
          <div className="mb-2">
            <h1 className="text-2xl font-bold text-slate-800">Set a new password</h1>
            <p className="mt-1 text-sm text-slate-500">Choose a strong password for your account</p>
          </div>
        </div>
        {message ? (
          <p className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {error}
          </p>
        ) : null}
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="New password"
            autoComplete="new-password"
            className="h-11 w-full rounded-md border border-gray-300 px-3 text-sm"
          />
          <button
            type="submit"
            disabled={isSaving}
            className="h-11 w-full rounded-md bg-[var(--brand-sage)] px-4 text-base font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? "Updating..." : "Update password"}
          </button>
        </form>
        <p className="text-sm text-gray-600">
          Return to{" "}
          <Link href="/login" className="font-medium text-[var(--brand-sage)]">
            login
          </Link>
        </p>
      </div>
    </main>
  );
}
