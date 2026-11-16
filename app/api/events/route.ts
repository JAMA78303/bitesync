import { NextResponse } from "next/server";
import { isAppEventName, sanitizeEventProps } from "@/lib/analytics/appEvents";
import { recordAppEvent } from "@/lib/analytics/recordAppEvent";
import { isNativeAppUserAgent } from "@/lib/native/app";
import { createClient } from "@/lib/supabase/server";

/** An event is a name and a few short properties; anything bigger isn't one. */
const MAX_BODY_BYTES = 2048;

/**
 * Records a product event sent by lib/analytics/events.ts. Always answers 204
 * for a well-formed request, whether or not the event was stored, so the
 * browser never retries or shows an error for analytics.
 */
export async function POST(request: Request) {
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return new NextResponse(null, { status: 413 });

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const { name, props } = (body ?? {}) as { name?: unknown; props?: unknown };
  if (!isAppEventName(name)) return new NextResponse(null, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await recordAppEvent({
    name,
    props: sanitizeEventProps(props),
    userId: user?.id ?? null,
    platform: isNativeAppUserAgent(request.headers.get("user-agent")) ? "ios" : "web",
  });

  return new NextResponse(null, { status: 204 });
}
