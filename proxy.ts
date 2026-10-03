import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { identifyCrawler } from "@/lib/analytics/aiCrawlers";
import { recordCrawlerVisit } from "@/lib/analytics/recordCrawlerVisit";
import {
  isAllowedWithoutEmailConfirmation,
  isEmailConfirmed,
  VERIFY_EMAIL_PATH,
} from "@/lib/auth/emailVerification";
import { updateSession } from "@/lib/supabase/middleware";

const PROTECTED_ROUTES = ["/today", "/planner", "/recipes", "/grocery", "/pantry", "/nutrition", "/goals", "/settings", "/billing", "/sample-week"];
const AUTH_ROUTES = ["/login", "/signup", VERIFY_EMAIL_PATH];
const ONBOARDING_ROUTE = "/onboarding";
const ADMIN_USER_IDS = (process.env.ADMIN_USER_ID ?? "")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);

async function getOnboardingFlags(
  request: NextRequest,
  response: NextResponse,
  userId: string,
): Promise<{
  hasCompletedOnboarding: boolean;
  firstRunCompleted: boolean;
}> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return { hasCompletedOnboarding: true, firstRunCompleted: true };
  }

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
    .select("has_completed_onboarding, first_run_completed")
    .eq("id", userId)
    .maybeSingle();

  // Missing profile ⇒ not onboarded. Using `!== false` treated null rows as done
  // and sent brand-new users straight into /today after email confirm.
  return {
    hasCompletedOnboarding: data?.has_completed_onboarding === true,
    firstRunCompleted: data?.first_run_completed === true,
  };
}

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  const path = request.nextUrl.pathname;

  // Record AI assistants and search engines reading the site — in the
  // background, so the page is not held up. See lib/analytics/aiCrawlers.ts.
  const userAgent = request.headers.get("user-agent") ?? "";
  const crawler = identifyCrawler(userAgent);
  if (crawler) event.waitUntil(recordCrawlerVisit(crawler, path, userAgent));

  const { user, response } = await updateSession(request);

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

    const onboardingFlags = await getOnboardingFlags(request, response, user.id);
    const onboardingDone = onboardingFlags.hasCompletedOnboarding;

    if (emailConfirmed && !onboardingDone && PROTECTED_ROUTES.some((route) => path.startsWith(route))) {
      if (!path.startsWith("/sample-week")) {
        return NextResponse.redirect(new URL(ONBOARDING_ROUTE, request.url));
      }
    }

    if (
      emailConfirmed &&
      onboardingDone &&
      path.startsWith(ONBOARDING_ROUTE) &&
      onboardingFlags.firstRunCompleted
    ) {
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
