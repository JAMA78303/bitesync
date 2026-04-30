"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!email) {
    redirect("/reset?error=Email%20is%20required");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/reset/confirm`,
  });

  if (error) {
    redirect(`/reset?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/reset?success=Password%20reset%20email%20sent");
}
