import Link from "next/link";
import type { ReactNode } from "react";
import { BiteSyncLogoMark } from "@/components/auth/BiteSyncLogoMark";
import { ds } from "@/lib/ui/classes";

type Props = {
 children: ReactNode;
 mode:"login" |"signup";
 error?: string | null;
 success?: ReactNode;
};

export function AuthLayout({ children, mode, error, success }: Props) {
 const isLogin = mode ==="login";

 return (
 <div className="flex min-h-screen flex-col bg-gradient-to-b from-[var(--header-from)] to-[var(--header-to)]">
 <div className="flex flex-col items-center justify-center px-4 pt-20 pb-8">
 <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--surface-card)] shadow-lg">
 <BiteSyncLogoMark className="h-8 w-8" />
 </div>
 <h1 className="text-2xl font-extrabold text-[var(--text-on-brand)]">BiteSync</h1>
 <p className="mt-1 text-sm text-[var(--text-on-brand-subtle)]">
 {isLogin ?"Welcome back" :"Start eating better today"}
 </p>
 </div>

 <div className="flex flex-1 flex-col rounded-t-3xl bg-[var(--surface-card)] px-6 pt-8 pb-12">
 <h2 className="mb-6 text-xl font-bold text-[var(--text-primary)]">
 {isLogin ?"Sign in to your account" :"Create your account"}
 </h2>

 {error ? (
 <p className={`mb-4 rounded-2xl px-4 py-3 text-sm ${ds.warnCallout}`}>
 {error}
 </p>
 ) : null}
 {success}

 {children}

 <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
 {isLogin ?"Don't have an account?" :"Already have an account?"}{" "}
 <Link href={isLogin ?"/signup" :"/login"} className="font-semibold text-[var(--text-link)]">
 {isLogin ?"Sign up free" :"Sign in"}
 </Link>
 </p>

 {isLogin ? (
 <p className="mt-3 text-center text-sm text-[var(--text-muted)]">
 <Link href="/reset" className="text-[var(--text-link)] hover:underline">
 Forgot password?
 </Link>
 </p>
 ) : null}

 <p className="mt-8 text-center text-xs text-[var(--text-muted)]">
 No credit card required · Free tier always available
 </p>
 </div>
 </div>
 );
}
