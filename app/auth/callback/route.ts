import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next") ?? "/planner";
  const base = requestUrl.origin;

  const redirectTo = new URL(next.startsWith("/") ? next : "/planner", base);
  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, base),
      );
    }
    return NextResponse.redirect(redirectTo);
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
    return NextResponse.redirect(redirectTo);
  }

  return NextResponse.redirect(new URL("/login?error=Invalid%20confirmation%20link", base));
}
