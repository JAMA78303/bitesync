import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { signUp } from "@/app/(auth)/signup/actions";
import { AuthSubmitButton } from "@/components/shared/AuthSubmitButton";

export default async function SignupPage({
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
            <h1 className="text-2xl font-bold text-slate-800">Create account</h1>
            <p className="mt-1 text-sm text-slate-500">Start planning meals with BiteSync</p>
          </div>
        </div>
        {success ? (
          <div className="space-y-3 rounded-md border border-green-300 bg-green-50 px-3 py-3 text-sm text-green-900">
            <p>{success}</p>
            <p className="text-xs leading-relaxed text-green-800">
              If nothing arrives in a few minutes, check your spam folder.
            </p>
            <Link
              href="/login"
              className="inline-flex text-sm font-medium text-green-900 underline underline-offset-2"
            >
              Go to log in
            </Link>
          </div>
        ) : null}
        {error ? (
          <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {error}
          </p>
        ) : null}
        {!success ? (
          <>
            <form action={signUp} className="space-y-4">
              <input
                type="email"
                name="email"
                required
                placeholder="Email"
                autoComplete="email"
                className="h-11 w-full rounded-md border border-gray-300 px-3 text-sm"
              />
              <input
                type="password"
                name="password"
                required
                minLength={8}
                placeholder="Password"
                autoComplete="new-password"
                className="h-11 w-full rounded-md border border-gray-300 px-3 text-sm"
              />
              <AuthSubmitButton label="Sign Up" />
            </form>
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-[var(--brand-sage)]">
                Log in
              </Link>
            </p>
          </>
        ) : null}
      </div>
    </main>
  );
}
