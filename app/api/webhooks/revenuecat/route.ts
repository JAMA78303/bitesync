import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { accountIdsInEvent, syncAppleEntitlement } from "@/lib/iap/revenuecat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * RevenueCat calls this when an App Store subscription changes (bought,
 * renewed, cancelled, expired, refunded, moved to another account). The event
 * itself isn't trusted for the outcome: it only says which accounts to
 * re-check, and lib/iap/revenuecat.ts asks RevenueCat for their current state.
 *
 * RevenueCat sends the Authorization header set in its dashboard; it must
 * equal REVENUECAT_WEBHOOK_AUTH. Without that secret the endpoint stays closed.
 */
function isAuthorized(request: Request): boolean {
  const expected = process.env.REVENUECAT_WEBHOOK_AUTH;
  const given = request.headers.get("authorization");
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { event?: unknown } | null;
  const ids = accountIdsInEvent(body?.event);

  let failed = 0;
  for (const id of ids) {
    const result = await syncAppleEntitlement(id);
    // An id RevenueCat knows but we don't (a deleted account) is not worth a retry.
    if ("error" in result && result.error !== "Unknown account.") failed += 1;
  }
  if (failed) {
    // A non-2xx makes RevenueCat send the event again later.
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }

  if (ids.length) {
    revalidatePath("/billing");
    revalidatePath("/settings");
  }
  return NextResponse.json({ ok: true, accounts: ids.length });
}
