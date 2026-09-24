"use client";

import { useFormStatus } from "react-dom";

type AuthSubmitButtonProps = {
 label: string;
 /** Shown while the form is submitting. */
 pendingLabel?: string;
 /** Replaces the default styling when given. */
 className?: string;
};

/**
 * A submit button that disables itself and says so while its form is in
 * flight. The signup form used a plain button: account creation waits for
 * Supabase to send the confirmation email, which can take several seconds,
 * and in that time the page did nothing visible — reported as "it won't
 * click", and clicked again, which fired a second signup.
 */
export function AuthSubmitButton({ label, pendingLabel = "Please wait...", className }: AuthSubmitButtonProps) {
 const { pending } = useFormStatus();

 return (
 <button
 type="submit"
 disabled={pending}
 aria-busy={pending}
 className={
 className ??
 "h-11 w-full rounded-md bg-[var(--brand-sage)] px-4 text-base font-medium text-[var(--btn-primary-text)] disabled:cursor-not-allowed disabled:opacity-70"
 }
 >
 {pending ? pendingLabel : label}
 </button>
 );
}
