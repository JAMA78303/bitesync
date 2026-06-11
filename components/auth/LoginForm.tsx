"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ds } from "@/lib/ui/classes";

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
 const email = String(fd.get("email") ??"").trim();
 const password = String(fd.get("password") ??"");

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
 ?"Incorrect email or password"
 : authError.message,
 );
 return;
 }

 router.refresh();
 router.push(redirectTo.startsWith("/") ? redirectTo :"/today");
 } finally {
 setPending(false);
 }
 }

 return (
 <form onSubmit={handleSubmit} className="space-y-4">
 {error ? (
 <p className={`rounded-2xl px-4 py-3 text-sm ${ds.warnCallout}`}>
 {error}
 </p>
 ) : null}
 <div>
 <label className="mb-1.5 block text-xs font-semibold text-[var(--text-muted)]">Email</label>
 <input
 type="email"
 name="email"
 required
 placeholder="you@example.com"
 autoComplete="email"
 disabled={pending}
 className={ds.input}
 />
 </div>
 <div>
 <label className="mb-1.5 block text-xs font-semibold text-[var(--text-muted)]">Password</label>
 <input
 type="password"
 name="password"
 required
 placeholder="••••••••"
 autoComplete="current-password"
 disabled={pending}
 className={ds.input}
 />
 </div>
 <button type="submit" disabled={pending} className={`${ds.primaryBtn} mt-2 w-full py-4 disabled:opacity-60`}>
 {pending ?"Please wait..." :"Sign in →"}
 </button>
 </form>
 );
}
