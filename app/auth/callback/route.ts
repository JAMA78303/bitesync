import { NextResponse } from "next/server";
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("has_completed_onboarding")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.has_completed_onboarding) {
      return NextResponse.redirect(new URL("/onboarding", base));
    }

    const destination = next.startsWith("/") ? next : "/today";
    return NextResponse.redirect(new URL(destination, base));
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, base),
      );
    }
    return postAuthRedirect();
  }

  // Some email confirmation links provide token_hash + type instead of code.
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
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, base),
      );
    }
    return postAuthRedirect();
  }

  return NextResponse.redirect(new URL("/login?error=Invalid%20confirmation%20link", base));
}
