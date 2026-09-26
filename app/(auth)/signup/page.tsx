import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { signUp } from "@/app/(auth)/signup/actions";
import { AuthSubmitButton } from "@/components/shared/AuthSubmitButton";
import { HEARD_FROM_OPTIONS } from "@/lib/auth/heardFrom";
import { ds } from "@/lib/ui/classes";

export default async function SignupPage({
 searchParams,
}: {
 searchParams: Promise<{ error?: string; success?: string }>;
}) {
 const { error, success } = await searchParams;

 const successNode = success ? (
 <div className={`mb-4 space-y-3 rounded-2xl px-4 py-3 text-sm ${ds.successCallout}`}>
 <p>{success}</p>
 <p className="text-xs leading-relaxed">If nothing arrives in a few minutes, check your spam folder.</p>
 <Link href="/login" className="inline-flex text-sm font-semibold text-[var(--brand-primary)] underline">
 Go to log in
 </Link>
 </div>
 ) : null;

 return (
 <AuthLayout mode="signup" error={error ?? null} success={successNode}>
 {!success ? (
 <form action={signUp} className="space-y-4">
 <div>
 <label className="mb-1.5 block text-xs font-semibold text-[var(--text-muted)]">Email</label>
 <input
 type="email"
 name="email"
 required
 placeholder="you@example.com"
 autoComplete="email"
 className={ds.input}
 />
 </div>
 <div>
 <label className="mb-1.5 block text-xs font-semibold text-[var(--text-muted)]">Password</label>
 <input
 type="password"
 name="password"
 required
 minLength={8}
 placeholder="••••••••"
 autoComplete="new-password"
 className={ds.input}
 />
 </div>
 <div>
 <label htmlFor="heard_from" className="mb-1.5 block text-xs font-semibold text-[var(--text-muted)]">
 How did you hear about BiteSync? <span className="font-normal">(optional)</span>
 </label>
 <select id="heard_from" name="heard_from" defaultValue="" className={ds.input}>
 <option value="">Choose one</option>
 {HEARD_FROM_OPTIONS.map((o) => (
 <option key={o.value} value={o.value}>
 {o.label}
 </option>
 ))}
 </select>
 </div>
 <AuthSubmitButton
 label="Create account →"
 pendingLabel="Creating your account…"
 className={`${ds.primaryBtn} mt-2 w-full py-4 disabled:cursor-not-allowed disabled:opacity-60`}
 />
 </form>
 ) : null}
 </AuthLayout>
 );
}
