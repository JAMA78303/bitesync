import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { requestPasswordReset } from "@/app/(auth)/reset/actions";
import { AuthSubmitButton } from "@/components/shared/AuthSubmitButton";

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen w-full flex-col justify-center px-6">
      <div className="mx-auto w-full max-w-md space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-2 text-center">
          <Logo size="sm" href="/" className="mx-auto" />
          <div className="mb-2">
            <h1 className="text-2xl font-bold text-slate-800">Reset password</h1>
            <p className="mt-1 text-sm text-slate-500">We will email you a secure reset link</p>
          </div>
        </div>
        {success ? (
          <p className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">
            {success}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {error}
          </p>
        ) : null}
        <form action={requestPasswordReset} className="space-y-4">
          <input
            type="email"
            name="email"
            required
            placeholder="Email"
            autoComplete="email"
            className="h-11 w-full rounded-md border border-gray-300 px-3 text-sm"
          />
          <AuthSubmitButton label="Send reset email" />
        </form>
        <p className="text-sm text-gray-600">
          Back to{" "}
          <Link href="/login" className="font-medium text-[var(--brand-sage)]">
            login
          </Link>
        </p>
      </div>
    </main>
  );
}
