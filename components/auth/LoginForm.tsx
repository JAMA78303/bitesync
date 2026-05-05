"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  redirectTo: string;
};

export function LoginForm({ redirectTo }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    setPending(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        setError(
          authError.message.includes("Invalid login credentials") || authError.status === 400
            ? "Incorrect email or password"
            : authError.message,
        );
        return;
      }

      router.refresh();
      router.push(redirectTo.startsWith("/") ? redirectTo : "/planner");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">{error}</p>
      ) : null}
      <input
        type="email"
        name="email"
        required
        placeholder="Email"
        autoComplete="email"
        disabled={pending}
        className="h-11 w-full rounded-md border border-gray-300 px-3 text-sm disabled:opacity-60"
      />
      <input
        type="password"
        name="password"
        required
        placeholder="Password"
        autoComplete="current-password"
        disabled={pending}
        className="h-11 w-full rounded-md border border-gray-300 px-3 text-sm disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-md bg-[var(--brand-sage)] px-4 text-base font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Please wait..." : "Log In"}
      </button>
    </form>
  );
}
