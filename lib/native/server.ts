import { headers } from "next/headers";
import { isNativeAppUserAgent, nativePurchasesEnabled } from "@/lib/native/app";

/** True when this request comes from the BiteSync iPhone app. */
export async function isNativeAppRequest(): Promise<boolean> {
  return isNativeAppUserAgent((await headers()).get("user-agent"));
}

/**
 * True for the iPhone app while Pro can't be bought in it: pages then show no
 * upgrade links or prices, as Apple doesn't allow pointing to web checkout.
 * Once in-app purchase is on, the app's upgrade prompts lead to its own
 * paywall on /billing.
 */
export async function nativeWithoutPurchases(): Promise<boolean> {
  return !nativePurchasesEnabled() && (await isNativeAppRequest());
}
