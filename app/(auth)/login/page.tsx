import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  const redirectTo = next?.startsWith("/") ? next : "/planner";

  return (
    <main className="mx-auto flex min-h-screen w-full flex-col justify-center px-6">
      <div className="mx-auto w-full max-w-md space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-2 text-center">
          <Logo size="sm" href="/" className="mx-auto" />
          <div className="mb-2">
            <h1 className="text-2xl font-bold text-slate-800">Welcome back</h1>
            <p className="mt-1 text-sm text-slate-500">Sign in to your BiteSync account</p>
          </div>
        </div>
        {error ? (
          <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {error}
          </p>
        ) : null}
        <LoginForm redirectTo={redirectTo} />
        <p className="text-sm text-gray-600">
          Forgot password?{" "}
          <Link href="/reset" className="font-medium text-[var(--brand-sage)]">
            Reset it
          </Link>
        </p>
        <p className="text-sm text-gray-600">
          New here?{" "}
          <Link href="/signup" className="font-medium text-[var(--brand-sage)]">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
