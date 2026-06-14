"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  confirmationCallbackUrl,
  VERIFY_EMAIL_PATH,
} from "@/lib/auth/emailVerification";
import { toUserFacingError } from "@/lib/errors/userFacing";
import { createClient } from "@/lib/supabase/server";

const RESEND_COOLDOWN_SEC = 60;
const RESEND_COOKIE = "bs_confirm_resend_at";

function verifyEmailUrl(params: Record<string, string>): string {
  const qs = new URLSearchParams(params).toString();
  return qs ? `${VERIFY_EMAIL_PATH}?${qs}` : VERIFY_EMAIL_PATH;
}

export async function resendConfirmationEmail(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    redirect(verifyEmailUrl({ error: "Email is required to resend confirmation." }));
  }

  const cookieStore = await cookies();
  const lastRaw = cookieStore.get(RESEND_COOKIE)?.value;
  if (lastRaw) {
    const last = Number.parseInt(lastRaw, 10);
    if (Number.isFinite(last) && Date.now() - last < RESEND_COOLDOWN_SEC * 1000) {
      redirect(
        verifyEmailUrl({
          email,
          error: "Please wait a minute before requesting another confirmation email.",
        }),
      );
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: confirmationCallbackUrl(),
    },
  });

  if (error) {
    redirect(
      verifyEmailUrl({
        email,
        error: toUserFacingError(error, "auth", "signup"),
      }),
    );
  }

  cookieStore.set(RESEND_COOKIE, String(Date.now()), {
    maxAge: RESEND_COOLDOWN_SEC,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  redirect(verifyEmailUrl({ email, sent: "1" }));
}

export async function signOutFromVerifyEmail() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
