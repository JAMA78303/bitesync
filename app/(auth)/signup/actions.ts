"use server";

import {
  confirmationCallbackUrl,
  EXISTING_ACCOUNT_MESSAGE,
  isAuthUserAlreadyRegisteredError,
  isDuplicateSignUpResponse,
  isConfirmationEmailSendError,
  isEmailConfirmed,
  signupErrorMessage,
  VERIFY_EMAIL_PATH,
} from "@/lib/auth/emailVerification";
import { toUserFacingError } from "@/lib/errors/userFacing";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/signup?error=Email%20and%20password%20are%20required");
  }

  const supabase = await createClient();

  // Confirmation emails: Supabase → Authentication → Providers → Email → enable "Confirm email".
  // Add Redirect URLs: `${NEXT_PUBLIC_APP_URL}` and `${NEXT_PUBLIC_APP_URL}/auth/callback`.
  // For production deliverability, configure SMTP (Authentication → SMTP Settings).
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: confirmationCallbackUrl(),
    },
  });

  if (error) {
    if (isAuthUserAlreadyRegisteredError(error)) {
      redirect(`/login?error=${encodeURIComponent(EXISTING_ACCOUNT_MESSAGE)}`);
    }
    // The account exists; only the email failed. Send them to the page with a
    // Resend button and say exactly that.
    if (isConfirmationEmailSendError(error)) {
      console.error("[signUp] account created but confirmation email failed:", error.code, error.message);
      const params = new URLSearchParams({
        email,
        error:
          "Your account is created, but the confirmation email didn't send. Wait a minute, then tap Resend below.",
      });
      redirect(`${VERIFY_EMAIL_PATH}?${params}`);
    }
    console.error("[signUp] failed:", error.code, error.status, error.message);
    const message = signupErrorMessage(error) ?? toUserFacingError(error, "auth", "signup");
    redirect(`/signup?error=${encodeURIComponent(message)}`);
  }

  if (isDuplicateSignUpResponse(data)) {
    redirect(`/login?error=${encodeURIComponent(EXISTING_ACCOUNT_MESSAGE)}`);
  }

  if (data.session && data.user && isEmailConfirmed(data.user)) {
    redirect("/onboarding");
  }

  redirect(`${VERIFY_EMAIL_PATH}?email=${encodeURIComponent(email)}`);
}
