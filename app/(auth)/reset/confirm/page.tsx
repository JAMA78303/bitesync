"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/shared/Logo";
import { createClient } from "@/lib/supabase/client";
import { ds } from "@/lib/ui/classes";

const LINK_DEAD =
 "This reset link has expired or was already used. Request a new one — links are single-use and time-limited.";

export default function ResetConfirmPage() {
 const router = useRouter();
 const [password, setPassword] = useState("");
 const [message, setMessage] = useState<string | null>(null);
 const [error, setError] = useState<string | null>(null);
 const [isSaving, setIsSaving] = useState(false);
 const [checking, setChecking] = useState(true);
 const [hasSession, setHasSession] = useState(false);

 // The recovery session is established by /auth/callback before we get here.
 // Confirm it exists so an expired link explains itself instead of failing on submit.
 useEffect(() => {
 let cancelled = false;
 (async () => {
 try {
 const supabase = createClient();
 const { data } = await supabase.auth.getSession();
 if (cancelled) return;
 setHasSession(Boolean(data.session));
 if (!data.session) setError(LINK_DEAD);
 } catch {
 // Client init or network failure — never leave the page stuck "checking".
 if (!cancelled) setError("Couldn't verify your reset link. Please request a new one.");
 } finally {
 if (!cancelled) setChecking(false);
 }
 })();
 return () => {
 cancelled = true;
 };
 }, []);

 async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
 event.preventDefault();
 setIsSaving(true);
 setMessage(null);
 setError(null);

 const supabase = createClient();
 const { error: updateError } = await supabase.auth.updateUser({ password });

 if (updateError) {
 // Raw "Auth session missing!" means the recovery link never established one.
 setError(/session/i.test(updateError.message) ? LINK_DEAD : updateError.message);
 setIsSaving(false);
 return;
 }

 setMessage("Password updated. Taking you to your planner…");
 setPassword("");
 setIsSaving(false);
 router.replace("/today");
 }

 return (
 <main className="mx-auto flex min-h-screen w-full flex-col justify-center px-6">
 <div className="mx-auto w-full max-w-md space-y-6 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 shadow-sm">
 <div className="space-y-2 text-center">
 <Logo size="sm" href="/" className="mx-auto" />
 <div className="mb-2">
 <h1 className="text-2xl font-bold text-[var(--text-primary)]">Set a new password</h1>
 <p className="mt-1 text-sm text-[var(--text-muted)]">Choose a strong password for your account</p>
 </div>
 </div>
 {message ? (
 <p className={`rounded-md px-3 py-2 text-sm ${ds.successCallout}`}>
 {message}
 </p>
 ) : null}
 {error ? (
 <p className={`rounded-md px-3 py-2 text-sm ${ds.warnCallout}`}>
 {error}
 </p>
 ) : null}
 {checking ? (
 <p className="text-sm text-[var(--text-muted)]">Checking your reset link…</p>
 ) : hasSession ? (
 <form onSubmit={onSubmit} className="space-y-4">
 <input
 type="password"
 required
 minLength={8}
 value={password}
 onChange={(event) => setPassword(event.target.value)}
 placeholder="New password"
 autoComplete="new-password"
 className="h-11 w-full rounded-md border border-[var(--border-default)] px-3 text-sm"
 />
 <button
 type="submit"
 disabled={isSaving}
 className="h-11 w-full rounded-md bg-[var(--brand-sage)] px-4 text-base font-medium text-[var(--btn-primary-text)] disabled:cursor-not-allowed disabled:opacity-70"
 >
 {isSaving ?"Updating..." :"Update password"}
 </button>
 </form>
 ) : (
 <Link
 href="/reset"
 className="flex h-11 w-full items-center justify-center rounded-md bg-[var(--brand-sage)] px-4 text-base font-medium text-[var(--btn-primary-text)]"
 >
 Request a new link
 </Link>
 )}
 <p className="text-sm text-[var(--text-secondary)]">
 Return to{""}
 <Link href="/login" className="font-medium text-[var(--brand-sage)]">
 login
 </Link>
 </p>
 </div>
 </main>
 );
}
