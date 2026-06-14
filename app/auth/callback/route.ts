import { NextResponse } from "next/server";
import {
  friendlyConfirmationError,
  isEmailConfirmed,
} from "@/lib/auth/emailVerification";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next") ?? "/today";
  const base = requestUrl.origin;

  const supabase = await createClient();

  async function postAuthRedirect(): Promise<NextResponse> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(new URL("/login", base));
    }

    if (!isEmailConfirmed(user)) {
      const verifyUrl = new URL("/verify-email", base);
      if (user.email) verifyUrl.searchParams.set("email", user.email);
      verifyUrl.searchParams.set(
        "error",
        "Your email is not confirmed yet. Request a new confirmation link below.",
      );
      return NextResponse.redirect(verifyUrl);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("has_completed_onboarding")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.has_completed_onboarding) {
      const onboardingUrl = new URL("/onboarding", base);
      onboardingUrl.searchParams.set("confirmed", "1");
      return NextResponse.redirect(onboardingUrl);
    }

    const destination = next.startsWith("/") ? next : "/today";
    const url = new URL(destination, base);
    url.searchParams.set("confirmed", "1");
    return NextResponse.redirect(url);
  }

  function redirectVerifyEmailError(message: string, email?: string | null) {
    const url = new URL("/verify-email", base);
    url.searchParams.set("error", friendlyConfirmationError(message));
    if (email) url.searchParams.set("email", email);
    return NextResponse.redirect(url);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return redirectVerifyEmailError(error.message);
    }
    return postAuthRedirect();
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as
        | "signup"
        | "recovery"
        | "email"
        | "email_change"
        | "invite",
    });
    if (error) {
      return redirectVerifyEmailError(error.message);
    }
    return postAuthRedirect();
  }

  return redirectVerifyEmailError("Invalid confirmation link");
}
