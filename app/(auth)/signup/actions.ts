"use server";

import {
  confirmationCallbackUrl,
  isEmailConfirmed,
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
    redirect(`/signup?error=${encodeURIComponent(toUserFacingError(error, "auth", "signup"))}`);
  }

  if (data.user && isEmailConfirmed(data.user)) {
    redirect("/onboarding");
  }

  redirect(`${VERIFY_EMAIL_PATH}?email=${encodeURIComponent(email)}`);
}
