import Link from "next/link";
import type { ReactNode } from "react";
import { BiteSyncLogoMark } from "@/components/auth/BiteSyncLogoMark";
import { ds } from "@/lib/ui/classes";

type Props = {
  children: ReactNode;
  mode: "login" | "signup";
  error?: string | null;
  success?: ReactNode;
};

export function AuthLayout({ children, mode, error, success }: Props) {
  const isLogin = mode === "login";

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#3a5a40] to-[#4a7a50]">
      <div className="flex flex-col items-center justify-center px-4 pt-20 pb-8">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg">
          <BiteSyncLogoMark className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-extrabold text-white">BiteSync</h1>
        <p className="mt-1 text-sm text-white/60">
          {isLogin ? "Welcome back" : "Start eating better today"}
        </p>
      </div>

      <div className="flex flex-1 flex-col rounded-t-3xl bg-white px-6 pt-8 pb-12 dark:bg-gray-950">
        <h2 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">
          {isLogin ? "Sign in to your account" : "Create your account"}
        </h2>

        {error ? (
          <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            {error}
          </p>
        ) : null}
        {success}

        {children}

        <p className="mt-6 text-center text-sm text-gray-500">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <Link href={isLogin ? "/signup" : "/login"} className="font-semibold text-[#3a5a40]">
            {isLogin ? "Sign up free" : "Sign in"}
          </Link>
        </p>

        {isLogin ? (
          <p className="mt-3 text-center text-sm text-gray-500">
            <Link href="/reset" className="text-[#3a5a40] hover:underline">
              Forgot password?
            </Link>
          </p>
        ) : null}

        <p className="mt-8 text-center text-xs text-gray-300 dark:text-gray-600">
          No credit card required · Free tier always available
        </p>
      </div>
    </div>
  );
}
