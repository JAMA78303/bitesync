import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import {
  friendlyConfirmationError,
  isEmailConfirmed,
} from "@/lib/auth/emailVerification";

type PendingCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

/**
 * Email confirmation / OAuth / recovery land here with ?code=… (PKCE).
 *
 * Session cookies from exchangeCodeForSession must be attached to the redirect
 * response with their full options. Dropping them (or writing only via
 * next/headers) leaves the user confirmed in Auth but unauthenticated on the
 * next page — which surfaces as the branded "Something went wrong" screen.
 */
export async function GET(request: NextRequest) {
  const requestUrl = request.nextUrl;
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next") ?? "/onboarding";
  const isRecovery =
    requestUrl.searchParams.get("flow") === "recovery" || type === "recovery";

  const base = publicOrigin(request);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return redirectBare(base, "/verify-email", {
      error: friendlyConfirmationError("Auth is not configured"),
    });
  }

  const pendingCookies: PendingCookie[] = [];

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          pendingCookies.push({ name, value, options });
        });
      },
    },
  });

  function redirect(pathWithQuery: string): NextResponse {
    const target = pathWithQuery.startsWith("http")
      ? pathWithQuery
      : new URL(pathWithQuery, base).toString();
    const response = NextResponse.redirect(target);
    for (const { name, value, options } of pendingCookies) {
      response.cookies.set(name, value, options);
    }
    return response;
  }

  function redirectVerify(message: string, email?: string | null) {
    const params = new URLSearchParams({
      error: friendlyConfirmationError(message),
    });
    if (email) params.set("email", email);
    return redirect(`/verify-email?${params}`);
  }

  async function postAuthRedirect(): Promise<NextResponse> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return redirect("/login");
    }

    if (isRecovery) {
      const target = next.startsWith("/") ? next : "/reset/confirm";
      return redirect(target);
    }

    if (!isEmailConfirmed(user)) {
      const params = new URLSearchParams({
        error:
          "Your email is not confirmed yet. Request a new confirmation link below.",
      });
      if (user.email) params.set("email", user.email);
      return redirect(`/verify-email?${params}`);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("has_completed_onboarding")
      .eq("id", user.id)
      .maybeSingle();

    // No profile row, or explicitly unfinished → first-run wizard.
    if (!profile || profile.has_completed_onboarding === false) {
      return redirect("/onboarding?confirmed=1");
    }

    const destination = next.startsWith("/") ? next : "/today";
    const sep = destination.includes("?") ? "&" : "?";
    return redirect(`${destination}${sep}confirmed=1`);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return redirectVerify(error.message);
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
      return redirectVerify(error.message);
    }
    return postAuthRedirect();
  }

  return redirectVerify("Invalid confirmation link");
}

function publicOrigin(request: NextRequest): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (appUrl) return appUrl;

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`;

  return request.nextUrl.origin;
}

function redirectBare(
  base: string,
  path: string,
  query?: Record<string, string>,
) {
  const url = new URL(path, base);
  if (query) {
    for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  }
  return NextResponse.redirect(url);
}
