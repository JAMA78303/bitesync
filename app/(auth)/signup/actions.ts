"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/signup?error=Email%20and%20password%20are%20required");
  }

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Confirmation emails: Supabase → Authentication → Providers → Email → enable "Confirm email".
  // Add Redirect URLs: `${NEXT_PUBLIC_APP_URL}` and `${NEXT_PUBLIC_APP_URL}/auth/callback`.
  // For production deliverability, configure SMTP (Authentication → SMTP Settings) or use a custom domain.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback?next=/planner`,
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  if (data.session) {
    redirect("/planner");
  }

  redirect("/signup?success=Check%20your%20email%20for%20a%20confirmation%20link");
}
