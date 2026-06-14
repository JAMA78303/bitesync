import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { AuthSubmitButton } from "@/components/shared/AuthSubmitButton";
import { resendConfirmationEmail, signOutFromVerifyEmail } from "@/app/(auth)/verify-email/actions";
import { isEmailConfirmed } from "@/lib/auth/emailVerification";
import { createClient } from "@/lib/supabase/server";
import { ds } from "@/lib/ui/classes";
import { redirect } from "next/navigation";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string; sent?: string }>;
}) {
  const { email: emailParam, error, sent } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && isEmailConfirmed(user)) {
    redirect("/today");
  }

  const email = (emailParam ?? user?.email ?? "").trim();

  return (
    <main className="mx-auto flex min-h-screen w-full flex-col justify-center px-6">
      <div className="mx-auto w-full max-w-md space-y-6 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 shadow-sm">
        <div className="space-y-2 text-center">
          <Logo size="sm" href="/" className="mx-auto" />
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Confirm your email</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            We sent a confirmation link{email ? ` to ${email}` : ""}. Open it to start using BiteSync.
          </p>
        </div>

        {sent ? (
          <p className={`rounded-md px-3 py-2 text-sm ${ds.successCallout}`}>
            Confirmation email sent. Check your inbox and spam folder.
          </p>
        ) : null}

        {error ? (
          <p className={`rounded-md px-3 py-2 text-sm ${ds.warnCallout}`}>{error}</p>
        ) : null}

        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
          Until your email is confirmed, planner, recipes, and billing stay locked. This keeps your
          account and payment details tied to an address you control.
        </p>

        <form action={resendConfirmationEmail} className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[var(--text-muted)]">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              defaultValue={email}
              placeholder="you@example.com"
              autoComplete="email"
              className="h-11 w-full rounded-md border border-[var(--border-default)] px-3 text-sm"
            />
          </div>
          <AuthSubmitButton label="Resend confirmation email" />
          <p className="text-center text-xs text-[var(--text-muted)]">
            You can request another email once per minute.
          </p>
        </form>

        {user ? (
          <form action={signOutFromVerifyEmail}>
            <button
              type="submit"
              className="w-full text-center text-sm font-medium text-[var(--text-link)] hover:underline"
            >
              Sign out and use a different email
            </button>
          </form>
        ) : (
          <p className="text-center text-sm text-[var(--text-secondary)]">
            Already confirmed?{" "}
            <Link href="/login" className="font-medium text-[var(--brand-sage)]">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
