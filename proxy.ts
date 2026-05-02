import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PROTECTED_ROUTES = ["/planner", "/recipes", "/grocery", "/settings", "/billing"];
const AUTH_ROUTES = ["/login", "/signup"];

export async function proxy(request: NextRequest) {
  const { user, response } = await updateSession(request);
  const path = request.nextUrl.pathname;

  if (PROTECTED_ROUTES.some((route) => path.startsWith(route)) && !user) {
    return NextResponse.redirect(new URL(`/login?next=${path}`, request.url));
  }

  if (AUTH_ROUTES.some((route) => path.startsWith(route)) && user) {
    return NextResponse.redirect(new URL("/planner", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)"],
};
