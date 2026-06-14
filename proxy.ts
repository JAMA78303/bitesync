import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  isAllowedWithoutEmailConfirmation,
  isEmailConfirmed,
  VERIFY_EMAIL_PATH,
} from "@/lib/auth/emailVerification";
import { updateSession } from "@/lib/supabase/middleware";

const PROTECTED_ROUTES = ["/today", "/planner", "/recipes", "/grocery", "/pantry", "/nutrition", "/goals", "/settings", "/billing"];
const AUTH_ROUTES = ["/login", "/signup", VERIFY_EMAIL_PATH];
const ONBOARDING_ROUTE = "/onboarding";
const ADMIN_USER_IDS = (process.env.ADMIN_USER_ID ?? "")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);

async function hasCompletedOnboarding(
  request: NextRequest,
  response: NextResponse,
  userId: string,
): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return true;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const { data } = await supabase
    .from("profiles")
    .select("has_completed_onboarding")
    .eq("id", userId)
    .maybeSingle();

  return data?.has_completed_onboarding !== false;
}

export async function proxy(request: NextRequest) {
  const { user, response } = await updateSession(request);
  const path = request.nextUrl.pathname;

  if ((PROTECTED_ROUTES.some((route) => path.startsWith(route)) || path.startsWith(ONBOARDING_ROUTE)) && !user) {
    return NextResponse.redirect(new URL(`/login?next=${path}`, request.url));
  }

  if (user) {
    const emailConfirmed = isEmailConfirmed(user);

    if (!emailConfirmed) {
      if (path.startsWith("/login") || path.startsWith("/signup")) {
        const verifyUrl = new URL(VERIFY_EMAIL_PATH, request.url);
        if (user.email) verifyUrl.searchParams.set("email", user.email);
        return NextResponse.redirect(verifyUrl);
      }
      if (!isAllowedWithoutEmailConfirmation(path)) {
        const verifyUrl = new URL(VERIFY_EMAIL_PATH, request.url);
        if (user.email) verifyUrl.searchParams.set("email", user.email);
        return NextResponse.redirect(verifyUrl);
      }
    } else if (path.startsWith(VERIFY_EMAIL_PATH)) {
      return NextResponse.redirect(new URL("/today", request.url));
    }

    const onboardingDone = await hasCompletedOnboarding(request, response, user.id);

    if (emailConfirmed && !onboardingDone && PROTECTED_ROUTES.some((route) => path.startsWith(route))) {
      return NextResponse.redirect(new URL(ONBOARDING_ROUTE, request.url));
    }

    if (emailConfirmed && onboardingDone && path.startsWith(ONBOARDING_ROUTE)) {
      return NextResponse.redirect(new URL("/today", request.url));
    }

    if (emailConfirmed && AUTH_ROUTES.some((route) => path.startsWith(route))) {
      return NextResponse.redirect(
        new URL(onboardingDone ? "/today" : ONBOARDING_ROUTE, request.url),
      );
    }
  }

  if (path.startsWith("/admin")) {
    if (!user || !ADMIN_USER_IDS.includes(user.id)) {
      return NextResponse.redirect(new URL("/planner", request.url));
    }
  }

  return response;
}

/** Skip auth/session work for static icons so tabs & PWA installs always get assets. */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|icon(?:\\?|$)|apple-icon(?:\\?|$)|favicon-\\d+\\.png|icon\\.png|apple-touch-icon\\.png|bitesync-[a-z-]+\\.png|maskable-\\d+\\.png|manifest\\.webmanifest|opengraph-image|.*\\.svg$|api/webhooks).*)",
  ],
};
