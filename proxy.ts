import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PROTECTED_ROUTES = ["/planner", "/recipes", "/grocery", "/nutrition", "/settings", "/billing"];
const AUTH_ROUTES = ["/login", "/signup"];
const ADMIN_USER_IDS = (process.env.ADMIN_USER_ID ?? "")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);

export async function proxy(request: NextRequest) {
  const { user, response } = await updateSession(request);
  const path = request.nextUrl.pathname;

  if (PROTECTED_ROUTES.some((route) => path.startsWith(route)) && !user) {
    return NextResponse.redirect(new URL(`/login?next=${path}`, request.url));
  }

  if (AUTH_ROUTES.some((route) => path.startsWith(route)) && user) {
    return NextResponse.redirect(new URL("/planner", request.url));
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
    "/((?!_next/static|_next/image|favicon\\.ico|icon\\.png|apple-touch-icon\\.png|manifest\\.webmanifest|opengraph-image|.*\\.svg$|api/webhooks).*)",
  ],
};
