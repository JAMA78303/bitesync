"use server";

import { toUserFacingError } from "@/lib/errors/userFacing";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!email) {
    redirect("/reset?error=Email%20is%20required");
  }

  const supabase = await createClient();
  // Route through the auth callback: the recovery link carries a PKCE code that
  // must be exchanged for a session in a route handler (Server Components cannot
  // set cookies). Landing straight on /reset/confirm left it with no session, so
  // updateUser failed with "Auth session missing".
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/auth/callback?next=%2Freset%2Fconfirm&flow=recovery`,
  });

  if (error) {
    redirect(`/reset?error=${encodeURIComponent(toUserFacingError(error, "auth", "reset"))}`);
  }

  redirect("/reset?success=Password%20reset%20email%20sent");
}
